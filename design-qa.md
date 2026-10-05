# 원본 포트폴리오 시각 비교

> 역사 기록: 최초 원본 이관 당시의 화면 비교입니다. 아래 통과 표시는 해당 커밋·검사 범위에만 적용됩니다. 이후 Home·모바일 변경과 현재 품질 상태는 [QA 안내](docs/qa/README.md)와 [버전 허브](versions/README.md)를 확인합니다.

final result: passed

## 비교 기준과 증거

- 원본: `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`
- 원본 화면: [Original portfolio evidence](https://github.com/nana-park/breadme/actions/workflows/source-reference.yml)의 source-evidence-390/1440. 내부 경로 `{width}/{route}-top.png`, `{width}/{route}-full.png`
- 1차 전체 비교: [d31179b 검수 실행](https://github.com/nana-park/breadme/actions/runs/37199826863)의 route-mobile-evidence, route-desktop-evidence. 각 `routes-route-smoke-*` 폴더의 evidence.json으로 경로를 확인하고 page-top.png/page-full.png 대조
- 상태: 각 경로의 기본 화면, 전체 스크롤 후 최상단 복귀. 같은 CSS viewport 390×844, 1440×900, deviceScaleFactor 1. 밀도 변환 없이 실제 픽셀 나란히 비교
- Home 추가 너비: 320, 767, 768, 1024, 1025px. Articles와 메뉴·자료창의 상태 캡처는 browser-verification에 포함

- 수정 후 증거: [2801632 전체 검수](https://github.com/nana-park/breadme/actions/runs/37200832738)의 전체 경로 캡처, [bb248b6 마지막 Enjoy 검수](https://github.com/nana-park/breadme/actions/runs/37201520985)의 home-checkpoint/enjoy 캡처
- 원본 핵심 11개 캡처 실행: `37194577666`, 상세 3개 캡처 실행: `37198862977`

## 확인한 다섯 표면

1. 글꼴·타이포: 원본 로컬 글꼴 사용. Home desktop h1 Pretendard 51.84px/600과 x445.421875/y165.5 일치. 각 경로의 큰 제목과 작은 메뉴 문구를 확대 대조
2. 간격·배치: Home 전체 높이 390×4997, 1440×4319 일치. Hero 아래 픽셀 차이 0. 프로젝트 상세 3개의 모바일·desktop 전체 높이도 각각 일치
3. 색: 원본 white/black/orange와 각 페이지 팔레트 대조. Awards 배경 우선순위 오류를 발견해 원본 크림색으로 복원하고 재캡처로 확인
4. 이미지: 원본 사진·SVG·동영상·Spline 사용, 임의 대체 없음. Spline 회전과 About 영상은 촬영 프레임 차이를 픽셀 오류로 세지 않음
5. 문구: 실제 원문 유지. 초기 구조 설명용 카드 제거. 원본의 미완성 기능·문구 오류를 임의로 완성하거나 새 경력 수치를 만들지 않음

## 발견 → 수정 → 재확인 이력

- [P1, 해결] 초기 구조 미리보기가 원본 디자인과 달랐음 → 실제 JSX/CSS/글꼴/미디어 이관. Home 원본/React 전체·Hero 확대 비교로 확인
- [P2, 해결] CSS utility 순서 차이 → 원본처럼 작성 CSS 뒤에 적용. Home 원본 비교로 재확인
- [P2, 해결] Home 390px 메일 버튼이 CTA를 가림, 햄버거 선이 위쪽으로 치우침 → 모바일 위치·세로 정렬 보정. f9dbd2f/d31179b 캡처와 브라우저 조작 검사로 확인. 초기 애니메이션 중의 측정도 후속 회귀 검사 추가
- [P2, 해결] 원본 Enjoy 390px 필터가 전체 문서를 460px로 넓힘 → 필터 줄 자체의 가로 스크롤·44px 조작 영역으로 보정. 후속 확대에서 긴 라벨 겹침을 발견해 각 버튼을 내용 너비로 유지. bb248b6 캡처에서 겹침 해소와 390px 문서 폭 확인
- [P1, 해결] Awards inline !important를 일반 스타일 규칙으로 옮겨 검정 배경이 이김 → 실제 inline important 우선순위로 보존. 원본 크림색 RGB(243,241,235) 브라우저 단언과 390/1440px 수정 캡처로 복원 확인
- [P2, 해결] 상세 3개에 원본에 없는 떠 있는 자료 UI 추가 → 원본대로 제거하고 Header는 Coming soon 안내. 원본의 route별 nav 활성·force-scrolled 상태도 복원. 2801632 캡처에서 확인

## 전체·확대 비교 방법

원본과 React의 동일 route, width, state 이미지를 같은 입력에 왼쪽/오른쪽으로 배치했습니다. 전체 높이·섹션과 텍스트/메뉴/표/제품 데모 확대 구간을 따로 확인했습니다. 원본 Enjoy의 460px 캡처는 원본의 실제 넘침이며 수정본의 390px 결과와 차이를 숨기거나 임의 확대하지 않습니다.

## 브라우저 검사와 남은 한계

2801632의 단위 68개·브라우저 48개가 모두 통과했습니다. bb248b6에서 마지막 Enjoy 라벨 보정과 글자 내부 폭 검사를 추가했고, 해당 화면 재캡처·집중 검사가 통과했습니다. 마지막 커밋의 전체 회귀 결과는 [PR checks](https://github.com/nana-park/breadme/pull/1/checks)에 연결됩니다.

이 보고서의 원본 이관 범위에는 남은 P0/P1/P2 시각 차단점이 없습니다. Awards 카드의 미세한 래스터 경계 차이는 문구·색·크기·배치 변형이 없어 비차단으로 분류했습니다. 원본에도 있던 일부 모바일 제목 말줄임과 떠 있는 메일 버튼의 본문 겹침까지 모두 재설계한 것은 아닙니다.

Spline 배지는 무료 플랜의 원본 상태로 유지합니다. 사용자가 현재 이관을 마무리하기로 했으며, 배지 제거·새로운 3D 제작은 수행하지 않았습니다.

실제 iOS/Android, Safari/Firefox, 스크린리더 종합 검수, 브라우저 자체 줌, 저사양 실기기 성능은 별도 미검수입니다. 메일 백엔드와 Korean UI는 준비 중 상태입니다. 공개·병합·배포는 하지 않았습니다.
