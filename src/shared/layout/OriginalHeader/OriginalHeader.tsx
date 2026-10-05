import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { originalNavigation } from "@/content/original/navigation";
import { originalHref } from "@/shared/utils/originalPaths";
import styles from "./OriginalHeader.module.css";

type Props = { pageId: string; onOpenMaterials: () => void };
const DESKTOP_BREAKPOINT = 1024;

function isAvailable(element: HTMLElement) {
  if (element.closest("[hidden], [inert]")) return false;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
  }
  return true;
}

export function OriginalHeader({ pageId, onOpenMaterials }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [forceClosed, setForceClosed] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const navMenu = useRef<HTMLDivElement>(null);
  const desktopMaterials = useRef<HTMLDivElement>(null);
  const wasMenuOpen = useRef(false);
  useEffect(() => {
    let wasMobile = window.innerWidth < DESKTOP_BREAKPOINT;
    let lastHeaderFocus: HTMLElement | null = null;
    const trackFocus = (event: FocusEvent) => {
      lastHeaderFocus =
        event.target instanceof HTMLElement &&
        nav.current?.contains(event.target)
          ? event.target
          : null;
    };
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    const handleResize = () => {
      const isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
      if (isMobile === wasMobile) return;
      wasMobile = isMobile;
      const active =
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
          ? document.activeElement
          : lastHeaderFocus;
      setIsMenuOpen(false);
      setOpenGroup(null);
      setForceClosed(false);
      // WHY: A breakpoint can hide the currently focused control before React rerenders.
      if (active && nav.current?.contains(active)) {
        if (
          isMobile &&
          (navMenu.current?.contains(active) ||
            desktopMaterials.current?.contains(active))
        ) {
          menuButton.current?.focus();
        } else if (!isMobile) {
          const materialsAction = active.dataset.materialsAction;
          const parentLink = active
            .closest("[data-nav-group]")
            ?.querySelector<HTMLElement>(".nav-link");
          const replacement = materialsAction
            ? desktopMaterials.current?.querySelector<HTMLElement>(
                `[data-materials-action="${materialsAction}"]`,
              )
            : active === menuButton.current
              ? (navMenu.current?.querySelector<HTMLElement>(
                  "[data-current-group='true'] > .nav-link",
                ) ?? navMenu.current?.querySelector<HTMLElement>(".nav-link"))
              : parentLink;
          replacement?.focus();
          setOpenGroup(null);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("focusin", trackFocus);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("focusin", trackFocus);
    };
  }, []);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        (!isMenuOpen && !openGroup)
      )
        return;
      event.preventDefault();
      if (isMenuOpen) setIsMenuOpen(false);
      if (openGroup && window.innerWidth >= DESKTOP_BREAKPOINT) {
        nav.current
          ?.querySelector<HTMLElement>(
            `[data-nav-group="${openGroup}"] > .nav-link`,
          )
          ?.focus();
      }
      setOpenGroup(null);
      setForceClosed(window.innerWidth >= DESKTOP_BREAKPOINT);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isMenuOpen, openGroup]);
  useLayoutEffect(() => {
    const restoreFocus = wasMenuOpen.current && !isMenuOpen;
    wasMenuOpen.current = isMenuOpen;
    if (!isMenuOpen || window.innerWidth >= DESKTOP_BREAKPOINT) {
      // WHY: React restores selection during commit, so return focus after cleanup/render.
      if (restoreFocus && window.innerWidth < DESKTOP_BREAKPOINT)
        menuButton.current?.focus();
      return;
    }
    const button = menuButton.current;
    const previousOverflow = document.body.style.getPropertyValue("overflow");
    const previousPriority =
      document.body.style.getPropertyPriority("overflow");
    const background = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main, footer, .footer, #email-popup, .original-skip-link",
      ),
    ).map((element) => ({ element, inert: element.getAttribute("inert") }));
    // WHY: Already-inert regions belong to their existing owner; do not rewrite them.
    background.forEach(({ element, inert }) => {
      if (inert === null) element.setAttribute("inert", "");
    });
    document.body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(
        nav.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled), [tabindex='0']",
        ) ?? [],
      ).filter(
        (element) =>
          !desktopMaterials.current?.contains(element) && isAvailable(element),
      );
    const containFocus = (event: FocusEvent) => {
      if (!nav.current?.contains(event.target as Node)) button?.focus();
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = focusable();
      const first = controls[0];
      const last = controls.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !nav.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !nav.current?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trapTab);
    document.addEventListener("focusin", containFocus);
    if (!nav.current?.contains(document.activeElement)) button?.focus();
    return () => {
      document.removeEventListener("keydown", trapTab);
      document.removeEventListener("focusin", containFocus);
      background.forEach(({ element, inert }) => {
        if (inert === null) element.removeAttribute("inert");
        else element.setAttribute("inert", inert);
      });
      if (previousOverflow)
        document.body.style.setProperty(
          "overflow",
          previousOverflow,
          previousPriority,
        );
      else document.body.style.removeProperty("overflow");
    };
  }, [isMenuOpen]);
  return (
    <nav
      ref={nav}
      className={`navbar ${styles.navigation} ${["projects", "articles"].includes(pageId) ? "force-scrolled" : ""} ${isScrolled ? "scrolled" : ""} ${openGroup ? "gnb-expanded" : ""} ${openGroup === "ABOUT" ? "original-about-open" : ""} ${forceClosed ? "nav-force-close" : ""}`}
      id="navbar"
      aria-label="Main navigation"
      onMouseLeave={() => setOpenGroup(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setOpenGroup(null);
      }}
    >
      <div className="fixed top-[70px] left-0 w-full bg-[#111111] border-t border-[#333] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-[-1] mega-backdrop" />
      <div className="container mx-auto flex justify-between items-center h-full relative">
        <div className="flex-1 flex justify-start items-center">
          <a
            href={originalHref("index.html")}
            className="logo text-lg font-bold text-black"
            aria-label="breadme home"
          >
            <span style={{ color: "#D97706" }}>bread</span>me
          </a>
        </div>
        <div
          ref={navMenu}
          className={`nav-menu hidden lg:flex justify-center gap-12 flex-shrink-0 shrink-0 h-full ${isMenuOpen ? "active" : ""}`}
          id="navMenu"
        >
          {originalNavigation.map((item) => {
            const hasChildren = "children" in item;
            const isActive =
              !["research", "lectures"].includes(pageId) &&
              (item.path === `${pageId === "home" ? "index" : pageId}.html` ||
                (hasChildren &&
                  item.children.some(
                    (child) => child.path === `${pageId}.html`,
                  )));
            const isCurrentGroup =
              isActive ||
              (item.label === "PROJECTS" &&
                [
                  "research",
                  "lectures",
                  "llm-based-voice-ivr",
                  "hopzie-oneclickbuilder",
                  "ai-mentoring-agent-detail",
                ].includes(pageId));
            return (
              <div
                key={item.label}
                data-current-group={isCurrentGroup || undefined}
                data-nav-group={item.label}
                className={
                  hasChildren
                    ? `group has-dropdown ${"about" in item ? "about-dropdown" : ""} h-full flex items-center relative ${openGroup === item.label ? "original-menu-expanded" : ""}`
                    : "flex items-center h-full"
                }
                onMouseEnter={() => {
                  setForceClosed(false);
                  if (window.innerWidth >= DESKTOP_BREAKPOINT)
                    setOpenGroup(hasChildren ? item.label : null);
                }}
                onFocus={() => {
                  setForceClosed(false);
                  if (window.innerWidth >= DESKTOP_BREAKPOINT)
                    setOpenGroup(hasChildren ? item.label : null);
                }}
              >
                <a
                  href={originalHref(item.path)}
                  className={`nav-link ${styles.primaryLink} ${hasChildren ? "flex items-center h-full" : ""} ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </a>
                {hasChildren && (
                  <div
                    className={`absolute top-[70px] left-1/2 -translate-x-1/2 w-[200px] ${"about" in item ? "h-[120px]" : "h-[160px]"} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col justify-center items-center gap-1.5 z-[999] original-submenu`}
                  >
                    {item.children.map((child) => (
                      <a
                        key={child.path}
                        href={originalHref(child.path)}
                        className={`text-[13px] font-sans font-medium text-white/90 hover:text-[#d97706] transition-colors flex items-center justify-center w-full lnb-link ${styles.secondaryLink}`}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="original-mobile-materials">
            <button
              type="button"
              data-materials-action="resume"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMaterials();
              }}
            >
              Resume
            </button>
            <button
              type="button"
              data-materials-action="portfolio"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMaterials();
              }}
            >
              Portfolio PDF
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-end items-center gap-3">
          <div ref={desktopMaterials} className="hidden lg:flex gap-3">
            <button
              type="button"
              data-materials-action="resume"
              onClick={onOpenMaterials}
              className="px-3 py-1.5 text-[0.7rem] font-bold bg-[#f2f2f2] hover:bg-[#e5e5e5] text-black rounded transition-colors uppercase tracking-wider"
            >
              Resume
            </button>
            <button
              type="button"
              data-materials-action="portfolio"
              onClick={onOpenMaterials}
              className="px-3 py-1.5 text-[0.7rem] font-bold bg-[#222222] hover:bg-black text-white rounded transition-colors uppercase tracking-wider"
            >
              Portfolio PDF
            </button>
          </div>
          <button
            ref={menuButton}
            type="button"
            className={`mobile-toggle lg:hidden ml-4 ${isMenuOpen ? "active" : ""}`}
            id="mobileToggle"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="navMenu"
            onClick={() => {
              setForceClosed(false);
              setIsMenuOpen((open) => !open);
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
