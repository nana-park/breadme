import { resolveOriginalPage } from "@/config/originalRoutes";
import { useCallback, useEffect, useRef, useState } from "react";
import { OriginalHeader } from "@/shared/layout/OriginalHeader/OriginalHeader";
import { OriginalFooter } from "@/shared/layout/OriginalFooter/OriginalFooter";
import { MaterialsPopup } from "@/shared/ui/MaterialsPopup/MaterialsPopup";
import { OriginalPage } from "@/pages/original/OriginalPage";

export function App() {
  const pageId = resolveOriginalPage();
  const isProjectDetail = [
    "llm-based-voice-ivr",
    "hopzie-oneclickbuilder",
    "ai-mentoring-agent-detail",
  ].includes(pageId);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const materialsReturnFocus = useRef<HTMLButtonElement | null>(null);
  const openPageMaterials = (trigger: HTMLButtonElement) => {
    materialsReturnFocus.current = trigger;
    setIsMaterialsOpen(true);
    // WHY: A second body action can be activated while this nonmodal panel is
    // already open. Re-focus its close control without toggling it closed.
    if (isMaterialsOpen)
      document.querySelector<HTMLButtonElement>("#popupMinimize")?.focus();
  };
  const closeMaterials = useCallback(() => setIsMaterialsOpen(false), []);
  const showPending = useCallback(() => window.alert("Coming soon!"), []);
  useEffect(() => {
    document.documentElement.lang = "en";
    document.title = "Nahyun Park";
    if (
      [
        "llm-based-voice-ivr",
        "hopzie-oneclickbuilder",
        "ai-mentoring-agent-detail",
      ].includes(pageId)
    ) {
      document.body.className =
        "bg-white text-zinc-900 font-sans antialiased selection:bg-zinc-200 selection:text-zinc-900";
    }
  }, [pageId]);
  return (
    <>
      <a className="original-skip-link" href="#main-content">
        Skip to content
      </a>
      <svg
        width="0"
        height="0"
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="arrow-grad-right"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
          </linearGradient>
          <linearGradient
            id="arrow-grad-down"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#d97706" stopOpacity="0" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
      <OriginalHeader
        pageId={pageId}
        onOpenMaterials={
          isProjectDetail ? showPending : () => setIsMaterialsOpen(true)
        }
      />
      <main id="main-content" tabIndex={-1}>
        <OriginalPage pageId={pageId} onOpenMaterials={openPageMaterials} />
      </main>
      <OriginalFooter onPending={showPending} />
      {!isProjectDetail && (
        <MaterialsPopup
          hideMinimizedDuringHomeHero={pageId === "home"}
          returnFocusRef={materialsReturnFocus}
          isOpen={isMaterialsOpen}
          onToggle={() => setIsMaterialsOpen((open) => !open)}
          onClose={closeMaterials}
        />
      )}
    </>
  );
}
