import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { homeExperience } from "@/content/site/homeExperience";
vi.mock("@/shared/ui/SplineHero/SplineHero", () => ({
  SplineHero: () => <div data-testid="original-spline" />,
}));

describe("Original portfolio React migration", () => {
  it("preserves Home section order and education while refining career copy", async () => {
    render(<App />);
    // The first cold lazy import transforms the preserved original page and styles.
    // Wait for real content rather than asserting against the Suspense fallback.
    expect(
      await screen.findByRole("heading", { level: 1 }, { timeout: 5000 }),
    ).toHaveTextContent("Designing AI Product Experiences Across Markets");
    expect(
      screen.getByRole("heading", { name: "Academic Standing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Selected Projects" }),
    ).toBeVisible();
    const sections = Array.from(
      document.querySelectorAll("[data-original-page='home'] > section"),
    );
    expect(sections.map((section) => section.id)).toEqual([
      "home",
      "partners",
      "footprint",
      "history",
      "history-2",
      "vision",
    ]);
    const researchFocus = screen.getByText(
      "Focused on human cognition, statistical modeling, and AI technical literacy, with research published in SSCI-indexed journals.",
    );
    expect(researchFocus.closest("#history-2")).not.toBeNull();
    expect(researchFocus.querySelector("br")).toBeNull();
    expect(document.querySelectorAll("[data-home-company]")).toHaveLength(2);
    expect(document.querySelector("#career-page-1")).not.toBeInTheDocument();
    expect(screen.queryByText("구조 미리보기")).not.toBeInTheDocument();
    expect(screen.queryByTestId("original-spline")).not.toBeInTheDocument();
    expect(
      screen.getByText("Previously at NAVER Cloud · SK Telecom"),
    ).toBeVisible();
    expect(
      screen.queryByText(/Grounded in psychology and Human–AI Interaction/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Helping people follow through:"),
    ).not.toBeInTheDocument();
  });
  it("keeps photos and motion out of the selected career layout", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Selected Projects" });
    const history = document.querySelector("#history")!;
    expect(
      history.querySelectorAll(
        "img, canvas, .mesh-blob-1, #history-glow, #history-dark-container",
      ),
    ).toHaveLength(0);
    expect(document.querySelectorAll("#history-2 img")).toHaveLength(2);
    expect(document.querySelectorAll("#partners .logo-track img")).toHaveLength(
      15,
    );
  });
  it("shows short outcomes in the selected order without separate caveat lines", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Selected Projects" });
    const naver = document.querySelector("[data-home-company='naver-cloud']")!;
    const skt = document.querySelector("[data-home-company='sk-telecom']")!;
    expect(
      Array.from(
        naver.querySelectorAll("[data-home-outcomes] li"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "No. 1 in Japan’s voicebot market (FY2024)",
      "2025 APEC summit showcase",
      "AI Call dropout: 33% → 8%",
    ]);
    expect(
      Array.from(
        skt.querySelectorAll("[data-home-outcomes] li"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "2024 GDWEB GRAND PRIZE",
      "5.5M subscribers · 22% growth",
      "Home-feed CTR: +3.74 percentage points",
    ]);
    expect(naver.querySelector("li a")).toHaveAttribute(
      "href",
      "https://line-works.com/pr/20260526-2/",
    );
    expect(skt.querySelector("li a")).toHaveAttribute(
      "href",
      "https://www.gdweb.co.kr/sub/view.asp?str_no=23244",
    );
    expect(skt).not.toHaveTextContent("No. 1");
    expect(
      Array.from(naver.querySelectorAll("p"), (item) => item.textContent),
    ).toEqual(["2024.07–2026.01 · 2023.07–2024.01", "AI Product Manager"]);
    expect(
      Array.from(skt.querySelectorAll("p"), (item) => item.textContent),
    ).toEqual(["2024.04–2024.07", "AI Product Manager"]);
    expect(
      Array.from(naver.querySelectorAll("[data-home-outcomes] li"), (item) =>
        item.getAttribute("data-product"),
      ),
    ).toEqual(["LINE WORKS AiCall", "CLOVA CareCall", "CLOVA CareCall"]);
    expect(
      Array.from(skt.querySelectorAll("[data-home-outcomes] li"), (item) =>
        item.getAttribute("data-product"),
      ),
    ).toEqual(["A.Dot", "A.Dot", "A.Dot"]);
    expect(naver.querySelector("li a")).toHaveAttribute(
      "title",
      "LINE WORKS AiCall: No. 1 in Japan’s voicebot market (FY2024)",
    );
    expect(skt.querySelector("li a")).toHaveAttribute(
      "title",
      "A.Dot: 2024 GDWEB GRAND PRIZE",
    );
    expect(
      Array.from(
        naver.querySelectorAll("[data-home-products] li"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "NAVER Care Call",
      "NAVER Care Call Console",
      "LINE WORKS AI Call",
    ]);
    expect(
      Array.from(
        skt.querySelectorAll("[data-home-products] li"),
        (item) => item.textContent,
      ),
    ).toEqual(["A.Dot"]);
    for (const card of [naver, skt]) {
      const labels = Array.from(card.querySelectorAll("h4"));
      expect(labels.map((label) => label.textContent)).toEqual([
        "Products",
        "Outcomes",
      ]);
      expect(labels[0].className).toBe(labels[1].className);
    }
    for (const outcome of [
      ...naver.querySelectorAll("[data-home-outcomes] li"),
      ...skt.querySelectorAll("[data-home-outcomes] li"),
    ]) {
      expect(outcome.textContent).not.toMatch(/\.$/);
    }
    expect(naver).not.toHaveTextContent("event trials");
    expect(skt).not.toHaveTextContent("staged tests");
    expect(homeExperience.items[0].outcomes[2].measurementContext).toContain(
      "Event trials with general visitors",
    );
    expect(homeExperience.items[1].outcomes[2].measurementContext).toContain(
      "Staged content tests versus January",
    );
    expect(naver).not.toHaveTextContent("Contribution");
    expect(skt).not.toHaveTextContent("Used SQL analysis");
    expect(screen.getByRole("link", { name: /Full career/ })).toHaveAttribute(
      "href",
      "/career.html",
    );
  });
  it("keeps native original navigation destinations and branding", async () => {
    render(<App />);
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: "breadme home" })).toHaveAttribute(
      "href",
      "/index.html",
    );
    expect(screen.getByRole("link", { name: "View my work" })).toHaveAttribute(
      "href",
      "/projects.html",
    );
    expect(document.documentElement.lang).toBe("en");
  });
  it("keeps Home partner-caption words separated when the responsive break is hidden", async () => {
    render(<App />);
    const caption = await screen.findByText(/Experience & collaboration with/);
    // WHY: A hidden responsive <br> contributes no whitespace to the mobile copy.
    expect(caption).toHaveTextContent(
      /^Experience & collaboration with industry leading organizations:$/,
    );
    expect(caption.querySelector("br")).toHaveClass("hidden", "sm:block");
  });
  it("opens the mobile menu, supports Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: "Open menu" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
  it("keeps the original application-materials UI honestly pending", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Open Email Popup" }));
    expect(
      screen.getByRole("heading", { name: "Application Materials" }),
    ).toBeVisible();
    expect(screen.getByText("Coming Soon")).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Email address (coming soon)" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Minimize Popup" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Open Email Popup" }),
      ).toHaveAttribute("aria-expanded", "false"),
    );
  });
  it("keeps an accessible skip link without rewriting the original content", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
  });
  it("does not present an unfinished Korean version as translated", async () => {
    const user = userEvent.setup();
    render(<App />);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "Korean" }));
    expect(alert).toHaveBeenCalledWith("Coming soon!");
    expect(document.documentElement.lang).toBe("en");
  });
});
