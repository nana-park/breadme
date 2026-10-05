import { statSync } from "node:fs";
import path from "node:path";
import { render, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { originalRoutePaths } from "@/config/originalRoutes";
vi.mock("@/shared/ui/SplineHero/SplineHero", () => ({
  SplineHero: () => <div />,
}));
afterEach(() => vi.unstubAllEnvs());
const base = import.meta.env.BASE_URL;
for (const [pageId, route] of Object.entries(originalRoutePaths)) {
  it(`resolves rendered src/href/inline CSS paths for ${base}${route}`, async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    window.history.replaceState({}, "", `${base}${route}`);
    const { container } = render(<App />);
    // The preserved pages (especially Articles) are transformed on a cold lazy
    // import. Keep the content assertion, but do not mistake a 1s import delay
    // in the test runner for a missing rendered route.
    await waitFor(
      () => expect(container.querySelector("main h1, main h2")).not.toBeNull(),
      { timeout: 5000 },
    );
    expect(
      container
        .querySelector("[data-original-page]")
        ?.getAttribute("data-original-page"),
    ).toBe(pageId);
    let count = 0;
    function verify(value: string) {
      if (!value || /^(#|data:|blob:|mailto:|tel:)/.test(value)) return;
      const url = new URL(value, window.location.href);
      if (url.origin !== window.location.origin) return;
      expect(url.pathname.startsWith(base), value).toBe(true);
      const local =
        decodeURIComponent(url.pathname.slice(base.length)) || "index.html";
      expect(
        statSync(path.join(process.cwd(), "dist", local)).isFile(),
        value,
      ).toBe(true);
      count++;
    }
    for (const el of container.querySelectorAll("[src], [href], [style]")) {
      for (const attribute of ["src", "href"]) {
        const value = el.getAttribute(attribute);
        if (value) verify(value);
      }
      const style = el.getAttribute("style") || "";
      for (const [, value] of style.matchAll(/url\(["']?([^"')]+)["']?\)/g))
        verify(value);
    }
    expect(count).toBeGreaterThan(10);
  });
}
