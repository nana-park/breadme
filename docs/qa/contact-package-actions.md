# Contact 패키지 직접 조작 검수

검사일: 2026-10-06. 기준: `7674290`에서 분리한 Contact 수정 브랜치. 이 기록은 로컬 소스 검사 결과이며 main 공개나 브라우저 검수 완료를 뜻하지 않습니다.

## 수정 범위

- Resume / Portfolio PDF: placeholder 링크 대신 native 버튼. 기존 Application Materials 비모달 패널을 열며 준비 중 파일·disabled 폼은 유지합니다.
- 패널을 반복 실행해도 닫히지 않고 닫기 버튼에 초점 진입. 닫기·Escape 뒤 실제 Contact 진입 버튼으로 복귀합니다.
- Copy URL: 공개 홈 `https://nana-park.github.io/breadme/`만 복사. 현재 Contact 경로·query·hash를 포함하지 않습니다.
- Clipboard API write 완료 뒤 정확히 `포트폴리오 웹사이트 URL이 복사되었습니다` native alert. 진행 중 재클릭은 중복 write/alert를 만들지 않습니다.
- 거부·미지원은 성공으로 표시하지 않고 별도 실패 alert, 접근 가능한 상태 문구와 직접 선택 가능한 읽기 전용 URL을 제공합니다. 이후 재시도 가능합니다.
- 원본 버튼 외형·아이콘·flex wrap을 유지하며 모바일 버튼 높이를 44px 이상으로 보정합니다. Contact Hero 정렬·모바일 Domain 숨김·기존 자료 폼은 유지합니다.

## 실제 실행

- `npm run check`: 통과. lint, typecheck, Vitest 11 files / 102 tests, production build.
- 집중 테스트 3 files / 33 tests: Contact package, 기존 Header/materials focus, App 회귀 통과.
- Contact 단위 검사는 390/1440px 환경 값, Enter/Space, 반복 열기·닫기·Escape, 본문 focus return, hash 보존, 요청 미전송을 확인합니다.
- Clipboard 단위 검사는 고정 홈 주소, 대기 promise 완료 이전 무알림, 진행 중 중복 방지, 반복 성공·정확한 alert 문구, 거부/미지원 실패 및 직접 선택, 실패 뒤 성공 재시도를 확인합니다.
- `playwright test tests/e2e/contact-package-actions.spec.ts --list`: 8 cases 수집 확인. 브라우저 실행 결과가 아닙니다.
- `git diff --check`: 통과.

## 브라우저 검증 대기

로컬 브라우저 실행은 현재 환경 제한 때문에 이번 작업에서 재시도하지 않았습니다. 새 Playwright 검사는 320/390/768/1440px 실제 버튼 영역·가로 넘침·키보드·패널 닫기 초점, 실제 Clipboard API readback와 native dialog 종류/문구/확인 뒤 재실행, 지연 write, 거부·미지원 및 수동 복사를 다룹니다. 기존 CI의 `npm run test:e2e`가 새 spec도 실행합니다. **최종 통합 SHA의 CI 결과를 확인하기 전 이 8개 브라우저 시나리오나 시각 검수를 통과로 표시하지 않습니다.**

실제 휴대폰, Safari, Firefox, 스크린리더 및 브라우저 자체 확대는 미검수입니다. 원본 변환기의 새 컴포넌트 보존 경로는 코드에 반영했지만 고정 HTML 원본 재변환은 실행하지 않았습니다.
