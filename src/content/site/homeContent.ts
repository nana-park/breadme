// WHAT: Home preview copy, independent of layout and interaction code.
// CONTENT-REVIEW: Existing English hero is preserved verbatim, not newly translated.
// Source: nana-park/Portfolio index.html. Full career/project migration remains pending.
export const homeContent = {
  name: "Nahyun Park",
  brand: { prefix: "bread", suffix: "me" },
  hero: {
    role: "AI PRODUCT MANAGER · UX RESEARCH · PSYCHOLOGY",
    title: "Designing Actionable AI",
    subtitle: "Helping people follow through:",
  },
  preview: {
    label: "구조 미리보기",
    title: "콘텐츠를 담기 전, 읽기 좋은 기본 구조부터.",
    description:
      "이 화면은 React 기본 구조를 확인하는 초안입니다. 기존 소개 문구만 연결했으며, 경력·프로젝트 상세와 자료 다운로드는 아직 이관하지 않았습니다.",
  },
  projects: {
    eyebrow: "01 / PROJECTS",
    title: "대표 프로젝트",
    description:
      "역할과 문제, 접근 과정, 성과를 같은 순서로 읽을 수 있도록 준비합니다.",
    status: "상세 콘텐츠 이관 예정",
    items: [
      {
        id: "context",
        number: "01",
        title: "어떤 문제였나요?",
        description: "배경과 해결하려던 문제를 설명할 자리입니다.",
      },
      {
        id: "contribution",
        number: "02",
        title: "무엇을 맡았나요?",
        description: "담당 역할과 핵심 의사결정을 정리할 자리입니다.",
      },
      {
        id: "outcome",
        number: "03",
        title: "어떤 결과를 만들었나요?",
        description: "확인된 성과와 배운 점을 담을 자리입니다.",
      },
    ],
  },
  contact: {
    eyebrow: "02 / NEXT STEP",
    title: "더 자세한 내용이 궁금하다면",
    description:
      "현재 공개된 경력과 프로젝트는 기존 포트폴리오에서 볼 수 있습니다. 이 초안에는 문의 전송이나 자료 다운로드 기능이 아직 없습니다.",
  },
  footer: "반응형 기본 구조 · 콘텐츠 이관 전 검토용",
} as const;
