# 저장소와 브랜치 운영

## 저장소 역할

- `nana-park/Portfolio`: 기존 HTML 원본과 이력 보존
- `nana-park/breadme`: React 소스, 문서와 릴리스 관리

기존 저장소의 임시 파일과 백업 파일을 통째로 옮기지 않고 실제 사용하는 항목만 선별합니다.

## 브랜치

### `main`

- 언제든 배포 가능한 안정 버전만 둡니다.
- 직접 개발하거나 직접 푸시하지 않습니다.
- `beta → main` 병합은 별도의 main 승인 전용 Codex 대화에서만 진행합니다.
- 사용자가 명확히 “main에 반영해줘”라고 승인해야 병합합니다.

### `beta`

- 여러 기능을 합쳐 확인하는 통합 브랜치입니다.
- 완성된 작업 브랜치를 기본 테스트 후 병합합니다.
- 환경별 복제 폴더를 만들지 않습니다.

### 작업 브랜치

```text
feature/home-design-system
feature/about-page
fix/mobile-navigation
docs/update-ground-rules
chore/update-dependencies
```

한 브랜치에는 하나의 목적만 포함합니다.

## 병합 흐름

```text
feature/*, fix/*, docs/*, chore/*
                  ↓
                beta
                  ↓ 사용자 전용 승인 대화
                main
```

개발자는 `main` 외 PR 생성, 기본 테스트, 단순 충돌 해결과 `beta` 병합을 처리할 수 있습니다.

다음 경우에는 `beta` 병합 전에도 사용자에게 확인합니다.

- 콘텐츠 의미 또는 디자인 방향이 달라짐
- 새 외부 서비스나 유료 서비스 도입
- 기존 기능 또는 데이터 삭제
- 큰 파일 구조 변경
- 여러 해결안의 사용자 경험 차이가 큼
- 충돌 해결이 사용자 작업을 덮을 위험이 있음

## 별도 공개 주소 배포 — 2026-10-04 승인 범위

사용자가 검수된 문서·React 기능·/breadme/ 배포 구성을 main에 통합하고 main에서만 게시하는 방식을 승인했습니다. 기존 github-pages 환경의 main 허용 규칙을 유지하며 다른 브랜치 권한은 추가하지 않습니다. 작업 브랜치와 PR 자체는 게시하지 않고 기존 `Portfolio` 저장소는 유지합니다. 이 승인은 이후의 임의 main 변경까지 포괄하지 않습니다.

## 커밋

작고 되돌릴 수 있는 단위로 작성합니다.

```text
feat: add home hero section
fix: correct mobile navigation overflow
docs: update directory review rules
refactor: extract shared section title
chore: update build configuration
```

기능 변경, 디자인 변경과 대규모 코드 정리를 한 커밋에 섞지 않습니다.
