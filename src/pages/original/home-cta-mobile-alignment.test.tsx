import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { OriginalHomeContent } from "./generated/OriginalHomeContent";

const titleText =
  /Creating AI dialogue experiences\s*driven by deep human intent\./;
const titleSelector =
  '.page[data-original-page="home"] [data-reading-role="qualifications-title"]';

describe("Home qualifications CTA mobile alignment", () => {
  it("marks the card, title and copy while preserving desktop utilities and content", () => {
    render(<OriginalHomeContent />);
    const title = screen.getByRole("heading", { name: titleText });
    expect(title).toHaveAttribute("data-reading-role", "qualifications-title");
    expect(
      document.querySelectorAll('[data-reading-role="qualifications-title"]'),
    ).toHaveLength(1);
    expect(title.querySelectorAll("br")).toHaveLength(1);
    expect(title).toHaveClass(
      "text-[28px]",
      "md:text-[36px]",
      "lg:text-[42px]",
    );
    expect(title.parentElement).toHaveAttribute("id", "cta-dark-container");
    expect(title.parentElement).toHaveAttribute(
      "data-reading-role",
      "qualifications-cta",
    );
    expect(
      document.querySelectorAll('[data-reading-role="qualifications-cta"]'),
    ).toHaveLength(1);
    expect(title.parentElement).toHaveClass(
      "px-6",
      "text-center",
      "items-center",
    );
    expect(
      screen.getByText(
        "Discover the academic background, certifications, and working principles that shape my approach.",
      ),
    ).toHaveAttribute("data-reading-role", "qualifications-copy");
    expect(
      document.querySelectorAll('[data-reading-role="qualifications-copy"]'),
    ).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Explore Qualifications" }),
    ).toHaveAttribute("href", "/qualified.html");
  });

  it("limits the three heading overrides to Home below 768px", () => {
    const css = postcss.parse(
      readFileSync("src/pages/original/OriginalPage.module.css", "utf8"),
    );
    const rules: string[] = [];
    css.walkRules((rule) => {
      if (!rule.selector.includes("qualifications-title")) return;
      expect(rule.selector).toBe(titleSelector);
      const parent = rule.parent;
      expect(parent?.type).toBe("atrule");
      if (parent?.type === "atrule") {
        expect(parent.name).toBe("media");
        expect(parent.params).toBe("(max-width: 767px)");
      }
      rule.walkDecls((declaration) => {
        expect(declaration.important).toBeFalsy();
        rules.push(`${declaration.prop}: ${declaration.value}`);
      });
    });
    expect(rules).toEqual([
      "width: 100%",
      "font-size: 24px",
      "text-align: left",
    ]);
  });

  it("limits inherited copy alignment to Home mobile without overriding the centered flex action", () => {
    const css = postcss.parse(
      readFileSync("src/pages/original/OriginalPage.module.css", "utf8"),
    );
    const declarations: string[] = [];
    css.walkRules((rule) => {
      if (!rule.selector.includes("qualifications-cta")) return;
      expect(rule.selector).toBe(
        '.page[data-original-page="home"] [data-reading-role="qualifications-cta"]',
      );
      const parent = rule.parent;
      expect(parent?.type).toBe("atrule");
      if (parent?.type === "atrule") {
        expect(parent.name).toBe("media");
        expect(parent.params).toBe("(max-width: 767px)");
      }
      rule.walkDecls((declaration) => {
        expect(declaration.important).toBeFalsy();
        declarations.push(`${declaration.prop}: ${declaration.value}`);
      });
    });
    expect(declarations).toEqual(["text-align: left"]);
  });

  it("keeps the description full-width only on mobile despite its source auto margins", () => {
    const css = postcss.parse(
      readFileSync("src/pages/original/OriginalPage.module.css", "utf8"),
    );
    const declarations: string[] = [];
    css.walkRules((rule) => {
      if (!rule.selector.includes("qualifications-copy")) return;
      expect(rule.selector).toBe(
        '.page[data-original-page="home"] [data-reading-role="qualifications-copy"]',
      );
      const parent = rule.parent;
      expect(parent?.type).toBe("atrule");
      if (parent?.type === "atrule") {
        expect(parent.name).toBe("media");
        expect(parent.params).toBe("(max-width: 767px)");
      }
      rule.walkDecls((declaration) => {
        expect(declaration.important).toBeFalsy();
        declarations.push(`${declaration.prop}: ${declaration.value}`);
      });
    });
    expect(declarations).toEqual(["width: 100%"]);
  });

  it("preserves all hooks when the original content is regenerated", () => {
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain('.querySelector("#cta-dark-container")');
    expect(converter).toContain(
      '?.setAttribute("data-reading-role", "qualifications-cta")',
    );
    expect(converter).toContain('.querySelector("#cta-dark-container p")');
    expect(converter).toContain(
      '?.setAttribute("data-reading-role", "qualifications-copy")',
    );
    expect(converter).toContain('.querySelector("#cta-dark-container h2")');
    expect(converter).toContain(
      '?.setAttribute("data-reading-role", "qualifications-title")',
    );
  });
});
