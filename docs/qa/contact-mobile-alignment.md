# Contact 모바일 Hero — Home 정렬 맞춤

기준 main: `70d3554bbb109805155c65412e69220c229c9eb8` (PR #6 이후). 대상: `fix/contact-mobile-home-alignment`. 이 문서는 Contact 첫 화면의 작은 스타일 변경과 집중 검수만 다룹니다.

## As-is → To-be

- 767px 이하 Contact Hero의 가운데 정렬 → Home과 같은 좌측 정렬
- 좌우 패딩 16px → 20px, 텍스트 읽기 폭은 Home과 같은 최대 380px
- 제목: 390px에서 31.98px / line-height 37.7364px → 34.32px / 37.752px. 320px에서는 32px / 35.2px
- 본문: 16px / line-height 26.4px → 실제 Home의 경력 요약과 같은 13px / 20.8px
- 사진·오버레이·원문·패널 세로 높이·하단 콘텐츠·소셜 링크·Coming Soon·구간 스냅 보존
- 768px 이상 Contact, Home, GNB, Awards의 스타일·마크업 변경 없음

위 To-be 수치는 아래 candidate의 Chromium computed-style 검사로 확인했습니다. Home의 사용하지 않는 17px summary 클래스는 기준으로 쓰지 않습니다.

## 재현할 검사

- `npm run check`: lint, 타입, 단위 검사, production build
- `npx playwright test tests/e2e/contact-mobile-alignment.spec.ts`: 320/390/430/767에서 실제 Home과 Contact의 좌측 시작점·텍스트 폭·폰트 크기·줄 높이·좌우 패딩을 비교. 문서/텍스트 넘침, 원본 사진, 링크, proximity snap도 확인하고 양쪽 PNG·JSON 저장
- 같은 파일의 768/1440 검사: 모바일에서 크기를 바꾼 뒤 원본 가운데 정렬·16px 패딩·350/500px 높이·48/56px 제목·16px 본문과 desktop snap 해제 확인
- 기존 모바일 가독성 검사에서 Contact가 요청된 Home 타입 규격을 사용하도록 기대값만 갱신. 기존 320px 합성 200% 글자 확대 검사는 그대로 유지하며, 새 집중 E2E에도 같은 helper를 사용해 Contact Hero의 확대·잘림 검사를 추가

## 캡처·실행 상태

- As-is: [main의 Mobile UI readability 실행](https://github.com/nana-park/breadme/actions/runs/37388746068), artifact `mobile-ui-evidence`의 `contact--w390--top.png`와 JSON. 실제 390×844 캡처와 측정값을 확인함
- To-be: [Foundation checks 실행](https://github.com/nana-park/breadme/actions/runs/37390867369), head `dc47f8feb7d73343b2c20ec807e648ec3add10e6`, PR merge ref `b22c96d5896be09b24a4ec5833220a342d0726d4`. [browser-verification artifact](https://github.com/nana-park/breadme/actions/runs/37390867369/artifacts/11381157130)의 Contact 집중 PNG·JSON을 확인함
- CI: 단위 97개, 기본 브라우저 90개(새 Contact 7개 포함) 통과. [Production paths](https://github.com/nana-park/breadme/actions/runs/37390867303)의 산출물 14개·브라우저 34개 통과. 별도 Mobile UI readability workflow는 이번 브랜치에서 skipped이며 통과로 세지 않음
- 직접 본 화면: 320/390/767px Contact, 390px Home 기준, 320px 합성 200% 글자 확대. 사진과 하단 카드 유지, 좌측 텍스트, 겹침/잘림 없이 콘텐츠 높이로 확대되는 것을 확인함
- 768×900, 1440×900: 앞선 main `70d3554`의 실제 baseline PNG와 candidate PNG를 RGB 픽셀로 대조. 두 크기 모두 변경 픽셀 0. 이 결과는 Contact 첫 viewport에 한정하며 전체 본문이나 모든 페이지로 확대하지 않음
- 로컬 검사: Node 24.19.0 / npm 11.9.0에서 `npm run check` 통과(lint·typecheck·단위 97개·production build). 새 Playwright 7개 case discovery 통과. 실제 브라우저 실행 성공을 뜻하지 않음
- 공개 상태: 작업 브랜치/PR 검수 범위. main 병합·배포는 별도 승인 대상

## 실제 Home / Contact 일치 값

| 화면 폭 | 텍스트 왼쪽 x | 텍스트 폭 | 제목 크기 / 줄 높이 | 본문 크기 / 줄 높이 | Hero 좌우 패딩 |
| --- | --- | --- | --- | --- | --- |
| 320 | 20 | 280 | 32 / 35.2 | 13 / 20.8 | 20 / 20 |
| 390 | 20 | 350 | 34.32 / 37.752 | 13 / 20.8 | 20 / 20 |
| 430 | 25 | 380 | 37.84 / 41.624 | 13 / 20.8 | 20 / 20 |
| 767 | 193.5 | 380 | 40 / 44 | 13 / 20.8 | 20 / 20 |

모든 값은 CSS px입니다. 두 페이지의 제목·본문은 모두 `text-align: left`이며, 작은 화면에서 실제 glyph와 문서 폭 넘침이 없었습니다. 380px 한도에 도달한 뒤에는 읽기 열 자체가 가운데 놓이는 Home 동작을 그대로 따릅니다.

실제 iOS/Android·Safari·native 200% zoom은 미검수입니다. 사진 배경 위 텍스트의 전체 대비 접근성 인증을 이번 작은 정렬 작업으로 선언하지 않습니다. 이후 이 QA 기록만 갱신한 커밋은 runtime diff가 없는지 구분하고 최신 PR 검사를 다시 확인합니다.
