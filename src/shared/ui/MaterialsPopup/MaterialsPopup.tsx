import { useEffect, useRef } from "react";
type Props = { isOpen: boolean; onToggle: () => void; onClose: () => void };
export function MaterialsPopup({ isOpen, onToggle, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const updatePosition = () => {
      const popup = root.current,
        footer = document.querySelector<HTMLElement>(".footer");
      if (!popup || !footer) return;
      const footerTop = footer.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY + window.innerHeight >= footerTop + 32) {
        popup.style.position = "absolute";
        popup.style.top = `${footerTop - popup.offsetHeight - 32}px`;
        popup.style.bottom = "auto";
      } else {
        popup.style.position = "fixed";
        popup.style.top = "auto";
        popup.style.bottom = "2rem";
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
        toggle.current?.focus();
      }
    };
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    document.addEventListener("keydown", onKey);
    updatePosition();
    const timer = window.setTimeout(updatePosition, 400);
    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose]);
  return (
    <div
      ref={root}
      id="email-popup"
      className={`email-popup ${isOpen ? "" : "minimized"}`}
      style={{
        position: "fixed",
        top: "auto",
        bottom: "2rem",
        right: "2rem",
        transform: "none",
      }}
    >
      <button
        ref={toggle}
        className="popup-toggle"
        id="popupToggle"
        aria-label="Open Email Popup"
        aria-expanded={isOpen}
        aria-controls="materials-content"
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
