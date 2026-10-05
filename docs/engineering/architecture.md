# 현재 아키텍처와 변경 지점

이 문서는 앞으로의 이상적인 구조가 아니라 **현재 동작하는 구조**를 설명합니다. 구현 기준은 `nana-park/breadme@3738e4620bb495ecfcd7ef589c91c2049ce0153a`입니다. 운영 명령과 장애 대응은 [실행·배포 Runbook](runbook.md)을 따릅니다.

기존 HTML 이관의 원본은 `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`입니다. 현재 React 화면에는 이후 승인된 Home·모바일 보정이 추가되어 있으므로 “원본 커밋과 모든 화면이 동일하다”는 의미는 아닙니다. 작업·병합·디자인·콘텐츠 권한은 [Ground Rules](../ground-rules/README.md)가 우선합니다. 이 문서는 새 승인이나 배포 권한을 만들지 않습니다.

## 1. 한눈에 보는 시스템

| 영역 | 현재 구현 | 유지보수 시 주의 |
| --- | --- | --- |
| UI | React 19.3.0, TypeScript 5.9.3, Vite 8.3.2 | 버전 원본은 `package.json`과 `package-lock.json` |
| 배포 | GitHub Pages의 `/breadme/` 정적 파일 | 배포는 해당 저장소의 `main` push에서만 실행 |
| 주소 | 14개 실제 HTML 진입 파일 + 일반 `<a>` 이동 | React Router 기반 SPA 라우팅이 아님 |
| 렌더링 | 동일한 HTML shell에서 pathname별 React 컴포넌트 선택 | HTML 본문을 미리 렌더링하는 SSG/SSR이 아님 |
| 데이터 | 저장소 안 TS/TSX/JSON, 일부 브라우저 상태 | 데이터베이스·자체 API·CMS·서버 함수 없음 |
| 스타일 | 원본 전역 CSS, 페이지 CSS, 생성 Tailwind utility, CSS Modules | 새 컴포넌트 규칙과 원본 보존 예외가 공존 |
| 자산 | 빌드 전에 원본을 검증해 `public/`에 준비 | 전체 358개, 약 301.57 MiB. 첫 방문 전송량과 다름 |
| 외부 런타임 | About/Voice IVR의 YouTube 플레이어 | 모든 콘텐츠가 완전한 오프라인 자산인 것은 아님 |
| 미완성 제품 기능 | Korean 전환, 자료 요청·메일 전송 | 실제 서비스처럼 성공을 표시하지 않음 |

근거: [`package.json`](../../package.json), [`App.tsx`](../../src/app/App.tsx), [`vite.config.ts`](../../vite.config.ts), [`deploy-pages.yml`](../../.github/workflows/deploy-pages.yml).

## 2. 요청에서 화면까지

```text
/breadme/about.html 요청
  → GitHub Pages가 dist/about.html 전달
  → 공통 JS/CSS entry 로드
  → src/main.tsx: createRoot + StrictMode
  → App: pathname에서 pageId 결정
  → OriginalHeader + OriginalPage + OriginalFooter
  → OriginalPage: 선택 페이지 JSX를 lazy import
  → 원본 DOM/스타일 표시 + 해당 페이지 interaction hook 연결
```

- [`index.html`](../../index.html)은 React root와 공통 메타데이터를 가진 shell입니다. JavaScript가 꺼지면 전체 본문 대신 기존 Portfolio 링크를 포함한 `noscript` 안내가 보입니다.
- [`main.tsx`](../../src/main.tsx)는 `createRoot`를 사용합니다. 서버 렌더링 결과의 hydration은 하지 않습니다.
- [`App.tsx`](../../src/app/App.tsx)는 공통 Header/Footer, skip link, 자료 패널을 조립합니다. 기본 문서 언어와 제목은 `en` / `Nahyun Park`입니다.
- [`OriginalPage.tsx`](../../src/pages/original/OriginalPage.tsx)는 페이지 컴포넌트를 `lazy`/`Suspense`로 나누어 로드합니다. 페이지별 CSS는 `import.meta.glob(..., eager: true)`로 문자열을 읽으므로 **JSX가 lazy라고 모든 CSS도 페이지별 네트워크 청크로 분리되는 것은 아닙니다**.
- Articles만 별도 [`OriginalArticlesPage.tsx`](../../src/pages/original/OriginalArticlesPage.tsx)를 사용합니다. 나머지 공개 페이지는 `generated/` JSX가 본문입니다.

### 주소 계약

공개 주소 목록의 단일 원본은 [`originalRoutePaths`](../../src/config/originalRoutes.ts)입니다. 같은 목록을 런타임, 정적 파일 생성기, 배포 테스트가 함께 사용합니다.

| pageId | `/breadme/` 뒤의 경로 |
| --- | --- |
| home | `index.html` 또는 빈 경로 |
| about / career / qualified / enjoy | `about.html` / `career.html` / `qualified.html` / `enjoy.html` |
| projects / research / articles | `projects.html` / `research.html` / `articles.html` |
| lectures / awards / contact | `lectures.html` / `awards.html` / `contact.html` |
| llm-based-voice-ivr | `projects/llm-based-voice-ivr.html` |
| hopzie-oneclickbuilder | `projects/hopzie-oneclickbuilder.html` |
| ai-mentoring-agent-detail | `projects/ai-mentoring-agent-detail.html` |

[`scripts/static-pages.ts`](../../scripts/static-pages.ts)는 Vite가 만든 `index.html`을 나머지 13개 경로에 복제하고 `.nojekyll`을 출력합니다. 각 HTML에는 동일한 React 진입점이 연결됩니다. URL 이동은 브라우저의 문서 탐색이며, 일반 링크로 다른 페이지를 열면 애플리케이션이 다시 시작됩니다.

`resolveOriginalPage()`는 pathname의 마지막 파일명에서 `.html`을 제거해 선택합니다. 전체 경로 구조를 검증하는 라우터는 아니며 알 수 없는 이름은 Home으로 처리합니다. 이 함수의 fallback과 실제 HTTP 404는 다른 계층입니다. 운영 서버에는 없는 파일을 Home으로 다시 쓰는 규칙이 없고, Pages 전용 테스트도 없는 경로가 진짜 404인지 검사합니다. Vite 개발/preview의 fallback만 보고 새 주소가 배포 가능하다고 판단하면 안 됩니다.

Articles의 `#article-detail?id=47268`는 별도 서버 경로가 아닙니다. 동일한 `articles.html`에서 hash를 읽어 본문을 바꿉니다. hash 변경, 새로고침, Back/Forward, 목록 복귀가 주소 계약에 포함됩니다.

## 3. 변경할 내용별 실제 원본

| 변경 대상 | 먼저 볼 파일 | 다른 파일과의 관계 |
| --- | --- | --- |
| Home 첫 소개 문구 | [`src/content/site/homeHero.ts`](../../src/content/site/homeHero.ts) | `HomeHero.tsx`가 렌더링. 기존 `homeContent.ts`와 다름 |
| Home Hero 구성/여백 | [`HomeHero.tsx`](../../src/pages/home/HomeHero.tsx), [`HomeHero.module.css`](../../src/pages/home/HomeHero.module.css) | `generated/OriginalHomeContent.tsx` 안에서 사용 |
| 원본 페이지 본문/구조 | [`src/pages/original/generated/`](../../src/pages/original/generated/) | 이관 결과물이며 변환기와 연결된 보존 계약이 있음 |
| Articles 제목·날짜·원문 링크 | [`articles/index.ts`](../../src/content/original/articles/index.ts) | 18개 ID와 Body 연결, 순서 보존 |
| Articles 본문·읽기 UI 문구 | [`articles/`](../../src/content/original/articles/), [`pageContent.ts`](../../src/content/original/articles/pageContent.ts) | 본문 fingerprint·이미지·링크 검증 fixture도 함께 검토 |
| 공개 메뉴와 목적지 | [`content/original/navigation.ts`](../../src/content/original/navigation.ts), [`OriginalHeader.tsx`](../../src/shared/layout/OriginalHeader/OriginalHeader.tsx) | 초기 scaffold의 `config/navigation.ts`가 아님 |
| 라우트 추가/변경 | [`config/originalRoutes.ts`](../../src/config/originalRoutes.ts), `OriginalPage.tsx` | 정적 파일·내부 링크·페이지 식별·직접 진입 테스트까지 함께 변경 |
| 원본 이미지 경로와 base 처리 | [`shared/utils/originalPaths.ts`](../../src/shared/utils/originalPaths.ts) | asset manifest 및 실제 `public/` 준비 결과와 연결 |
| 모바일 구간 스냅 | [`config/mobileScrollSnap.ts`](../../src/config/mobileScrollSnap.ts), [`useMobileScrollSnap.ts`](../../src/shared/hooks/useMobileScrollSnap.ts) | 767/768 경계·hash·읽기 흐름을 함께 검증 |
| 공통 명칭 | [`docs/content/shared-terms.md`](../content/shared-terms.md), [`content/shared/terms.ts`](../../src/content/shared/terms.ts) | 신규 명칭·번역은 기존 정책 적용. 모든 원본 JSX가 데이터 분리를 끝낸 것은 아님 |

### `generated`의 의미와 재생성 주의

[`convert-original-pages.mjs`](../../scripts/convert-original-pages.mjs)는 감사한 HTML을 실제 React JSX와 페이지 CSS로 변환합니다. 전체 HTML 문자열 주입이나 전체 페이지 iframe 방식이 아니며, 원본 `<script>`와 inline event 실행은 제외합니다. 원본 handler 문자열은 추적용 `data-original-*`로 남기고 필요한 동작을 React hook에 옮겼습니다. Mentoring의 로컬 데모 iframe은 `OriginalMentoringMockupContent` 컴포넌트로 포함합니다.

변환기는 원본 체크아웃 HEAD가 고정 커밋인지, 대상 HTML이 그 커밋과 다른지 검사합니다. 실행 시 `generated/*.tsx`, `generated/*.css`, `conversion-manifest.json`을 다시 씁니다. 현재 Home Hero 연결을 보존하는 변환 규칙도 포함합니다. **평상시 dev/build에서는 변환기를 실행하지 않습니다.** 현재 체크인된 TSX/CSS가 배포 입력이며, 원본 Git 커밋은 이관 provenance입니다.

원본 커밋만 바꾸거나 생성 파일만 대규모 수정하지 않습니다. 구조 변경이 필요하면 변경 의도를 먼저 정하고, 재생성 규칙에 반영할 부분과 수동 관리할 부분을 구분해 diff를 검토합니다. 재생성이 현재의 모바일 보정·읽기 역할·승인된 문구를 보존하는지는 별도 검증 대상입니다. 데이터 분리와 컴포넌트화는 [폴더 규칙](../ground-rules/02-directory-structure.md)의 페이지 완료 검토에서 범위를 정합니다.

### 현재 사용하지 않는 초기 구조

`HomePage.tsx`/`HomePage.module.css`, `homeContent.ts`, `siteMetadata.ts`, `locales/ko/common.ts`, `config/navigation.ts`, 기존 `shared/layout/Header`·`Footer`, `Container`·`ActionLink`·`SectionTitle`은 초기 구조에서 연결된 묶음입니다. 현재 `App → OriginalPage` 공개 경로와 연결되지 않은 파일을 고쳐도 운영 화면이 바뀌지 않을 수 있습니다. `styles/globals.css`와 `design-tokens.css`도 현재 `main.tsx`의 전역 import 경로에 없습니다.

`SplineHero`와 `@splinetool/viewer` 의존성, 장면·배지 캐시는 남아 있지만 현재 Home Hero는 텍스트 중심이고 Spline을 import/render하지 않습니다. 정적 검증기는 사용하지 않는 Spline runtime chunk가 나오면 실패하며 Pages 브라우저 검사는 Home canvas/scene 요청이 없는지 확인합니다. 존재하는 파일과 현재 사용 중인 기능을 구분하고, 삭제는 별도 범위와 회귀 검증을 정한 작업으로 다룹니다.

## 4. 상태와 인터랙션 소유권

| 소유 코드 | 책임 | 회귀 확인 |
| --- | --- | --- |
| `App` + `OriginalHeader` + `MaterialsPopup` | 메뉴·자료 패널, 초점·Escape·배경 inert/스크롤 복구 | 반복 열기/닫기, resize, 메뉴와 패널 동시 상태 |
| [`useOriginalPageInteractions`](../../src/shared/hooks/useOriginalPageInteractions.ts) | 경력·발자취·인증 탭·추천·갤러리·강의 캐러셀 | 원본 DOM 선택자, 키보드, reduced motion, 정리 함수 |
| [`useOriginalDetailInteractions`](../../src/shared/hooks/useOriginalDetailInteractions.ts) | 프로젝트 펼침, 상세 탭·데모 조작, About/YouTube media | 비활성 탭의 영상 중지, 재진입, 외부 API 실패 |
| `OriginalArticlesPage` | 3개씩 6쪽 목록, 읽기 선택, 목록 위치·초점 복귀 | 직접 hash 진입, 알 수 없는 ID, Back/Forward, 저장소 사용 불가 |
| `useMobileScrollSnap` | 모바일 큰 구획 표식과 native proximity snap | 긴 본문·가로 캐러셀 유지, 767/768 경계 |

원본 구조를 보존하기 위해 일부 hook은 DOM을 직접 찾아 속성·스타일·리스너를 연결합니다. JSX의 ID, class, `data-*`를 바꾸면 외형뿐 아니라 hook의 계약도 바뀝니다. listener·timer·observer·media 정리는 StrictMode 재마운트에서도 동작해야 합니다. 전역 상태 라이브러리는 없습니다. Articles는 목록 scroll 위치를 `sessionStorage`의 `articlesScrollY`와 메모리 ref에 저장하며 저장소 접근 실패도 처리합니다.

Contact 및 자료 폼은 disabled이고 submit을 막습니다. 자체 백엔드·이메일 전송·로그인·실제 AI 추론은 구현되어 있지 않습니다. 프로젝트 데모의 화면 변화나 `Coming soon!` 안내를 실제 요청 완료로 기록하지 않습니다.

## 5. 스타일 적용 경로

1. `main.tsx`가 로컬 `fonts.css`, 원본 `source-styles.css`, `mobile-scroll.css`를 import합니다.
2. `source-styles.css`가 원본 공통 스타일 14개를 명시한 순서로 묶습니다.
3. `OriginalPage`가 선택 페이지의 `generated/*.css` 문자열을 `<style>`에 넣습니다. Mentoring 상세는 mockup CSS도 추가합니다.
4. 같은 위치에서 `tailwind.generated.css`를 그 뒤에, `accessibility-mobile.css`를 마지막에 넣습니다.
5. `OriginalPage.module.css`, `HomeHero.module.css`, Header/Footer/MaterialsPopup CSS Modules가 각 소유 범위의 반응형·접근성 보정을 담당합니다. 실제 우선순위는 삽입 순서 외에 specificity, inline style, 원본 `!important`도 영향을 줍니다.

`tailwind.generated.css`는 [`tailwind.config.js`](../../tailwind.config.js)의 `src/**/*.{ts,tsx,css}`와 HTML을 스캔해 로컬 CLI로 생성합니다. 방문자 브라우저에 Tailwind CDN 스크립트를 실행하는 방식이 아닙니다. 새 일반 컴포넌트에는 [CSS Modules 원칙](../ground-rules/08-css-and-responsive-styles.md)을 적용하며, 원본 Tailwind·ID·inline style 보존을 새 코드의 기본 규칙으로 확대하지 않습니다. 현황과 예외는 [공통 적용표](../design-system/component-adoption.md), [디자인 예외](../design-system/design-exceptions.md)를 함께 확인합니다.

## 6. 자산 준비와 무결성

| 집합 | 원본/검증 기준 | 생성 경로 | 기준 수량·용량 |
| --- | --- | --- | --- |
| 저장소 원본 | [`asset-manifest.json`](../../src/content/original/asset-manifest.json), 고정 Portfolio 커밋·길이·SHA-256 | `public/original/` | 147개, 289,373,612 bytes |
| 외부 원본 | [`external-asset-manifest.json`](../../src/content/original/external-asset-manifest.json), URL·길이·SHA-256·타입 | `public/original-external/` | available 211개, 26,849,087 bytes |
| 합계 | 두 manifest의 available 자산 합계 | Vite가 `dist/`로 복사 | 358개, 316,222,699 bytes, 약 301.57 MiB |

- 원본 스크립트는 기존 캐시 → 선택적 `ORIGINAL_ASSET_SOURCE_DIR` → 고정 GitHub raw URL 순으로 확인합니다. 길이/해시가 일치한 파일만 최종 경로에 둡니다.
- 외부 스크립트는 허용된 origin, redirect, 파일 크기/타입/해시를 검증합니다. 기존 외부 캐시가 손상되면 조용히 덮어쓰지 않고 실패합니다.
- 외부 211개에는 글꼴 140, 이미지 54, fallback PNG 5, 원본 font CSS 5, 라이선스 6, Spline 장면 1이 포함됩니다. 현재 manifest에 unavailable 항목은 없습니다.
- font CSS·라이선스·5개 fallback PNG는 lock에 보존한 동일 바이트에서 복원합니다. 원격 응답이 달라졌다고 체크섬을 자동 갱신하지 않습니다.
- `fonts.css`는 고정된 원본 선언을 로컬 URL로 바꾼 생성 파일입니다. 폰트를 임의의 대체 글꼴로 바꾸지 않습니다.
- `public/original/`, `public/original-external/`, `dist/`는 Git 제외 대상입니다. 전체 자산을 캐시와 산출물 양쪽에 보관하므로 최소 자산 합계의 약 두 배 외에 의존성·브라우저·검수 파일 공간이 더 필요합니다.
- Vite는 public 자산 전체를 배포 산출물에 복사합니다. lazy page import나 이미지 lazy loading이 이 301.57 MiB의 보관·배포 규모를 줄여 주는 것은 아닙니다. Enjoy 사진 51개 약 200.71 MiB가 큰 비중을 차지합니다.

상세 출처·라이선스·누락 원본은 [원본 자산](../original-assets.md), [외부 자산](../original-external-assets.md)에 보존합니다. 해시 검증은 바이트 동일성을 의미하며 이용 허가, 시각적 정상 동작, 취약점 부재까지 증명하지 않습니다.

### 경로 도우미

- `assetUrl("images/...")`: `${BASE_URL}original/...`로 변환합니다.
- `assetUrl(외부 URL)`: available manifest에 있으면 `${BASE_URL}original-external/...`로 바꿉니다. 목록에 없는 HTTP(S) URL은 그대로 반환하므로 새 URL 추가 시 hotlink 여부를 확인해야 합니다.
- `originalHref(...)`: `/breadme/` 같은 base를 붙이고, 기존 Portfolio 내부 링크를 현재 사이트 링크로 옮깁니다. 외부 링크·`mailto:`·`tel:`·hash는 유지합니다.
- 폰트 CSS는 Vite import를 거쳐 base를 처리합니다. provenance용 원본 `source-css/`를 직접 페이지에 연결하지 않습니다.

## 7. 외부 의존성의 경계

| 시점 | 실제 의존성 | 장애와 확인 범위 |
| --- | --- | --- |
| 설치/빌드 | npm registry, 고정 GitHub raw 자산, manifest의 외부 자산 origin | 캐시가 없으면 네트워크 필요. 정상 캐시는 다시 검증해 사용 |
| 공개 페이지 표시 | GitHub Pages의 HTML/JS/CSS/이미지/글꼴 | 같은 origin의 base, 404, 폰트·이미지 로드를 Pages suite로 확인 |
| About | YouTube embed `BQGPG91YsLo`, `https://www.youtube.com/iframe_api` | API 실패 시 native iframe과 원본 인터뷰 링크는 남음. 재생 성공은 별도 확인 |
| Voice IVR 상세 | YouTube embed `ma-IFITSs6o` | 외부 플레이어 오류와 앱 회귀를 동일 기준선에서 분리 조사 |
| 사용자가 링크 선택 | ART insight 원문, DOI/논문, 뉴스·영상·프로필·메일 링크 | 링크 존재 검증과 외부 서비스의 현재 정상 응답은 다른 검증 |
| 현재 사용하지 않음 | Spline viewer/scene | 설치·캐시에 존재하지만 Home 공개 런타임 의존으로 집계하지 않음 |

외부 URL 문자열이 JSX에 남아 있어도 `assetUrl()`이 로컬로 매핑할 수 있습니다. 반대로 외부 링크가 보인다는 이유만으로 페이지 로드 때 그 사이트를 호출한다고 단정하지 않습니다. 프로젝트 mockup에 표시된 쇼핑/서비스 URL 텍스트도 실제 API 연결의 증거가 아닙니다.

저장소 소스에서 자체 analytics나 업무 API 호출은 확인되지 않습니다. 그러나 YouTube 같은 포함 서비스는 자체 네트워크 요청을 만들 수 있습니다. [`tests/pages/support.ts`](../../tests/pages/support.ts)는 QA 중 비읽기 HTTP 메서드를 차단하고 외부 write 시도를 별도 기록합니다. **테스트에서 차단한 상태를 실제 방문자의 개인정보/telemetry 동작과 같다고 설명하지 않습니다.**

## 8. 배포 계약과 관측 한계

- 기본 Vite base는 `/`이고 공개 빌드에는 `VITE_BASE_PATH=/breadme/`를 사용합니다.
- Publish workflow는 build 검사 → 정적 파일/Pages 브라우저 검사 → `deployment.json` 생성 → Pages artifact 업로드 → `github-pages` 환경 배포 → 실제 게시 revision/브라우저 검사 순서입니다.
- `deployment.json`에는 repository, commit, base가 들어갑니다. 일반 `npm run build`가 생성하는 파일이 아니라 Publish workflow가 업로드 직전에 추가하는 영수증입니다.
- `verify-deployed-revision.mjs`는 공개 `/breadme/`의 영수증이 기대하는 40자리 `GITHUB_SHA`와 일치하는지 검사합니다. 사이트가 열린다는 사실만으로 최신 커밋 게시를 확정하지 않습니다.
- 코드상 `main` 조건과 별개로 GitHub 환경·branch protection의 실제 설정은 저장소 파일만으로 모두 확인할 수 없습니다. 권한을 넓혀 우회하지 않습니다.

기준선 `3738e46`의 [Foundation checks](https://github.com/nana-park/breadme/actions/runs/37278044636), [Publish breadme](https://github.com/nana-park/breadme/actions/runs/37278044595)는 성공으로 확인된 실행 기록입니다. 이 문서 작성 시 별도의 최신 live fetch 성공 증거는 확보하지 않았습니다. 따라서 여기의 “현재 구조”는 해당 소스 기준이며, 앞으로의 공개 상태는 영수증과 해당 SHA의 CI로 다시 확인합니다.

## 9. 개선 작업을 시작할 때의 기술 기준

1. 소유 파일과 현재 import 경로를 확인하고 초기 scaffold를 운영 구현으로 오인하지 않습니다.
2. URL·hash·content ID·DOM hook selector·자산 해시는 각각 보존 계약입니다. 변경 범위를 테스트와 함께 명시합니다.
3. 페이지별 콘텐츠 추출, CSS 격리, 미사용 파일 정리는 화면 개선과 섞지 않고 검증 가능한 단위로 나눕니다.
4. 글꼴·대형 미디어 최적화는 바이트 보존 계약을 바꾸는 별도 설계입니다. 용량 감소 수치, 원본 비교, 이미지 비율, 출처와 라이선스가 acceptance criteria에 들어가야 합니다.
5. 새 외부 서비스·자료 전송·번역·페이지 메타데이터 분리는 제품 결정과 운영 범위를 먼저 정합니다. 현재 구현에 없는 기능을 문서만으로 완료 처리하지 않습니다.
6. 기존 검수 문서의 수치는 작성 시점의 기록일 수 있습니다. 실행 대상 코드·설정·최종 CI 결과가 현재 검증 범위의 근거입니다. 구체적인 우선순위와 완료 조건은 [개선 백로그](../backlog.md)에 연결합니다.
