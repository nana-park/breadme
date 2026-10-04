import { describe, expect, it } from "vitest";
import { staticPageEntries } from "../../scripts/static-pages";
import {
  originalPageIds,
  originalRoutePaths,
  resolveOriginalPage,
} from "./originalRoutes";

describe("static hosting routes", () => {
  it("keeps all 14 original routes unique and inside the output directory", () => {
    const routes = Object.values(originalRoutePaths);
    expect(Object.keys(originalRoutePaths)).toEqual([...originalPageIds]);
    expect(new Set(routes).size).toBe(14);
    for (const route of routes) {
      expect(route).toMatch(/^(projects\/)?[a-z-]+\.html$/);
    }
  });

  for (const base of ["/", "/breadme/"]) {
    it(`resolves every direct HTML entry below ${base}`, () => {
      expect(resolveOriginalPage(base)).toBe("home");
      for (const pageId of originalPageIds) {
        expect(resolveOriginalPage(base + originalRoutePaths[pageId])).toBe(
          pageId,
        );
      }
    });
  }

  it("preserves base-absolute assets in every emitted deep entry", () => {
    const html = '<script src="/breadme/assets/index.js"></script>';
    const entries = staticPageEntries(html);
    expect(entries).toHaveLength(13);
    expect(entries.map((entry) => entry.fileName)).toEqual(
      Object.values(originalRoutePaths).filter(
        (route) => route !== "index.html",
      ),
    );
    expect(entries.every((entry) => entry.source === html)).toBe(true);
    expect(
      entries.filter((entry) => entry.fileName.startsWith("projects/")),
    ).toHaveLength(3);
  });
});
