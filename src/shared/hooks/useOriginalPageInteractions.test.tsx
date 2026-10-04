import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOriginalPageInteractions } from "./useOriginalPageInteractions";

function Fixture({ page = "home" }: { page?: string }) {
  useOriginalPageInteractions(page);
  return (
    <main>
      <h2 id="career-role-title">As an AI Product Manager,</h2>
      <p id="career-role-desc">Original description</p>
      <div id="career-container">
        <div id="career-page-1">First careers</div>
        <div id="career-page-2">Second careers</div>
      </div>
      <span id="career-page-indicator">01 / 02</span>
      <button id="btn-career-prev" />
      <button id="btn-career-next" />
      <div className="footprint-gallery-container">
        <div className="group/card">
          <h3>APEC 2025</h3>
        </div>
      </div>
    </main>
  );
}

function CertificationFixture() {
  useOriginalPageInteractions("qualified");
  return (
    <main>
      <div id="cert-tabs">
        <button className="cert-tab-btn active" data-target="cert-ai">
          AI &amp; Tools
        </button>
        <button className="cert-tab-btn" data-target="cert-data">
          Data &amp; Statistics
        </button>
        <button className="cert-tab-btn" data-target="cert-psycho">
          Psychology
        </button>
        <button className="cert-tab-btn" data-target="cert-lang">
          Languages
        </button>
      </div>
      <div className="cert-panel" id="cert-ai">
        AI content
      </div>
      <div className="cert-panel" id="cert-data">
        Data content
      </div>
      <div className="cert-panel" id="cert-psycho">
        Psychology content
      </div>
      <div className="cert-panel" id="cert-lang">
        Language content
      </div>
    </main>
  );
}

function LectureFixture() {
  useOriginalPageInteractions("lectures");
  return (
    <main>
      {["Kyonggi", "Dongguk"].map((title) => (
        <div data-lecture-carousel key={title}>
          <div className="lecture-slides" data-current-index="0">
            <img src="/one.png" alt={`${title} one`} />
            <img src="/two.png" alt={`${title} two`} />
            <img src="/three.png" alt={`${title} three`} />
          </div>
          <button data-prev-btn className="hidden" />
          <button data-next-btn className="hidden" />
          <div className="lecture-indicators hidden" />
        </div>
      ))}
    </main>
  );
}

function GalleryFixture() {
  useOriginalPageInteractions("enjoy");
  return (
    <main>
      <button className="life-filter-btn" data-target="col-culinary">
        Culinary
      </button>
      <button className="life-filter-btn" data-target="col-travel">
        Travel
      </button>
      <div className="left-col" id="col-culinary">
        Culinary intro
      </div>
      <div className="left-col" id="col-travel">
        Travel intro
      </div>
      <div className="right-gallery" id="gallery-col-culinary">
        Food photographs
      </div>
      <div className="right-gallery hidden" id="gallery-col-travel">
        <div className="column">
          <div data-dest="Korea">Jeju</div>
        </div>
        <div className="column">
          <div data-dest="Europe">Paris</div>
        </div>
      </div>
      <a href="#" className="travel-dest-btn" data-filter="All Destinations">
        All Destinations
        <span className="indicator-dot" />
      </a>
      <a href="#" className="travel-dest-btn" data-filter="Korea">
        Korea
      </a>
      <a href="#" className="travel-dest-btn" data-filter="North America">
        North America
      </a>
    </main>
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches:
      query.includes("prefers-reduced-motion") || query.includes("hover: none"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("source page interaction lifecycle", () => {
  it("switches both original career buttons and exact role copy", () => {
    render(<Fixture />);
    fireEvent.click(screen.getByRole("button", { name: "Next career page" }));
    expect(screen.getByText("02 / 02")).toBeInTheDocument();
    expect(screen.getByText("As an IT Innovator,")).toBeInTheDocument();
    expect(screen.getByText("Second careers")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    expect(screen.getByText("First careers")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Previous career page" }),
    );
    expect(screen.getByText("01 / 02")).toBeInTheDocument();
    expect(screen.getByText("As an AI Product Manager,")).toBeInTheDocument();
  });

  it("does not double-bind career handlers in StrictMode", () => {
    render(
      <StrictMode>
        <Fixture page="career" />
      </StrictMode>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next career page" }));
    expect(screen.getByText("02 / 02")).toBeInTheDocument();
  });

  it("cancels the role fade timeout when its page unmounts", () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia("x"),
      matches: false,
    });
    const view = render(<Fixture />);
    fireEvent.click(screen.getByRole("button", { name: "Next career page" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("centers a footprint by keyboard without scrolling the document", () => {
    render(<Fixture />);
    fireEvent.keyDown(
      screen.getByRole("button", { name: "Center APEC 2025" }),
      { key: "Enter" },
    );
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: "auto" }),
    );
  });

  it("selects all four certification panels through clicks and arrow keys", () => {
    render(<CertificationFixture />);
    fireEvent.click(screen.getByRole("tab", { name: "Data & Statistics" }));
    expect(
      screen.getByRole("tabpanel", { name: "Data & Statistics" }),
    ).toHaveStyle({ display: "grid" });
    expect(document.getElementById("cert-ai")).toHaveStyle({ display: "none" });
    fireEvent.keyDown(screen.getByRole("tab", { name: "Data & Statistics" }), {
      key: "ArrowRight",
    });
    expect(screen.getByRole("tab", { name: "Psychology" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "Psychology" }), {
      key: "End",
    });
    expect(screen.getByRole("tabpanel", { name: "Languages" })).toBeVisible();
  });

  it("wraps lecture slides independently, creates one dot set and removes it on cleanup", () => {
    const view = render(
      <StrictMode>
        <LectureFixture />
      </StrictMode>,
    );
    const carousels = screen.getAllByRole("region");
    expect(
      carousels[0].querySelectorAll(".lecture-indicators button"),
    ).toHaveLength(3);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Previous photo" })[0],
    );
    expect(carousels[0].querySelector(".lecture-slides")).toHaveAttribute(
      "data-current-index",
      "2",
    );
    expect(carousels[1].querySelector(".lecture-slides")).toHaveAttribute(
      "data-current-index",
      "0",
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Show photo 2 of 3" })[1],
    );
    expect(carousels[1].querySelector(".lecture-slides")).toHaveStyle({
      transform: "translateX(-100%)",
    });
    expect(
      screen.getAllByRole("button", { name: "Next photo" })[0],
    ).toHaveStyle({ opacity: "1" });
    view.unmount();
    expect(
      carousels[0].querySelectorAll(".lecture-indicators button"),
    ).toHaveLength(0);
  });

  it("restores Enjoy tab state and filters the real image nodes without reparenting", () => {
    window.sessionStorage.setItem("activeLifeTab", "col-travel");
    render(<GalleryFixture />);
    expect(screen.getByRole("button", { name: "Travel" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const jeju = screen.getByText("Jeju");
    const parent = jeju.parentElement;
    fireEvent.click(screen.getByRole("link", { name: "Korea" }));
    expect(jeju).toBeVisible();
    expect(screen.getByText("Paris")).not.toBeVisible();
    expect(jeju.parentElement).toBe(parent);
    fireEvent.click(screen.getByRole("link", { name: "North America" }));
    expect(jeju).not.toBeVisible();
    fireEvent.click(screen.getByRole("link", { name: "All Destinations" }));
    expect(jeju).toBeVisible();
    expect(screen.getByText("Paris")).toBeVisible();
    act(() =>
      fireEvent.click(screen.getByRole("button", { name: "Culinary" })),
    );
    expect(window.sessionStorage.getItem("activeLifeTab")).toBe("col-culinary");
  });
});
