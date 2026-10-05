# 디자인 시스템 안내

[프로젝트 안내](../../README.md) · [원본 이관 반응형 원칙](../responsive-strategy.md) · [QA 기준](../qa/README.md)

이 문서는 화면을 계속 개선할 때 **현재 무엇을 재사용하고, 무엇을 별도로 결정해야 하는지** 찾는 입구입니다. 기준은 2026-10-05의 main `3738e4620bb495ecfcd7ef589c91c2049ce0153a` 소스입니다. 완성된 통합 디자인 시스템이나 새 디자인 승인을 선언하지 않습니다.

## 1. 현재 적용 상태

현재 화면은 원본 포트폴리오의 React 이관 위에 Home Hero와 모바일 가독성 보정을 더한 구성입니다. 기존 페이지를 새 컴포넌트·토큰 체계로 일괄 교체하지 않습니다.

| 확인할 것 | 실제 소유 위치와 역할 |
| --- | --- |
| 공통 화면 조립 | [`App.tsx`](../../src/app/App.tsx): `OriginalHeader`, 본문, `OriginalFooter`, 자료 패널 |
| 글꼴·원본 공통 CSS | [`main.tsx`](../../src/main.tsx)가 `original/fonts.css`, `original/source-styles.css`, `mobile-scroll.css`를 가져옴 |
| 페이지별 원본 스타일 | [`OriginalPage.tsx`](../../src/pages/original/OriginalPage.tsx)가 해당 페이지 CSS → 생성된 원본 Tailwind utility → 접근성 보정 순서로 삽입 |
| 모바일 읽기 역할 | [`OriginalPage.module.css`](../../src/pages/original/OriginalPage.module.css)의 `data-reading-role` 선택자 |
| 공통 메뉴·Footer·자료 UI | 각 `OriginalHeader`, `OriginalFooter`, `MaterialsPopup`의 CSS Module이 자체 보정 소유 |
| 현재 Home Hero | [`HomeHero.module.css`](../../src/pages/home/HomeHero.module.css); 다른 페이지의 공통 Hero 규칙이 아님 |
| Home 경력 | [`HomeExperience.module.css`](../../src/pages/home/HomeExperience.module.css): 기존 Education의 흰 배경·2열/모바일1열·타입·여백·버튼 규격 재사용. 사진·경력 모션 제거, 승인된 회사별 1px 테두리/10px radius/24px padding 추가. 원래 Education·캐러셀 유지 |
| 초기 뼈대 | `design-tokens.css`, `globals.css`, `HomePage`, `Header`, `Footer`, `Container`, `SectionTitle`, `ActionLink`는 현재 App의 실행 조합이 아님 |

[`08` 스타일 규칙](../ground-rules/08-css-and-responsive-styles.md)은 신규 작업의 CSS Modules 중심 방향을 설명하며 Tailwind를 사용하지 않는다고 명시합니다. 현재 원본 utility 보존은 [이관 범위의 결정](../responsive-strategy.md#2-데스크톱은-원본과-같은-조건으로-비교)입니다. 이를 신규 화면에도 Tailwind를 도입하는 상시 허가로 읽지 않습니다. 원본의 inline 스타일·강한 선택자를 정리하는 작업도 별도 범위로 계획합니다.

## 2. 타이포그래피

글꼴 파일은 로컬 원본 에셋을 사용합니다. 원본 `style.css`의 sans 계열은 Pretendard/Inter, 본문 계열 변수는 Lora이며 페이지 CSS와 utility가 실제 역할별 글꼴을 다시 지정할 수 있습니다. 한 파일의 선언만으로 모든 화면의 계산 글꼴을 단정하지 않습니다.

다음은 **현재 코드의 적용 범위**이며 새 전역 글자 크기 규격이 아닙니다. rem의 px 환산은 기본 16px일 때입니다.

| 역할 | 현재 값 | 범위 |
| --- | --- | --- |
| Home 제목 / 과거 경력 근거 | 제목 `clamp(48px, 5.6vw, 84px)`·줄간격 1.06 / `.experience` 13px·1.6 | Home 기본 |
| Home 모바일 제목 / 과거 경력 근거 | 제목 `clamp(32px, 8.8vw, 40px)`·1.1 / `.experience` 13px·1.6 | 767px 이하 |
| 이관 페이지의 읽기 제목 / 설명 | 제목 `clamp(1.875rem, 8.2vw, 2.25rem)`·1.18 / 설명 1rem·1.65 | 767px 이하, 실제 역할 표식이 붙은 요소만 |
| 메뉴 주 항목 / 하위 항목 | 1rem / 0.875rem, 줄간격 1.5 | 열린 메뉴, 1023px 이하 |
| Footer 링크·언어 / Articles 목록 요약 | 0.875rem·1.5 / 0.9375rem·1.65 | 767px 이하 |

- Home의 보류된 설명 문단용 `.summary` CSS(기본 20px, 모바일 17px)는 남아 있지만 현재 JSX에서 렌더링하지 않습니다. 이를 현재 표시되는 본문 크기로 사용하지 않습니다.
- 제목·본문·메타·작은 제품 모형의 의미를 먼저 구분합니다. 모든 `p`, 작은 캡션, 제품 데모 글자를 일괄 확대하지 않습니다.
- 긴 글과 확대 상태에서 줄바꿈·전체 문구·출처를 보존합니다. 고정 높이와 말줄임으로 읽기 문제를 숨기지 않습니다.
- **AI Mentoring 상세의 선택적 제목/설명 역할 표식 2개는 보류**입니다. 기존 제목 32px·설명 14px를 유지하며, 위 모바일 읽기 규칙을 적용 완료한 것으로 세지 않습니다. 범위는 [기존 TC의 보류 기록](../qa/mobile-ui-test-cases.md#명시적-보류-항목)을 따릅니다.
- 화면의 영어 원문과 한국어 개발 문서를 구분하고, 공식 명칭은 [공통 명칭](../content/shared-terms.md)을 확인합니다.

## 3. 색상·간격·토큰

- 현재 원본 토큰은 [`original/style.css`](../../src/styles/original/style.css)의 `--color-bg-*`, `--color-text-*`, `--spacing-*`, `--font-*`, `--transition-*`입니다. 원본 간격 단계는 0.5/1/2/4/6/8rem이며 페이지별 고정값·utility와 함께 쓰입니다.
- 원본 `.container`의 좌우 여백은 5vw입니다. Home Hero는 별도로 기본 32px, 모바일 20px 좌우 여백을 사용하고 모바일 섹션 간격에 `--home-mobile-section-space`의 40px를 사용합니다. 이를 모든 페이지의 Container 규격으로 확대하지 않습니다.
- [`design-tokens.css`](../../src/styles/design-tokens.css)는 초기 제안이며 현재 진입점에서 가져오지 않습니다. 활성 컴포넌트의 `var(--control-size, 2.75rem)` 같은 fallback이 있다고 해서 이 파일이 연결된 것은 아닙니다.
- 두 체계에는 같은 이름도 있습니다. 예를 들어 `--color-accent`는 원본에서 `#d4a574`, 초기 토큰에서 `#d97706`입니다. 초기 파일을 전역으로 연결하는 일은 단순 정리가 아니라 기존 색상을 바꿀 수 있는 변경입니다.
- 재사용할 때는 선언값뿐 아니라 적용 대상·fallback·우선순위·미디어 조건을 확인합니다. 반복 숫자를 토큰으로 바꾸기 전에 같은 역할인지부터 확인합니다.

## 4. 컴포넌트와 반응형 동작

실제 페이지별 연결 상태는 [공통 컴포넌트 적용표](component-adoption.md) 한 곳에서 관리합니다. 초기 컴포넌트 파일의 존재를 현재 적용 완료로 기록하지 않습니다.

- 공통 Header·Footer는 14개 페이지에서 사용합니다. 자료 패널은 핵심 11개 페이지에 있고 상세 3개는 Header 자료 링크에서 준비 중 안내를 제공합니다. 자료 전송 백엔드는 없습니다.
- Home은 텍스트 중심 `HomeHero`를 사용하며 `SplineHero`는 현재 Home에서 렌더링하지 않습니다. 과거 Spline 중심 설명을 현재 Home의 기준으로 사용하지 않습니다.
- 같은 콘텐츠·컴포넌트에서 화면 폭에 맞춰 배치를 바꿉니다. 모바일 전용 콘텐츠 복제본을 만들지 않습니다.
- Header는 높이 70px, **1023px 이하 모바일 메뉴 / 1024px 이상 데스크톱 메뉴**입니다. 읽기 보정·Footer 2열·중복 자료 바로가기 숨김·문서 스냅은 **767px 이하**입니다.
- 768px에서는 읽기 보정은 끝나도 모바일 메뉴는 남습니다. 일반적인 Mobile/Tablet/Desktop 명칭보다 각 기능의 실제 경계를 우선합니다. 원본 갤러리·표의 독립 가로 스크롤도 유지합니다.

## 5. 접근성과 상태 계약

구현된 보정과 확인 기준을 구분합니다. 아래 계약의 전체 접근성 적합성을 이 문서만으로 인증하지 않습니다.

- 본문 바로가기와 보이는 키보드 초점을 유지합니다. 메뉴·버튼의 이름, 활성/비활성 상태, 제목 순서를 검사합니다.
- 모바일 메뉴는 배경 조작 차단·초점 순환·Escape/버튼 닫기·초점/스크롤 복원을 함께 유지합니다. 1023↔1024px 전환 후 숨은 요소에 초점이 남지 않아야 합니다.
- 자료 패널은 **비모달**입니다. 모달처럼 초점을 가두지 않으며 Coming Soon과 비활성 입력·전송을 사실대로 유지합니다. 모달을 새로 도입한다면 별도의 접근성 계약과 검수가 필요합니다.
- 독립 조작 영역은 44px를 목표로 합니다. 현재 메뉴·Footer의 보정 결과를 원본 모든 링크의 합격으로 확대하지 않습니다.
- 이동 줄이기 설정에서는 문서 스냅과 일부 반복 애니메이션을 완화합니다. 외부 동영상·3D까지 모두 정지한다고 가정하지 않습니다. 200% 글자 확대와 브라우저 자체 줌은 별도로 확인합니다.
- 실제 검수 절차와 미검수 범위는 [QA 기준](../qa/README.md)을 따릅니다.

## 6. 변경 판단과 다음 정리

1. **페이지 고유 표현:** 페이지/컴포넌트 가까이에서 수정하고 모바일·데스크톱 영향 범위를 적습니다.
2. **반복되는 같은 역할:** 사용처와 상태를 비교한 뒤 공통 variant 또는 의미 기반 토큰을 제안합니다. 비슷하게 보인다는 이유만으로 서로 다른 역할을 합치지 않습니다.
3. **기존 공통 값·variant 변경:** 영향 페이지를 열거하고 [디자인 시스템 운영 규칙](../ground-rules/09-design-system-governance.md)에 따른 확인을 받습니다.
4. **승인된 규칙의 예외:** 구현 전 승인을 받고 [예외 목록](design-exceptions.md)·코드·페이지 README를 함께 갱신합니다. 기존 `DE-001`의 범위를 자동 확대하지 않습니다.

후속 통합은 아직 제안 단계입니다. 먼저 활성 선언/사용처/fallback/화면 범위를 대조하는 토큰 목록을 만들고, 이름 충돌을 해결한 작은 단위부터 검토합니다. 완료 기준은 영향 페이지·상태가 명시되고, 계산 스타일과 같은 조건의 화면 비교에서 의도하지 않은 변화가 없으며, 새 공통 규칙과 승인된 차이가 문서에 반영된 상태입니다. 이 문서 추가만으로 초기 토큰 활성화나 통합 완료를 선언하지 않습니다.
