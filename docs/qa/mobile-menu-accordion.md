# 모바일 단일 열 아코디언 메뉴

2026-10-08 복구. 기준 main `7a029aafe8be8dfc83c666cfe5935bf0e7c40038`. 승인된 모바일 메뉴 변경을 이전 검토 내용에서 복원했습니다.

## 동작과 범위

- HOME / ABOUT / PROJECTS / AWARDS / CONTACT는 좌측 정렬 한 열입니다. ABOUT / PROJECTS는 전체 행 disclosure 버튼이며, 하위 링크도 16px 들여쓰기를 둔 한 열입니다.
- 한 그룹만 열립니다. 메뉴를 다시 열 때 현재 페이지의 그룹을 펼치고 Home/Awards/Contact/Enjoy에서는 둘 다 접습니다. 경로 변경도 새 그룹을 선택합니다.
- 기존 상위 ABOUT / PROJECTS와 같은 목적지인 breadme / Products 링크를 보존하여 고유 목적지 10개를 모두 유지합니다. Desktop의 상위 링크와 hover/focus 하위 메뉴는 유지합니다.
- 글자 16px/14px, 최소 44px 조작 영역, 짧은 화면·확대 글자용 세로 스크롤을 유지합니다. 모바일 Resume / Portfolio PDF는 추가하지 않습니다.
- Escape, focus trap, 배경 inert, body overflow 복구, 닫은 뒤 햄버거 초점 복귀를 보존합니다. Desktop 전환은 교체된 disclosure 대신 새 상위 링크에 초점을 돌려줍니다.
- 접힌 그룹은 hidden 상태입니다. 원본 `.invisible`의 강제 display 선언과 충돌하지 않도록 접힌 동안 해당 표시 클래스를 제외합니다. 새 important 선언은 없습니다.

## 검증 범위와 제한

- Header 단위 테스트 40개: 페이지별 초기 그룹·다시 열기·경로 변경·한 그룹씩 열기·목적지·접힌 링크의 접근성 제외·기존 초점/스크롤 회귀.
- E2E 14개 경로의 기본/About/Projects 상태, Home의 390×844·390×740·375×667·320×640 배치와 glyph bounds·터치 크기·왼쪽 정렬·들여쓰기·목적지를 검사합니다.
- 320×320 및 synthetic 200% text에서 두 그룹의 모든 표시 조작에 스크롤로 접근하고 Enter/Space, Back, 현재 링크 표시, Desktop 링크/자료 동작을 검사합니다.
- 기존 mobile-controls와 별도 모바일 가독성 검사도 아코디언 상태에 맞게 보존했습니다.
- 이전 작업에서 전체 check와 root 정적 페이지 검사가 통과했으나, 복구 후 통합 코드의 최종 검증은 통합 결과를 기준으로 합니다. 이번 복구에서 Header 40개를 다시 실행했습니다.
- 기존 Chromium socket 및 cloud mobile DevTools 제한은 우회하거나 반복하지 않았습니다. 브라우저 실행·새 스크린샷·실기기·Safari/Firefox·스크린리더·native 확대는 미검수입니다. Discovery는 브라우저 실행이 아닙니다.
