# 실행·검수·배포 Runbook

기준: `nana-park/breadme@3738e4620bb495ecfcd7ef589c91c2049ce0153a`. 이 문서는 재현 절차입니다. 아래 명령을 이 문서 작성 중 모두 실행했다는 보고서가 아닙니다. 시스템 구조는 [아키텍처](architecture.md), 작업 권한은 [Ground Rules](../ground-rules/README.md), 결과 기록은 해당 PR/QA 문서를 확인합니다. 변경 접수부터 완료까지는 [유지보수 흐름](../maintenance.md), 개선 작업의 우선순위와 완료 조건은 [개선 백로그](../backlog.md)에 연결합니다.

## 1. 작업 시작과 환경

1. [`AGENTS.md`](../../AGENTS.md), [브랜치 운영](../ground-rules/01-repository-and-branching.md), [작업 흐름](../ground-rules/05-development-workflow.md), [Version Hub](../../versions/README.md)를 읽습니다.
2. 현재 브랜치·커밋·작업 중인 변경을 확인합니다. 다른 사람의 수정은 reset/clean으로 지우지 않습니다.
3. 변경 목적에 맞는 작업 브랜치를 사용합니다. main 직접 개발·직접 push나 이번 문서 작업을 근거로 한 배포는 하지 않습니다.

```sh
git status --short
git branch --show-current
git rev-parse HEAD
node --version
npm --version
```

- Node 요구 범위는 [`package.json`](../../package.json)의 `>=24.15.0 <25`, [`.nvmrc`](../../.nvmrc)는 `24`입니다. Node 24의 오래된 patch까지 모두 지원한다는 뜻은 아닙니다.
- npm은 `package-lock.json`을 존중하는 `npm ci`를 사용합니다. 별도 npm 버전 pin은 현재 없습니다.
- 설치 자산 외에 준비 캐시 약 302 MiB와 `dist/` 복사본, 브라우저, 검사 출력 공간이 필요합니다. desktop baseline까지 만들면 자산 복사본이 더 생깁니다.
- 처음에는 npm registry·고정 GitHub raw URL·manifest에 기록된 공개 자산 origin의 네트워크 접근이 필요합니다. 접근 거부를 다른 origin이나 새 체크섬으로 우회하지 않습니다.

Node 관리 도구가 이미 설치된 환경에서는 다음처럼 맞춥니다.

```sh
nvm install 24
nvm use 24
node --version
npm ci --no-audit --no-fund
```

기본 npm cache 경로에 쓰기 권한이 없는 작업 환경에서는 `npm ci --no-audit --no-fund --cache .cache/npm`처럼 저장소의 Git 제외 cache를 사용합니다. OS 권한을 넓혀 해결하지 않습니다.

`npm ci`는 lock과 `package.json`이 다르면 중단합니다. 재현을 위해 무작정 `npm install`로 lock을 바꾸지 않습니다. 현재 GitHub Actions 파일은 `npm ci`를 사용하며, 위 로컬 권장 명령의 audit/fund 옵션과는 구분합니다.

## 2. npm 명령과 자동 실행 단계

| 명령 | 실제 동작 | 포함하지 않는 것 |
| --- | --- | --- |
| `npm run dev` | `predev` → 자산 준비 + utility 생성 → Vite 개발 서버 | production artifact 검증 |
| `npm run prepare:assets` | 원본 147개 + 외부 211개 준비/검증 | JSX 변환, Tailwind 생성 |
| `npm run styles:generate` | Tailwind 입력을 `tailwind.generated.css`로 생성 | build·자산 다운로드 |
| `npm run lint` | ESLint, warning도 실패 | typecheck·브라우저 실행 |
| `npm run typecheck` | `tsc -b --pretty false` | 번들·실제 DOM 검수 |
| `npm run test` | `src/**/*.test.{ts,tsx}` Vitest 실행 | `tests/static-pages`, Playwright |
| `npm run build` | `prebuild` → 자산 준비 + utility 생성 → `tsc -b && vite build` | E2E, Pages 검증, 배포 |
| `npm run preview` | 기존 `dist/`를 Vite preview로 제공 | build·누락 파일의 실제 Pages 404 보장 |
| `npm run test:e2e` | 기본 `playwright.config.ts` 실행 | build·Pages 전용 config·모바일 독립 config |
| `npm run test:pages` | 기존 `dist/` 정적 파일 검사 + `vitest.pages.config.ts` | **build, Playwright 실행, 배포 모두 포함하지 않음** |
| `npm run check` | lint → typecheck → unit tests → build | `test:pages`, E2E, 실제 공개 사이트 확인 |

`npm run check`는 마지막 build 때문에 자산을 준비하고 생성 CSS를 쓸 수 있습니다. `npm run build` 대신 Vite를 직접 호출하면 npm의 `prebuild`가 생략됩니다. 명령 뒤에는 실패한 단계와 산출물의 기준 SHA/base를 함께 기록합니다.

## 3. 로컬 개발과 기본 검증

아래는 저장소 루트의 POSIX shell 기준입니다. Windows PowerShell에서는 `VITE_BASE_PATH=/ ...` 대신 `$env:VITE_BASE_PATH = '/'`처럼 설정하고 명령을 실행합니다. base를 바꾼 뒤에는 다시 build해야 합니다.

### 개발 서버

```sh
VITE_BASE_PATH=/ npm run dev -- --host 127.0.0.1
```

터미널에 출력된 실제 주소로 접속합니다. 기본 root(`/`) 개발 화면은 빠른 수정 확인용입니다. 이 단계만으로 `/breadme/`나 nested HTML의 배포 성공을 판정하지 않습니다.

### 소스·일반 브라우저 검사

```sh
VITE_BASE_PATH=/ npm run check
npx --no-install playwright install chromium
npm run test:e2e
```

- Linux CI와 동일하게 시스템 브라우저 라이브러리 설치도 필요한 환경은 `npx --no-install playwright install --with-deps chromium`을 사용합니다. 이미 준비된 환경에서 반복 설치할 필요는 없습니다.
- 기본 Playwright는 기존 root-base `dist/`를 port 4173에서 preview합니다. root 빌드를 먼저 해야 합니다.
- CI에서는 기존 preview 재사용이 꺼져 있고, 로컬 기본 config에서는 켜져 있습니다. 다른 checkout의 서버가 port 4173을 차지하고 있지 않은지 확인합니다. 다른 작업의 프로세스를 임의로 종료하지 않습니다.
- 브라우저 실행이 차단되면 설치/권한/renderer 제한을 구체적으로 기록합니다. test discovery나 unit test 성공으로 대체하지 않습니다.

변경 페이지와 주요 동작을 390px·1440px에서 직접 확인하고, 필요한 768px 경계를 추가합니다. Home/Projects/Articles/Contact 이동, 메뉴 반복 열기·닫기, Back/Forward, hash 직접 진입, 폰트·이미지, 콘솔 오류를 변경 범위에 맞게 확인합니다. 실제 기기·Safari·스크린리더·브라우저 기본 200% 줌은 Chromium 자동 검사와 별도입니다.

## 4. 공개 경로와 산출물 검사

일반 E2E를 끝낸 뒤 `/breadme/` 빌드로 바꿉니다. 이 빌드 이후 root-base E2E를 실행하려면 다시 `/`로 build해야 합니다.

```sh
VITE_BASE_PATH=/breadme/ npm run build
VITE_BASE_PATH=/breadme/ npm run test:pages
npx --no-install playwright test --config=playwright.pages.config.ts
```

동일 shell에 `VITE_BASE_PATH`를 export한 경우도 값이 일치해야 합니다. build와 `test:pages`의 base가 다르면 올바른 파일도 잘못된 기준으로 검사할 수 있습니다.

PowerShell의 대응 명령은 다음과 같습니다. 이후 root-base 개발/E2E로 돌아갈 때는 값을 `/`로 바꾸고 다시 build합니다.

```powershell
$env:VITE_BASE_PATH = '/breadme/'
npm run build
npm run test:pages
npx --no-install playwright test --config=playwright.pages.config.ts
# root-base로 돌아갈 때
$env:VITE_BASE_PATH = '/'
npm run build
```

### 각 검사의 범위

- [`verify-static-pages.ts`](../../scripts/verify-static-pages.ts): 14개 HTML 진입점, 로컬 JS/CSS/폰트 URL, `.nojekyll`, manifest 자산 358개의 바이트 길이와 SHA-256, 불필요한 Spline runtime chunk 부재.
- [`tests/static-pages/output.test.tsx`](../../tests/static-pages/output.test.tsx): 별도 Vitest config로 산출물/라우트 계약 검사.
- [`playwright.pages.config.ts`](../../playwright.pages.config.ts): port 4180의 실제 정적 서버에서 390×844, 1440×900 검사. `PAGES_PORT`로 포트 변경 가능.
- [`static-server.mjs`](../../tests/pages/static-server.mjs)는 `/breadme/` 아래의 실제 `dist/` 파일만 제공하고 없는 파일에는 404를 반환합니다. SPA rewrite가 없습니다.
- 브라우저 검사는 14개 route의 직접 로드·새로고침·이미지·폰트·base, Home→Projects→상세→Back, Articles hash 읽기/복귀, 없는 route/JS의 진짜 404를 검사합니다.
- 현재 Home은 Spline canvas와 runtime 요청이 없어야 합니다.
- QA 브라우저는 비읽기 HTTP 요청을 차단합니다. app-origin write 시도는 실패이며 외부 embed write 시도는 별도 evidence에 남습니다. 실제 폼을 제출하는 검사로 바꾸지 않습니다.

현재 test case 목록만 확인하려면 다음을 사용합니다. `--list` 성공은 실제 실행 성공이 아닙니다.

```sh
npx --no-install playwright test --config=playwright.pages.config.ts --list
```

## 5. 필요할 때 실행하는 별도 UI 검수

기본 E2E나 Pages 검사에 자동 포함되지 않습니다. 변경 영역과 검수 목적에 맞게 선택하고 실제 실행 여부를 기록합니다.

### 모바일 읽기·조작 증거

```sh
VITE_BASE_PATH=/ npm run build
MOBILE_UI_CAPTURE_ONLY=1 npx --no-install playwright test --config=playwright.mobile-ui.config.ts
```

[`tests/mobile-ui/README.md`](../../tests/mobile-ui/README.md)에 route/글/화면 폭/상태별 범위가 있습니다. baseline/reading capture에는 진단용 관측이 있고, readability·interaction·image-ratio 파일에는 엄격한 assertion도 있습니다. 초록색 실행은 그 assertion과 캡처가 완료되었다는 뜻이며 모든 PNG의 시각 검토 완료는 아닙니다. root font/synthetic text 확대는 실제 브라우저 줌과 구분합니다.

### 동일 브라우저의 desktop 비교와 provider 기준선

```sh
node scripts/prepare-desktop-unchanged.mjs
npx --no-install playwright test --config=playwright.desktop-unchanged.config.ts
# Voice IVR 외부 플레이어/런타임 문제를 같은 조건으로 조사할 때만 추가
npx --no-install playwright test --config=playwright.provider-baseline.config.ts
```

- candidate root-base build와 준비 자산이 먼저 있어야 합니다.
- 준비 스크립트는 현재 main을 가져오는 것이 아니라 **고정 `4f026a3dd816c11bb1a4718379e2ba9d6f7527af`**를 `git archive`로 복원합니다. 해당 object가 체크아웃에 필요합니다.
- baseline과 candidate lock이 완전히 같은 경우에만 같은 `node_modules`를 사용합니다. lock 차이를 무시하거나 다른 graph를 몰래 설치하지 않습니다.
- `test-results/desktop-unchanged-baseline/`을 재생성하므로 그 경로에 사람이 보관한 파일을 두지 않습니다. baseline/candidate는 각각 port 4174/4173을 사용합니다.
- 비교 범위는 14개 route의 768/1440px 첫 viewport와 Footer입니다. 동적 미디어를 가린 정확한 pixel 비교이며 전체 본문·모든 상태·실제 기기 동등성 검사는 아닙니다.
- provider baseline은 같은 Voice IVR 사례를 이전 정상 기준에서도 관측하기 위한 것입니다. 후보 코드의 runtime failure를 무시해도 된다는 허가가 아닙니다.

Home 전용 layout 검사는 기본 `tests/e2e`에도 포함되며, `HOME_BASELINE_URL`을 지정하면 공개 기준선과의 비교 자료를 만들 수 있습니다. 바뀔 수 있는 live baseline의 캡처 시점과 revision을 기록하고 고정 desktop baseline과 혼동하지 않습니다.

## 6. 자산 문제 진단

### 기존 캐시 검사

```sh
node scripts/prepare-original-assets.mjs --check
node scripts/prepare-external-assets.mjs --verify-only --strict
```

첫 명령은 읽기 전용이며 네트워크와 쓰기가 없습니다. 외부 명령은 다운로드나 글꼴 CSS 변경 없이 기존 바이트를 검사하지만 내부 구현상 캐시 디렉터리를 만들 수 있습니다. 두 검사를 “어떠한 파일시스템 변경도 없는 동일 명령”으로 설명하지 않습니다.

| 증상 | 먼저 확인 | 대응 |
| --- | --- | --- |
| 원본 자산 없음 | 고정 URL·네트워크 접근, `ORIGINAL_ASSET_SOURCE_DIR` 경로 | 정상 공개 원본/일치하는 로컬 파일을 사용해 `prepare:assets` 재실행 |
| 원본 checksum 불일치 | manifest SHA/길이와 실제 파일 | 정상 고정 원본에서만 복구. 스크립트가 검증된 임시 파일로 교체 |
| 외부 캐시 checksum 불일치 | 손상된 정확한 파일·출처·현재 diff | 실패를 보존하고 원인 조사. 전체 캐시 삭제나 체크섬 변경으로 통과시키지 않음 |
| upstream 404/redirect/바이트 변경 | manifest URL·resolvedUrl·보존된 원본 | 동등한 바이트 확보 전 build 차단. 임의 mirror/placeholder 교체 금지 |
| 글꼴 CSS가 예상과 다름 | manifest font stylesheet와 `fonts.css` diff | 생성 원본을 확인해 정상 prepare. 임의 대체 폰트로 해결하지 않음 |
| root는 정상, Pages에서 이미지/폰트 404 | `VITE_BASE_PATH`, `assetUrl`/`originalHref`, CSS import 경로 | `/breadme/`로 rebuild하고 정적 서버 검사 |

선택적 원본 체크아웃은 다음처럼 지정할 수 있습니다. 로컬 파일이 고정 manifest와 다르면 스크립트는 고정 원격 원본을 사용합니다.

```sh
ORIGINAL_ASSET_SOURCE_DIR=/absolute/path/to/Portfolio npm run prepare:assets
```

원본 HTML 변환기 재실행은 자산 문제 해결 명령이 아닙니다. 필요한 경우 [아키텍처의 재생성 설명](architecture.md#generated의-의미와-재생성-주의)을 먼저 확인하고 별도 변경으로 수행합니다. 자세한 자산 정책은 [원본 자산](../original-assets.md), [외부 자산](../original-external-assets.md)을 따릅니다.

## 7. CI의 실제 실행 범위

| workflow | 실행 조건 | 무엇을 보장하는가 / 한계 |
| --- | --- | --- |
| [`Foundation checks`](../../.github/workflows/ci.yml) | 모든 PR, main push, 수동 실행 | `check`, Home/Enjoy checkpoint, 기본 E2E. Pages 전용 검사와 별개 |
| [`Breadme production paths`](../../.github/workflows/pages-checks.yml) | 모든 PR | `/breadme/` build, `test:pages`, Pages Playwright. 업로드·배포 없음 |
| [`Publish breadme`](../../.github/workflows/deploy-pages.yml) | 해당 저장소의 main push | 검사한 artifact만 게시한 뒤 영수증·live Pages 검사 |
| [`Home mobile layout review`](../../.github/workflows/home-layout-review.yml) | 지정 Home 관련 path를 바꾸는 PR이면서 head가 `feature/home-mobile-branding` | 전용 Home 비교. 다른 feature/docs 브랜치에서는 일반적으로 job 실행 안 됨 |
| [`Mobile UI readability`](../../.github/workflows/mobile-ui-audit.yml) | PR head가 `feature/mobile-ui-readability` 또는 수동 실행 | mobile UI, 고정 baseline 준비, desktop guard. provider 관측만 `continue-on-error` |
| [`Original portfolio evidence`](../../.github/workflows/source-reference.yml) | 원본 캡처 스크립트/해당 workflow 변경 PR | 390/1440 원본 상세 3개 캡처. 전체 제품 gate가 아님 |

현재 특정 브랜치용 workflow가 있다는 이유로 앞으로 모든 PR에서 모바일/desktop guard가 자동 수행된다고 가정하지 않습니다. skipped job은 pass와 구분하며 branch protection의 required check 여부는 GitHub 실제 설정을 확인합니다.

보고서와 증거는 대체로 Actions artifact에 7일 보관됩니다. 주요 이름은 `browser-verification`, `route-mobile-evidence`, `route-desktop-evidence`, `pages-production-evidence`, `pages-predeploy-evidence`, `pages-live-evidence`, `mobile-ui-evidence`, `desktop-unchanged-evidence`입니다. 필요 증거의 실행 URL·commit·환경·최종 결과를 QA 기록에 남깁니다. JSON의 중간 `statusBeforeRuntimeAssertion`만 보고 전체 pass로 기록하지 않습니다.

## 8. 릴리스와 실제 게시 확인

병합·공개 권한은 [브랜치 운영](../ground-rules/01-repository-and-branching.md)과 [릴리스/복구 규칙](../ground-rules/04-backup-and-release.md)을 따릅니다. 기본 흐름은 작업 브랜치 → beta → 별도 main 승인 대화 → main입니다. 실제 저장소의 과거 승인 예외나 당시 PR target을 앞으로의 포괄 승인으로 해석하지 않습니다.

### 공개 전

- [ ] 범위와 사용자 확인 항목을 정리하고 관련 페이지 README/공통 적용표/콘텐츠 원본을 확인
- [ ] 동일 candidate SHA의 `check`, 일반 E2E, `/breadme/` 산출물/Pages 브라우저 결과 확인
- [ ] 변경 영역에 필요한 별도 UI 검수와 실제 수동 결과, 미검수·환경 제한 명시
- [ ] 새 외부 서비스, 콘텐츠 의미, 공개 자료, 디자인 예외에 기존 규칙 적용
- [ ] 해당 main 반영에 대한 명시적 승인 확인. 기존 승인·CI 성공만으로 main 병합하지 않음

### main 반영 후

1. remote main의 실제 SHA와 Publish 실행 SHA가 일치하는지 확인합니다.
2. Publish의 `build`, `deploy`, `verify-live`를 각각 확인합니다. deploy 성공 후 verify-live 실패도 “전체 게시 검증 성공”으로 처리하지 않습니다.
3. 공개 `deployment.json`의 repository/commit/base를 비교합니다. 영수증 파일이 없는 일반 local build와 구분합니다.
4. 해당 live 주소를 Pages Playwright로 검사하고 14개 경로의 직접 진입·새로고침과 핵심 흐름을 확인합니다.
5. 공개 주소, SHA, 실행 링크, 남은 제한을 결과에 남깁니다. [`versions/`](../../versions/README.md)는 기존 버전 규칙에 맞춰 별도 갱신합니다.

게시되어야 할 정확한 SHA를 알고 있을 때 다음 검사만 실행할 수 있습니다. 아래 변수에는 **검증하려는 공개 커밋의 40자리 SHA**를 넣으며 작업 브랜치 HEAD를 무조건 사용하지 않습니다.

```sh
PUBLISHED_SHA='여기에_확인한_40자리_공개_커밋_SHA'
GITHUB_SHA="$PUBLISHED_SHA" \
  PAGES_BASE_URL=https://nana-park.github.io/breadme/ \
  node scripts/verify-deployed-revision.mjs

PAGES_BASE_URL=https://nana-park.github.io/breadme/ \
  npx --no-install playwright test --config=playwright.pages.config.ts
```

`verify-deployed-revision.mjs`는 이 공개 origin/base만 허용하고 최대 24회, 5초 간격으로 영수증을 비교합니다. `PAGES_BASE_URL`을 지정한 Playwright는 로컬 서버를 띄우지 않습니다. fetch·브라우저 접근이 막히면 CI 증거와 직접 관측의 한계를 나누어 보고하고 성공을 추정하지 않습니다.

기준선 증거: `3738e46`의 [Foundation 성공 기록](https://github.com/nana-park/breadme/actions/runs/37278044636), [Publish 성공 기록](https://github.com/nana-park/breadme/actions/runs/37278044595). 문서 작성 시 별도의 최신 live fetch 성공을 확보하지 않았으므로 이 링크를 이후 커밋이나 현재 방문 시점의 보장으로 사용하지 않습니다.

## 9. 장애 대응과 복구

### 공통 기록

실패한 SHA/주소/route/화면 폭/상태, 발생 시각, browser·Node 버전, 실패 명령과 최종 로그, 콘솔·네트워크·스크린샷을 남깁니다. 재현되지 않은 사용자 증상은 “미재현”으로 보존합니다. 외부 플레이어 오류, renderer 제약, 새 코드 회귀를 원인 확인 없이 합치지 않습니다.

| 상황 | 우선 조치 | 완료 판정 |
| --- | --- | --- |
| build 실패 | 첫 실패 단계와 자산/타입/번들 로그 분리 | 해당 수정 후 전체 관련 검사 재실행 |
| E2E는 통과, nested URL 404 | HTML entry와 `/breadme/` 정적 서버 확인 | 직접 요청·새로고침이 실제 200, unknown 경로는 404 |
| 게시 영수증 SHA 불일치 | Publish job/artifact/SHA/환경 상태와 CDN 전달 조사 | 영수증과 기대 SHA 일치 + live 검사 |
| runtime error가 외부 media와 함께 발생 | runtime stack·네트워크 증거, 필요 시 동일 provider baseline 비교 | 원인/영향 분리. 에러 문자열 whitelist로 숨기지 않음 |
| 화면만 달라짐 | 동일 viewport·글꼴·state·browser 기준 캡처 | 변경 계약에 맞는 비교와 실제 PNG 검토 |
| main 게시 후 회귀 | 마지막 정상 기준과 영향 범위 확인, 사용자에게 공개 영향 보고 | 승인된 복구본의 새 SHA가 게시되고 live 검증 성공 |

### 복구 원칙

[기존 복구 규칙](../ground-rules/04-backup-and-release.md)에 따라 마지막 정상 태그/커밋을 확인하고 `fix/*` 브랜치에서 복구 변경을 준비합니다. 되돌릴 범위가 명확하면 문제 변경을 되돌리는 PR을 만들되, 이후 사용자 변경을 덮어쓰지 않는지 검토합니다. force push, main 이력 rewrite, 통째 백업 폴더 덮어쓰기, 환경의 main-only 제한 해제는 복구 절차가 아닙니다.

이 저장소의 공개 경로는 main push 기반입니다. 따라서 정상본 재배포도 승인된 main 상태로 복구한 뒤 기존 Publish 경로를 거쳐야 합니다. **긴급 상황이라는 이유로 별도 main 승인 규칙을 생략하지 않습니다.** 복구 후의 기대 영수증 SHA는 예전 원본 SHA가 아니라 실제 복구 commit일 수 있습니다. 새 영수증과 live 검사로 완료를 확인한 후 원인을 별도 수정합니다.

## 10. 의존성·생성 파일 유지보수

- 의존성 변경은 별도 `chore/*` 범위에서 package/lock diff, Node 요구, 주요 upstream 변경, 소스·브라우저·Pages 검사를 묶어 검토합니다. 문서 작업에 버전 갱신이나 자동 fix를 섞지 않습니다.
- 과거 설치 로그에 **high 등급 5건**이 보고된 이력이 있으나, 이번 점검에서 advisory ID·현재 의존 경로·공개 런타임 도달성은 검증하지 않았습니다. “서비스에서 악용 가능한 취약점 5개 확인” 또는 “보안상 안전함”으로 바꾸어 기록하지 않습니다.
- 이번 점검은 추가 audit metadata 전송을 하지 않았습니다. `npm audit`/`npm audit fix`를 자동 재실행하지 않고, 허용된 검토 범위에서 advisory 근거와 dev/build/runtime 구분, 영향·조치·회귀 검증을 확보하는 별도 보안 검토로 다룹니다.
- `prepare:assets`/`styles:generate` 후 tracked `fonts.css`/`tailwind.generated.css`에 diff가 생기면 자동 생성물이라는 이유로 무조건 커밋하지 않습니다. 같은 lock·manifest·입력에서 설명 가능한 변화인지 확인합니다.
- 미사용 scaffold·Spline 의존성 제거는 import/번들/검사 영향과 보존 요구를 확인한 별도 작업입니다. 삭제 자체를 성능 개선 완료로 기록하지 않습니다.

## 11. 결과 기록 템플릿

```text
대상: PR / branch / full SHA
목적과 변경 파일:
실행 환경: Node, npm, OS, browser, base, viewport
실행한 검사: 명령 → pass / fail / blocked / not run
직접 확인한 상태:
증거: Actions run, artifact, screenshot/JSON 위치
기존 기준선 대비 새 문제:
미검수 및 환경 제한:
사용자 결정/승인 필요 항목:
공개 여부: 미공개 / 공개, 실제 영수증 SHA
후속 작업과 완료 조건:
```

이 템플릿은 결과를 구분하기 위한 도구이며 pass 항목을 미리 채우지 않습니다. 문서-only 변경은 변경 범위를 명확히 기록하고, 소스/배포 검사를 수행하지 않았다면 그 상태를 그대로 남깁니다.
