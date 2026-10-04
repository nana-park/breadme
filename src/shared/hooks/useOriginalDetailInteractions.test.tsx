import { StrictMode, useRef } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOriginalDetailInteractions } from "./useOriginalDetailInteractions";
import { assetUrl } from "@/shared/utils/originalPaths";
import { OriginalProjectsContent } from "@/pages/original/generated/OriginalProjectsContent";
import { OriginalVoiceIvrContent } from "@/pages/original/generated/OriginalVoiceIvrContent";
import { OriginalHopzieContent } from "@/pages/original/generated/OriginalHopzieContent";
import { OriginalMentoringContent } from "@/pages/original/generated/OriginalMentoringContent";

function ProjectsFixture() {
  const root = useRef<HTMLElement>(null);
  useOriginalDetailInteractions("projects", root);
  return (
    <main ref={root}>
      {["One", "Two"].map((name) => (
        <section key={name} aria-label={name}>
          {[0, 1, 2, 3, 4].map((number) => (
            <div className="hidden-project hidden" key={number}>
              {name} project {number}
            </div>
          ))}
          <button
            data-original-click="expandProjects(this)"
            aria-expanded="false"
          >
            <span>View more projects</span>
            <svg />
          </button>
        </section>
      ))}
      <div className="group/list">
        <div>
          <button
            data-original-click="original nested disclosure"
            aria-expanded="false"
          >
            <span className="more-text">View projects</span>
            <span className="less-text hidden">Hide projects</span>
            <svg />
          </button>
        </div>
        <div className="hidden group-[.is-expanded]/list:flex">
          Group project
        </div>
      </div>
      <details>
        <summary>LINE WORKS AiCall</summary>
        <div>
          <a href="/projects/llm-based-voice-ivr.html">Deep dive</a>
        </div>
      </details>
      <details>
        <summary>NAVER CareCall</summary>
        <div>CareCall projects</div>
      </details>
    </main>
  );
}

function DetailFixture({
  page = "hopzie-oneclickbuilder",
  prefix = "hopzie",
}: {
  page?: string;
  prefix?: string;
}) {
  useOriginalDetailInteractions(page);
  return (
    <main>
      <div id={`${prefix}-tabs`}>
        <button
          className={`${prefix}-tab-btn active bg-black text-white`}
          data-target="tab-storefront"
        >
          Storefront
        </button>
        <button
          className={`${prefix}-tab-btn text-zinc-500`}
          data-target="tab-building"
        >
          Building
        </button>
        <button
          className={`${prefix}-tab-btn text-zinc-500`}
          data-target="tab-demo"
        >
          Demo
        </button>
      </div>
      <section className={`${prefix}-tab-content block`} id="tab-storefront">
        Original storefront
      </section>
      <section className={`${prefix}-tab-content hidden`} id="tab-building">
        <button data-original-click="const overlay = document.getElementById('storefront-overlay');">
          Generate Commerce Page
        </button>
        <div id="storefront-overlay" style={{ opacity: 1 }}>
          Storefront overlay
        </div>
      </section>
      <section className={`${prefix}-tab-content hidden`} id="tab-demo">
        <iframe
          title="Demo video"
          src="https://www.youtube.com/embed/ma-IFITSs6o?mute=1&enablejsapi=1"
        />
        <a
          href="#"
          data-original-href="javascript:void(0)"
          data-original-click="document.querySelector('.hopzie-tab-btn[data-target=tab-storefront]').click()"
        >
          View storefront
        </a>
      </section>
      <section className={`${prefix}-tab-content hidden`} id="unreachable-tab">
        Source hidden example
      </section>
      <img
        src="/creator.jpg"
        alt="Haeyong"
        className="creator-avatar"
        data-original-error="original avatar fallback"
      />
    </main>
  );
}

function MockupFixture() {
  useOriginalDetailInteractions("ai-mentoring-agent-detail");
  return (
    <main>
      <div
        className="original-mentoring-mockup-frame"
        data-testid="mockup-frame"
      >
        <div className="original-mentoring-mockup" data-testid="mockup">
          <input id="auto-toggle" type="checkbox" defaultChecked />
          <div id="auto-config" style={{ display: "flex" }}>
            Daily at 9:00
          </div>
        </div>
      </div>
    </main>
  );
}

function AboutFixture() {
  useOriginalDetailInteractions("about");
  return (
    <main>
      <div id="ebs-yt-player" />
    </main>
  );
}

const apiWindow = window as Window & {
  YT?: unknown;
  onYouTubeIframeAPIReady?: () => void;
};
beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});
afterEach(() => {
  delete apiWindow.YT;
  delete apiWindow.onYouTubeIframeAPIReady;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("original project disclosures", () => {
  it("reveals three projects at a time, collapses all, and isolates each card", () => {
    render(
      <StrictMode>
        <ProjectsFixture />
      </StrictMode>,
    );
    const first = screen.getByRole("region", { name: "One" });
    const second = screen.getByRole("region", { name: "Two" });
    const button = within(first).getByRole("button");
    fireEvent.click(button);
    expect(first.querySelectorAll(".hidden-project.hidden")).toHaveLength(2);
    expect(second.querySelectorAll(".hidden-project.hidden")).toHaveLength(5);
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveTextContent("View fewer projects");
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(button);
    expect(first.querySelectorAll(".hidden-project.hidden")).toHaveLength(5);
    expect(button).toHaveTextContent("View more projects");
  });

  it("opens only one native disclosure without moving its original content", () => {
    const view = render(<ProjectsFixture />);
    const first = screen.getByText("LINE WORKS AiCall").closest("details")!;
    const second = screen.getByText("NAVER CareCall").closest("details")!;
    const content = first.lastElementChild;
    fireEvent.click(screen.getByText("LINE WORKS AiCall"));
    expect(first.open).toBe(true);
    expect(content).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(screen.getByText("NAVER CareCall"));
    expect(first.open).toBe(false);
    expect(second.open).toBe(true);
    expect(first.lastElementChild).toBe(content);
    fireEvent.click(screen.getByText("NAVER CareCall"));
    expect(second.open).toBe(false);
    view.unmount();
    expect(first.hasAttribute("style")).toBe(false);
  });

  it("cancels stale close transitions on rapid reopen and clears all timers on unmount", () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia("x"),
      matches: false,
    });
    const view = render(<ProjectsFixture />);
    const summary = screen.getByText("LINE WORKS AiCall");
    const details = summary.closest("details")!;
    fireEvent.click(summary);
    fireEvent.click(summary);
    fireEvent.click(summary);
    act(() => vi.advanceTimersByTime(400));
    expect(details.open).toBe(true);
    expect(summary).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(summary);
    view.unmount();
    // jsdom queues its own native details toggle event when attributes are restored.
    act(() => vi.advanceTimersByTime(0));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("toggles nested group labels and scrolls only on collapse", () => {
    render(<ProjectsFixture />);
    const button = screen.getByText("View projects").closest("button")!;
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Group project")).toHaveAttribute(
      "aria-hidden",
      "false",
    );
    fireEvent.click(button);
    expect(screen.getByText("Group project")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "nearest",
    });
  });
});

describe("original detail tabs and local demonstrations", () => {
  it.each([
    ["llm-based-voice-ivr", "aicall"],
    ["hopzie-oneclickbuilder", "hopzie"],
    ["ai-mentoring-agent-detail", "mentoring"],
  ])("preserves click and keyboard selection for %s", (page, prefix) => {
    render(
      <StrictMode>
        <DetailFixture page={page} prefix={prefix} />
      </StrictMode>,
    );
    const first = screen.getByRole("tab", { name: "Storefront" });
    expect(first).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Building" }));
    expect(screen.getByRole("tabpanel", { name: "Building" })).toBeVisible();
    expect(screen.getByText("Original storefront")).not.toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Building" }), {
      key: "End",
    });
    expect(screen.getByRole("tab", { name: "Demo" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Demo" }), {
      key: "ArrowRight",
    });
    expect(first).toHaveFocus();
    expect(first).toHaveClass("bg-black", "text-white", "active");
    expect(screen.getByText("Source hidden example")).not.toBeVisible();
  });

  it("pauses hidden YouTube media and handles the existing Storefront shortcut", () => {
    render(<DetailFixture />);
    const iframe = screen.getByTitle("Demo video") as HTMLIFrameElement;
    const pause = vi.spyOn(iframe.contentWindow!, "postMessage");
    fireEvent.load(iframe);
    expect(pause).toHaveBeenCalledWith(
      JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
      "https://www.youtube.com",
    );
    fireEvent.click(screen.getByRole("tab", { name: "Demo" }));
    fireEvent.click(screen.getByRole("link", { name: "View storefront" }));
    expect(screen.getByRole("tab", { name: "Storefront" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("toggles only the local Generate overlay and attempts each avatar fallback once", () => {
    render(<DetailFixture />);
    fireEvent.click(screen.getByRole("tab", { name: "Building" }));
    const button = screen.getByRole("button", {
      name: "Generate Commerce Page",
    });
    fireEvent.click(button);
    expect(screen.getByText("Storefront overlay")).toHaveStyle({
      opacity: "0",
    });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(screen.getByText("Storefront overlay")).toHaveStyle({
      opacity: "1",
    });
    const image = screen.getByAltText("Haeyong") as HTMLImageElement;
    fireEvent.error(image);
    expect(image.getAttribute("src")).toBe(
      assetUrl(
        "https://ui-avatars.com/api/?name=H&background=050505&color=fff",
      ),
    );
    const fallback = image.src;
    fireEvent.error(image);
    expect(image.src).toBe(fallback);
  });

  it("scales mentoring by its frame width, toggles config, and disconnects ResizeObserver", () => {
    let resized: (() => void) | undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    const view = render(<MockupFixture />);
    const frame = screen.getByTestId("mockup-frame");
    Object.defineProperty(frame, "clientWidth", {
      configurable: true,
      value: 425,
    });
    act(() => resized?.());
    expect(screen.getByTestId("mockup").style.zoom).toBe("0.5");
    expect(observe).toHaveBeenCalledWith(frame);
    const toggle = screen.getByRole("checkbox", {
      name: "Scheduled automation demonstration",
    });
    fireEvent.click(toggle);
    expect(screen.getByText("Daily at 9:00")).not.toBeVisible();
    fireEvent.click(toggle);
    expect(screen.getByText("Daily at 9:00")).toHaveStyle({ display: "flex" });
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});

describe("About interview lifecycle", () => {
  it("retains a muted real embed and cancels its pending API request on unmount", async () => {
    vi.useFakeTimers();
    const previous = vi.fn();
    apiWindow.onYouTubeIframeAPIReady = previous;
    const view = render(
      <StrictMode>
        <AboutFixture />
      </StrictMode>,
    );
    const iframe = screen.getByTitle(
      "Building Warm Conversation — EBS interview",
    ) as HTMLIFrameElement;
    const url = new URL(iframe.src);
    expect(url.searchParams.get("mute")).toBe("1");
    expect(url.searchParams.get("autoplay")).toBe("0");
    expect(url.searchParams.get("start")).toBe("2230");
    expect(
      document.querySelectorAll(
        'script[src="https://www.youtube.com/iframe_api"]',
      ),
    ).toHaveLength(1);
    view.unmount();
    expect(apiWindow.onYouTubeIframeAPIReady).toBe(previous);
    expect(
      document.querySelectorAll(
        'script[src="https://www.youtube.com/iframe_api"]',
      ),
    ).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
    await act(async () => {});
  });

  it("loops both original excerpts, never starts with sound, and destroys its player", async () => {
    vi.useFakeTimers();
    vi.mocked(window.matchMedia).mockReturnValue({
      ...window.matchMedia("x"),
      matches: false,
    });
    const player = {
      mute: vi.fn(),
      seekTo: vi.fn(),
      playVideo: vi.fn(),
      pauseVideo: vi.fn(),
      getCurrentTime: vi.fn(() => 2230),
      destroy: vi.fn(),
    };
    let ready: ((event: { target: typeof player }) => void) | undefined;
    const Player = vi.fn(function (
      _element: HTMLElement,
      options: { events: { onReady: typeof ready } },
    ) {
      ready = options.events.onReady;
      return player;
    });
    apiWindow.YT = { Player };
    const view = render(<AboutFixture />);
    await act(async () => {});
    act(() => ready?.({ target: player }));
    expect(player.mute).toHaveBeenCalledOnce();
    expect(player.seekTo).toHaveBeenCalledWith(2230, true);
    expect(player.playVideo).toHaveBeenCalledOnce();
    player.getCurrentTime.mockReturnValue(2257);
    act(() => vi.advanceTimersByTime(250));
    expect(player.seekTo).toHaveBeenLastCalledWith(2295, true);
    player.getCurrentTime.mockReturnValue(2310);
    act(() => vi.advanceTimersByTime(250));
    expect(player.seekTo).toHaveBeenLastCalledWith(2230, true);
    view.unmount();
    expect(player.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps native playback available when the optional API fails", async () => {
    vi.useFakeTimers();
    const view = render(<AboutFixture />);
    await act(async () => vi.advanceTimersByTime(15000));
    expect(
      screen.getByTitle("Building Warm Conversation — EBS interview"),
    ).toBeInTheDocument();
    expect(apiWindow.onYouTubeIframeAPIReady).toBeUndefined();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

function SourceFixture({ page }: { page: string }) {
  const root = useRef<HTMLElement>(null);
  useOriginalDetailInteractions(page, root);
  return (
    <main ref={root}>
      {page === "projects" ? (
        <OriginalProjectsContent />
      ) : page === "llm-based-voice-ivr" ? (
        <OriginalVoiceIvrContent />
      ) : page === "hopzie-oneclickbuilder" ? (
        <OriginalHopzieContent />
      ) : (
        <OriginalMentoringContent />
      )}
    </main>
  );
}

describe("generated source JSX compatibility", () => {
  it("binds all nine real details and both original project expansion buttons", () => {
    const { container } = render(<SourceFixture page="projects" />);
    const details = Array.from(container.querySelectorAll("details"));
    expect(details).toHaveLength(9);
    details.forEach((detail) => {
      fireEvent.click(detail.querySelector("summary")!);
      expect(detail.open).toBe(true);
      expect(details.filter((candidate) => candidate.open)).toHaveLength(1);
    });
    const expanders = container.querySelectorAll(
      '[data-original-click="expandProjects(this)"]',
    );
    expect(expanders).toHaveLength(2);
    expanders.forEach((button) => {
      expect(
        button.parentElement!.querySelectorAll(".hidden-project.hidden"),
      ).toHaveLength(2);
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(
        button.parentElement!.querySelectorAll(".hidden-project.hidden"),
      ).toHaveLength(0);
    });
    expect(
      container.querySelectorAll(
        'button[aria-controls^="original-project-group-"]',
      ),
    ).toHaveLength(6);
  });

  it.each([
    "llm-based-voice-ivr",
    "hopzie-oneclickbuilder",
    "ai-mentoring-agent-detail",
  ])("binds the five real feature tabs on %s", (page) => {
    render(<SourceFixture page={page} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(5);
    tabs.forEach((tab) => {
      fireEvent.click(tab);
      expect(tab).toHaveAttribute("aria-selected", "true");
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    });
    if (page === "ai-mentoring-agent-detail") {
      fireEvent.click(screen.getByRole("tab", { name: "Workflow Automation" }));
      const toggle = screen.getByRole("checkbox", {
        name: "Scheduled automation demonstration",
      });
      fireEvent.click(toggle);
      expect(document.getElementById("auto-config")).toHaveStyle({
        display: "none",
      });
    }
  });
});
