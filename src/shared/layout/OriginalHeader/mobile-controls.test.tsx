import { StrictMode, useCallback, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OriginalHeader } from "./OriginalHeader";
import { MaterialsPopup } from "@/shared/ui/MaterialsPopup/MaterialsPopup";

function Harness({
  showHeader = true,
  pageId = "home",
  hideMinimizedDuringHomeHero = false,
  initiallyOpenMaterials = false,
}: {
  showHeader?: boolean;
  pageId?: string;
  hideMinimizedDuringHomeHero?: boolean;
  initiallyOpenMaterials?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpenMaterials);
  const close = useCallback(() => setIsOpen(false), []);
  return (
    <>
      <a className="original-skip-link" href="#main-content">
        Skip to content
      </a>
      {showHeader && (
        <OriginalHeader
          pageId={pageId}
          onOpenMaterials={() => setIsOpen(true)}
        />
      )}
      <main id="main-content">
        <button>Outside control</button>
        <button onClick={() => setIsOpen(true)}>Open test materials</button>
        <div data-original-page={pageId}>
          <section id="home">
            <div>
              <p>Upper copy</p>
            </div>
            <div>
              <p data-testid="subtitle">Helping people follow through:</p>
            </div>
            <div>
              <a href="/projects.html" data-testid="hero-cta">
                View My Work
              </a>
            </div>
          </section>
        </div>
      </main>
      <footer className="footer">
        <button>Footer control</button>
      </footer>
      <MaterialsPopup
        hideMinimizedDuringHomeHero={hideMinimizedDuringHomeHero}
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        onClose={close}
      />
    </>
  );
}

function resize(width: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event("resize"));
  });
}
function focus(element: HTMLElement) {
  act(() => element.focus());
}
function rect(top: number, left = 0, width = 100, height = 44) {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

// WHAT: Popup behavior is exercised via a parent-owned state trigger, not a
// removed mobile menu entry or a click on a CSS-hidden production control.
function openTestMaterials() {
  fireEvent.click(screen.getByRole("button", { name: "Open test materials" }));
}

beforeEach(() => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 844,
  });
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  document.body.style.overflow = "";
});
afterEach(() => {
  document.body.style.overflow = "";
});

describe("mobile controls and nonmodal materials focus", () => {
  it("traps focus, restores preexisting inert/overflow, and repeats safely in StrictMode", () => {
    const view = render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    const main = screen.getByRole("main");
    const footer = document.querySelector("footer")!;
    const popup = document.querySelector("#email-popup")!;
    footer.setAttribute("inert", "preserved");
    document.body.style.setProperty("overflow", "clip", "important");
    const toggle = screen.getByRole("button", { name: "Open menu" });
    for (let count = 0; count < 3; count += 1) {
      fireEvent.click(toggle);
      expect(main).toHaveAttribute("inert");
      expect(popup).toHaveAttribute("inert");
      expect(footer).toHaveAttribute("inert", "preserved");
      expect(document.body.style.overflow).toBe("hidden");
      focus(toggle);
      fireEvent.keyDown(document, { key: "Tab" });
      expect(screen.getByRole("link", { name: "breadme home" })).toHaveFocus();
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
      expect(toggle).toHaveFocus();
      focus(screen.getByRole("button", { name: "Outside control" }));
      expect(toggle).toHaveFocus();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveFocus();
      expect(main).not.toHaveAttribute("inert");
      expect(popup).not.toHaveAttribute("inert");
      expect(footer).toHaveAttribute("inert", "preserved");
      expect(document.body.style.overflow).toBe("clip");
      expect(document.body.style.getPropertyPriority("overflow")).toBe(
        "important",
      );
    }
    fireEvent.click(toggle);
    view.rerender(
      <StrictMode>
        <Harness showHeader={false} />
      </StrictMode>,
    );
    expect(main).not.toHaveAttribute("inert");
    expect(popup).not.toHaveAttribute("inert");
    expect(footer).toHaveAttribute("inert", "preserved");
    expect(document.body.style.overflow).toBe("clip");
    const outside = screen.getByRole("button", { name: "Outside control" });
    focus(outside);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(outside).toHaveFocus();
  });

  it("moves focus only from controls hidden at the 1023/1024 breakpoint", () => {
    resize(1023);
    render(<Harness pageId="research" />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    focus(toggle);
    resize(1024);
    const projects = screen.getByRole("link", {
      name: "PROJECTS",
    });
    expect(projects).toHaveFocus();
    resize(1023);
    expect(toggle).toHaveFocus();
    fireEvent.click(toggle);
    focus(screen.getByRole("link", { name: "Research" }));
    resize(1024);
    expect(projects).toHaveFocus();
    expect(screen.getByRole("main")).not.toHaveAttribute("inert");
    expect(document.body.style.overflow).toBe("");
    const desktopResume = screen.getByRole("button", { name: "Resume" });
    focus(desktopResume);
    resize(1023);
    expect(toggle).toHaveFocus();
    resize(1024);
    expect(projects).toHaveFocus();
    const outside = screen.getByRole("button", { name: "Outside control" });
    focus(outside);
    resize(1023);
    expect(outside).toHaveFocus();
    resize(1024);
    expect(outside).toHaveFocus();
  });

  it("does not steal focus on idle Escape and returns desktop submenu focus to its parent", () => {
    resize(1440);
    render(<Harness />);
    const outside = screen.getByRole("button", { name: "Outside control" });
    focus(outside);
    const idleEscape = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    act(() => document.dispatchEvent(idleEscape));
    expect(idleEscape.defaultPrevented).toBe(false);
    expect(outside).toHaveFocus();
    const projects = screen.getByRole("link", {
      name: "PROJECTS",
    });
    focus(projects);
    focus(screen.getByRole("link", { name: "Research" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(projects).toHaveFocus();
    expect(document.querySelector("#navbar")).not.toHaveClass("gnb-expanded");
    expect(document.querySelector("#navbar")).toHaveClass("nav-force-close");
  });

  it.each([390, 767, 768, 1440])(
    "restores a visible materials entry after every close at %spx without network",
    (width) => {
      resize(width);
      const fetch = vi.spyOn(window, "fetch").mockResolvedValue(new Response());
      render(
        <StrictMode>
          <Harness />
        </StrictMode>,
      );
      const toggle = screen.getByRole("button", { name: "Open Email Popup" });
      for (const closeWithEscape of [false, true, false]) {
        if (width < 768) openTestMaterials();
        else fireEvent.click(toggle);
        const minimize = screen.getByRole("button", { name: "Minimize Popup" });
        expect(minimize).toHaveFocus();
        expect(toggle).toHaveAttribute("tabindex", "-1");
        expect(toggle).toHaveAttribute("aria-hidden", "true");
        expect(
          screen.getByRole("textbox", { name: "Email address (coming soon)" }),
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: /Receive breadme package/ }),
        ).toBeDisabled();
        expect(screen.getByRole("main")).not.toHaveAttribute("inert");
        if (closeWithEscape) fireEvent.keyDown(document, { key: "Escape" });
        else fireEvent.click(minimize);
        expect(
          width < 768
            ? screen.getByRole("button", { name: "Open menu" })
            : toggle,
        ).toHaveFocus();
        expect(toggle).not.toHaveAttribute("aria-hidden");
        expect(toggle).not.toHaveAttribute("tabindex");
        expect(document.querySelector("#materials-content")).toHaveAttribute(
          "hidden",
        );
      }
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("removes materials from the mobile menu but preserves desktop actions and navigation", () => {
    const openMaterials = vi.fn();
    render(<OriginalHeader pageId="home" onOpenMaterials={openMaterials} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.querySelector("#navMenu")!;
    expect(menu.querySelectorAll("a")).toHaveLength(12);
    expect(
      menu.querySelectorAll("button, [data-materials-action]"),
    ).toHaveLength(0);
    expect(menu).not.toHaveTextContent(/Resume|Portfolio/);
    fireEvent.keyDown(document, { key: "Escape" });
    resize(1440);
    for (const name of ["Resume", "Portfolio PDF"]) {
      const action = screen.getByRole("button", { name });
      expect(menu).not.toContainElement(action);
      fireEvent.click(action);
    }
    expect(openMaterials).toHaveBeenCalledTimes(2);
  });

  it("does not dismiss or focus the inert popup behind an open mobile menu", () => {
    render(<Harness initiallyOpenMaterials />);
    const popupToggle = document.querySelector("#popupToggle")!;
    const menuToggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(menuToggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuToggle).toHaveFocus();
    expect(popupToggle).toHaveAttribute("aria-expanded", "true");
    expect(document.querySelector("#email-popup")).not.toHaveAttribute("inert");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(menuToggle).toHaveFocus();
    expect(popupToggle).toHaveAttribute("aria-expanded", "false");
  });

  it("cleans up popup observers and timers after StrictMode replay and unmount", () => {
    vi.useFakeTimers();
    try {
      const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
      const view = render(
        <StrictMode>
          <Harness />
        </StrictMode>,
      );
      expect(vi.getTimerCount()).toBe(1);
      expect(disconnect).toHaveBeenCalledTimes(1);
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
      expect(disconnect).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("retains open-panel footer docking and closes to the mobile menu", () => {
    let footerTop = 4000;
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
      function (this: HTMLElement) {
        return this.id === "email-popup" ? 280 : 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.classList.contains("footer")) return rect(footerTop);
        return rect(0, 0, 0, 0);
      },
    );
    render(<Harness />);
    openTestMaterials();
    const popup = document.querySelector<HTMLElement>("#email-popup")!;
    expect(popup.style.position).toBe("fixed");
    expect(popup.style.bottom).toBe("2rem");
    footerTop = 500;
    fireEvent.scroll(window);
    expect(popup.style.position).toBe("absolute");
    expect(popup.style.top).toBe("188px");
    expect(popup.style.bottom).toBe("auto");
    fireEvent.click(screen.getByRole("button", { name: "Minimize Popup" }));
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    expect(popup).toHaveClass("minimized");
    expect(document.querySelector("#materials-content")).toHaveAttribute(
      "hidden",
    );
  });

  it.each(["home", "projects", "articles"])(
    "restores shortcut focus after a 768-to-390 resize on %s without stealing other focus",
    (pageId) => {
      resize(768);
      render(<Harness pageId={pageId} />);
      const shortcut = screen.getByRole("button", { name: "Open Email Popup" });
      const menuToggle = screen.getByRole("button", { name: "Open menu" });
      focus(shortcut);
      // Browsers may blur display:none controls before the resize handler runs.
      act(() => shortcut.blur());
      expect(document.body).toHaveFocus();
      resize(390);
      expect(menuToggle).toHaveFocus();
      resize(768);
      focus(shortcut);
      resize(767);
      expect(menuToggle).toHaveFocus();
      const outside = screen.getByRole("button", { name: "Outside control" });
      focus(outside);
      resize(768);
      resize(390);
      expect(outside).toHaveFocus();
    },
  );

  it("returns Home materials focus to the menu both within and after its Hero", () => {
    let heroTop = 0;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.id === "home") return rect(heroTop, 0, 390, 844);
        if (this.classList.contains("footer")) return rect(4000);
        return rect(0, 0, 0, 0);
      },
    );
    render(<Harness hideMinimizedDuringHomeHero />);
    for (const top of [0, -900]) {
      heroTop = top;
      fireEvent.scroll(window);
      openTestMaterials();
      expect(
        screen.getByRole("button", { name: "Minimize Popup" }),
      ).toHaveFocus();
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
    }
  });

  it.each([
    "llm-based-voice-ivr",
    "hopzie-oneclickbuilder",
    "ai-mentoring-agent-detail",
  ])("preserves source neutral navigation on detail %s", (pageId) => {
    render(<Harness pageId={pageId} />);
    expect(screen.getByRole("link", { name: "PROJECTS" })).not.toHaveClass(
      "active",
    );
    expect(
      screen.getByRole("link", { name: "PROJECTS" }).parentElement,
    ).toHaveAttribute("data-current-group", "true");
  });
});
