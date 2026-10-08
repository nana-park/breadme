# 원본 포트폴리오 React 이관

## 기준

`nana-park/Portfolio`의 `834815915647e4b3fbf9285b88b8001e37b94aa0`을 기준으로 레이아웃·문구·사진·글꼴·색상·원본 SVG와 주요 동작을 보존합니다. 원본과 다른 새 시안을 만드는 작업이 아닙니다.

## Home 경력 구현

Home의 `#history`는 사진·모션 없는 흰색 Education 스타일의 `HomeExperience`로 교체합니다. 회사 캐러셀·발자취·Education·나머지 섹션과 다른 페이지는 유지합니다. 실제 규격·콘텐츠 순서·검수 한계는 [Home README](../home/README.md)를 따릅니다.

## 페이지

| URL                                        | 내용                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `/`, `/index.html`                         | 선택된 텍스트 Hero·원본 파트너·발자취·경력·학력·CTA |
| `/about.html`                              | 소개·배경 영상·미디어                               |
| `/career.html`                             | 경력·추천                                           |
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

- Home Hero는 `../home/HomeHero.tsx`, 경력은 `HomeExperience`, 하단 CTA 내용은 `HomeCapabilities`에서 관리합니다. CTA는 기존 박스와 배경 효과 안에서 Product Focus·Core Strengths를 표시하고 Products 목록으로 연결합니다. 변환기는 이 세 컴포넌트 연결을 보존하며 나머지 원본 섹션은 유지합니다.
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

2026-10-05 모바일 가독성 작업은 [PR #3](https://github.com/nana-park/breadme/pull/3)으로 main에 병합됐습니다. 현재 코드·배포 상태는 [버전 허브](../../../versions/README.md), 아래 검수 기록은 각 실행 커밋을 기준으로 읽습니다. 12개 원본 랜딩의 767px 이하 제목은 30–36px 범위, 설명은 기본 16px로 맞추고 Home의 승인된 별도 Hero는 유지합니다. 강의 말줄임, About 이름 도식, Career 추천인 잘림, Contact/Enjoy 확대 글자 잘림을 콘텐츠 높이에 맞게 보정합니다. Awards 제목은 같은 배경색의 독립된 읽기 줄로 옮겨 그림의 검은 그림자와 겹치지 않게 합니다. 원본 문구와 링크는 변경하지 않습니다.

공통 메뉴·Footer·자료 팝업은 각 컴포넌트의 CSS Module이 모바일 보정을 소유합니다. 메뉴는 기존 1024px 전환점 아래에서 16/14px, Footer는 767px 이하에서 2열·14px 링크·44px 조작 영역을 사용합니다. 메뉴가 열려 inert 상태인 자료 팝업은 보이지 않도록 해 메뉴를 가리지 않습니다. 이전 CSS의 중요한 선언은 기본값을 보존한 변수 연결로만 제어합니다.

수정 전 캡처, TC 범위와 검수 한계는 [모바일 UI 테스트 케이스](../../../docs/qa/mobile-ui-test-cases.md)를 봅니다. 실제 휴대폰·Safari 검사나 브라우저 자체 200% 줌을 완료했다는 뜻은 아닙니다. 이후 변경의 main 병합·공개는 별도 승인 대상입니다.

## 자체 검수

Home 7개 폭, 전체 14개 경로의 390px/1440px, 원본·React 비교, 링크·이미지·콘솔·키보드·터치·상태 전환을 확인합니다. 결과는 [이관 검수 기록](../../../docs/qa/original-migration-verification.md)에 구분해 기록합니다.

## 모바일 구간 스크롤

모바일(767px 이하)에서 14개 경로의 큰 구획에 native proximity snap을 적용합니다. 타깃 선택은 `src/config/mobileScrollSnap.ts`에 모았고 원본 레이아웃 요소에 표지만 붙입니다. 원본 내용을 화면 높이에 맞춰 자르거나 터치·휠을 가로채지 않습니다. Articles는 읽기 화면이 새로 나타날 때 타깃을 갱신하고, 글 전체를 하나의 긴 읽기 구간으로 유지합니다. 데스크톱·가로 캐러셀은 기존 동작입니다.

About와 Awards의 장식용 바깥 `overflow:hidden`만 모바일에서 `clip`으로 바꿉니다. 같은 시각적 잘림을 유지하되 구간 스냅이 중간 스크롤 상자에 막히지 않게 하는 호환 보정입니다(DE-001). 내부 데모·미디어·표·캐러셀의 overflow는 바꾸지 않습니다.

AI Mentoring 상세는 기존 데모 소스의 업로드 제한 때문에 선택적 타이포그래피 역할 2개를 적용하지 않고 원본 파일을 그대로 둡니다. 기존 제목 32px·Director’s Log 14px는 유지됩니다. 공통 메뉴/Footer와 해당 경로의 QA는 포함하지만, 이 페이지의 글자 크기 조정까지 완료한 것으로 표시하지 않습니다.

추가 화면 검수에서 원형 자료 바로가기가 여러 페이지의 본문을 가리는 것이 확인되어, 767px 이하의 최소화 바로가기는 전 경로에서 감춥니다. Home에서도 Hero 아래에 다시 나타나지 않습니다. 2026-10-06 후속 요청으로 모바일 햄버거 메뉴의 Resume/Portfolio PDF 진입도 제거했습니다. Desktop 자료 버튼·Contact 자료 본문·Coming Soon 패널은 그대로이며, PDF 공개나 전송 기능을 추가하지 않습니다. 패널을 닫거나 숨김 경계로 크기를 바꾸면 보이는 메뉴 버튼에 초점을 돌립니다.

## Contact 모바일 Hero 정렬 (2026-10-05)

사용자 요청에 따라 Contact의 767px 이하 Hero 텍스트만 Home과 같은 좌측 정렬·좌우 패딩 20px·최대 읽기 폭 380px을 사용합니다. 제목은 실제 Home 제목과 같은 `clamp(32px, 8.8vw, 40px)` / line-height 1.1, 본문은 화면에 렌더링되는 Home 경력 요약과 같은 13px / line-height 1.6입니다. Home의 사용하지 않는 17px summary 규칙은 기준이 아닙니다.

보정은 `OriginalPage.module.css`의 Contact Hero 역할 안에만 적용합니다. 사진·오버레이·문구·기존 세로 높이·하단 카드/링크·자료 Coming Soon·native proximity snap은 보존하며 768px 이상과 Home·Awards·GNB는 바꾸지 않습니다. [집중 검수 기록](../../../docs/qa/contact-mobile-alignment.md)에 실제 실행 결과와 캡처 한계를 구분합니다.


2026-10-06 추가 요청: Contact의 `Domain` 카드 전체는 767px 이하에서만 감춥니다. `data-contact-card="domain"` 표식과 같은 CSS Module이 소유하며 변환기에도 표식을 보존합니다. 모바일은 빈 카드 자리 없이 Connect → Location으로 이어지고, 768px 이상 Domain/Review Projects는 유지합니다. 별도 Resume & Portfolio Package의 Copy URL, 기존 비활성 폼과 Coming Soon은 바꾸지 않습니다.

## About 모바일 소개·이름 도식·구간 경계

2026-10-06 요청 범위에서는 767px 이하 About의 소개 제목·설명·버튼을 Home의 중앙 배치된 최대 380px 읽기 열에 맞춰 좌측 정렬합니다. 기본 여백은 20px이며, 430px 화면에서는 Home처럼 25px로 늘어납니다. 기존 `.container`의 5vw 기본값을 보존하는 gutter 변수는 About 소개 요소에서만 이 모바일 값으로 설정합니다. 이름 도식의 Park Nahyun은 40→36px, 발음 기호는 30→27px, 연결선은 80→70px로 조금 줄이고 작은 설명 라벨과 BREAD/ME의 의미는 유지합니다.

`data-about-chapter`는 소개 → 이름 도식 → 인터뷰의 세 경계를 명시합니다. 모바일 각 구간의 최소 높이는 화면에서 Header 70px를 뺀 값이며, 긴 내용과 확대된 글자는 구간 자체를 늘립니다. 기존 문서 proximity snap·메뉴 열림 시 해제·reduced motion 규칙을 재사용합니다. 강제 고정 높이, 새 스크롤 컨테이너, 휠/터치 가로채기는 추가하지 않습니다. 768px 이상 화면은 원본 값을 사용합니다. [검수 범위와 상태](../../../docs/qa/about-mobile-sections.md)를 확인합니다.

## Career 콘텐츠 정리 (2026-10-06)

사용자 요청으로 Career의 중복 Education(`history-2`)을 모바일·데스크톱 모두 제거합니다. 순서는 소개 → 경력 2패널 → Team Work 추천이며 Home의 Academic Standing·학력 사진·연구 링크는 그대로입니다. 빈 섹션이나 스냅 지점은 남기지 않습니다. 변환기의 `applyCareerContentOverrides`가 재생성 시 같은 범위를 유지합니다. Team Work 아래 `Unfiltered voices…` 문장의 명시적 줄바꿈은 767px 이하에서만 숨겨 자연스럽게 줄바꿈되며, 문구와 768px 이상 줄바꿈은 보존합니다.

같은 요청의 모바일 추천 카드는 기본 1:1 비율, 너비 최대350px(좁은 화면은 viewport−48px), padding16px, 본문14px/1.45, 추천인12px/1.35로 조정합니다. 원문 6개와 작성자 정보는 생략하지 않습니다. 글자 확대 시에는 카드 너비와 같은 최소 높이·자동 콘텐츠 높이로 정사각형보다 높게 늘어나 전체 텍스트를 보존합니다. 768px 이상 기존 카드 크기·본문·작성자 스타일은 유지합니다.

## 페이지 로딩 중 공통 Header 스타일

페이지 전환 시 lazy 본문의 다운로드를 기다리는 동안에도 기존 페이지 CSS → utility → 모바일 접근성 스타일을 한 번씩 즉시 적용합니다. 스타일 묶음은 `OriginalPage`의 Suspense 밖에 있고 본문과 상호작용 hook만 로딩 경계 안에 있습니다. Desktop 자료 버튼의 모바일 숨김과 Header 정렬이 처음부터 유지되어 Resume/Portfolio PDF가 기본 버튼으로 잠깐 노출되지 않게 합니다. CSS 내용·적용 순서·페이지 링크 방식은 바꾸지 않습니다.

`loading-styles.test.tsx`는 로딩 전후 스타일 노드의 개수·순서·동일성을 검사하고, `header-loading-styles.spec.ts`는 실제 본문 JS 응답을 지연시킨 상태의 320–1440px Header와 반복 페이지 이동을 검사합니다. 단위 검사가 실제 브라우저 검사 결과를 대신하지 않습니다.

## 모바일 메뉴 한 화면 배치 (2026-10-06)

공통 Header의 모바일 메뉴는 5개 상위 링크와 ABOUT 3개·PROJECTS 4개 하위 링크를 모두 유지합니다. 하위 링크만 2열로 배치하고 메뉴의 상하 여백·그룹 간격을 줄여 390×844·390×740·375×667·320×640에서 스크롤 없이 보이도록 구성합니다. 글자는 기존 16/14px, 최소 터치 영역은 44px이며 링크 이름·목적지는 바꾸지 않습니다. 더 짧은 화면과 확대 글자를 위해 세로 스크롤을 남기고, Escape·닫기 버튼·초점 가두기·본문 스크롤 잠금은 유지합니다. Desktop은 변경하지 않습니다. 실제 실행 결과와 미검수 범위는 [모바일 메뉴 검수 기록](../../../docs/qa/mobile-menu-compact.md)에 구분합니다.


## Contact 패키지 직접 조작 (2026-10-06)

Resume / Portfolio PDF placeholder를 `ContactPackageActions`의 native 버튼으로 연결합니다. App → OriginalPage의 콜백으로 기존 Application Materials 패널을 열고, 반복 실행은 열린 패널을 유지하며 닫기/Escape 뒤 실제 본문 진입 버튼으로 초점을 돌립니다. 자료 전송·PDF 공개는 여전히 Coming Soon입니다.

Copy URL은 `siteMetadata.portfolioUrl`의 공개 홈 `https://nana-park.github.io/breadme/`만 복사합니다. Clipboard API가 완료된 뒤에만 사용자 지정 “포트폴리오 웹사이트 URL이 복사되었습니다” alert를 보입니다. 거부·미지원은 실패 alert 및 선택 가능한 읽기 전용 URL로 안내하고 재시도할 수 있습니다. 진행 중 중복 클릭은 무시합니다. 문구는 `src/content/site/contactPackage.ts`, 버튼·피드백 스타일은 `ContactPackageActions.module.css`가 소유합니다. 원본 형태·줄바꿈을 보존하고 767px 이하 버튼 조작 높이만 44px 이상으로 보정합니다. Hero 정렬·Domain 숨김·메일 폼은 이 수정에 영향받지 않습니다. 변환기도 본문 조작 컴포넌트를 보존합니다.

검사 범위와 브라우저 실행 제한은 [Contact 패키지 검수](../../../docs/qa/contact-package-actions.md)를 봅니다.


Home 협업 회사 목록은 `HomePartnerLogos`에서 관리합니다. 기존 파트너 섹션의 문구·위치·크기는 유지하고 Google을 제거, SK Inc.와 LINE WORKS를 추가했습니다. SK Telecom과 SK Inc.는 별도 회사이며 6개 로고를 세 번 반복합니다. 자세한 공식 출처와 스타일 보존 범위는 [Home README](../home/README.md)를 따릅니다.

## Contact-style photo introductions

Qualifications (`qualified.html`), Products (`projects.html`), Research and Articles use `LandingPhotoHero` with their existing photos. The previous long headings become two concise supporting paragraphs in `src/content/original/landingHeroes.ts`; all following page content is retained. Only widths through 767px are left-aligned, with Contact's 20px gutter, 380px column, 32–40px heading and 13px copy. Tablet/desktop remain centered, using 48/56px headings, 16px copy and 350/500px minimum hero heights. Enlarged text can grow the panel. A 60% black overlay protects white small-copy contrast (minimum 5.74:1 over white source pixels). Contact itself stays unchanged.

`apply-landing-hero-override.ts` preserves this structure on regeneration. Articles pagination, reading-view spacing and return behavior remain unchanged. Mobile scroll-snap targets now follow the moved introductions. The mobile header's one-open About/Projects accordion and the career secondary action are included in the same review; see the associated QA notes.

## About 모바일 프로젝트 버튼 정렬 (2026-10-08)

767px 이하 About 첫 화면의 `View my projects` 버튼만 가운데 정렬합니다. 제목·본문의 좌측 정렬과 읽기 폭, 다른 CTA 및 768px 이상 레이아웃은 유지합니다. `OriginalPage.module.css`의 기존 About 소개 액션 래퍼에만 적용하며, `about-mobile-sections.spec.ts`에서 320·390·430·767px 버튼 중심과 768·1440px 기존 정렬을 검사합니다.

### Qualifications 모바일 구분과 정렬

767px 이하에서만 Core Competencies의 기존 6개 항목에 Contact/Home 경력과 같은 흰 배경·1px #e5e7eb 테두리·8px 모서리·24px 안쪽 여백·작은 그림자를 적용합니다. 세 본문 섹션 제목은 기존 컨테이너 왼쪽에 맞추고, 인증 필터는 12px 글자·작은 간격의 한 줄로 표시합니다. 좁으면 가로 스크롤하며 44px 터치 높이를 유지합니다. 문구·순서·필터 동작과 768px 이상 기존 배치는 보존합니다. 역할 표식은 변환기에도 반영합니다.
