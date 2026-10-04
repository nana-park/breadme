# Home

현재 `/breadme/`와 `/breadme/index.html`의 첫 소개 영역은 `HomeHero.tsx`가 담당합니다. 아래 파트너·발자취·경력·학력·CTA는 원본 JSX를 유지합니다.

## 이번 수정

- 경력 자료에 근거한 `Making AI agents work for people.` 소개와 직무 설명
- 실제 Projects / Contact로 이동하는 두 버튼
- 모바일에서는 세로 버튼, 원본 Spline 오브젝트 중심 조정
- Spline 표시 배지를 숨기거나 자르지 않음
- 일반 문서 흐름을 사용해 글자가 커져도 제목·설명·버튼이 서로 겹치지 않게 구성

## 파일

- `HomeHero.tsx`: 실제 Hero React 요소
- `HomeHero.module.css`: Home에만 적용하는 배치와 모바일 규칙
- `../../content/site/homeHero.ts`: 검토용 소개·버튼 문구의 단일 원본
- `../original/generated/OriginalHomeContent.tsx`: Hero 연결과 나머지 기존 Home 내용

현재 문구는 사용자가 제공한 경력 자료에 근거한 검토안입니다. 공개된 페이지에 개인 자료 링크나 새 성과 수치를 추가하지 않습니다. 다른 페이지의 설명·수치는 이번 범위에서 수정하지 않습니다.

## 검수

`tests/e2e/home-layout.spec.ts`는 320/375/390/430/1440px에서 실제 오브젝트 픽셀 중심, 원본 배지의 노출·클리핑, CTA 줄 수·세로 배치·키보드·목적지·메뉴를 확인합니다. 공개 중인 화면과 수정 브랜치 화면을 같은 크기로 캡처합니다. 통과 여부는 PR #2의 최신 CI에서 확인하며 실제 기기 전체 검수나 완전한 접근성 준수를 뜻하지 않습니다.

`HomePage.tsx` / `HomePage.module.css`는 최초 구조 미리보기의 역사 파일입니다. 현재 라우트에서는 렌더링하지 않습니다.
