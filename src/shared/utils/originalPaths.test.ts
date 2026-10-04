import { afterEach, describe, expect, it, vi } from "vitest";
import { originalRoutePaths } from "@/config/originalRoutes";
import externalManifest from "@/content/original/external-asset-manifest.json";
import { assetUrl, originalHref } from "./originalPaths";

afterEach(() => vi.unstubAllEnvs());

describe("GitHub Pages asset and navigation paths", () => {
  for (const base of ["/", "/breadme/"]) {
    it(`keeps every native HTML link below ${base}`, () => {
      vi.stubEnv("BASE_URL", base);
      for (const route of Object.values(originalRoutePaths)) {
        expect(originalHref(route)).toBe(base + route);
        expect(
          originalHref(
            `https://nana-park.github.io/Portfolio/${route}#section`,
          ),
        ).toBe(`${base}${route}#section`);
      }
    });
    it(`keeps original images and every localized external asset below ${base}`, () => {
      vi.stubEnv("BASE_URL", base);
      expect(assetUrl("/Files/image.png")).toBe(
        `${base}original/Files/image.png`,
      );
      for (const asset of externalManifest.entries) {
        if (asset.status === "available") {
          expect(assetUrl(asset.url)).toBe(
            base + asset.localPath.replace(/^\/+/, ""),
          );
        }
      }
    });
  }
  it("preserves external, mail, fragment and embedded media URLs", () => {
    vi.stubEnv("BASE_URL", "/breadme/");
    for (const value of [
      "https://example.com/",
      "mailto:hello@example.com",
      "#main-content",
    ]) {
      expect(originalHref(value)).toBe(value);
    }
    for (const value of [
      "https://example.com/image.png",
      "data:image/png;base64,AA==",
      "blob:example",
    ]) {
      expect(assetUrl(value)).toBe(value);
    }
  });
});
