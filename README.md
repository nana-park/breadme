# Portfolio React

기존 HTML 포트폴리오를 보존하면서 React로 옮기는 프로젝트입니다.

**현재 단계: 설계 문서 검토 + 반응형 기본 구조 세팅.** 실제로 실행되는 Home 미리보기와 검사 도구를 만들었습니다. 포트폴리오 전체 완성이나 운영 사이트 교체 단계는 아닙니다.

- [기존 공개 포트폴리오](https://nana-park.github.io/Portfolio/)
- [기존 HTML 원본](https://github.com/nana-park/Portfolio)
- [React 저장소](https://github.com/nana-park/portfolio-react)

## 이번에 된 것

- Vite + React + TypeScript 실행·빌드 구조
- 데스크톱과 모바일 모두에서 읽을 수 있는 Home 구조 미리보기
- 공통 Header / Footer / Container / SectionTitle / ActionLink
- 모바일 메뉴, 키보드 탐색, 본문 바로가기, 실제로 이동하는 앵커
- 색상·글자·여백의 공통 기준(디자인 토큰)과 CSS Modules
- 소개 내용, 공통 UI 문구, 메뉴 설정을 화면 코드와 분리
- 코드 검사, 타입 검사, 컴포넌트 테스트, 브라우저 반응형·접근성 테스트
- PR 검사 워크플로 구성. 실제 원격 실행 결과는 PR checks에서 확인

## 아직 하지 않은 것

- About / Projects / Research / Articles / Lectures / Awards / Contact 개별 페이지와 상세 콘텐츠 이관
- 이력서·포트폴리오 PDF 다운로드, 자료 요청·메일 전송 백엔드
- 영어 UI 번역·언어 전환, 원본 이미지·3D·영상 이관
- 최종 디자인 승인, 전체 포트폴리오 접근성 인증, 실기기 Safari 검수
- beta 또는 main 병합, 배포, 기존 운영 사이트 변경

미구현 기능을 눌러도 되는 버튼처럼 만들지 않았습니다. Home 카드에는 `상세 콘텐츠 이관 예정`을 표시하고 기존 사이트로 가는 링크를 제공합니다. 공개 준비 전이므로 검색 제외 메타데이터를 넣었습니다.

## 채용 담당자를 위한 반응형 기준

데스크톱에서는 전체 구조를 빠르게 훑고, 모바일에서는 세로로 차례대로 읽도록 배치합니다. **소개 → 프로젝트의 문제·역할·성과 → 연락과 자료 확인**이라는 목적은 두 화면에서 같습니다. 모바일에 중요한 내용을 숨기거나, 가로 스와이프·마우스 hover를 해야만 정보를 볼 수 있게 만들지 않습니다.

- Desktop: 1025px 이상, 넓은 콘텐츠 폭과 다열 배치
- Tablet: 768–1024px, 여백과 열 간격을 줄임
- Mobile: 767px 이하, 1열·펼침 메뉴·44px 이상 조작 높이
- CSS는 기존 규칙대로 Desktop 기본 → Tablet → Mobile 순서로 작성
- 검수 폭: 320, 390, 767, 768, 1024, 1025, 1440px

자세한 결정은 [반응형 전략](docs/responsive-strategy.md)과 [설계 검토](docs/design-review.md)를 읽어 주세요.

## 내 컴퓨터에서 실행하기

Node.js 24 LTS(24.15.0 이상)와 npm이 필요합니다. `.nvmrc`는 사용할 Node 버전을 표시하는 파일입니다. 저장소를 내려받은 `portfolio-react` 폴더에서 터미널을 열고 실행하세요.

```bash
npm ci
npm run dev
```

터미널에 나온 로컬 주소(보통 `http://localhost:5173`)를 브라우저로 열면 됩니다. 종료하려면 터미널에서 `Ctrl+C`를 누릅니다.

처음 설치에는 `npm ci`를 사용합니다. `package-lock.json`에 기록된 같은 의존성 버전으로 설치하므로 환경마다 달라질 가능성을 줄입니다.

## 확인 명령어

| 명령 | 쉬운 설명 |
| --- | --- |
| `npm run dev` | 수정하면서 화면 확인 |
| `npm run lint` | 코드·React 규칙의 기본 오류 확인 |
| `npm run typecheck` | 컴포넌트와 데이터 연결 오류 확인 |
| `npm test` | 메뉴·구조 등 컴포넌트 테스트 |
| `npm run build` | 배포 가능한 파일 생성. 실제 배포는 하지 않음 |
| `npm run preview` | 만들어진 결과물을 로컬에서 확인 |
| `npm run check` | lint → typecheck → test → build를 한 번에 실행 |

브라우저 검사(첫 실행 시 Chromium 설치 필요):

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Linux에서 브라우저 시스템 의존성이 없다면 `npx playwright install --with-deps chromium`을 사용합니다. 이미 설치된 Chromium을 사용하는 검수 환경은 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`에 실행 파일 경로를 지정할 수 있습니다. 일반 사용자는 설정할 필요 없습니다.

2026-10-04 자체 검수: 코드·타입·빌드와 컴포넌트 테스트 6개, GitHub CI의 브라우저 테스트 11개가 통과했습니다. 320–1440px의 7개 폭과 키보드·터치·글꼴 확대를 확인했습니다. 로컬 브라우저 실행은 환경 제한으로 막혀 GitHub-hosted Chromium에서 검사했습니다.

검사 상세와 **통과 / 미실행 구분**은 [이번 검수 기록](docs/qa/foundation-verification.md)에 있습니다. [Draft PR #1](https://github.com/nana-park/portfolio-react/pull/1)에서 최신 커밋의 CI 결과를 볼 수 있습니다.

## 어디를 고치면 되나요?

```text
src/
├─ app/                    화면의 가장 바깥 조립
├─ pages/home/             Home 화면·스타일·설명서
├─ shared/layout/          Header, Footer, Container
├─ shared/ui/              공통 링크와 섹션 제목
├─ content/site/           소개 문구·링크 원본
├─ content/shared/          공통 공식 명칭
├─ locales/ko/             반복되는 한국어 메뉴·버튼 문구
├─ locales/en/             영어 UI 도입 조건 안내(아직 미구현)
├─ config/                 메뉴와 화면 이동 설정
├─ styles/                 공통 디자인 토큰·기본 스타일
└─ main.tsx                앱 시작 지점
```

- 문구 변경: `src/content/site/homeContent.ts`
- 버튼·메뉴 명칭 변경: `src/locales/ko/common.ts`
- 전체 색상·간격 변경: `src/styles/design-tokens.css`
- Home 배치 변경: `src/pages/home/HomePage.module.css`
- 화면 구성과 미구현 범위: [Home README](src/pages/home/README.md)

콘텐츠가 없는 폴더나 가짜 페이지를 미리 늘리지 않습니다. 여러 페이지가 필요해질 때 라우터와 상세 구조를 함께 추가합니다. TypeScript의 `.tsx`는 화면 컴포넌트, `.ts`는 데이터·설정 파일입니다.

## 브랜치를 이렇게 선택한 이유

작업 시작 시 `main`과 `feature/home-design-system`에는 초기 문서만 있고 React 실행 코드가 없었습니다. 최신 협업·디자인·다국어 규칙 28개 커밋은 `docs/collaboration-ground-rules`에만 있었습니다.

그래서 해당 문서 브랜치의 `4b07328`에서 `feature/responsive-react-foundation`을 만들었습니다. 문서 이력을 복사하거나 덮어쓰지 않고 이어받았으며, Draft PR은 **docs/collaboration-ground-rules**를 대상으로 하여 이번 기본 구조 변경만 검토할 수 있게 합니다. 기존 브랜치와 main에는 직접 쓰지 않습니다.

현재 `beta`는 없습니다. 이후 통합할 때는 문서 이력과 이 작업을 검토한 후 `beta` 기준을 정하고 합칩니다. `beta` 전체 검수 → 사용자의 별도 main 승인 → main 반영 → 별도 배포 순서입니다. 이번 PR을 만들었다고 main이나 공개 사이트가 바뀌지는 않습니다.

## 문서 안내

- [설계 검토 결과](docs/design-review.md)
- [반응형 전략](docs/responsive-strategy.md)
- [실행 검수 기록](docs/qa/foundation-verification.md)
- [Ground Rules](docs/ground-rules/README.md)
- [버전관리 허브](versions/README.md)
- [디자인 시스템 적용표](docs/design-system/component-adoption.md)
- [디자인 예외 목록](docs/design-system/design-exceptions.md)
- [공통 명칭 목록](docs/content/shared-terms.md)
