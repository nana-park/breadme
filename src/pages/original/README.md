# 원본 포트폴리오 React 이관

## 기준

`nana-park/Portfolio`의 `834815915647e4b3fbf9285b88b8001e37b94aa0`을 기준으로 레이아웃·문구·사진·글꼴·색상·원본 SVG와 주요 동작을 보존합니다. 원본과 다른 새 시안을 만드는 작업이 아닙니다.

## 페이지

| URL | 내용 |
| --- | --- |
| `/`, `/index.html` | 선택된 텍스트 Hero·원본 파트너·발자취·경력·학력·CTA |
| `/about.html` | 소개·배경 영상·미디어 |
| `/career.html` | 경력·학력·추천 |
| `/qualified.html` | 역량·인증 4개 탭·업무 원칙 |
| `/enjoy.html` | 원본 갤러리·카테고리·여행지 선택. 메뉴 숨김 유지 |
| `/projects.html` | 실제 프로젝트·펼침 목록·9개 세부 펼침·상세 링크 |
| `/research.html` | 연구 4개 항목·논문 링크 |
| `/articles.html` | 아티클 18개·6쪽 목록·해시 주소로 읽기·복귀 |
| `/lectures.html` | 강의·두 이미지 캐러셀 |
| `/awards.html` | 수상·원본 이미지 |
| `/contact.html` | 원본 연락 링크·아직 준비 중인 자료 요청 |
| `/projects/llm-based-voice-ivr.html` | Voice IVR 사례·탭·원본 동영상 |
| `/projects/hopzie-oneclickbuilder.html` | Hopzie 사례·탭·원본 로컬 데모 상태 |
| `/projects/ai-mentoring-agent-detail.html` | 멘토링 사례·탭·React로 옮긴 제품 데모 |

주소를 직접 열거나 새로고침해도 같은 페이지를 표시합니다. 브라우저 기본 링크 이동을 사용합니다. Articles는 원본의 `#article-detail?id=…` 주소를 유지합니다.

## 파일 역할

- Home Hero는 `../home/HomeHero.tsx`에서 별도 관리합니다. 나머지 원본 섹션은 유지하며 변환기를 재실행해도 Hero 연결을 보존합니다.
- `generated/*.tsx`: 원본 HTML 요소를 실제 React JSX로 옮긴 내용. HTML 문자열 주입이나 전체 페이지 iframe이 아닙니다.
- `generated/*.css`: 원본 페이지의 개별 스타일
- `OriginalArticlesPage.tsx`: 아티클 목록·페이지 선택·본문·복귀
- `../../content/original/articles/`: 원본 영어 본문 18개와 메타데이터
- `../../shared/hooks/useOriginalPageInteractions.ts`: 경력·갤러리·인증·강의 조작
- `../../shared/hooks/useOriginalDetailInteractions.ts`: 프로젝트 펼침·상세 탭·원본 미디어·제품 데모
- 공통 Header / Footer / MaterialsPopup / SplineHero는 `shared/`에 둡니다.

## 원본의 미완성 상태

자료 전송·Korean UI 등 원본의 미완성 기능은 완료된 것처럼 만들지 않습니다. 자료 폼을 비활성화하고 전송 성공을 흉내 내지 않습니다. 연결되지 않은 이전 버전·백업은 대상에서 제외했습니다.

원본 `lectures.html` 일부 바이트가 이미 잘못된 UTF-8이라 표시되는 대체 문자는 추측해 새 문장으로 바꾸지 않았습니다. 콘텐츠 교정은 원문 확인 후 별도로 합니다.

## 허용한 모바일·접근성 보정

원본의 데스크톱 화면은 유지합니다. 모바일 Hero의 과도한 3D 잘림, 자료 버튼의 CTA 가림, 메뉴의 초점·터치·닫기 처리, 문자 줄바꿈과 페이지의 실제 가로 넘침처럼 사용을 막는 부분만 수정합니다. 기존 디자인을 새로운 색·카드·레이아웃으로 대체하지 않습니다.

원본 CSS의 적용 순서는 원본의 작성 스타일 → 페이지 스타일 → Tailwind utility → 필요한 모바일·접근성 보정입니다. 기존 소스에서 브라우저가 무시한 잘못된 CSS URL 한 줄은 빌드를 위해 제외했고 화면 효과를 새로 추가하지 않았습니다.

## 자체 검수

Home 7개 폭, 전체 14개 경로의 390px/1440px, 원본·React 비교, 링크·이미지·콘솔·키보드·터치·상태 전환을 확인합니다. 결과는 [이관 검수 기록](../../../docs/qa/original-migration-verification.md)에 구분해 기록합니다.
