# 파일명과 코드 이름 규칙

## 공통 원칙

- 기술 이름은 영어로 작성합니다. 화면에 표시되는 콘텐츠는 한국어와 영어를 자유롭게 사용합니다.
- 이름만 보고 역할과 내용을 예상할 수 있어야 합니다.
- 색상, 위치와 크기보다 제품과 화면에서 맡는 역할을 표현합니다.
- `final`, `new`, `temp`, `copy`, 날짜만 붙인 이름은 사용하지 않습니다.
- 버전은 파일명이 아니라 Git에서 관리합니다.

```text
권장: FeaturedProjectCard
비권장: LargeOrangeCard

권장: SectionTitle
비권장: LeftPurpleTitle
```

## 구조·페이지·라우트 폴더

영문 소문자 `kebab-case`를 사용합니다.

```text
pages/
home/
project-detail/
design-system/
ground-rules/
```

## 컴포넌트 폴더와 파일

컴포넌트 폴더, JSX 파일과 컴포넌트 이름은 동일한 `PascalCase`를 사용합니다.

```text
HeroSection/
├─ HeroSection.jsx
└─ HeroSection.module.css

ProjectCard/
├─ ProjectCard.jsx
└─ ProjectCard.module.css
```

```text
Header.jsx       → function Header()
HomePage.jsx     → function HomePage()
HeroSection.jsx  → function HeroSection()
```

하나의 컴포넌트 파일은 기본적으로 하나의 대표 컴포넌트를 내보냅니다.

## 페이지와 섹션

```text
HomePage.jsx
ProjectsPage.jsx
HeroSection.jsx
FeaturedProjectsSection.jsx
```

기획 문서, 페이지 README, 라우트와 컴포넌트에서 같은 화면 용어를 사용합니다.

## Hook

`use`로 시작하는 `camelCase`를 사용합니다.

```text
useMediaQuery.js
useScrollPosition.js
useOutsideClick.js
```

## 일반 JavaScript와 콘텐츠

역할이 드러나는 `camelCase`를 사용합니다.

```text
formatDate.js
projectData.js
articleCategories.js
socialLinks.js
```

## CSS 파일

전역 스타일 파일은 영문 소문자 `kebab-case`를 사용합니다.

```text
design-tokens.css
typography.css
globals.css
```

컴포넌트 스타일은 컴포넌트와 동일한 `PascalCase` 이름에 `.module.css`를 붙입니다.

```text
ProjectCard.jsx
ProjectCard.module.css
```

CSS 클래스 규칙과 스타일 격리 방식은 [`08-css-and-responsive-styles.md`](08-css-and-responsive-styles.md)를 따릅니다.

## 이미지와 영상

모든 에셋은 영문 소문자 `kebab-case`를 사용합니다.

```text
home-hero-team.webp
project-hopzie-thumbnail.webp
award-japan-government.webp
article-ai-accessibility-cover.webp
```

권장 형식:

```text
[영역]-[콘텐츠]-[용도].[확장자]
```

실제로 다른 에셋이 필요할 때만 화면 또는 크기 정보를 붙입니다.

```text
home-hero-team-mobile.webp
home-hero-team-desktop.webp
profile-nahyun-640.webp
profile-nahyun-1280.webp
```

다음 이름은 사용하지 않습니다.

```text
image1.png
new-image-final.png
uploaded_media_12345.png
수정본2.png
```

## 문서

일반 문서는 영문 소문자 `kebab-case`를 사용합니다. 읽는 순서가 중요한 문서 묶음에만 숫자 접두사를 사용합니다.

```text
README.md
01-repository-and-branching.md
02-directory-structure.md
```

## Boolean과 이벤트

Boolean 값은 상태를 질문처럼 읽을 수 있게 작성합니다.

```text
isOpen
isLoading
hasError
canNavigate
```

이벤트 처리 함수는 `handle`로 시작합니다.

```text
handleMenuOpen
handleProjectSelect
handleFormSubmit
```

## 이름 검토 시점

페이지 완료 검토에서 다음을 확인합니다.

- 파일명, 폴더명과 컴포넌트 이름 일치
- 기획 문서와 코드 용어 일치
- 오래된 이름이 import에 남아 있지 않음
- 동일 역할을 서로 다른 이름으로 부르지 않음
- 외형만 설명하거나 임시 상태를 나타내는 이름이 없음
