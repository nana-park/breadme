import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import postcss from "postcss";
import { OriginalQualifiedContent } from "./generated/OriginalQualifiedContent";

describe("Qualifications mobile layout", () => {
  it("marks six existing cards, three headings, and four unchanged filters", () => {
    const { container } = render(<OriginalQualifiedContent />);
    const cards = container.querySelectorAll('[data-reading-role="competency-card"]');
    expect(cards).toHaveLength(6);
    expect(Array.from(cards, (card) => card.querySelector("span")?.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "Domains", "Product Strategy", "Business & Markets", "Leadership", "Research & Analytics", "Tools",
    ]);
    const headers = container.querySelectorAll('[data-reading-role="qualification-section-header"]');
    expect(headers).toHaveLength(3);
    expect(Array.from(headers, (header) => header.closest("section")?.id)).toEqual([
      "toolkit-grid", "certifications-runway", "how-work",
    ]);
    expect(Array.from(container.querySelectorAll('[data-reading-role="qualification-filters"] button'), (button) => button.getAttribute("data-target"))).toEqual([
      "cert-ai", "cert-data", "cert-psycho", "cert-lang",
    ]);
  });

  it("limits all added styling to 767px and preserves regeneration hooks", () => {
    const css = readFileSync("src/pages/original/OriginalPage.module.css", "utf8");
    const converter = readFileSync("scripts/convert-original-pages.mjs", "utf8");
    let rules = 0;
    postcss.parse(css).walkRules((rule) => {
      if (!/competency-card|qualification-section-header|qualification-filters/.test(rule.selector)) return;
      rules++;
      expect(rule.parent?.type).toBe("atrule");
      expect(rule.parent).toHaveProperty("params", "(max-width: 767px)");
    });
    expect(rules).toBe(5);
    for (const role of ["competency-card", "qualification-section-header", "qualification-filters"]) {
      expect(converter).toContain(`"${role}"`);
    }
  });
});
