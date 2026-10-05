# 원본 포트폴리오 React 이관

## 기준

`nana-park/Portfolio`의 `834815915647e4b3fbf9285b88b8001e37b94aa0`을 기준으로 레이아웃·문구·사진·글꼴·색상·원본 SVG와 주요 동작을 보존합니다. 원본과 다른 새 시안을 만드는 작업이 아닙니다.

## 페이지

| URL                                        | 내용                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `/`, `/index.html`                         | 선택된 텍스트 Hero·원본 파트너·발자취·경력·학력·CTA |
| `/about.html`                              | 소개·배경 영상·미디어                               |
| `/career.html`                             | 경력·학력·추천                                      |
| `/qualified.html`                          | 역량·인증 4개 탭·업무 원칙                          |
| `/enjoy.html`                              | 원본 갤러리·카테고리·여행지 선택. 메뉴 숨김 유지    |
| `/projects.html`                           | 실제 프로젝트·펼침 목록·9개 세부 펼침·상세 링크     |
| `/research.html`                           | 연구 4개 항목·논문 링크                             |
| `/articles.html`                           | 아티클 18개·6쪽 목록·해시 주소로 읽기·복귀          |
| `/lectures.html`                           | 강의·두 이미지 캐러셀                               |
| `/awards.html`                             | 수상·원본 이미지                                    |
| `/contact.html`                            | 원본 연락 링크·아직 준비 중인 자료 요청             |
| `/projects/llm-based-voice-ivr.html`       | Voice IVR 사례·탭·원본 동영상                       |
| `/projects/hopzie-oneclickbuilder.html`    | Hopzie 사례·탭·원본 로컬 데모 상태                  |
| `/projects/ai-mentoring-agent-detail.html` | 멘토링 사례·탭·React로 옮긴 제품 데모               |

주소를 직접 열거나 새로고침해도 같은 페이지를 표시합니다. 브라우저 기본 링크 이동을 사용합니다. Articles는 원본의 `#article-detail?id=…` 주소를 유지합니다.

## 파일 역할

- Home Hero는 `../home/HomeHero.tsx`에서 별도 관리합니다. 나머지 원본 섹션은 유지하며 변환기를 재실행해도 Hero 연결을 보존합니다.
- `generated/*.tsx`: 원본 HTML 요소를 실제 React JSX로 옮긴 내용. HTML 문자열 주입이나 전체 페이지 iframe이 아닙니다.
- `generated/*.css`: 원본 페이지의 개별 스타일
- `OriginalPage.module.css`: 검수에서 확인된 모바일 글자 역할·잘림 보정. `data-reading-role`로 실제 소개 문구·강의 정보·이름 도식·추천인 카드만 지정하며 제품 데모의 축소 글자는 일괄 확대하지 않습니다.
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

2026-10-05 모바일 가독성 작업은 `feature/mobile-ui-readability`, [Draft PR #3](https://github.com/nana-park/breadme/pull/3)에서 진행합니다. 12개 원본 랜딩의 767px 이하 제목은 30–36px 범위, 설명은 기본 16px로 맞추고 Home의 승인된 별도 Hero는 유지합니다. 강의 말줄임, About 이름 도식, Career 추천인 잘림, Contact/Enjoy 확대 글자 잘림을 콘텐츠 높이에 맞게 보정합니다. Awards 제목은 같은 배경색의 독립된 읽기 줄로 옮겨 그림의 검은 그림자와 겹치지 않게 합니다. 원본 문구와 링크는 변경하지 않습니다.

공통 메뉴·Footer·자료 팝업은 각 컴포넌트의 CSS Module이 모바일 보정을 소유합니다. 메뉴는 기존 1024px 전환점 아래에서 16/14px, Footer는 767px 이하에서 2열·14px 링크·44px 조작 영역을 사용합니다. 메뉴가 열려 inert 상태인 자료 팝업은 보이지 않도록 해 메뉴를 가리지 않습니다. 이전 CSS의 중요한 선언은 기본값을 보존한 변수 연결로만 제어합니다.

수정 전 캡처, TC 범위와 검수 한계는 [모바일 UI 테스트 케이스](../../../docs/qa/mobile-ui-test-cases.md)를 봅니다. 실제 휴대폰·Safari 검사나 브라우저 자체 200% 줌을 완료했다는 뜻은 아닙니다. main 병합·공개는 별도 승인 대상입니다.

## 자체 검수

Home 7개 폭, 전체 14개 경로의 390px/1440px, 원본·React 비교, 링크·이미지·콘솔·키보드·터치·상태 전환을 확인합니다. 결과는 [이관 검수 기록](../../../docs/qa/original-migration-verification.md)에 구분해 기록합니다.

## 모바일 구간 스크롤

모바일(767px 이하)에서 14개 경로의 큰 구획에 native proximity snap을 적용합니다. 타깃 선택은 `src/config/mobileScrollSnap.ts`에 모았고 원본 레이아웃 요소에 표지만 붙입니다. 원본 내용을 화면 높이에 맞춰 자르거나 터치·휠을 가로채지 않습니다. Articles는 읽기 화면이 새로 나타날 때 타깃을 갱신하고, 글 전체를 하나의 긴 읽기 구간으로 유지합니다. 데스크톱·가로 캐러셀은 기존 동작입니다.

About와 Awards의 장식용 바깥 `overflow:hidden`만 모바일에서 `clip`으로 바꿉니다. 같은 시각적 잘림을 유지하되 구간 스냅이 중간 스크롤 상자에 막히지 않게 하는 호환 보정입니다(DE-001). 내부 데모·미디어·표·캐러셀의 overflow는 바꾸지 않습니다.

AI Mentoring 상세는 기존 데모 소스의 업로드 제한 때문에 선택적 타이포그래피 역할 2개를 적용하지 않고 원본 파일을 그대로 둡니다. 기존 제목 32px·Director’s Log 14px는 유지됩니다. 공통 메뉴/Footer와 해당 경로의 QA는 포함하지만, 이 페이지의 글자 크기 조정까지 완료한 것으로 표시하지 않습니다.
