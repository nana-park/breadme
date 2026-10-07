# 공통 명칭 목록

번역하지 않거나 공식 표기를 공통으로 유지하는 제품, 브랜드, 기관과 기술 명칭을 관리합니다.

## 규칙

- `default`는 영어 공식 표기를 사용합니다.
- 언어별 예외가 없으면 `default`를 한국어와 영어 화면에서 그대로 사용합니다.
- 공식 한국어 표기 또는 사용자가 지정한 예외가 있을 때만 `ko`를 추가합니다.
- `en`은 `default`와 다를 때만 추가합니다.
- 번역 여부가 애매하면 자동 번역하지 않고 사용자에게 확인합니다.
- 대소문자, 띄어쓰기와 상표 표기를 임의로 바꾸지 않습니다.
- 변경 시 영향받는 페이지와 언어를 버전 기록에 표시합니다.
- 예외는 사용자가 전달한 뒤 이유와 적용 범위를 메모합니다.

이 목록은 문서 기준표입니다. React 구현 시 동일한 내용을 `src/content/shared/terms.ts`의 단일 원본으로 옮기며 페이지에서 직접 반복 작성하지 않습니다.

## 제품과 프로젝트

| ID | 분류 | default | ko 예외 | 메모 |
| --- | --- | --- | --- | --- |
| `hopzie` | Product | Hopzie | - | 모든 언어에서 영어 공식명 사용 |

## 회사와 브랜드

| ID | 분류 | default | ko 예외 | 메모 |
| --- | --- | --- | --- | --- |
| `naver-cloud` | Organization | NAVER Cloud | - | 사용자 예외 전달 전까지 공통 사용 |
| `sk-telecom` | Organization | SK Telecom | - | 사용자 예외 전달 전까지 공통 사용 |
| `sk-inc` | Organization | SK Inc. | - | 지주사. Home 로고에서 SK Telecom과 별도 표시; 공식 SK Holdings 소개 기준 |
| `line-works` | Organization | LINE WORKS | - | 일본 LINE WORKS 기업 워드마크. 일반 LINE 서비스와 구분 |

## 기술과 도구

| ID | 분류 | default | ko 예외 | 메모 |
| --- | --- | --- | --- | --- |
| `react` | Technology | React | - | 번역하지 않음 |
| `figma` | Tool | Figma | - | 번역하지 않음 |
| `github` | Tool | GitHub | - | 번역하지 않음 |

## 공통 데이터 유형

다음은 단어 목록에 개별 등록하지 않아도 기본적으로 모든 언어에서 원본값을 공유합니다.

- 콘텐츠 ID
- URL slug
- 이메일
- URL
- 날짜와 수치의 원본값
- 이미지와 파일 경로

## 예외 추가 형식

```text
ID: naver-cloud
기준값: NAVER Cloud
한국어 표시명: 네이버클라우드
적용 범위: [About][KO], [Career][KO]
이유: 한국어 공식 브랜드 표기 사용
확인자: 사용자
```

예외를 추가하면 관련 콘텐츠 파일, 페이지 README, PR과 버전 기록도 함께 확인합니다.

## Home 제품 표시 예외 — 2026-10-05

사용자가 Home 경력 카드의 가독성을 위해 `NAVER Care Call`, `NAVER Care Call Console`, `LINE WORKS AI Call` 표기를 지정했습니다. 적용 범위는 Home의 Products 목록이며, 원본 자료의 `CLOVA CareCall` / `LINE WORKS AiCall` 브랜드명은 성과별 내부 데이터와 공식 근거에 유지합니다. 다른 페이지나 전역 명칭은 변경하지 않습니다. 이 로컬 표시 예외는 `src/content/site/homeExperience.ts`에서 관리합니다.
