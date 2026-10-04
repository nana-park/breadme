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
export function resolveOriginalPage(): OriginalPageId {
  const filename =
    window.location.pathname
      .split("/")
      .filter(Boolean)
      .at(-1)
      ?.replace(/\.html$/, "") ?? "index";
  return originalPageIds.includes(filename as OriginalPageId)
    ? (filename as OriginalPageId)
    : "home";
}
