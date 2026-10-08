import type { OriginalPageId } from "./originalRoutes";

// WHAT: Existing, coherent page chapters. WHY: Snapping every paragraph, card,
// accordion panel or embedded demo would interrupt reading and nested scrolling.
export const mobileSnapSelectors: Record<OriginalPageId, string> = {
  home: ":scope > section",
  about: "[data-about-chapter]",
  career: ":scope > section",
  qualified: ":scope > section",
  enjoy: "#enjoy > .container > div",
  projects:
    '[data-landing-photo-hero="projects"], #projects > .container > div:first-child > div:not(#archived-detailed-project-cards) > div > div',
  research:
    '[data-landing-photo-hero="research"], #research > .container > div',
  articles:
    '[data-landing-photo-hero="articles"], #articles-list-container, #article-detail',
  lectures:
    "#lectures > .container > div:first-child, #lectures > .container > div:nth-child(2) > div",
  awards: "#awards > div:first-child, #awards > .container",
  contact: "#contact > div:first-child, #contact > .container > div",
  "llm-based-voice-ivr": ".text-center.mt-48, #impact, [class~='mt-[218px]']",
  "hopzie-oneclickbuilder":
    ".text-center.mt-48, #impact, [class~='mt-[218px]']",
  "ai-mentoring-agent-detail":
    ".text-center.mt-48, #impact, [class~='mt-[218px]']",
};

// Only these decorative outer clips sit between a chapter and the document.
// Do not alter the genuine horizontal scrollers or clipped media/demo frames.
export const mobileSnapFlowSelectors: Partial<Record<OriginalPageId, string>> =
  {
    about: "#about",
    awards: "#awards",
  };
