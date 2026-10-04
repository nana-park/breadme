import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { navigation } from "@/config/navigation";
import { homeContent } from "@/content/site/homeContent";
import { common } from "@/locales/ko/common";
import { Container } from "@/shared/layout/Container/Container";
import styles from "./Header.module.css";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  const lastFocusedControl = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      // WHY: CSS can blur a newly hidden control before the media-query event runs.
      const focused =
        document.activeElement === document.body
          ? lastFocusedControl.current
          : document.activeElement;
      if (desktop.matches && focused === menuButton.current) {
        navigationRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      }
      if (!desktop.matches && navigationRef.current?.contains(focused)) {
        menuButton.current?.focus();
      }
      setIsMenuOpen(false);
    };
    const handleHistory = () => {
      if (
        !desktop.matches &&
        navigationRef.current?.contains(document.activeElement)
      ) {
        menuButton.current?.focus();
      }
      setIsMenuOpen(false);
    };
    desktop.addEventListener("change", handleResize);
    window.addEventListener("hashchange", handleHistory);
    return () => {
      desktop.removeEventListener("change", handleResize);
      window.removeEventListener("hashchange", handleHistory);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  const handleNavigate = (href: string) => {
    setIsMenuOpen(false);
    // ACCESSIBILITY: Move focus out of the menu before its links become hidden.
    document.querySelector<HTMLElement>(href)?.focus({ preventScroll: true });
  };

  return (
    <header className={styles.header}>
      <Container>
        <div
          className={styles.headerContent}
          onFocusCapture={(event) => {
            lastFocusedControl.current = event.target;
          }}
          onBlurCapture={(event) => {
            // Keep only a focus loss caused by a control becoming display:none.
            if (
              event.relatedTarget ||
              event.target.getClientRects().length > 0
            ) {
              lastFocusedControl.current = null;
            }
          }}
        >
          <a
            className={styles.brand}
            href="#overview"
            onClick={() => handleNavigate("#overview")}
            aria-label={`${homeContent.brand.prefix}${homeContent.brand.suffix} · ${homeContent.name} · ${common.home}`}
          >
            <span lang="en">
              <span className={styles.brandPrefix}>
                {homeContent.brand.prefix}
              </span>
              {homeContent.brand.suffix}
            </span>
          </a>
          <button
            ref={menuButton}
            className={styles.menuButton}
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? common.menuClose : common.menuOpen}
            <span aria-hidden="true">{isMenuOpen ? "−" : "+"}</span>
          </button>
          <nav
            ref={navigationRef}
            id="primary-navigation"
            aria-label={common.navigationLabel}
            className={`${styles.navigation} ${isMenuOpen ? styles.isOpen : ""}`}
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => handleNavigate(item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
}
