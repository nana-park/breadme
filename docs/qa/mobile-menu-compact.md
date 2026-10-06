# 모바일 메뉴 한 화면 배치

2026-10-06 요청 범위: 모바일 햄버거 메뉴의 Resume/Portfolio PDF만 제거하고 가급적 스크롤 없이 전체 메뉴를 표시합니다. Desktop Header 버튼과 Contact 자료 본문은 유지합니다. main 병합·배포 승인은 별도입니다.

## 변경과 설계값

- 상위 링크 5개: HOME, ABOUT, PROJECTS, AWARDS, CONTACT.
- 하위 링크 7개: ABOUT의 breadme/Career/Qualified, PROJECTS의 Products/Research/Articles/Lectures. 이름·순서·목적지를 그대로 유지합니다.
- 상위 링크는 1열, 각 그룹 하위 링크는 2열입니다. 기존 DOM/키보드 순서와 위계는 유지합니다.
- 기존 16px/14px 글자와 최소 44px 터치 영역을 유지합니다. 사용자 요청을 위해 글자나 터치 영역을 더 줄일 필요가 없는 배치를 선택했습니다.
- 상하 여백 8px, 좌우 20px, 그룹 간격 4px, safe-area 하단 여백. CSS 기준 콘텐츠 높이는 9행 × 44px + 그룹 간격 16px + 상하 여백 16px = 428px입니다. 원본 하위 메뉴 상하 테두리가 있는 경로는 432px입니다. 실제 글꼴/확대/safe-area는 브라우저 실측 대상입니다.
- 헤더 높이 70px을 제외한 가용 높이: 390×844는 774px, 390×740는 670px, 375×667는 597px, 320×640는 570px.
- 메뉴의 overflow-y:auto를 유지하고 그룹을 강제로 축소하지 않습니다. 매우 짧은 화면과 확대 글자는 내용에 맞춰 커지고 세로 스크롤로 접근할 수 있습니다.
- 변경 스타일은 Header의 CSS Module에서 1023px 이하에만 적용합니다. 원본 중요 선언과 경쟁하는 새 !important는 추가하지 않습니다.

## 자동 검사 범위

`tests/e2e/mobile-menu-compact.spec.ts`:

- 14개 경로의 390×844와 Home의 나머지 3개 화면에서 메뉴의 client/scroll 크기, 12개 링크 전체 bounds, 실제 글자 bounds, 최소 터치 영역, 원본 경로를 검사하고 PNG/JSON을 첨부합니다.
- 320×320 짧은 화면과 synthetic computed text 200%에서 세로 스크롤로 모든 링크에 도달하고 가로 잘림이 없는지 확인합니다. 이는 실제 브라우저 줌·OS 텍스트 확대·접근성 인증이 아닙니다.
- 모바일 링크 이동과 잠금 해제, Desktop 자료 버튼 두 개를 확인합니다.

기존 focus trap·Escape·반복 닫기·inert 및 body overflow 복구·1023/1024 경계 검사는 보존합니다. 제거된 모바일 자료 진입을 참조한 테스트는 모바일 부재 검사와 실제 Desktop 자료 버튼 진입 후 모바일 resize 검사로 구분합니다. 단위 테스트의 팝업 자체 동작은 부모 상태를 제어합니다.

## 실행 결과와 제한

- Header 단위 테스트: 2개 파일 25개 통과.
- TypeScript 검사: 통과.
- 전체 lint·TypeScript·단위 테스트 10개 파일 96개·production build: 통과. 에셋 캐시는 저장소의 checksum 검사로 재확인했습니다. 기존 Browserslist 최신화 안내와 큰 chunk 경고는 비차단 경고로 남습니다.
- 정적 페이지 검사: 14개 HTML 진입점·358개 byte-verified asset과 14개 정적 페이지 테스트 통과.
- Playwright test discovery: 새 compact menu 검사 17개와 기존 mobile-controls 5개를 정상 로드했습니다. discovery는 브라우저 실행이 아닙니다.
- 브라우저 검사: 이 로컬 환경은 Chromium의 socket 생성이 차단되어 실행할 수 없습니다. 이미 확인된 같은 실패를 반복하지 않았습니다. 새 E2E는 기존 CI Chromium renderer에서 실행해야 합니다.
- CSS 설계값을 렌더링 실측으로 대신하지 않았으며 스크린샷을 만들었다고 주장하지 않습니다. 실제 휴대폰·Safari·Firefox·스크린리더·native 200% zoom은 미검수입니다.
