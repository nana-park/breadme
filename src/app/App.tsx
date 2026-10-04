import { resolveOriginalPage } from "@/config/originalRoutes";
import { useCallback, useEffect, useState } from "react";
import { OriginalHeader } from "@/shared/layout/OriginalHeader/OriginalHeader";
import { OriginalFooter } from "@/shared/layout/OriginalFooter/OriginalFooter";
import { MaterialsPopup } from "@/shared/ui/MaterialsPopup/MaterialsPopup";
import { OriginalPage } from "@/pages/original/OriginalPage";

export function App() {
  const pageId = resolveOriginalPage();
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(false);
  const closeMaterials = useCallback(() => setIsMaterialsOpen(false), []);
  const showPending = useCallback(() => setPendingMessage(true), []);
  useEffect(() => {
    document.documentElement.lang = "en";
    document.title = "Nahyun Park";
  }, []);
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
        onOpenMaterials={() => setIsMaterialsOpen(true)}
      />
      <main id="main-content" tabIndex={-1}>
        <OriginalPage pageId={pageId} />
      </main>
      <OriginalFooter onPending={showPending} />
      <MaterialsPopup
        isOpen={isMaterialsOpen}
        onToggle={() => setIsMaterialsOpen((open) => !open)}
        onClose={closeMaterials}
      />
      {pendingMessage && (
        <div
          className="original-pending-overlay"
          role="presentation"
          onClick={() => setPendingMessage(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-title"
            className="original-pending-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="pending-title">Coming soon!</h2>
            <button
              autoFocus
              type="button"
              onClick={() => setPendingMessage(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
