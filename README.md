# breadme

기존 [Portfolio](https://github.com/nana-park/Portfolio)의 디자인과 내용을 React로 옮기는 프로젝트입니다. **원본 디자인을 기준으로 합니다.** 처음 만들었던 구조 설명용 화면은 실제 포트폴리오 화면으로 교체했습니다.

- [공개 사이트](https://nana-park.github.io/breadme/)
- [Home 개선 검토 PR #2](https://github.com/nana-park/breadme/pull/2)
- [기존 공개 포트폴리오](https://nana-park.github.io/Portfolio/)
- 원본 기준 커밋: `834815915647e4b3fbf9285b88b8001e37b94aa0`
- 새 게시 주소: https://nana-park.github.io/breadme/ (배포 결과는 Actions와 deployment.json에서 확인)
- 기존 `Portfolio` 저장소·공개 사이트는 그대로 유지합니다. 이름을 바꾼 것은 이 React 저장소뿐입니다.

## 이번 Home 개선 (검토 중)

공개된 첫 이관본 다음 작업입니다. **이번 PR은 Home만 변경하며 아직 공개 사이트에 반영하지 않았습니다.**

- 사용자 경력 자료를 근거로 AI Product Manager의 실제 역할을 소개합니다. 성과 수치를 새로 만들지 않습니다.
- 제목: `Designing AI Product Experiences Across Markets`
- 모바일에서는 이름·직무, 헤드라인, 과거 경력의 **왼쪽 시작선을 맞춥니다**. 버튼 배치와 데스크톱 정렬은 그대로입니다.
- 모바일의 두 버튼을 세로로 배치하고, `View my work` / `Get in touch`처럼 짧게 표시합니다. 기존 Projects / Contact로 이동합니다.
- 사용자가 선택한 **텍스트 중심 첫 화면**으로 바꿉니다. Home에서는 3D 컴포넌트를 렌더링하지 않으며, 3D는 남기고 배지만 숨기는 방식이 아닙니다.
- Home Hero는 `src/pages/home/HomeHero.tsx`, 문구는 `src/content/site/homeHero.ts`, 스타일은 같은 폴더의 CSS Module에서 수정합니다.
- About·Projects 등 다른 화면과 Home 아래 경력·학력 섹션은 유지합니다.
- 작은 이름·직무 → 큰 제목 → 작은 과거 경력 근거의 글자 크기 위계를 둡니다.
- 사용자 요청에 따라 `Grounded in psychology`로 시작해 `Japan.`으로 끝나는 설명 문단만 잠시 제거했습니다. 원문은 Git의 `e783331` 이력에 남겨 다음 수정 때 다시 검토합니다. 이름·제목·과거 회사·CTA와 스타일은 그대로입니다.
- 모바일 첫 소개 영역에서는 중복된 떠 있는 자료 버튼을 잠시 숨기고, Header의 자료 메뉴는 유지합니다. 소개 영역을 지나면 떠 있는 버튼이 다시 보입니다. 자료 전송은 여전히 Coming Soon입니다.
- 320 / 375 / 390 / 430 / 1440px의 전후 캡처, 실제 글자 크기·줄 수·겹침·CTA 목적지와 키보드를 검수합니다. 정확한 통과 여부는 PR의 최신 Actions 결과를 확인합니다.

현재 공개 커밋은 `4607953bda8b0c0683b4ba09786781f95be861ea`입니다. 첫 이관·공개 검수는 단위77개, 기능48개, 실제 공개 URL34개가 통과했습니다. 이 기록을 이번 Home 수정의 통과 결과로 대신하지 않습니다. 새 병합·게시에는 별도 확인이 필요합니다.

## 지금 된 것

- 원본 글꼴·색·간격·SVG·사진·영상·3D를 유지한 React JSX 화면
- Home / About / Career / Qualified / Enjoy / Projects / Research / Articles / Lectures / Awards / Contact 11개 화면
- 실제로 연결된 프로젝트 상세 3개: Voice IVR / Hopzie / AI Mentoring
- Articles 18개 영어 본문 전체, 6쪽 목록, 읽기·뒤로 이동
- 원본 Header / Footer, 모바일 메뉴, 경력 전환·인증 탭·갤러리·강의 캐러셀·프로젝트 펼침·상세 탭
- 최초 이관에서는 원본 Spline 장면과 배지를 보존했습니다. 이번 Home 검토안은 사용자가 선택한 텍스트 중심 소개로 변경합니다. 원본 파일·해시 기록은 보존하지만 Home에서는 불러오지 않습니다.
- 기본 실행·코드·타입·단위·브라우저 검사와 원본 비교 캡처

전체 HTML을 iframe에 넣거나 문자열 HTML로 보여주는 방식이 아닙니다. 화면은 실제 React 요소이고, 동작은 React 상태와 정리 가능한 이벤트 처리로 옮겼습니다. 원본에 이미 있던 YouTube 동영상 플레이어는 미디어 임베드로 유지합니다. 멘토링의 제품 데모는 React 요소로 변환했습니다.

## 데스크톱과 모바일

데스크톱은 원본 화면을 같은 너비로 나란히 비교합니다. 모바일에서도 원본 디자인을 유지하되 화면 밖으로 잘리는 요소, 버튼 겹침과 키보드·터치 문제만 조정합니다.

- 원본과 동일한 70px 헤더와 메뉴 구조
- 1024px 미만에서 모바일 메뉴, 767px 이하에서 필요한 화면 조정
- 같은 콘텐츠·목적지·기능 유지
- Home의 좁은 화면에서는 텍스트 위계와 세로 CTA로 같은 읽기·이동 흐름을 유지
- 모바일 조작 영역·포커스·메뉴 닫기·자료 팝업 겹침 검수
- Enjoy의 긴 필터 줄은 모바일 화면 밖으로 잘리지 않고 줄 안에서 가로 스크롤

## 아직 준비되지 않은 기능

- 이력서·포트폴리오 패키지 자동 전송과 요청 백엔드는 활성화하지 않았습니다.
- 자료 요청 UI의 `Coming Soon` 표시를 유지하고 전송 입력은 비활성화했습니다. 실제로 메일을 보내지 않고 성공했다고 표시하지 않습니다.
- 원본 상세 3개는 떠 있는 자료 버튼 없이 Header의 `Coming soon!` 안내를 유지합니다.
- 원본의 미완성 Korean 버튼은 `Coming soon!` 안내를 유지합니다. 영어 페이지를 번역 완료라고 표시하지 않습니다.
- 원본에서 숨긴 Enjoy 메뉴는 새로 노출하지 않습니다. 기존 `enjoy.html` 주소의 화면은 옮겼습니다.
- 연결되지 않은 오래된 프로젝트 페이지·백업 파일은 복사하지 않았습니다.
- 최초 이관본은 main에 반영해 공개했습니다. 이후의 변경은 검토 브랜치와 PR에서 검수하고, 별도로 확인한 뒤 공개합니다.

## 내 컴퓨터에서 실행하기

Node.js 24 LTS(24.15.0 이상)와 npm이 필요합니다. 저장소 폴더에서 터미널을 열고 실행하세요.

```bash
npm ci
npm run dev
```

터미널의 로컬 주소(보통 `http://localhost:5173`)를 엽니다. 종료는 `Ctrl+C`입니다.

### 처음에는 원본 파일을 받습니다

원본 사진·영상 약276MiB와 외부 글꼴·이미지 약26MiB를 처음 한 번 받으므로 인터넷 연결과 시간이 필요합니다. 원본의 고해상도 파일을 임의로 줄이거나 다른 그림으로 바꾸지 않았습니다.

- 원본 커밋·URL·파일 SHA-256을 고정해 받은 내용이 맞는지 확인합니다.
- 받은 파일은 `public/original/`, `public/original-external/`에 재사용 가능한 로컬 파일로 둡니다.
- 이 큰 파일들을 React Git 이력에 중복 저장하지 않습니다.
- 방문자 브라우저에는 빌드에 포함된 로컬 사진·글꼴을 제공합니다. 원본 사이트의 사진 URL을 직접 연결해 쓰는 방식이 아닙니다.
- 환경에 따라 PNG 바이트가 바뀌는 원본 기본 아바타 5개는 확인한 원본 바이트를 작게 고정해 두었습니다. 해시 검사를 끄지 않았습니다.

[원본 파일 준비 설명](docs/original-assets.md) / [외부 파일·글꼴 라이선스](docs/original-external-assets.md)

## 주요 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 파일 준비 후 개발 화면 실행 |
| `npm run prepare:assets` | 원본 파일을 받고 해시 검증 |
| `npm run styles:generate` | 원본 클래스에 맞는 로컬 Tailwind CSS 생성 |
| `npm run lint` | 코드·React 규칙 검사 |
| `npm run typecheck` | 데이터와 컴포넌트 연결 검사 |
| `npm test` | 콘텐츠·조작·정리 동작 단위 검사 |
| `npm run build` | 원본 파일 준비·스타일 생성·프로덕션 빌드. 배포는 하지 않음 |
| `npm run preview` | 빌드 결과를 로컬에서 열기 |
| `npm run check` | lint → typecheck → test → build |
| `npm run test:e2e` | 실제 Chromium으로 화면·이동·조작 검사 |
| `VITE_BASE_PATH=/breadme/ npm run test:pages` | 배포 빌드 후 14개 HTML·폰트·원본 파일 검사 |
| `npx playwright test --config=playwright.pages.config.ts` | 실제 정적 서버의 /breadme/ 경로 브라우저 검사 |

첫 브라우저 검사 전에는 `npx playwright install chromium`을 실행하세요. Linux에 시스템 의존성이 없으면 `npx playwright install --with-deps chromium`이 필요할 수 있습니다. 브라우저 검사 전에 `npm run build`를 실행합니다.

## 어떤 파일을 보면 되나요?

```text
src/
├─ app/App.tsx                      공통 화면과 자료 팝업 조립
├─ config/originalRoutes.ts          실제 원본 URL과 페이지 선택
├─ pages/original/OriginalPage.tsx    각 원본 페이지 연결
├─ pages/original/generated/         원본을 그대로 옮긴 JSX·페이지 CSS
├─ pages/original/OriginalArticlesPage.tsx  아티클 목록·읽기 동작
├─ content/original/articles/        18개 아티클 본문과 메타데이터
├─ content/original/                 메뉴와 검증된 파일 목록
├─ shared/layout/OriginalHeader/     원본 헤더·반응형 메뉴
├─ shared/layout/OriginalFooter/     원본 푸터
├─ shared/ui/MaterialsPopup/         미완성 자료 UI
├─ shared/ui/SplineHero/             원본 3D 장면
├─ shared/hooks/                    페이지별 실제 조작과 정리
└─ styles/original/                  원본 CSS·글꼴·필요한 모바일 보정
```

이 단계는 원본을 정확하게 옮기는 것이 우선입니다. 원본 JSX를 공통 카드나 새로운 디자인으로 다시 쓰지 않았습니다. 원본 CSS와 Tailwind 클래스의 적용 순서도 보존합니다. 이후 문구나 디자인을 바꾸는 작업은 이관 검수와 분리해 진행합니다.

`generated` 파일은 원본 고정 커밋을 확인한 변환 도구로 만들었습니다. 다른 원본에 도구를 돌리면 먼저 중단하도록 보호합니다. 현재 화면을 바꿀 때는 페이지 설명과 검수도 함께 갱신합니다.

## 검수 상태와 범위

원본과 React의 14개 페이지를 390px·1440px에서 비교했습니다. Home은 320/390/767/768/1024/1025/1440px에서도 확인했습니다. 단위 검사 68개와 브라우저 검사 48개로 화면·이동·조작을 검수했고, 발견한 Awards 배경·Enjoy 필터·자료 버튼 겹침 등을 수정했습니다. 정확한 검사 커밋과 후속 기록은 아래 문서를 기준으로 합니다.

최신 전체 경로·모바일 조작·시각 검수의 **통과 / 미검수 구분**은 [이관 검수 기록](docs/qa/original-migration-verification.md)과 [디자인 비교](design-qa.md)에 기록합니다. [PR checks](https://github.com/nana-park/breadme/pull/1/checks)에서 정확한 마지막 커밋의 결과를 볼 수 있습니다.

로컬 Chromium 실행은 작업환경의 OS socket 제한, 클라우드 브라우저의 localhost 접근은 보안 제한으로 막혔습니다. 사용자 컴퓨터 설정을 풀지 않고 GitHub-hosted Chromium에서 실제 렌더링·스크린샷·조작을 검수합니다.

## 브랜치와 공개 상태

최신 협업 규칙을 보존하려고 `docs/collaboration-ground-rules`에서 `feature/responsive-react-foundation`을 만들었습니다. 처음에는 문서 브랜치를 대상으로 검토했고, 공개·main 병합 승인 후 PR 대상을 main으로 전환합니다. 문서와 코드의 기존 이력은 일반 merge로 보존합니다.

이번에는 사용자가 검수한 변경을 main에 합치고 main에서만 게시하는 방식을 승인했습니다. 기존 문서·기능 이력을 보존하는 merge commit을 사용하며, PR 검사를 통과한 변경만 main에 반영합니다.

GitHub Pages용 빌드는 `VITE_BASE_PATH=/breadme/ npm run build`입니다. 14개 `.html` 파일을 실제로 만들어 중첩 상세 페이지에 직접 들어가거나 새로고침해도 개발 서버의 우회 없이 열리도록 했습니다. `VITE_BASE_PATH=/breadme/ npm run test:pages`로 배포 파일과 원본 자산을 검사합니다.

배포는 `main`에 검토한 커밋을 반영할 때만 실행됩니다. 작업 브랜치·PR은 자동 게시하지 않으며 다른 브랜치의 배포 권한도 추가하지 않습니다. `.github/workflows/deploy-pages.yml`은 빌드와 34개 배포 경로 검사 후 게시하고, 실제 공개 주소에서 같은 검사를 다시 실행합니다. 별도 PAT나 서버 계정은 쓰지 않습니다. 공개된 정확한 커밋은 `deployment.json`에서 확인합니다.

GitHub Pages의 기존 main 허용 규칙을 유지합니다. 기존 `/Portfolio/`의 삭제·이동 안내·리디렉션은 아직 적용하지 않습니다.

## 문서

- [원본 이관 범위와 화면 구성](src/pages/original/README.md)
- [Ground Rules](docs/ground-rules/README.md)
- [반응형 전략](docs/responsive-strategy.md)
- [버전 현황](versions/README.md)
- [공통 컴포넌트 적용표](docs/design-system/component-adoption.md)
- [초기 구조 검수 기록](docs/qa/foundation-verification.md): 원본 이관 전 기록
