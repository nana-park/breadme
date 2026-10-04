import { useEffect, useRef, useState } from "react";
import { originalNavigation } from "@/content/original/navigation";
import { originalHref } from "@/shared/utils/originalPaths";

type Props = { pageId: string; onOpenMaterials: () => void };
export function OriginalHeader({ pageId, onOpenMaterials }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setOpenGroup(null);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKey);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    if (isMenuOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);
  return (
    <nav
      ref={nav}
      className={`navbar ${isScrolled ? "scrolled" : ""} ${openGroup ? "gnb-expanded" : ""} ${openGroup === "ABOUT" ? "original-about-open" : ""}`}
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
          className={`nav-menu hidden lg:flex justify-center gap-12 flex-shrink-0 shrink-0 h-full ${isMenuOpen ? "active" : ""}`}
          id="navMenu"
        >
          {originalNavigation.map((item) => {
            const hasChildren = "children" in item;
            const isActive =
              item.path === `${pageId === "home" ? "index" : pageId}.html` ||
              (hasChildren &&
                item.children.some((child) => child.path === `${pageId}.html`));
            return (
              <div
                key={item.label}
                className={
                  hasChildren
                    ? `group has-dropdown ${"about" in item ? "about-dropdown" : ""} h-full flex items-center relative ${openGroup === item.label ? "original-menu-expanded" : ""}`
                    : "flex items-center h-full"
                }
                onMouseEnter={() =>
                  setOpenGroup(hasChildren ? item.label : null)
                }
                onFocus={() => setOpenGroup(hasChildren ? item.label : null)}
              >
                <a
                  href={originalHref(item.path)}
                  className={`nav-link ${hasChildren ? "flex items-center h-full" : ""} ${isActive ? "active" : ""}`}
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
                        className="text-[13px] font-sans font-medium text-white/90 hover:text-[#d97706] transition-colors flex items-center justify-center w-full lnb-link"
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
              onClick={() => {
                setIsMenuOpen(false);
                onOpenMaterials();
              }}
            >
              Resume
            </button>
            <button
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
          <div className="hidden lg:flex gap-3">
            <button
              type="button"
              onClick={onOpenMaterials}
              className="px-3 py-1.5 text-[0.7rem] font-bold bg-[#f2f2f2] hover:bg-[#e5e5e5] text-black rounded transition-colors uppercase tracking-wider"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onOpenMaterials}
              className="px-3 py-1.5 text-[0.7rem] font-bold bg-[#222222] hover:bg-black text-white rounded transition-colors uppercase tracking-wider"
            >
              Portfolio PDF
            </button>
          </div>
          <button
            ref={menuButton}
            className={`mobile-toggle lg:hidden ml-4 ${isMenuOpen ? "active" : ""}`}
            id="mobileToggle"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="navMenu"
            onClick={() => setIsMenuOpen((open) => !open)}
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
