export const originalPageIds = [
  "home",
  "about",
  "career",
  "qualified",
  "enjoy",
  "projects",
  "research",
  "articles",
  "lectures",
  "awards",
  "contact",
  "llm-based-voice-ivr",
  "hopzie-oneclickbuilder",
  "ai-mentoring-agent-detail",
] as const;
export type OriginalPageId = (typeof originalPageIds)[number];
// WHAT: One route inventory is shared by the React resolver and static hosting build.
export const originalRoutePaths: Record<OriginalPageId, string> = {
  home: "index.html",
  about: "about.html",
  career: "career.html",
  qualified: "qualified.html",
  enjoy: "enjoy.html",
  projects: "projects.html",
  research: "research.html",
  articles: "articles.html",
  lectures: "lectures.html",
  awards: "awards.html",
  contact: "contact.html",
  "llm-based-voice-ivr": "projects/llm-based-voice-ivr.html",
  "hopzie-oneclickbuilder": "projects/hopzie-oneclickbuilder.html",
  "ai-mentoring-agent-detail": "projects/ai-mentoring-agent-detail.html",
};

export function resolveOriginalPage(
  pathname = window.location.pathname,
): OriginalPageId {
  const filename =
    pathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, "") ?? "index";
  return originalPageIds.includes(filename as OriginalPageId)
    ? (filename as OriginalPageId)
    : "home";
}
