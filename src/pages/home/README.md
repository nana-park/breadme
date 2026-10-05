# Home

`/breadme/`와 `/breadme/index.html`의 순서는 기존 Hero → 회사 로고 캐러셀 → 발자취 갤러리 → 경력 → Education → Qualified CTA입니다.

## 선택된 경력 구현

- `HomeExperience`가 원래 `#history` 영역 전체를 교체합니다. 학력과 같은 흰 배경·2열/모바일1열 구조를 바탕으로, 사진 없이도 경계를 구분하도록 승인된 얇은 회사별 테두리를 추가했으며 사진과 기존 경력의 남색 모션은 렌더링하지 않습니다.
- 작은 `Careers` 라벨 → `Selected Projects` 제목 → 짧은 설명 → 기존 Education 규격의 `Full career` 버튼을 사용합니다. 새 페이지나 프로젝트 목록 확장은 아닙니다.
- 날짜 → 회사명 → AI Product Manager 직무명 → Products → Outcomes를 표시합니다. Products와 Outcomes는 같은 h4 스타일이며 제품명은 Products 아래 목록으로 한 번만 표시하고 성과 문장에서는 반복하지 않습니다. 긴 제품 소개/기여 설명 문단은 제거하고 성과는 한 문장/짧은 사실 단위로만 두며 별도 부연·각주 줄은 없으며 성과 여섯 항목의 끝 마침표를 생략합니다. 수치의 소수점과 No. 1/A.Dot 내부 표기는 유지합니다. 화면에는 “AI Call dropout: 33% → 8%”, “Home-feed CTR: +3.74 percentage points”로 짧게 표시합니다. 행사 체험 / 단계별 콘텐츠 테스트·1월 대비라는 측정 조건은 내부 콘텐츠 데이터와 QA 문서에 보존합니다.
- NAVER 제품 표시는 사용자 요청에 따라 NAVER Care Call / NAVER Care Call Console / LINE WORKS AI Call 세 줄입니다. 공식 소스의 브랜드 표기는 성과별 내부 데이터에 유지합니다.
- NAVER는 AiCall의 FY2024 일본 시장1위, CLOVA CareCall의 2025 APEC showcase, 행사 체험의 통화 이탈률 33%→8% 순서입니다. SK Telecom은 A.Dot의 2024 GDWEB GRAND PRIZE, 가입자550만/22% 성장, 단계별 콘텐츠 테스트의 1월 대비 CTR +3.74%p 순서입니다.
- 시장1위 문장은 공식 LINE WORKS 발표로, 디자인 수상 문구는 공식 GDWEB 결과로 연결합니다. 정부상이나 개인 수상으로 표기하지 않습니다. Korea1위·SKT시장점유율·MAU·개인의 단독 성과로 새로 해석하지 않습니다. 내부 원본 문서나 비공개 자료 링크는 넣지 않습니다.

## 원본 Education에서 재사용한 규격

- 실제 `.container`: max-width1440px, 좌우5vw. 초기 `design-tokens.css`는 연결하지 않음
- 섹션 여백: 위64px / 아래96px; 제목 묶음 아래48px
- 라벨11px/weight500/자간0.2em → 제목24px(768px부터28px)/weight500 → 설명13px(768px부터14px)
- 버튼: #1a1a1a, 13px/weight600, 상하10px·좌우24px, radius4px, 작은↗
- 열: 모바일1열, 768px부터2열; gap32px, 1024px부터48px
- 회사 박스: 1px solid #e4e4e7, radius10px, 흰 배경, shadow없음, 웹·모바일 모두 내부24px. 제목 묶음은 박스 밖에 유지. 웹은 grid stretch로 같은 행의 높이를 맞추고, 모바일에는 고정 높이를 두지 않음
- 항목: 날짜11px → 회사명20px(768px부터22px)/weight400 → 직무명12px (두 회사 모두 AI Product Manager)
- Products/Outcomes 라벨10px로 동일 위계; 각 목록 내용13px/line-height1.6. 항목 사이8px, 제품 목록 아래24px, 자연 줄바꿈; 고정 높이·축소 글자·말줄임 없음

사진은 사용자의 최종 선택에 따라 제거했으므로 이미지 자리를 빈 박스나 고정 높이로 남기지 않습니다. 기존 Education의 사진·padding·위치는 유지합니다. 사용자 요청에 따른 유일한 본문 예외는 Research Focus 두 문장을 한 문장으로 다듬고 강제 줄바꿈을 제거한 것입니다. 화면 폭에 따른 자연 줄바꿈은 허용합니다.

## 소스와 범위

- `HomeExperience.tsx`, `HomeExperience.module.css`: 경력만의 조립/스타일
- `src/content/site/homeExperience.ts`: 문구와 공개 근거 링크; 회사명은 공통 `terms` 사용
- `OriginalHomeContent.tsx`: `#history`만 컴포넌트로 교체. 회사 캐러셀·갤러리·하단CTA는 main533d33b와 동일. Education은 승인된 Research Focus 한 문장 외에 동일
- `scripts/convert-original-pages.mjs`: Home history 교체와 Research Focus 문장 교정을 재생성 시 보존. 다른 페이지 생성 규칙은 바꾸지 않음
- 공통 Header/Footer/자료 UI·Career 페이지·기존 Hero는 그대로 유지. Resume/PDF는 Coming Soon

검사 결과와 한계는 [Home career review](../../../docs/qa/home-career-review.md)에 기록합니다.

## 검수와 공개 상태

- 단위 검사: section 순서, 기존 Education/로고, 경력의 사진·모션 제거, 성과 순서/회사별 귀속/공식 링크
- `home-career-visibility.spec.ts`: 320/390/768/1440px 흰 배경·기존 순서·학력과 같은 제목 위계·열 배치·줄바꿈·링크/Back·캡처
- Hero·메뉴·자료·모바일 스크롤 검사를 유지하고, 원래 경력 페이지의 패널 검사는 `/career.html`에서 계속 수행
- 로컬 Chromium은 정상 실행 시 socket permission 오류로 시작 전에 차단됨. 정책/실행 플래그를 바꿔 우회하지 않음. 도식 이미지는 실제 브라우저 캡처나 기기 검수의 대체가 아님
- 현 단계는 로컬 구현/검토입니다. GitHub push/PR와 main 병합·배포는 아직 승인·수행되지 않음

`HomePage.tsx` / `HomePage.module.css`는 초기 구조 미리보기 역사 파일로 현재 라우트에서 렌더링하지 않습니다.
