# Version Hub

[← README](../README.md) · [변경 이력](CHANGELOG.md) · [개선 목록](../docs/backlog.md) · [검수 기준](../docs/qa/README.md)

## 확인한 코드·공개 상태

마지막 상태 확인: **2026-10-05 UTC**, 문서 기반 정리 시점. 이 표는 시점이 고정된 기록이며 이후 변경은 GitHub와 공개 revision을 다시 확인합니다.

| 구분 | 확인한 값·근거 |
| --- | --- |
| main | [`3738e4620bb495ecfcd7ef589c91c2049ce0153a`](https://github.com/nana-park/breadme/commit/3738e4620bb495ecfcd7ef589c91c2049ce0153a) |
| 최초 React 이관 | [PR #1](https://github.com/nana-park/breadme/pull/1), 2026-10-04 병합 `4607953` |
| 텍스트 중심 Home·모바일 스크롤 | [PR #2](https://github.com/nana-park/breadme/pull/2), 2026-10-04 병합 `4f026a3` |
| 모바일 UI·가독성 | [PR #3](https://github.com/nana-park/breadme/pull/3), 2026-10-05 병합 `b666b34` |
| Home 파트너 문구 공백 | [PR #4](https://github.com/nana-park/breadme/pull/4), 2026-10-05 병합 `3738e46` |
| 같은 main의 CI | [Foundation checks 성공](https://github.com/nana-park/breadme/actions/runs/37278044636) |
| 같은 main의 게시·게시 후 검사 | [Publish breadme 성공](https://github.com/nana-park/breadme/actions/runs/37278044595). 워크플로의 `verify-live`는 공개 revision과 경로를 검사함 |
| 공개 URL·정확한 revision | [breadme](https://nana-park.github.io/breadme/) · [deployment.json](https://nana-park.github.io/breadme/deployment.json) |

위 공개 상태는 GitHub API의 exact-SHA 워크플로 결과로 재확인했습니다. 이번 문서 작업에서 새 브라우저 시각 검수를 완료한 것은 아닙니다. 게시 후 검사의 성공을 모든 화면·실기기·전체 접근성 검사 통과로 확대하지 않습니다.

이전 README가 PR #3을 Draft로 표시한 것은 오래된 작업 상태였습니다. **PR #3의 병합 사실과 과거 strict desktop 검사의 미해결 차이는 서로 다른 정보**입니다. [당시 모바일/데스크톱 결과](../docs/qa/mobile-ui-review.md)를 그대로 보존합니다.

## 이번 변경의 상태

- 목적: 지속 개선용 제품·페이지/행동·디자인·아키텍처·운영·QA·backlog 문서 기반 정리
- 작업 브랜치: `docs/product-maintenance-foundation`
- 상태: 문서 검토용. 런타임·콘텐츠·의존성·배포 설정 변경 없음
- main 병합·추가 공개: 이번 작업에 포함하지 않음. 명시적인 별도 승인이 필요함
- 제품 결정: [backlog 결정 대기](../docs/backlog.md#제품-소유자가-결정할-것)에 제안으로 구분. 문서 추가가 해당 기능의 구현 승인은 아님

## 유지되는 제한

- Resume/Portfolio PDF 자동 전송·요청 백엔드는 없음. Korean UI는 Coming Soon
- Contact 본문의 일부 조작은 이관된 표시에 동작이 연결되지 않음. [행동 목록](../docs/product/routes-and-content.md)에서 Header·본문·Footer를 구분
- 실제 기기·Safari·Firefox·스크린리더·브라우저 자체 확대의 종합 검수는 완료로 선언하지 않음
- 원본 스타일 보존 계층과 초기 목표 구조의 공존, 과거 픽셀 차이·외부 임베드 오류는 [개선 목록](../docs/backlog.md)에서 추적

## 상태 갱신 규칙

실제 공개 후에는 이 허브에서 main SHA·배포 revision·검사 URL만 갱신하고, 사용자에게 보이는 변경은 [CHANGELOG](CHANGELOG.md)에 남깁니다. 날짜·커밋 없는 `현재 모두 통과` 표기를 사용하지 않습니다. 과거 QA 보고서는 고정된 증거입니다.

현재 배포는 `.github/workflows/deploy-pages.yml`의 main push로만 실행됩니다. `beta` 통합 브랜치는 이 확인 시점에 없으며, 문서에 적힌 목표 흐름과 실제 운영을 혼동하지 않습니다. 향후 브랜치/승인 정책을 바꾸려면 [저장소·브랜치 규칙](../docs/ground-rules/01-repository-and-branching.md)을 함께 검토합니다.

[버전 번호 규칙](VERSIONING.md) · [상세 릴리스 기록](releases/README.md). `package.json`의 `0.1.0`은 패키지 버전이며, GitHub Pages 게시 또는 GitHub Release/태그 존재와 같은 의미가 아닙니다.
