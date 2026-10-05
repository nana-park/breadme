import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./MaterialsPopup.module.css";
type Props = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  hideMinimizedDuringHomeHero?: boolean;
};
export function MaterialsPopup({
  isOpen,
  onToggle,
  onClose,
  hideMinimizedDuringHomeHero = false,
}: Props) {
  const [homeHeroVisible, setHomeHeroVisible] = useState(false);
  const hideMinimized =
    hideMinimizedDuringHomeHero && homeHeroVisible && !isOpen;
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const minimize = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    // WHY: Focus after the new state is rendered, never on the scaled-away toggle.
    if (!root.current?.closest("[inert]")) {
      if (isOpen) minimize.current?.focus();
      else if (wasOpen.current) {
        if (hideMinimized)
          document.querySelector<HTMLElement>("#navbar .logo")?.focus();
        else if (
          window.innerWidth < 768 &&
          document.querySelector("#article-detail")
        )
          document.querySelector<HTMLElement>("#mobileToggle")?.focus();
        else toggle.current?.focus();
      }
    }
    wasOpen.current = isOpen;
  }, [isOpen, hideMinimized]);
  useEffect(() => {
    let shortcutHadFocus = document.activeElement === toggle.current;
    const trackShortcutFocus = (event: FocusEvent) => {
      shortcutHadFocus = event.target === toggle.current;
    };
    const updatePosition = () => {
      const popup = root.current,
        footer = document.querySelector<HTMLElement>(".footer");
      if (!popup) return;
      // A resize can hide the reading shortcut without an open/close render.
      if (
        !isOpen &&
        window.innerWidth < 768 &&
        document.querySelector("#article-detail") &&
        (document.activeElement === toggle.current ||
          (document.activeElement === document.body && shortcutHadFocus))
      )
        document.querySelector<HTMLElement>("#mobileToggle")?.focus();
      if (hideMinimizedDuringHomeHero) {
        const hero = document.querySelector<HTMLElement>(
          "[data-original-page='home'] #home",
        );
        const rect = hero?.getBoundingClientRect();
        const visible =
          window.innerWidth < 768 &&
          !!rect &&
          rect.bottom > 70 &&
          rect.top < window.innerHeight;
        setHomeHeroVisible(visible);
        // WHY: A resize/scroll must not strand keyboard focus on a hidden entry.
        if (visible && !isOpen && document.activeElement === toggle.current)
          document.querySelector<HTMLElement>("#navbar .logo")?.focus();
      }
      const footerTop = footer
        ? footer.getBoundingClientRect().top + window.scrollY
        : Infinity;
      if (window.scrollY + window.innerHeight >= footerTop + 32) {
        popup.style.position = "absolute";
        popup.style.top = `${footerTop - popup.offsetHeight - 32}px`;
        popup.style.bottom = "auto";
      } else {
        popup.style.position = "fixed";
        popup.style.top = "auto";
        popup.style.bottom = "2rem";
        if (
          !hideMinimizedDuringHomeHero &&
          !isOpen &&
          window.innerWidth < 768
        ) {
          const hero = document.querySelector<HTMLElement>(
            "[data-original-page='home'] #home",
          );
          const cta = hero?.lastElementChild;
          const links = Array.from(
            cta?.querySelectorAll<HTMLElement>("a") ?? [],
          );
          const visibleLinks = links
            .map((link) => link.getBoundingClientRect())
            .filter(
              (rect) =>
                rect.width > 0 &&
                rect.bottom > 70 &&
                rect.top < window.innerHeight,
            );
          // WHY: The toggle animates from scale(0), so its visual rect can be empty
          // during first paint. Collide against its untransformed resting footprint.
          const button = toggle.current;
          const rootFontSize =
            Number.parseFloat(
              getComputedStyle(document.documentElement).fontSize,
            ) || 16;
          const baselineBottom = window.innerHeight - 2 * rootFontSize;
          const baselineRight = popup.getBoundingClientRect().right;
          const toggleRect =
            button && button.offsetWidth > 0 && button.offsetHeight > 0
              ? {
                  top: baselineBottom - button.offsetHeight,
                  bottom: baselineBottom,
                  left: baselineRight - button.offsetWidth,
                  right: baselineRight,
                }
              : null;
          const gap = 16;
          if (
            toggleRect &&
            visibleLinks.some(
              (rect) =>
                rect.left < toggleRect.right + gap &&
                rect.right > toggleRect.left - gap &&
                rect.bottom > toggleRect.top - gap &&
                rect.top < toggleRect.bottom + gap,
            )
          ) {
            const subtitle = cta?.previousElementSibling
              ?.querySelector("p")
              ?.getBoundingClientRect();
            const contentTop = Math.min(
              ...visibleLinks.map((rect) => rect.top),
              subtitle && subtitle.height > 0 && subtitle.bottom > 70
                ? subtitle.top
                : Infinity,
            );
            // WHY: Move only the floating control into the existing gap above Hero copy.
            // Measuring the source text/buttons preserves their exact layout and adapts to wrapping.
            popup.style.bottom = `${window.innerHeight - contentTop + gap}px`;
          }
        }
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        isOpen &&
        !event.defaultPrevented &&
        !root.current?.closest("[inert]")
      ) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    document.addEventListener("focusin", trackShortcutFocus);
    document.addEventListener("keydown", onKey);
    updatePosition();
    const timer = window.setTimeout(updatePosition, 400);
    // The Home page loads lazily; remeasure when its content and fonts arrive.
    const observer = new MutationObserver(updatePosition);
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    let mounted = true;
    void document.fonts?.ready.then(() => {
      if (mounted) updatePosition();
    });
    return () => {
      mounted = false;
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("focusin", trackShortcutFocus);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose, hideMinimizedDuringHomeHero]);
  return (
    <div
      ref={root}
      id="email-popup"
      className={`email-popup ${styles.popup} ${isOpen ? "" : "minimized"}`}
      style={{
        position: "fixed",
        top: "auto",
        bottom: "2rem",
        right: "2rem",
        transform: "none",
        // Home only: the Header still opens materials; the duplicate floating
        // entry returns after the Hero, without covering the artwork or its badge.
        visibility: hideMinimized ? "hidden" : "visible",
        pointerEvents: hideMinimized ? "none" : undefined,
      }}
    >
      <button
        ref={toggle}
        className="popup-toggle"
        id="popupToggle"
        aria-label="Open Email Popup"
        aria-expanded={isOpen}
        aria-controls="materials-content"
        tabIndex={isOpen ? -1 : undefined}
        aria-hidden={isOpen || undefined}
        onClick={onToggle}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </button>
      <div className="popup-content" id="materials-content" hidden={!isOpen}>
        <div className="popup-header">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
            Application Materials
          </h3>
          <button
            ref={minimize}
            className="popup-minimize"
            id="popupMinimize"
            aria-label="Minimize Popup"
            onClick={onClose}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <p className="popup-description">
          Leave your email below to instantly receive the complete portfolio and
          resume package.
        </p>
        <div className="relative mt-2">
          <form
            id="emailPopupForm"
            className="popup-form relative z-0"
            onSubmit={(event) => event.preventDefault()}
            aria-label="Application materials are coming soon"
          >
            <input
              disabled
              type="email"
              aria-label="Email address (coming soon)"
              placeholder="Enter your email address"
              className="w-full bg-white border border-gray-200 text-[#111] text-[13.5px] font-sans px-5 py-2.5"
              style={{ borderRadius: 50 }}
            />
            <button
              disabled
              type="submit"
              className="popup-submit-btn"
              style={{
                background: "#fff",
                color: "#52525b",
                border: "1px solid #d4d4d8",
                borderRadius: 50,
              }}
            >
              <span style={{ fontWeight: 700 }}>
                Receive <span style={{ color: "#D97706" }}>bread</span>
                <span style={{ color: "#111" }}>me</span> package
              </span>
            </button>
          </form>
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl pointer-events-auto"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.8) 100%)",
              backdropFilter: "blur(1px)",
              margin: -4,
            }}
          >
            <span
              className="inline-flex items-center justify-center px-4 pt-[7px] pb-[5px] rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm leading-none"
              style={{
                background: "#111",
                color: "#fff",
                border: "1px solid #333",
              }}
            >
              Coming Soon
            </span>
          </div>
        </div>
        <div id="popupFeedback" className="popup-feedback" />
      </div>
    </div>
  );
}
