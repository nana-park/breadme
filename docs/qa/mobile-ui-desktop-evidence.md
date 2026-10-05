# 웹 픽셀 비교 전체 기록

> 역사 기록: 아래 기준 커밋·후보 화면·실패 수치는 PR #3 작성 당시의 증거입니다. PR #3은 2026-10-05 병합됐지만 이 보고서의 실패/미검수를 소급해 통과로 바꾸지 않습니다. 현재 상태는 [버전 허브](../../versions/README.md), 다음 검수 기준은 [QA 안내](README.md)를 확인합니다.

[← As-is / To-be 검토](mobile-ui-review.md)

기준 main `4f026a3dd816c11bb1a4718379e2ba9d6f7527af`, 후보 `93af4a5feb6a9168bd9dba1037ab82ae50ddf9e6`.
[CI 37270059784](https://github.com/nana-park/breadme/actions/runs/37270059784)의 comparison-summary.json에서 아래56개 수치만 옮겼습니다. 검사별 원문 로그는 CI artifact에 있습니다. 비밀정보·전체 브라우저 로그는 저장소에 복사하지 않습니다.

**53/56 PNG 일치. 엄격한 전체 게이트는 실패했습니다.** 같은 크기의 PNG를 RGBA 채널별로 비교하며 차이가 있는 픽셀을 셉니다. 픽셀 0인 그림은 SHA-256도 동일합니다. 이 표는 추가 Inter 굵기의 로드 이력 등의 별도 assertion 판정까지 대체하지 않습니다.

동적 미디어 픽셀은 양쪽에서 동일하게 제외하고 해당 영역의 기하 정보를 검사합니다. 첫 화면과 Footer viewport만 비교하며 긴 페이지 전체·모든 상호작용·실제 영상 프레임의 동일성 주장은 하지 않습니다.

| 경로 | 폭 | 상태 | 변경 픽셀 | PNG 크기 일치 | SHA-256 일치 |
| --- | ---: | --- | ---: | --- | --- |
| about | 768 | footer | 0 | 예 | 예 |
| about | 768 | top | 0 | 예 | 예 |
| ai-mentoring-agent-detail | 768 | footer | 0 | 예 | 예 |
| ai-mentoring-agent-detail | 768 | top | 5 | 예 | 아니요 |
| articles | 768 | footer | 0 | 예 | 예 |
| articles | 768 | top | 0 | 예 | 예 |
| awards | 768 | footer | 0 | 예 | 예 |
| awards | 768 | top | 0 | 예 | 예 |
| career | 768 | footer | 0 | 예 | 예 |
| career | 768 | top | 0 | 예 | 예 |
| contact | 768 | footer | 0 | 예 | 예 |
| contact | 768 | top | 0 | 예 | 예 |
| enjoy | 768 | footer | 0 | 예 | 예 |
| enjoy | 768 | top | 0 | 예 | 예 |
| home | 768 | footer | 0 | 예 | 예 |
| home | 768 | top | 0 | 예 | 예 |
| hopzie-oneclickbuilder | 768 | footer | 0 | 예 | 예 |
| hopzie-oneclickbuilder | 768 | top | 0 | 예 | 예 |
| lectures | 768 | footer | 0 | 예 | 예 |
| lectures | 768 | top | 0 | 예 | 예 |
| llm-based-voice-ivr | 768 | footer | 0 | 예 | 예 |
| llm-based-voice-ivr | 768 | top | 0 | 예 | 예 |
| projects | 768 | footer | 0 | 예 | 예 |
| projects | 768 | top | 0 | 예 | 예 |
| qualified | 768 | footer | 0 | 예 | 예 |
| qualified | 768 | top | 0 | 예 | 예 |
| research | 768 | footer | 0 | 예 | 예 |
| research | 768 | top | 0 | 예 | 예 |
| about | 1440 | footer | 0 | 예 | 예 |
| about | 1440 | top | 0 | 예 | 예 |
| ai-mentoring-agent-detail | 1440 | footer | 2115 | 예 | 아니요 |
| ai-mentoring-agent-detail | 1440 | top | 0 | 예 | 예 |
| articles | 1440 | footer | 0 | 예 | 예 |
| articles | 1440 | top | 0 | 예 | 예 |
| awards | 1440 | footer | 0 | 예 | 예 |
| awards | 1440 | top | 0 | 예 | 예 |
| career | 1440 | footer | 0 | 예 | 예 |
| career | 1440 | top | 0 | 예 | 예 |
| contact | 1440 | footer | 0 | 예 | 예 |
| contact | 1440 | top | 0 | 예 | 예 |
| enjoy | 1440 | footer | 0 | 예 | 예 |
| enjoy | 1440 | top | 2 | 예 | 아니요 |
| home | 1440 | footer | 0 | 예 | 예 |
| home | 1440 | top | 0 | 예 | 예 |
| hopzie-oneclickbuilder | 1440 | footer | 0 | 예 | 예 |
| hopzie-oneclickbuilder | 1440 | top | 0 | 예 | 예 |
| lectures | 1440 | footer | 0 | 예 | 예 |
| lectures | 1440 | top | 0 | 예 | 예 |
| llm-based-voice-ivr | 1440 | footer | 0 | 예 | 예 |
| llm-based-voice-ivr | 1440 | top | 0 | 예 | 예 |
| projects | 1440 | footer | 0 | 예 | 예 |
| projects | 1440 | top | 0 | 예 | 예 |
| qualified | 1440 | footer | 0 | 예 | 예 |
| qualified | 1440 | top | 0 | 예 | 예 |
| research | 1440 | footer | 0 | 예 | 예 |
| research | 1440 | top | 0 | 예 | 예 |

## 차이 해석

- Enjoy1440 첫 화면: 최초2픽셀 차이, 새 후보 캡처가 두 기준 캡처와 일치해 동일 빌드의 변동을 확인했습니다.
- AI Mentoring1440 Footer viewport: 최초2115픽셀 차이는 Footer 위 파트너명 텍스트 영역입니다. 새 main 캡처가 두 후보 캡처와 일치해 기준 빌드 자체의 변동을 확인했습니다.
- AI Mentoring768 첫 화면:5픽셀 차이 중3개는 이번 새 main 캡처에서도 재현됐으나, 이번 실행 안에서 후보와 완전히 동일한 main PNG는 얻지 못했습니다. 엄격한 동일성 판정은 남깁니다.
- Home768·Lectures1440은 PNG가 동일하지만 추가 Inter 굵기의 로드 이력 assertion이 달라 사례가 실패했습니다. 글꼴 준비·오류와 렌더링 픽셀 검사는 유지하고 캐시 목록은 진단 정보로 남기는 후속 검사를 준비했습니다.

앱 소스는 구현44027e9 이후 바뀌지 않았으며 픽셀 허용치를 올리지 않았습니다.

## 후속 진단 실행 `ac0644`

[CI 37272095126](https://github.com/nana-park/breadme/actions/runs/37272095126)에서 폰트 로드 목록은 진단 정보로 남기고, 실제 글꼴 준비·오류·기하·픽셀 검사를 그대로 유지했습니다. 결과는 **25/28 사례, 53/56 PNG 일치**입니다. 나머지 차이는 아래와 같습니다.

| 경로 | 폭 | 상태 | 변경 픽셀 |
| --- | ---: | --- | ---: |
| Hopzie | 768 | 첫 화면 | 5 |
| AI Mentoring | 768 | 첫 화면 | 2 |
| Hopzie | 1440 | 첫 화면 | 13 |

이 후속 실행도 엄격한 전체 통과가 아닙니다. 앱 소스를 바꾸거나 픽셀 허용치를 높이지 않았습니다. 위 56개 전체 표와 갤러리 대표 이미지는 원래 명시한 `93af4a5` 실행 기록이며 후속 결과로 바꿔 표시하지 않습니다.
