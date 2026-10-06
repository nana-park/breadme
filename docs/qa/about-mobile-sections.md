# About 모바일 소개·이름 도식·구간 스크롤

2026-10-06 사용자 요청에 따른 About 전용 변경입니다. 이 문서는 로컬 구현과 검사 범위를 기록하며, 공개 브랜치·PR·main 병합·배포 승인을 대신하지 않습니다.

## 변경 범위

- 767px 이하 소개 제목·설명·버튼의 왼쪽 시작선: Home의 중앙 최대 380px 읽기 열과 동일하며 최소 20px(430px에서는 25px). 본문과 링크의 내용은 유지합니다.
- Original Name 도식: 이름 40→36px, 발음 기호 30→27px, 의미 글자 clamp 범위 약 10% 축소, 세로 연결선 80→70px. 작은 라벨은 그대로 둡니다.
- 소개·이름 도식·인터뷰의 세 구간: 기존 native proximity snap을 재사용하며 각 구간에 Header를 제외한 viewport 최소 높이를 둡니다. 긴 내용은 자연스럽게 늘어나고 Footer까지 접근할 수 있어야 합니다.
- 메뉴 열림·reduced motion에서 스냅 해제, 문서 스크롤, 768px 이상 화면은 기존 계약을 유지합니다.
- 새 스크롤 이벤트 처리, 콘텐츠 제거, 영상 변경, 외부 서비스·의존성 변경은 없습니다.

## 검수 계약

`src/pages/original/about-mobile-sections.test.tsx`는 실제 React 본문의 세 구간 순서, 작은 도식 요소 제외, 문구·링크 보존과 gutter fallback을 검사합니다. source-level 검사는 실제 CSS 계산과 화면 검수를 대신하지 않습니다.

`tests/e2e/about-mobile-sections.spec.ts`의 7개 케이스:

1. 320·390·430px: 실제 20px 시작선, 이름/기호/연결선 크기, 세 구간 높이와 계산된 snap 속성, 휠로 이름/인터뷰 경계에 접근 후 정렬, 하단 링크와 Footer 접근, 가로 넘침, PNG/geometry 캡처
2. 390px: 메뉴 반복 열기·Escape·초점 복귀와 reduced motion 스냅 해제
3. 320px: 소개 글자 synthetic computed 200% 확대 후 구간 확장·내부 스크롤·마지막 링크 접근. 실제 브라우저 줌/기기 접근성 검사가 아닙니다.
4. 768·1440px: 원래 중앙 정렬·5vw gutter·40/30/80px 도식 값과 자유 스크롤, 소개/도식 PNG 캡처

## 현재 확인 상태

- 병합 전 main `70d3554` + About 변경: 로컬 `npm run check` 성공. lint·typecheck·99개 단위 검사·production build 통과. 원본 147개/외부 211개 자산 checksum 검증 및 재사용, 다운로드 0.
- PR #7 이후 기준: `7674290`으로 rebase했고, 이 기준의 tree `325f2396ddd23e73bb39fe459732980977200144`가 실제 main `9f3aaba`와 같음을 GitHub 읽기 API로 확인했습니다. README 충돌은 Contact/About 문단을 모두 보존했습니다. 이후 aggregate 재검사에서는 lint 다음 typecheck 단계에서 실행 도구의 approval-review cancellation이 발생해 최종 결과를 확보하지 못했습니다. CI에서 최종 통합 상태를 재검사해야 합니다.
- Playwright 7개 케이스 수집: 성공. 브라우저 실행 성공을 뜻하지 않습니다.
- 실제 모바일/데스크톱 렌더링과 스냅 검증: 미실행. 사용자가 About·Career·초기 Header 보정을 함께 검토하는 Draft PR 업로드를 승인했으며, 통합된 최종 커밋의 기존 CI renderer에서 실행해야 합니다.
- 물리 iOS/Android 터치, Safari, 브라우저 기본 줌: 미검수
- main 병합과 공개 배포: 별도 승인 대상. Draft PR 승인이나 기존 Home/Contact 배포 승인으로 대신하지 않습니다.

## 2026-10-06 추가 여백 비교

390px CI 실제 캡처에서 Home/About 제목·본문은 모두 x=20px였고, 430px에서는 Home x=25px/About x=20px 차이가 확인됐습니다. About gutter 변수만 Home의 중앙 최대380px 읽기 열을 따르도록 보정합니다. 320/390/430/767px에서 같은 브라우저의 Home/About 제목·본문 시작선과 폭을 직접 비교하며, About 버튼은 동일한 텍스트 시작선에 놓습니다. 이 추가 수정의 실제 검사는 최종 PR CI 결과를 따릅니다.
