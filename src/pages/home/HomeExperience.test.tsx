import { readFileSync } from "node:fs";
import postcss from "postcss";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import styles from "./HomeExperience.module.css";
import { HomeExperience } from "./HomeExperience";

afterEach(() => vi.unstubAllEnvs());

describe("Home experience actions", () => {
  it("reuses Academic's secondary surface without changing the shared target or focus", () => {
    const css = postcss.parse(
      readFileSync("src/pages/home/HomeExperience.module.css", "utf8"),
    );
    const rules = new Map<string, Record<string, string>>();
    css.walkRules((rule) => {
      const declarations: Record<string, string> = {};
      rule.walkDecls((declaration) => {
        declarations[declaration.prop] = declaration.value;
      });
      rules.set(rule.selector, declarations);
    });
    expect(rules.get(".secondaryAction")).toEqual({
      border: "1px solid #e4e4e7",
      background: "#fff",
      color: "#3f3f46",
      "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 5%)",
    });
    expect(rules.get(".secondaryAction:hover")).toEqual({
      background: "#fafafa",
    });
    expect(rules.get(".careerLink")).toMatchObject({
      "min-height": "44px",
      background: "#1a1a1a",
      color: "#fff",
    });
    expect(rules.get(".careerLink:focus-visible")).toEqual({
      outline: "2px solid #145dcc",
      "outline-offset": "4px",
    });
  });
  for (const base of ["/", "/breadme/"]) {
    it(`places primary Products before secondary Full career with ${base} destinations`, () => {
      vi.stubEnv("BASE_URL", base);
      render(<HomeExperience />);
      const career = screen.getByRole("link", { name: "Full career" });
      const products = screen.getByRole("link", { name: "Products" });
      expect(career).toHaveAttribute("href", `${base}career.html`);
      expect(products).toHaveAttribute("href", `${base}projects.html`);
      expect(career.parentElement).toBe(products.parentElement);
      expect(products.nextElementSibling).toBe(career);
      expect(products).toHaveClass(styles.careerLink);
      expect(products).not.toHaveClass(styles.secondaryAction);
      expect(career).toHaveClass(styles.careerLink, styles.secondaryAction);
      expect(products).not.toHaveAttribute("target");
    });
  }

  it("keeps both actions in natural keyboard order", async () => {
    const user = userEvent.setup();
    render(<HomeExperience />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Full career" })).toHaveFocus();
  });
});
