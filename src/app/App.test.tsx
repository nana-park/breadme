import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { navigation } from "@/config/navigation";
import { homeContent } from "@/content/site/homeContent";
import { siteMetadata } from "@/content/site/siteMetadata";
import { common } from "@/locales/ko/common";

describe("Home foundation", () => {
  it("restores a direct fragment only after the React sections exist", () => {
    window.history.replaceState(null, "", "/#projects");
    render(<App />);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "start",
    });
    expect(
      vi.mocked(HTMLElement.prototype.scrollIntoView).mock.contexts.at(-1),
    ).toBe(document.getElementById("projects"));
    window.history.replaceState(null, "", "/");
  });

  it("renders one main heading, clear preview status, and no invented projects", () => {
    render(<App />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      homeContent.hero.title,
    );
    expect(screen.getByText(homeContent.preview.label)).toBeVisible();
    expect(screen.getByText(homeContent.projects.status)).toBeVisible();
    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(3);
  });

  it("keeps every navigation destination real and keyboard focusable", () => {
    render(<App />);
    for (const { href } of navigation) {
      expect(document.querySelector(href)).toHaveAttribute("tabindex", "-1");
    }
    expect(
      screen.getByRole("link", { name: common.skipToContent }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("opens, closes repeatedly, and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    const button = screen.getByRole("button", { name: common.menuOpen });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
    await user.click(button);
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes navigation and moves focus to the chosen section", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: common.menuOpen }));
    await user.click(
      screen.getByRole("link", {
        name: common.navigation.projects,
      }),
    );
    expect(
      screen.getByRole("button", { name: common.menuOpen }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("projects")).toHaveFocus();
  });

  it("uses the verified original destination instead of broken downloads", () => {
    render(<App />);
    screen
      .getAllByRole("link", { name: common.visitOriginal })
      .forEach((link) =>
        expect(link).toHaveAttribute("href", siteMetadata.originalPortfolioUrl),
      );
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
