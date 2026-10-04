# Changelog

모든 중요한 변경사항을 최신 작업부터 기록합니다. 아직 공개 릴리스는 없습니다.

## [Unreleased]

### 원본 충실 이관 — 2026-10-04

원본 기준: `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`. 사용자의 원본 스타일 보존 요청에 따라 초기 구조 미리보기를 실제 포트폴리오 화면으로 교체했습니다.

#### 영향을 받은 페이지

- Home / About / Career / Qualified / Enjoy / Projects / Research / Articles / Lectures / Awards / Contact
- Voice IVR / Hopzie / AI Mentoring 상세
- 총 14개 페이지 단위. `/`와 `/index.html`은 같은 Home이며 Enjoy 메뉴 숨김은 원본대로 유지

#### Added

- [All Pages][Desktop][Mobile][EN] 원본 레이아웃·문구·글꼴·색·간격·SVG·사진·영상의 실제 React JSX 이관
- [Projects][EN] 연결된 상세 3개, 목록 펼침·상세 탭·멘토링 제품 데모
- [Articles][EN] 본문 18개·6쪽 목록·해시 직접 진입·읽기·뒤로·앞으로 이동
- [Career][Qualified][Enjoy][Lectures] 원본 경력 전환·인증 탭·갤러리·강의 캐러셀 동작
- [Home] 원본 Spline 장면과 표시 배지 유지
- [Assets] 원본 147개·외부 211개를 길이와 SHA-256으로 검증하는 재현 가능한 로컬 캐시, 처음 준비 약 302 MiB
- [Assets] 원본 글꼴 라이선스와 고정된 아바타 5개 바이트 복원, 해시 검증 유지
- [QA] 통합 단위 검사 68개, 전체 경로·본문·모바일 조작 등을 확인하는 브라우저 검사 48개 구성

#### Changed

- [All Pages] Home 안내용 3개 앵커 화면에서 원본 `.html` 경로·본문·연락 경로로 전환
- [Styles] 원본 작성 CSS·페이지 CSS·Tailwind utility의 적용 순서를 보존하고 필요한 모바일·접근성 보정만 마지막에 적용
- [Header] 원본 70px 높이·1024px 경계 유지. 모바일 오버레이 메뉴의 초점·스크롤·배경 상태 복원
- [Content][EN] 원본 영어 UI와 본문 유지. Korean 버튼은 원본의 `Coming soon!` 상태 유지
- [Materials] 자료 요청 UI를 유지하되 입력·전송은 비활성화. 백엔드·자동 메일·가짜 성공 처리를 추가하지 않음
- [Docs] 반응형 전략·버전 현황·실제 공통 컴포넌트 적용표를 현재 이관 범위로 갱신. 초기 설계·검수 기록은 역사 자료로 보존

#### Fixed

- [Home][Mobile] 3D의 과도한 잘림과 자료 UI의 Hero·CTA 가림 보정
- [Header][Mobile] 반복 열기·Escape·Tab 순환과 1023↔1024px 전환 시 보이는 대응 조작 영역으로 초점 복원
- [Header][Desktop] 하위 메뉴의 키보드 접근과 Escape 후 상위 항목 복귀
- [Materials] 메뉴와 자료 패널의 겹침·초점 처리, 비모달 닫기 동작

#### 검수와 공개 상태

- 로컬 lint·typecheck·단위 테스트 68개·build 통과
- 통합 브라우저 검사 48개는 문서 갱신 시점에 진행 중. 최종 결과는 [이관 검수 기록](../docs/qa/original-migration-verification.md)과 정확한 커밋의 PR checks에서 확인
- 원본 대조와 실제 기기·보조 기술 확인 범위를 구분. 초기 구조 검수 성공을 전체 이관 성공으로 확대하지 않음
- Draft PR 검토 중이며 beta/main 병합·배포·최종 공개 승인은 별도

### 이전 단계: 기본 구조 — 2026-10-04 (역사 기록)

아래는 원본 충실 이관 전에 완료한 작업입니다. 당시의 미구현 표시, 한국어 미리보기, 메뉴 경계와 검사 수치는 **그 시점에만 적용**되며 현재 범위는 위의 원본 이관 항목을 따릅니다.

#### 영향을 받은 페이지

- Home (구조 미리보기)
- About / Projects / Research / Articles / Lectures / Awards / Contact는 아직 미구현

#### Added — 2026-10-04

- [Home][All Viewports][KO] Vite + React + TypeScript 기반과 실행·검사 명령
- [Home][Mobile][Tablet][Desktop][KO] 동일 콘텐츠의 반응형 기본 구조와 공통 컴포넌트
- [Home][All Viewports][KO] 본문 바로가기, 키보드 메뉴와 실제 앵커 이동
- [Home][All Viewports][EN] 기존 breadme 브랜드와 영어 Hero 원문 연결 (영어 UI 전체 지원 아님)
- [Home][All Viewports][KO] 이관 전 상태와 기존 포트폴리오 링크를 명확히 표시
- [Home][All Viewports] 컴포넌트 테스트 6개, 7개 폭을 포함한 브라우저·접근성·터치 검사 11개와 PR CI 구성
- [Docs] 반응형 HR 탐색 전략, 설계 검토, 쉬운 README와 검수 기록

#### Fixed

- [Home][Mobile] 320px에서 앵커 새로고침·직접 진입 위치 복원
- [Home][Mobile][Tablet] 767↔768px 메뉴 전환 시 키보드 포커스 보존
- [Home][KO][All Viewports] 한국어 단어 중간 줄바꿈 완화

#### Changed

- 문서의 `src/data` / `src/content` 충돌을 `src/content`로 통일
- TypeScript 구현에 맞춰 기본 구조 예시와 공식 명칭 원본 경로 정리
- Home 공통 컴포넌트 적용표와 버전 현황 갱신

#### 이전에 추가됨

- 저장소 및 협업 Ground Rules
- 버전관리 허브와 공통 컴포넌트 적용표

## [0.1.0] - 예정

### 현재 목표

- 원본 디자인과 콘텐츠를 보존한 React 이관 및 실행 기반
- 14개 경로·핵심 조작·반응형·원본 대조 검수와 확인 범위 정리

초기 목표였던 Home 기본 구조에서 사용자 요청에 따라 전체 원본 이관으로 범위를 확장했습니다. 버전 번호는 아직 출시된 버전이 아니며 전체 검수, beta 통합, 별도 main 승인과 배포는 완료되지 않았습니다. 자료 전송 백엔드와 새 번역은 이 릴리스에 구현된 것으로 표시하지 않습니다.
