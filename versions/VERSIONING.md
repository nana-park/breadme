# 버전관리 규칙

## 형식

```text
vMAJOR.MINOR.PATCH
```

- 정식 공개 전: `v0.x.x`
- React 최초 정식 공개: `v1.0.0`

### MAJOR

정보 구조, URL, 디자인 시스템 또는 사용 경험이 호환되지 않을 정도로 근본적으로 바뀔 때 올립니다. 사전에 사용자와 결정합니다.

### MINOR

새 페이지, 주요 섹션, 필터와 같은 의미 있는 사용자 가치를 추가할 때 올립니다.

```text
v0.1.0 Home 및 디자인 시스템
v0.2.0 About
v0.3.0 Projects
```

### PATCH

기능 추가 없이 오류, 접근성, 성능, 링크, 이미지와 작은 스타일 문제를 수정할 때 올립니다.

## 페이지 표기

각 버전은 영향받은 페이지를 모두 기록합니다. 모든 페이지가 영향받아도 페이지명을 생략하지 않습니다.

```text
영향받은 페이지:
- Home
- About
- Projects

변경사항:
- [Home][Mobile] Hero 이미지 누락 수정
- [Projects][All Viewports] 상세 링크 오류 수정
```

상세 페이지는 대상을 구체적으로 씁니다.

```text
[Project Detail: Hopzie]
[Article Detail: AI Accessibility]
```

## 화면 표기

모바일과 데스크톱은 별도 버전을 만들지 않습니다.

```text
[Mobile]
[Tablet]
[Desktop]
[All Viewports]
```

검수 화면:

```text
Mobile: 390px
Tablet: 768px
Desktop: 1440px
```

## 언어 표기

한국어와 영어는 별도 버전을 만들지 않습니다. 변경사항에 언어 범위를 명시합니다.

```text
[KO]
[EN]
[KO][EN]
```

공통 명칭 또는 메타데이터 변경으로 두 언어가 모두 영향받으면 `[KO][EN]`을 표시합니다.

```text
- [Home][KO] Hero 소개 문구 수정
- [Home][EN] 직무명 번역 수정
- [Projects][KO][EN] Hopzie 공통 공식명 수정
```

## 공식 기록

- `versions/CHANGELOG.md`: 전체 버전 요약 한 파일
- `versions/releases/vX.Y.Z.md`: 버전별 변경, 테스트와 승인 상세
- Git tag와 GitHub Release: `main` 공개 기준점
