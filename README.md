# Portfolio React

기존 [Portfolio](https://github.com/nana-park/Portfolio)의 디자인과 내용을 React로 옮기는 프로젝트입니다. **원본 디자인을 기준으로 합니다.** 처음 만들었던 구조 설명용 화면은 실제 포트폴리오 화면으로 교체했습니다.

- [검토 중인 Draft PR #1](https://github.com/nana-park/portfolio-react/pull/1)
- [기존 공개 포트폴리오](https://nana-park.github.io/Portfolio/)
- 원본 기준 커밋: `834815915647e4b3fbf9285b88b8001e37b94aa0`
- 병합·배포 전 작업입니다. 기존 공개 사이트는 그대로 유지합니다.

## 지금 된 것

- 원본 글꼴·색·간격·SVG·사진·영상·3D를 유지한 React JSX 화면
- Home / About / Career / Qualified / Enjoy / Projects / Research / Articles / Lectures / Awards / Contact 11개 화면
- 실제로 연결된 프로젝트 상세 3개: Voice IVR / Hopzie / AI Mentoring
- Articles 18개 영어 본문 전체, 6쪽 목록, 읽기·뒤로 이동
- 원본 Header / Footer, 모바일 메뉴, 경력 전환·인증 탭·갤러리·강의 캐러셀·프로젝트 펼침·상세 탭
- 원본 Spline 장면과 표시 배지. 스크린샷마다 회전 각도는 달라질 수 있습니다.
- 기본 실행·코드·타입·단위·브라우저 검사와 원본 비교 캡처

전체 HTML을 iframe에 넣거나 문자열 HTML로 보여주는 방식이 아닙니다. 화면은 실제 React 요소이고, 동작은 React 상태와 정리 가능한 이벤트 처리로 옮겼습니다. 원본에 이미 있던 YouTube 동영상 플레이어는 미디어 임베드로 유지합니다. 멘토링의 제품 데모는 React 요소로 변환했습니다.

## 데스크톱과 모바일

데스크톱은 원본 화면을 같은 너비로 나란히 비교합니다. 모바일에서도 원본 디자인을 유지하되 화면 밖으로 잘리는 요소, 버튼 겹침과 키보드·터치 문제만 조정합니다.

- 원본과 동일한 70px 헤더와 메뉴 구조
- 1024px 미만에서 모바일 메뉴, 767px 이하에서 필요한 화면 조정
- 같은 콘텐츠·목적지·기능 유지
- Home의 좁은 화면에서는 3D가 과하게 잘리지 않도록 맞춤
- 모바일 조작 영역·포커스·메뉴 닫기·자료 팝업 겹침 검수

## 아직 준비되지 않은 기능

- 이력서·포트폴리오 패키지 자동 전송과 요청 백엔드는 활성화하지 않았습니다.
- 자료 요청 UI의 `Coming Soon` 표시를 유지하고 전송 입력은 비활성화했습니다. 실제로 메일을 보내지 않고 성공했다고 표시하지 않습니다.
- 원본의 미완성 Korean 버튼은 `Coming soon!` 안내를 유지합니다. 영어 페이지를 번역 완료라고 표시하지 않습니다.
- 원본에서 숨긴 Enjoy 메뉴는 새로 노출하지 않습니다. 기존 `enjoy.html` 주소의 화면은 옮겼습니다.
- 연결되지 않은 오래된 프로젝트 페이지·백업 파일은 복사하지 않았습니다.
- 최종 공개 승인·beta/main 병합·배포는 별도입니다.

## 내 컴퓨터에서 실행하기

Node.js 24 LTS(24.15.0 이상)와 npm이 필요합니다. 저장소 폴더에서 터미널을 열고 실행하세요.

```bash
npm ci
npm run dev
```

터미널의 로컬 주소(보통 `http://localhost:5173`)를 엽니다. 종료는 `Ctrl+C`입니다.

### 처음에는 원본 파일을 받습니다

원본 사진·영상 약276MiB와 외부 글꼴·이미지 약26MiB를 처음 한 번 받으므로 인터넷 연결과 시간이 필요합니다. 원본의 고해상도 파일을 임의로 줄이거나 다른 그림으로 바꾸지 않았습니다.

- 원본 커밋·URL·파일 SHA-256을 고정해 받은 내용이 맞는지 확인합니다.
- 받은 파일은 `public/original/`, `public/original-external/`에 재사용 가능한 로컬 파일로 둡니다.
- 이 큰 파일들을 React Git 이력에 중복 저장하지 않습니다.
- 방문자 브라우저에는 빌드에 포함된 로컬 사진·글꼴을 제공합니다. 원본 사이트의 사진 URL을 직접 연결해 쓰는 방식이 아닙니다.
- 환경에 따라 PNG 바이트가 바뀌는 원본 기본 아바타 5개는 확인한 원본 바이트를 작게 고정해 두었습니다. 해시 검사를 끄지 않았습니다.

[원본 파일 준비 설명](docs/original-assets.md) / [외부 파일·글꼴 라이선스](docs/original-external-assets.md)

## 주요 명령어

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 파일 준비 후 개발 화면 실행 |
| `npm run prepare:assets` | 원본 파일을 받고 해시 검증 |
| `npm run styles:generate` | 원본 클래스에 맞는 로컬 Tailwind CSS 생성 |
| `npm run lint` | 코드·React 규칙 검사 |
| `npm run typecheck` | 데이터와 컴포넌트 연결 검사 |
| `npm test` | 콘텐츠·조작·정리 동작 단위 검사 |
| `npm run build` | 원본 파일 준비·스타일 생성·프로덕션 빌드. 배포는 하지 않음 |
| `npm run preview` | 빌드 결과를 로컬에서 열기 |
| `npm run check` | lint → typecheck → test → build |
| `npm run test:e2e` | 실제 Chromium으로 화면·이동·조작 검사 |

첫 브라우저 검사 전에는 `npx playwright install chromium`을 실행하세요. Linux에 시스템 의존성이 없으면 `npx playwright install --with-deps chromium`이 필요할 수 있습니다. 브라우저 검사 전에 `npm run build`를 실행합니다.

## 어떤 파일을 보면 되나요?

```text
src/
├─ app/App.tsx                      공통 화면과 자료 팝업 조립
├─ config/originalRoutes.ts          실제 원본 URL과 페이지 선택
├─ pages/original/OriginalPage.tsx    각 원본 페이지 연결
├─ pages/original/generated/         원본을 그대로 옮긴 JSX·페이지 CSS
├─ pages/original/OriginalArticlesPage.tsx  아티클 목록·읽기 동작
├─ content/original/articles/        18개 아티클 본문과 메타데이터
├─ content/original/                 메뉴와 검증된 파일 목록
├─ shared/layout/OriginalHeader/     원본 헤더·반응형 메뉴
├─ shared/layout/OriginalFooter/     원본 푸터
├─ shared/ui/MaterialsPopup/         미완성 자료 UI
├─ shared/ui/SplineHero/             원본 3D 장면
├─ shared/hooks/                    페이지별 실제 조작과 정리
└─ styles/original/                  원본 CSS·글꼴·필요한 모바일 보정
```

이 단계는 원본을 정확하게 옮기는 것이 우선입니다. 원본 JSX를 공통 카드나 새로운 디자인으로 다시 쓰지 않았습니다. 원본 CSS와 Tailwind 클래스의 적용 순서도 보존합니다. 이후 문구나 디자인을 바꾸는 작업은 이관 검수와 분리해 진행합니다.

`generated` 파일은 원본 고정 커밋을 확인한 변환 도구로 만들었습니다. 다른 원본에 도구를 돌리면 먼저 중단하도록 보호합니다. 현재 화면을 바꿀 때는 페이지 설명과 검수도 함께 갱신합니다.

## 검수 상태와 범위

원본 Home의 390px·1440px 캡처와 React 화면을 확보하여 비교했습니다. 데스크톱 Hero의 글꼴·크기·위치와 Hero 아래 섹션을 대조했고, 모바일의 3D 잘림과 자료 버튼 겹침을 확인해 보정했습니다.

최신 전체 경로·모바일 조작·시각 검수의 **통과 / 미검수 구분**은 [이관 검수 기록](docs/qa/original-migration-verification.md)과 [디자인 비교](design-qa.md)에 기록합니다. [PR checks](https://github.com/nana-park/portfolio-react/pull/1/checks)에서 정확한 마지막 커밋의 결과를 볼 수 있습니다.

로컬 Chromium 실행은 작업환경의 OS socket 제한, 클라우드 브라우저의 localhost 접근은 보안 제한으로 막혔습니다. 사용자 컴퓨터 설정을 풀지 않고 GitHub-hosted Chromium에서 실제 렌더링·스크린샷·조작을 검수합니다.

## 브랜치와 공개 상태

최신 협업 규칙을 보존하려고 `docs/collaboration-ground-rules`에서 `feature/responsive-react-foundation`을 만들었습니다. Draft PR 대상도 문서 브랜치이며 main이나 운영 사이트가 자동으로 바뀌지 않습니다.

향후 문서·기능 검토 → beta 통합과 전체 검수 → 사용자의 별도 main 승인 → main 반영 → 별도 배포 순서입니다.

## 문서

- [원본 이관 범위와 화면 구성](src/pages/original/README.md)
- [Ground Rules](docs/ground-rules/README.md)
- [반응형 전략](docs/responsive-strategy.md)
- [버전 현황](versions/README.md)
- [공통 컴포넌트 적용표](docs/design-system/component-adoption.md)
- [초기 구조 검수 기록](docs/qa/foundation-verification.md): 원본 이관 전 기록
