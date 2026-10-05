import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
vi.mock("@/shared/ui/SplineHero/SplineHero", () => ({
  SplineHero: () => <div data-testid="original-spline" />,
}));

describe("Original portfolio React migration", () => {
  it("renders the approved text-led Hero and preserves original Home sections", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
      "Designing AI Product Experiences Across Markets",
    );
    expect(
      screen.getByRole("heading", { name: "Academic Standing" }),
    ).toBeInTheDocument();
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
