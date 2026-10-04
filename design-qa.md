# 원본 포트폴리오 시각 비교

final result: blocked

## 비교 기준과 증거

- 원본: `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`
- 원본 화면: [Original portfolio evidence](https://github.com/nana-park/portfolio-react/actions/workflows/source-reference.yml)의 source-evidence-390/1440. 내부 경로 `{width}/{route}-top.png`, `{width}/{route}-full.png`
- 현재 전체 비교: [d31179b 검수 실행](https://github.com/nana-park/portfolio-react/actions/runs/37199826863)의 route-mobile-evidence, route-desktop-evidence. 각 `routes-route-smoke-*` 폴더의 evidence.json으로 경로를 확인하고 page-top.png/page-full.png 대조
- 상태: 각 경로의 기본 화면, 전체 스크롤 후 최상단 복귀. 같은 CSS viewport 390×844, 1440×900, deviceScaleFactor 1. 밀도 변환 없이 실제 픽셀 나란히 비교
- Home 추가 너비: 320, 767, 768, 1024, 1025px. Articles와 메뉴·자료창의 상태 캡처는 browser-verification에 포함

## 확인한 다섯 표면

1. 글꼴·타이포: 원본 로컬 글꼴 사용. Home desktop h1 Pretendard 51.84px/600과 x445.421875/y165.5 일치. 각 경로의 큰 제목과 작은 메뉴 문구를 확대 대조
2. 간격·배치: Home 전체 높이 390×4997, 1440×4319 일치. Hero 아래 픽셀 차이 0. 프로젝트 상세 3개의 모바일·desktop 전체 높이도 각각 일치
3. 색: 원본 white/black/orange와 각 페이지 팔레트 대조. Awards 배경 우선순위 오류를 발견해 수정 중인 항목으로 분리
4. 이미지: 원본 사진·SVG·동영상·Spline 사용, 임의 대체 없음. Spline 회전과 About 영상은 촬영 프레임 차이를 픽셀 오류로 세지 않음
5. 문구: 실제 원문 유지. 초기 구조 설명용 카드 제거. 원본의 미완성 기능·문구 오류를 임의로 완성하거나 새 경력 수치를 만들지 않음

## 발견 → 수정 → 재확인 이력

- [P1, 해결] 초기 구조 미리보기가 원본 디자인과 달랐음 → 실제 JSX/CSS/글꼴/미디어 이관. Home 원본/React 전체·Hero 확대 비교로 확인
- [P2, 해결] CSS utility 순서 차이 → 원본처럼 작성 CSS 뒤에 적용. Home 원본 비교로 재확인
- [P2, 해결] Home 390px 메일 버튼이 CTA를 가림, 햄버거 선이 위쪽으로 치우침 → 모바일 위치·세로 정렬 보정. f9dbd2f/d31179b 캡처와 브라우저 조작 검사로 확인. 초기 애니메이션 중의 측정도 후속 회귀 검사 추가
- [P2, 재확인 대기] 원본 Enjoy 390px 필터가 전체 문서를 460px로 넓힘 → 필터 줄 자체의 가로 스크롤·44px 조작 영역으로 보정
- [P1, 재확인 대기] Awards inline !important를 일반 스타일 규칙으로 옮겨 검정 배경이 이김 → 실제 inline important 우선순위로 보존. 원본 크림색 RGB(243,241,235) 브라우저 단언 추가
- [P2, 재확인 대기] 상세 3개에 원본에 없는 떠 있는 자료 UI 추가 → 원본대로 제거하고 Header는 Coming soon 안내. 원본의 route별 nav 활성·force-scrolled 상태도 복원

## 전체·확대 비교 방법

원본과 React의 동일 route, width, state 이미지를 같은 입력에 왼쪽/오른쪽으로 배치했습니다. 전체 높이·섹션과 텍스트/메뉴/표/제품 데모 확대 구간을 따로 확인했습니다. 원본 Enjoy의 460px 캡처는 원본의 실제 넘침이며 수정본의 390px 결과와 차이를 숨기거나 임의 확대하지 않습니다.

## 브라우저 검사와 남은 한계

현재 d31179b는 48개 중 47개 통과했고, 남은 하나는 알려진 Enjoy 모바일 넘침입니다. 수정된 최종 커밋과 재캡처를 확인하기 전에는 전체 완료로 표시하지 않습니다.

실제 iOS/Android, Safari/Firefox, 스크린리더 종합 검수, 브라우저 자체 줌, 저사양 실기기 성능은 별도 미검수입니다. 메일 백엔드와 Korean UI는 준비 중 상태입니다. 공개·병합·배포는 하지 않았습니다.
