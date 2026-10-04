import { useOriginalDetailInteractions } from "@/shared/hooks/useOriginalDetailInteractions";
import { useMobileScrollSnap } from "@/shared/hooks/useMobileScrollSnap";
import originalUtilities from "@/styles/original/tailwind.generated.css?raw";
import mobileAccessibility from "@/styles/original/accessibility-mobile.css?raw";
import { lazy, Suspense, useLayoutEffect, useRef } from "react";
import type { OriginalPageId } from "@/config/originalRoutes";
import { useOriginalPageInteractions } from "@/shared/hooks/useOriginalPageInteractions";

const pages = {
  home: {
    component: lazy(() =>
      import("./generated/OriginalHomeContent").then((module) => ({
        default: module.OriginalHomeContent,
      })),
    ),
    css: "OriginalHomeContent",
  },
  about: {
    component: lazy(() =>
      import("./generated/OriginalAboutContent").then((module) => ({
        default: module.OriginalAboutContent,
      })),
    ),
    css: "OriginalAboutContent",
  },
  career: {
    component: lazy(() =>
      import("./generated/OriginalCareerContent").then((module) => ({
        default: module.OriginalCareerContent,
      })),
    ),
    css: "OriginalCareerContent",
  },
  qualified: {
    component: lazy(() =>
      import("./generated/OriginalQualifiedContent").then((module) => ({
        default: module.OriginalQualifiedContent,
      })),
    ),
    css: "OriginalQualifiedContent",
  },
  enjoy: {
    component: lazy(() =>
      import("./generated/OriginalEnjoyContent").then((module) => ({
        default: module.OriginalEnjoyContent,
      })),
    ),
    css: "OriginalEnjoyContent",
  },
  projects: {
    component: lazy(() =>
      import("./generated/OriginalProjectsContent").then((module) => ({
        default: module.OriginalProjectsContent,
      })),
    ),
    css: "OriginalProjectsContent",
  },
  research: {
    component: lazy(() =>
      import("./generated/OriginalResearchContent").then((module) => ({
        default: module.OriginalResearchContent,
      })),
    ),
    css: "OriginalResearchContent",
  },
  articles: {
    component: lazy(() =>
      import("./OriginalArticlesPage").then((module) => ({
        default: module.OriginalArticlesPage,
      })),
    ),
    css: "OriginalArticlesContent",
  },
  lectures: {
    component: lazy(() =>
      import("./generated/OriginalLecturesContent").then((module) => ({
        default: module.OriginalLecturesContent,
      })),
    ),
    css: "OriginalLecturesContent",
  },
  awards: {
    component: lazy(() =>
      import("./generated/OriginalAwardsContent").then((module) => ({
        default: module.OriginalAwardsContent,
      })),
    ),
    css: "OriginalAwardsContent",
  },
  contact: {
    component: lazy(() =>
      import("./generated/OriginalContactContent").then((module) => ({
        default: module.OriginalContactContent,
      })),
    ),
    css: "OriginalContactContent",
  },
  "llm-based-voice-ivr": {
    component: lazy(() =>
      import("./generated/OriginalVoiceIvrContent").then((module) => ({
        default: module.OriginalVoiceIvrContent,
      })),
    ),
    css: "OriginalVoiceIvrContent",
  },
  "hopzie-oneclickbuilder": {
    component: lazy(() =>
      import("./generated/OriginalHopzieContent").then((module) => ({
        default: module.OriginalHopzieContent,
      })),
    ),
    css: "OriginalHopzieContent",
  },
  "ai-mentoring-agent-detail": {
    component: lazy(() =>
      import("./generated/OriginalMentoringContent").then((module) => ({
        default: module.OriginalMentoringContent,
      })),
    ),
    css: "OriginalMentoringContent",
  },
} as const;
const pageCss = import.meta.glob<string>("./generated/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});

function MountedOriginalPage({ pageId }: { pageId: OriginalPageId }) {
  const root = useRef<HTMLDivElement>(null);
  useOriginalPageInteractions(pageId, root);
  useOriginalDetailInteractions(pageId, root);
  useMobileScrollSnap(pageId, root);
  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && !hash.includes("?"))
      document.getElementById(hash)?.scrollIntoView();
  }, []);
  const Page = pages[pageId].component;
  return (
    <div
      ref={root}
      data-original-page={pageId}
      onSubmitCapture={(event) => event.preventDefault()}
    >
      <style>{pageCss[`./generated/${pages[pageId].css}.css`]}</style>
      {pageId === "ai-mentoring-agent-detail" && (
        <style>
          {pageCss["./generated/OriginalMentoringMockupContent.css"]}
        </style>
      )}
      {/* WHY: Source CDN utilities are inserted after its authored page CSS. */}
      <style>{originalUtilities}</style>
      <style>{mobileAccessibility}</style>
      <div data-mobile-snap-entry aria-hidden="true" />
      <Page />
    </div>
  );
}

export function OriginalPage({ pageId }: { pageId: OriginalPageId }) {
  return (
    <Suspense
      fallback={
        <div
          aria-label="Loading portfolio"
          style={{ minHeight: "100vh", background: "#fff" }}
        />
      }
    >
      <MountedOriginalPage pageId={pageId} />
    </Suspense>
  );
}
