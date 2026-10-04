# Version Hub

## 현재 상태

- 현재 작업 버전: `v0.1.0` 준비 중 (출시되지 않음)
- 현재 구현 범위: 원본 디자인·콘텐츠의 React 이관, 핵심 11개 화면 + 연결된 상세 3개
- 원본 기준: `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`
- Articles: 영어 본문 18개·6쪽 목록·읽기와 복귀 구현
- 파일 준비: 원본 147개 + 외부 211개 SHA-256 검증, 첫 준비 약 302 MiB
- 로컬 검수: lint·typecheck·단위 테스트 68개·build 통과
- 전체 브라우저 검수: 48개 구성, 2801632 전체 통과. 마지막 커밋 결과는 [현재 이관 검수 기록](../docs/qa/original-migration-verification.md)에 기록
- 검토 링크: [Draft PR #1](https://github.com/nana-park/portfolio-react/pull/1)
- 다음 목표: 검토 결과를 바탕으로 beta 통합과 별도 공개 승인 검토
- 작업 브랜치: `feature/responsive-react-foundation`
- 기준 브랜치: `docs/collaboration-ground-rules` (`4b07328`)
- Draft PR 대상: `docs/collaboration-ground-rules` (기존 문서 이력 보존)
- 사용자 확인 상태: 원본 스타일 이관 방향에 따라 작업 중. 최종 공개 승인·별도 main 승인은 완료되지 않음
- main 반영 가능 여부: 불가. 전체 검수와 별도 main 승인 전
- 배포 상태: 미배포. 기존 HTML 사이트 유지

위 검수 수치는 2026-10-04 문서 갱신 시점의 상태입니다. 정확한 최신 커밋과 CI 결과는 [PR checks](https://github.com/nana-park/portfolio-react/pull/1/checks), 세부 확인 범위는 아래 검수 문서에서 확인합니다. 이전 Home 뼈대의 6개 단위·11개 브라우저 성공을 현재 전체 이관의 결과로 사용하지 않습니다.

## 아직 준비 중인 기능

- 자료 요청 백엔드와 이력서·포트폴리오 자동 메일 전송은 비활성 상태
- 원본의 Korean 버튼은 `Coming soon!` 안내 유지, 번역 완료 아님
- 실제 기기·다른 브라우저·스크린리더·브라우저 자체 줌의 종합 검수 미완료
- beta/main 병합과 공개 배포는 별도 절차

## 문서

- [현재 구현과 실행 방법](../README.md)
- [원본 이관 페이지 구성](../src/pages/original/README.md)
- [현재 반응형 전략](../docs/responsive-strategy.md)
- [현재 이관 검수 기록](../docs/qa/original-migration-verification.md)
- [원본 디자인 비교](../design-qa.md)
- [초기 설계 검토: 역사 기록](../docs/design-review.md)
- [초기 구조 검수: 역사 기록](../docs/qa/foundation-verification.md)
- [버전 규칙](VERSIONING.md)
- [전체 변경 이력](CHANGELOG.md)
- [상세 릴리스 기록](releases/README.md)

`beta`는 작업 시작 시 없었습니다. 현재 Draft PR은 검토 단위를 만들기 위한 것이며 `feature → beta → 별도 승인 → main` 원칙이나 공개 승인을 대신하지 않습니다.

PR 자동 양식은 [`.github/pull_request_template.md`](../.github/pull_request_template.md)에 있습니다. 공식 공개 기록은 GitHub Releases에서 관리합니다.
