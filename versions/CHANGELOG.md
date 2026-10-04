# Changelog

모든 중요한 변경사항을 최신 버전부터 기록합니다.

## [Unreleased]

### 영향을 받은 페이지

- Home (구조 미리보기)
- About / Projects / Research / Articles / Lectures / Awards / Contact는 아직 미구현

### Added — 2026-10-04

- [Home][All Viewports][KO] Vite + React + TypeScript 기반과 실행·검사 명령
- [Home][Mobile][Tablet][Desktop][KO] 동일 콘텐츠의 반응형 기본 구조와 공통 컴포넌트
- [Home][All Viewports][KO] 본문 바로가기, 키보드 메뉴와 실제 앵커 이동
- [Home][All Viewports][EN] 기존 breadme 브랜드와 영어 Hero 원문 연결 (영어 UI 전체 지원 아님)
- [Home][All Viewports][KO] 이관 전 상태와 기존 포트폴리오 링크를 명확히 표시
- [Home][All Viewports] 컴포넌트 테스트 6개, 7개 폭을 포함한 브라우저·접근성·터치 검사 11개와 PR CI 구성
- [Docs] 반응형 HR 탐색 전략, 설계 검토, 쉬운 README와 검수 기록

### Fixed

- [Home][Mobile] 320px에서 앵커 새로고침·직접 진입 위치 복원
- [Home][Mobile][Tablet] 767↔768px 메뉴 전환 시 키보드 포커스 보존
- [Home][KO][All Viewports] 한국어 단어 중간 줄바꿈 완화

### Changed

- 문서의 `src/data` / `src/content` 충돌을 `src/content`로 통일
- TypeScript 구현에 맞춰 기본 구조 예시와 공식 명칭 원본 경로 정리
- Home 공통 컴포넌트 적용표와 버전 현황 갱신

### 이전에 추가됨

- 저장소 및 협업 Ground Rules
- 버전관리 허브와 공통 컴포넌트 적용표

## [0.1.0] - 예정

### 목표

- [Home][All Viewports] Home 페이지와 디자인 시스템 첫 완성

기본 구조 세팅은 이 목표의 일부입니다. 최종 콘텐츠, 디자인 확인, beta 검수, main 승인과 배포는 완료되지 않았습니다.
