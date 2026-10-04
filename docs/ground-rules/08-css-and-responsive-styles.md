# CSS와 반응형 스타일 규칙

## 기본 선택

- 전역 규칙은 일반 CSS로 관리합니다.
- 페이지와 컴포넌트는 CSS Modules로 격리합니다.
- Tailwind와 CSS-in-JS는 사용하지 않습니다.

```text
src/styles/
├─ reset.css
├─ design-tokens.css
├─ typography.css
├─ animations.css
└─ globals.css

HeroSection/
├─ HeroSection.jsx
└─ HeroSection.module.css
```

## 전역 CSS 역할

전역 CSS에는 사이트 전체에서 공유하는 항목만 둡니다.

- 색상
- 간격
- 타이포그래피
- 모서리와 그림자
- 애니메이션 속도
- 브라우저 스타일 초기화
- Body 기본 스타일

페이지 전용 스타일을 전역 파일에 계속 추가하지 않습니다.

## CSS Module 역할

- 해당 컴포넌트의 배치
- 내부 요소
- Hover, Focus와 활성 상태
- 해당 컴포넌트의 반응형 처리
- 해당 컴포넌트의 디자인 예외

```jsx
import styles from "./HeroSection.module.css";

<section className={styles.heroSection}>
  <h1 className={styles.heroTitle}>Nahyun Park</h1>
</section>
```

CSS Module 클래스는 역할 중심 `camelCase`를 사용합니다.

```css
.heroSection {}
.heroTitle {}
.heroDescription {}
.projectGrid {}
```

## 스타일 소유권

각 컴포넌트가 자신의 스타일을 소유합니다. 페이지가 공통 컴포넌트 내부를 선택자로 직접 덮어쓰지 않습니다.

```css
/* 비권장 */
.heroSection button {
  border-radius: 0;
}
```

다른 모양이 필요하면 의미가 드러나는 variant를 사용합니다.

```jsx
<Button variant="hero" />
```

페이지에만 필요한 별도 역할이면 페이지 전용 컴포넌트로 분리합니다.

## 선택자

- 깊은 중첩 선택자를 피합니다.
- 스타일 용도로 ID를 사용하지 않습니다.
- 클래스 이름은 색상과 위치가 아니라 역할을 표현합니다.
- `!important`는 원칙적으로 사용하지 않습니다.

`!important`가 꼭 필요하면 `DESIGN-EXCEPTION`에 이유와 제거 조건을 기록합니다.

## 반응형

동일 컴포넌트와 동일 버전에서 모바일·태블릿·데스크톱을 처리합니다. 별도 모바일 컴포넌트나 CSS 복사본을 만들지 않습니다.

채용 담당자는 데스크톱과 모바일 모두에서 소개 → 프로젝트 → 연락·자료 확인의 같은 목적을 완수할 수 있어야 합니다. CSS 작성 순서는 Desktop 기본 + Tablet, Mobile Override를 유지하지만, 모바일의 정보와 기능을 축소한다는 뜻이 아닙니다. 구체적인 읽기 흐름과 검수 기준은 [반응형 전략](../responsive-strategy.md)을 따릅니다.

```css
.heroSection {
  min-height: 100vh;
}

/* Tablet */
@media (max-width: 1024px) {
  .heroSection {
    min-height: 80vh;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .heroSection {
    min-height: auto;
  }
}
```

기준 화면:

```text
Desktop: 1025px 이상
Tablet: 768px–1024px
Mobile: 767px 이하
```

반응형 조정 자체는 디자인 예외가 아닙니다. 디자인 시스템의 모바일 규칙을 벗어날 때만 적용 범위, 이유와 재검토 조건을 기록합니다.

## 주석

컴포넌트의 주요 스타일 블록에는 필요한 경우 WHAT과 WHY를 기록합니다.

```css
/*
 * WHAT: Home Hero의 전체 화면 레이아웃
 * WHY: 방문자가 핵심 포지셔닝을 첫 화면에서 바로 인식하도록 함
 */
```

모든 선언을 설명하지 않고 구조, 비직관적인 결정과 예외에만 주석을 작성합니다.

## 검토 시점

페이지 완료 시 다음을 확인합니다.

- 전역 스타일에 페이지 전용 규칙이 섞이지 않았는가?
- 공통 컴포넌트 내부를 외부에서 덮어쓰지 않았는가?
- Desktop, Tablet과 Mobile Override 순서가 일관적인가?
- 역할 기반 클래스명을 사용했는가?
- 디자인 토큰 대신 의미 없는 숫자를 반복하지 않았는가?
- `!important`와 디자인 예외에 이유가 기록돼 있는가?
