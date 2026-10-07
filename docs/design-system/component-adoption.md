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
- Header는 원본 70px 높이와 1024px 메뉴 경계를 유지합니다. 2026-10-06 요청에 따라 모바일 메뉴의 Resume/Portfolio PDF를 제거하고 ABOUT·PROJECTS 하위 링크를 2열로 배치합니다. 5개 상위·7개 하위 링크의 이름·목적지, 16/14px 글자와 최소 44px 터치 영역, 초점·닫기·스크롤 잠금은 유지합니다.
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

## 모바일 메뉴·자료 진입 (2026-10-06 갱신)

767px 이하의 본문을 가리는 중복 원형 바로가기 숨김은 유지합니다. 이후 사용자 요청으로 1024px 미만 햄버거 메뉴의 Resume/Portfolio PDF 항목도 제거합니다. Desktop Header의 두 자료 버튼, 768px 이상 원형 바로가기, Contact 본문의 자료 영역과 Coming Soon 상태는 유지합니다. 팝업 상태·초점 검사는 실제 Desktop 진입 후 모바일 resize 또는 컴포넌트의 부모 상태 제어로 검증하며, 제거된 모바일 진입을 가정하지 않습니다.

메뉴의 최소 높이는 약 428px(원본 submenu 테두리가 있는 경로는 432px)에 safe-area 하단 여백을 더한 값입니다. 390×844·390×740·375×667·320×640 무스크롤 노출을 브라우저 검사 대상으로 삼고, 더 짧은 화면·확대 글자에는 overflow-y:auto를 유지합니다. 이 수치는 CSS 설계값이며 브라우저 실측 통과 선언이 아닙니다. [검수 범위와 제한](../qa/mobile-menu-compact.md)을 참고합니다.

## About 모바일 구간 정리

2026-10-06 About 요청은 기존 OriginalHeader·OriginalFooter·MaterialsPopup 연결을 유지합니다. 페이지 CSS Module과 명시적 역할/구간 표식에서만 소개 정렬·이름 도식 크기·구간 최소 높이를 관리합니다. `.container` gutter의 5vw fallback은 유지하고 모바일 About 소개에서만 최소 20px와 Home의 중앙 최대 380px 읽기 열을 함께 따릅니다. 공통 스크롤 hook은 기존 요소에 구간 표식을 붙이며 실제 스크롤은 native proximity 규칙이 처리합니다.

## Career 콘텐츠 정리 (2026-10-06)

Career의 Education 섹션을 제거해 경력 다음에 추천이 이어집니다. Home의 학력과 공통 Header/Footer/자료 UI 적용 상태는 유지합니다. Team Work 소개 문장의 줄바꿈만 페이지 소유 `testimonial-intro` 역할로 767px 이하에서 자연 흐름으로 바꾸며 별도 모바일 콘텐츠나 공통 컴포넌트는 추가하지 않습니다.

Career 모바일 추천 카드는 1:1 비율과 축소한 본문/작성자 글자 규격을 페이지 CSS Module에서 관리합니다. 글자 확대 시 내용 높이를 우선해 잘림을 방지하며, Desktop 원본 카드와 인용문은 그대로입니다.

## 로딩 상태에서도 유지되는 공통 스타일

공통 Header가 본문 로딩 중에도 이미 표시되므로, Header가 사용하는 기존 utility와 모바일 접근성 스타일은 lazy 본문과 별도로 즉시 삽입합니다. `OriginalPage`가 페이지 CSS → utility → 접근성 순서를 그대로 소유하고 Suspense는 본문만 감쌉니다. 새로운 스타일 시스템이나 자료 기능은 추가하지 않습니다.

## Home 경력·제품 진입

Home의 Full career와 Products는 같은 `HomeExperience` action 스타일을 사용합니다. 기존 route helper가 각각 Career와 제품 목록 경로를 만들며, 44px 최소 높이와 줄바꿈 가능한 action row로 좁은 화면·큰 글자를 지원합니다. 회사 카드의 표면과 내용, Home 학력은 그대로입니다.

## Contact 패키지 직접 조작

2026-10-06: Contact 본문의 Resume / Portfolio PDF도 기존 MaterialsPopup을 엽니다. Contact 전용 `ContactPackageActions`는 원본 버튼의 색·border·radius·SVG를 보존하며 clipboard 진행·실패·직접 복사를 담당합니다. 공통 자료 패널은 선택적 `returnFocusRef`로 본문 진입 버튼에 초점을 복귀시키고, 이 ref가 없는 기존 Header·떠 있는 버튼 동작은 유지합니다. PDF 공개·이메일 수집·전송을 추가하지 않습니다.


## Home 하단 제품 CTA (2026-10-06)

`HomeCapabilities`는 기존 Home 하단 어두운 카드의 텍스트와 버튼만 관리합니다. 실제 Academic Standing의 H2 24/28px·H3 20/22px·본문 13px 규격을 재사용하며 Product Focus와 Core Strengths를 같은 위계로 표시합니다. 기존 모바일 텍스트 좌측·버튼 중앙 정렬을 보존하고, `originalHref`로 Products 목록에 연결합니다. 이전 Qualifications의 역할별 CSS 보정은 이 컴포넌트의 CSS Module로 대체합니다. 공통 Header/Footer/MaterialsPopup 연결, Academic과 다른 페이지는 그대로입니다. PR·공개 승인은 이 연결 기록과 별개입니다.


## Home 회사 로고 (2026-10-06)

`HomePartnerLogos`는 기존 파트너 영역의 움직이는 로고 목록만 소유합니다. Google을 제거하고 SK Inc.와 LINE WORKS를 추가하며 SK Telecom·NAVER·NAVER Cloud·H&M은 유지합니다. 공식 원본 SVG 파일과 40초 움직임·반응형 간격을 보존하고, 새 로고에도 기존의 흑백·45% 투명도 처리를 똑같이 적용합니다. 로고 세 반복은 단일 데이터 목록을 사용하며, 끝 간격으로 이음새를 맞추고 중복 접근성 이름을 제거합니다. Header/Footer/자료 UI와 다른 Home 섹션은 바꾸지 않습니다.
