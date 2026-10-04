import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { originalArticles } from ".";
import { assetUrl } from "@/shared/utils/originalPaths";
import sourceExpectations from "./source-expectations.json";

// WHAT: The immutable source-derived fingerprints verify every migrated article.
// WHY: Text, images, and original links must survive JSX conversion without rewriting.
describe("Original article source fidelity", () => {
  it("keeps all 18 entries in their exact source order", () => {
    expect(originalArticles.map(({ id }) => id)).toEqual(
      sourceExpectations.map(({ id }) => id),
    );
    expect(originalArticles).toHaveLength(18);
  });
  it.each(sourceExpectations)("preserves metadata and body $id", (source) => {
    const article = originalArticles.find(({ id }) => id === source.id)!;
    expect({
      title: article.title,
      date: article.date,
      url: article.url,
      excerpt: article.excerpt,
    }).toEqual({
      title: source.title,
      date: source.date,
      url: source.url,
      excerpt: source.excerpt,
    });
    const doc = new DOMParser().parseFromString(
      renderToStaticMarkup(<article.Body />),
      "text/html",
    );
    const text = doc.body.textContent!.replace(/\s+/g, " ").trim();
    expect(createHash("sha256").update(text).digest("hex")).toBe(
      source.textSha256,
    );
    expect(
      Array.from(doc.images, (image) => ({
        src: image.getAttribute("src"),
        alt: image.getAttribute("alt"),
      })),
    ).toEqual(
      source.images.map(({ src, alt }) => ({ src: assetUrl(src), alt })),
    );
    expect(
      Array.from(doc.querySelectorAll("a"), (link) =>
        link.getAttribute("href"),
      ),
    ).toEqual(source.links);
    expect(doc.querySelector("iframe, script")).toBeNull();
  });
  it("resolves every article image to the downloaded local manifest", () => {
    for (const { images } of sourceExpectations) {
      for (const { src } of images)
        expect(assetUrl(src)).toMatch(/^\/original-external\//);
    }
  });
});
