import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OriginalArticlesPage } from "./OriginalArticlesPage";
import { originalArticles } from "@/content/original/articles";

function navigateTo(hash: string) {
  act(() => {
    window.history.replaceState(null, "", `/articles.html${hash}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

beforeEach(() => {
  window.history.replaceState(null, "", "/articles.html");
  sessionStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});
afterEach(() => vi.restoreAllMocks());

describe("Original Articles reading flow", () => {
  it("shows the exact hero and the first three dated entries", () => {
    render(<OriginalArticlesPage />);
    expect(
      screen.getByRole("heading", {
        name: "Sharing insights and thoughts on AI product management and user experience.",
      }),
    ).toBeVisible();
    expect(screen.getByAltText("Articles Environment")).toHaveAttribute(
      "src",
      "/original/nahyun_imported/image_source/Projects_Articles/bg.png",
    );
    expect(screen.getByText("September 2023")).toBeVisible();
    expect(
      screen.getAllByRole("link", { name: /^Read Article:/ }),
    ).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: "Previous articles page" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Articles page 1" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("button", { name: "Articles page 6" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to List" }),
    ).not.toBeInTheDocument();
  });
  it("paginates all 18 entries using the original five-page moving window", async () => {
    const user = userEvent.setup();
    render(<OriginalArticlesPage />);
    for (let page = 1; page <= 6; page += 1) {
      expect(
        screen
          .getAllByRole("link", { name: /^Read Article:/ })
          .map((link) => link.getAttribute("href")),
      ).toEqual(
        originalArticles
          .slice((page - 1) * 3, page * 3)
          .map(({ id }) => `#article-detail?id=${id}`),
      );
      if (page < 6)
        await user.click(
          screen.getByRole("button", { name: "Next articles page" }),
        );
    }
    expect(
      screen.getByRole("button", { name: "Next articles page" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Articles page 6" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("button", { name: "Articles page 1" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Previous articles page" }),
    );
    expect(
      screen.getByRole("button", { name: "Articles page 5" }),
    ).toHaveAttribute("aria-current", "page");
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: -150,
      behavior: "smooth",
    });
  });
  it("opens an article and restores its paginated list, scroll, and keyboard focus", async () => {
    const user = userEvent.setup();
    render(<OriginalArticlesPage />);
    await user.click(screen.getByRole("button", { name: "Articles page 2" }));
    const article = originalArticles[3];
    const readLink = screen.getByRole("link", {
      name: `Read Article: ${article.title}`,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 1234,
    });
    readLink.focus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findAllByRole("button", { name: "Back to List" }),
    ).toHaveLength(2);
    expect(window.location.hash).toBe(`#article-detail?id=${article.id}`);
    expect(screen.getByRole("heading", { name: article.title })).toHaveFocus();
    expect(screen.getByText(`Published on ${article.date}`)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View Original (KR)" }),
    ).toHaveAttribute("href", article.url);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    await user.click(
      screen.getAllByRole("button", { name: "Back to List" })[1],
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Articles page 2" }),
      ).toBeVisible(),
    );
    expect(
      screen.getByRole("button", { name: "Articles page 2" }),
    ).toHaveAttribute("aria-current", "page");
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1234);
    expect(readLink).toHaveFocus();
    expect(sessionStorage.getItem("articlesScrollY")).toBeNull();
  });
  it("supports direct detail links and repeated browser Back/Forward hash transitions", () => {
    navigateTo("#article-detail?id=47268");
    render(<OriginalArticlesPage />);
    expect(
      screen.getByRole("heading", { name: "Hockney’s iPad" }),
    ).toBeVisible();
    expect(
      document.getElementById("article-detail-content")!.querySelectorAll("img")
        .length,
    ).toBeGreaterThan(0);
    navigateTo("#articles");
    expect(
      screen.getByRole("navigation", { name: "Articles pagination" }),
    ).toBeVisible();
    navigateTo("#article-detail?id=66504");
    expect(
      screen.getByRole("heading", { name: originalArticles[0].title }),
    ).toBeVisible();
    navigateTo("");
    expect(
      screen.getAllByRole("link", { name: /^Read Article:/ }),
    ).toHaveLength(3);
  });
  it("keeps unknown article links usable by returning to the archive", () => {
    navigateTo("#article-detail?id=missing");
    render(<OriginalArticlesPage />);
    expect(
      screen.getByRole("navigation", { name: "Articles pagination" }),
    ).toBeVisible();
    expect(document.getElementById("article-detail")).toBeNull();
  });
  it("respects reduced motion and avoids unavailable-storage failures", () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
    } as MediaQueryList);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage disabled", "SecurityError");
    });
    render(<OriginalArticlesPage />);
    fireEvent.click(screen.getByRole("button", { name: "Articles page 2" }));
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: -150,
      behavior: "auto",
    });
    const list = document.getElementById("articles-list-container")!;
    expect(() =>
      fireEvent.click(
        within(list).getAllByRole("link", { name: /^Read Article:/ })[0],
      ),
    ).not.toThrow();
  });
});
