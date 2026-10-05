# breadme

Nahyun Park의 AI Product Manager 포트폴리오입니다. 기존 [Portfolio](https://github.com/nana-park/Portfolio)의 콘텐츠와 디자인을 React로 이관한 뒤, 화면·콘텐츠·운영을 작은 단위로 개선합니다. 기존 저장소와 공개 사이트는 별도로 유지합니다.

[공개 사이트](https://nana-park.github.io/breadme/) · [현재 상태와 배포 근거](versions/README.md) · [다음 개선 순서](docs/backlog.md)

## 처음 받은 사람을 위한 문서 지도

| 궁금한 것 | 먼저 읽을 문서 |
| --- | --- |
| 누구에게 어떤 가치를 주는가? 무엇이 아직 가설인가? | [제품 목적·사용자·핵심 여정](docs/product/overview.md) |
| 어떤 페이지와 행동이 있고 어디를 고치는가? | [사이트 구조(IA) 및 페이지 명세](docs/product/routes-and-content.md) |
| 글자·간격·컴포넌트·반응형의 실제 기준은? | [디자인 시스템 안내](docs/design-system/README.md) |
| 코드와 데이터가 어떻게 연결되는가? | [현재 아키텍처](docs/engineering/architecture.md) |
| 실행·검사·배포·장애 복구는 어떻게 하는가? | [운영 안내](docs/engineering/runbook.md) |
| 모바일과 데스크톱에서 어디까지 검수해야 하는가? | [QA 기준과 증거 읽는 법](docs/qa/README.md) |
| 어떤 문제부터 해결하며 완료는 어떻게 판단하는가? | [우선순위·완료 조건·결정 대기](docs/backlog.md) |
| 변경 뒤 어느 문서까지 갱신하는가? | [문서 관리·작업 체크리스트](docs/maintenance.md) |

새 작업은 **제품/행동 확인 → 관련 소스·기존 규칙 확인 → 작은 변경 → 범위에 맞는 검수 → 같은 PR에서 문서 갱신** 순서로 진행합니다. 문서의 `현재 구현`, `개선 제안`, `역사 기록`을 구분하며, 제안을 구현 완료로 읽지 않습니다.

## 현재 제공 범위

- 핵심 11개 화면과 프로젝트 상세 3개, 영어 Articles 18개
- Home → Projects → 상세 사례 → Contact로 탐색하는 정적 포트폴리오
- 경력·인증 탭, 프로젝트 펼침, 갤러리·강의 캐러셀, 글 읽기/복귀, 프로젝트 내부 시연 UI
- 모바일 메뉴, 767px 이하 큰 구간의 proximity 스크롤 스냅, 줄바꿈·조작 영역 보정
- 이력서/Portfolio PDF 전송과 Korean UI는 Coming Soon. 전송 백엔드가 없으며, 모든 Contact 본문 버튼이 실제 동작하는 것은 아닙니다. [행동별 상태](docs/product/routes-and-content.md)를 기준으로 확인합니다.

2026-10-05 확인 기준 PR #1–#4는 병합됐습니다. 정확한 main·배포 커밋과 검사 링크는 [버전 허브](versions/README.md)에만 모읍니다. 과거 화면 비교의 실패·미검수는 병합 이력과 별개로 보존합니다. 이번 문서 정리는 화면 변경·병합·배포를 포함하지 않습니다.

## 로컬 시작

[`.nvmrc`](.nvmrc)와 [package.json](package.json)의 Node 조건을 사용합니다. 현재 요구 범위는 Node 24.15.0 이상, 25 미만입니다.

```bash
npm ci --no-audit --no-fund
npm run dev
```

터미널에 표시되는 주소를 열고 `Ctrl+C`로 종료합니다. `dev`와 `build` 전에는 고정된 원본·외부 자산 약 302 MiB를 처음 한 번 준비하고 SHA-256으로 검증합니다. 네트워크가 필요한 단계와 안전한 복구 방법은 [운영 안내](docs/engineering/runbook.md)에 있습니다. `--no-audit`는 자동 audit 전송을 생략할 뿐 보안 검사 통과를 뜻하지 않습니다.

```bash
npm run check                           # lint → typecheck → 단위 검사 → build
npm run test:e2e                         # build 이후 Chromium 검수
VITE_BASE_PATH=/breadme/ npm run build
VITE_BASE_PATH=/breadme/ npm run test:pages  # 이미 만든 dist 검사, 빌드하지 않음
npx playwright test --config=playwright.pages.config.ts
```

브라우저 최초 설치, Windows 환경변수 문법, 개별 검사의 전제조건은 [운영 안내](docs/engineering/runbook.md)를 따릅니다. 테스트 개수나 이전 성공을 현재 전체 품질 보증으로 사용하지 않습니다.

## 유지할 기준

- 실제 라우트의 단일 원본: [`src/config/originalRoutes.ts`](src/config/originalRoutes.ts)
- 원본 기준: `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`
- 최신 정책: [Ground Rules](docs/ground-rules/README.md). 원본 이관 계층과 새 코드 목표 구조를 구분합니다.
- 화면 변경 근거: [기존 모바일 As-is/To-be 보고서](docs/qa/mobile-ui-review.md), [데스크톱 비교](docs/qa/mobile-ui-desktop-evidence.md)
- `main` 병합은 별도 명시적 승인 대상입니다. 작업 PR을 만들었다고 공개하지 않습니다. 현재 배포는 main 변경 시 실행되므로 문서만 병합해도 배포가 시작될 수 있습니다.
