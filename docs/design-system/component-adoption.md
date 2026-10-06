# 공통 컴포넌트 적용표

2026-10-04 현재, 원본 `834815915647e4b3fbf9285b88b8001e37b94aa0`을 React로 옮긴 **실제 실행 경로**를 기준으로 기록합니다. 초기 Home 구조 미리보기의 적용표는 현재 화면을 설명하지 않습니다.

상태는 `적용`, `적용 대기`, `디자인 예외`, `해당 없음`으로 구분합니다. 이 표의 `적용`은 컴포넌트 연결 상태이며 화면 검수 통과나 공개 승인을 뜻하지 않습니다.

## 실행 중인 공통 컴포넌트

| 페이지            | OriginalHeader | OriginalFooter | MaterialsPopup | SplineHero        |
| ----------------- | -------------- | -------------- | -------------- | ----------------- |
| Home              | 적용           | 적용           | 적용           | 현재 렌더링 안 함 |
| About             | 적용           | 적용           | 적용           | 해당 없음         |
| Career            | 적용           | 적용           | 적용           | 해당 없음         |
| Qualified         | 적용           | 적용           | 적용           | 해당 없음         |
| Enjoy             | 적용           | 적용           | 적용           | 해당 없음         |
| Projects          | 적용           | 적용           | 적용           | 해당 없음         |
| Research          | 적용           | 적용           | 적용           | 해당 없음         |
| Articles          | 적용           | 적용           | 적용           | 해당 없음         |
| Lectures          | 적용           | 적용           | 적용           | 해당 없음         |
| Awards            | 적용           | 적용           | 적용           | 해당 없음         |
| Contact           | 적용           | 적용           | 적용           | 해당 없음         |
| Voice IVR 상세    | 적용           | 적용           | 원본에 없음    | 해당 없음         |
| Hopzie 상세       | 적용           | 적용           | 원본에 없음    | 해당 없음         |
| AI Mentoring 상세 | 적용           | 적용           | 원본에 없음    | 해당 없음         |

- `App`이 Header·본문·Footer·MaterialsPopup을 조립하고 `OriginalPage`가 14개 페이지를 선택합니다.
- `/`와 `/index.html`은 같은 Home입니다. Enjoy는 경로를 유지하지만 원본처럼 메뉴에서는 숨깁니다.
- Header는 원본 70px 높이와 1024px 메뉴 경계를 유지하며 모바일 초점·터치·닫기 동작을 보정합니다.
- MaterialsPopup은 원본 핵심 11개 페이지에만 있습니다. 원본 상세 3개에는 떠 있는 버튼이 없고 Header 자료 링크는 `Coming soon!` 안내를 표시합니다. 자료 전송은 `Coming Soon` 상태입니다. 연결 상태를 메일 기능 완료로 표시하지 않습니다.
- Home은 사용자 선택에 따라 텍스트 중심 `HomeHero`와 CSS Module을 사용합니다. `SplineHero`는 Home에서 렌더링하지 않으며 원본 이관 파일은 보존합니다. 다른 페이지로 새 Hero 스타일을 확대하지 않습니다.
- Home 경력은 `HomeExperience`와 CSS Module로 관리합니다. 사용자 선택에 따라 Education의 흰 배경·타입·여백·열 규칙을 재사용하고 사진·경력 모션을 제거했습니다. 회사 안의 Products/Outcomes는 같은 h4 위계·스타일이며 각 항목은 그 아래 목록으로 표시합니다. 회사 박스는 2026-10-06 요청에 따라 Contact Domain의 실제 1px #e5e7eb·radius8px·작은 그림자·hover 중간 그림자를 사용합니다. padding은 1024px 미만24px / 이상32px이며 제목·내용·grid는 보존합니다. Education은 사용자 요청의 Research Focus 문장 교정·강제 줄바꿈 제거만 적용하며 구조·사진·스타일은 유지합니다. 회사 캐러셀·갤러리·공통 Header/Footer·자료 UI·Career 페이지는 바꾸지 않습니다.
- Articles는 목록·읽기 화면을 가진 하나의 경로입니다. 영어 본문 18개와 6쪽 목록은 `OriginalArticlesPage`가 관리합니다.
- 모바일 가독성 보정(PR #3)은 `OriginalPage.module.css`의 명시적 `data-reading-role`과 Header/Footer/MaterialsPopup의 자체 CSS Module에서 관리합니다. 생성 페이지의 역할 표식은 변환기에도 반영합니다. 새 모바일 전용 페이지나 복제된 콘텐츠는 만들지 않습니다.
- Footer의 기존 CSS 중요 선언은 컴포넌트가 767px 이하에서 설정하는 CSS 변수로 제어하며 기존 fallback은 그대로입니다. 새 CSS Module에 `!important`를 추가하지 않습니다. 콘텐츠용 보정은 767px 이하, 메뉴용 보정은 기존 1023px 이하 범위입니다.

## 초기 컴포넌트와의 관계

기존 `Header`, `Footer`, `Container`, `SectionTitle`, `ActionLink`는 초기 구조 미리보기에서 사용한 파일입니다. 현재 App과 원본 이관 페이지는 이 조합으로 렌더링하지 않습니다. 파일이 남아 있다는 이유로 현재 14개 페이지에 `적용` 또는 `적용 대기`로 표시하지 않습니다.

초기 적용 기록은 Git 이력과 [기본 구조 검수 기록](../qa/foundation-verification.md)에 남깁니다. 기존 원본 레이아웃을 이 초기 컴포넌트에 맞추기 위해 바꾸지 않습니다.

## 스타일과 공통화 범위

현재 단계의 목표는 사용자가 요청한 원본 디자인의 충실한 이관입니다. 공통 Header·Footer·자료 UI는 공유하되, 원본 페이지의 카드·제목·상세 레이아웃을 하나의 새로운 디자인으로 통일하지 않습니다.

원본 작성 CSS와 페이지 CSS, 로컬에서 생성한 원본 Tailwind utility, 필요한 모바일·접근성 보정을 사용합니다. 초기 CSS Modules 전용 뼈대와의 차이는 [현재 반응형 전략](../responsive-strategy.md)에 기록합니다. 이 선택을 모든 후속 페이지의 상시 스타일 규칙으로 확대하지 않습니다.

새로운 디자인 예외 승인이나 최종 디자인 시스템 승인을 이 표에서 선언하지 않습니다. 원본 대조가 끝난 뒤 디자인을 변경하거나 공통 컴포넌트로 재구성할 때는 기존 승인·회귀 검수 절차를 따릅니다.

## 회귀 검수와 갱신

Header·Footer·자료 UI를 바꾸면 14개 경로가 영향 범위입니다. 390px·1440px 경로 검사, Home의 7개 너비, 1023↔1024px 메뉴 상태·초점 전환을 확인합니다. 실제 통과 여부는 [현재 이관 검수 기록](../qa/original-migration-verification.md)에 남깁니다.

공통 컴포넌트·경로·콘텐츠 위치가 바뀌면 이 표와 [페이지 README](../../src/pages/original/README.md)를 함께 갱신합니다. `적용 대기`는 실제 구현 화면에서 계획된 미이관 항목에만 사용합니다.

## PR #3 모바일 자료 진입

767px 이하에서는 본문을 가리는 중복 원형 바로가기를 숨기고 공통 메뉴의 Resume/Portfolio PDF 항목을 사용합니다. Home도 동일합니다. Coming Soon 패널과 비활성 자료 요청은 유지합니다. 768px 이상 표시와 Desktop 구성은 변경하지 않습니다.
