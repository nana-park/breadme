import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import postcss from "postcss";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyHomeCapabilitiesOverride } from "../../../scripts/apply-home-capabilities-override";
import { HomeCapabilities } from "../home/HomeCapabilities";
import { OriginalHomeContent } from "./generated/OriginalHomeContent";

const title = "From human understanding to AI product experiences.";
afterEach(() => vi.unstubAllEnvs());

describe("Home product capabilities CTA", () => {
  it("keeps the original box and displays one H2 with two equal H3 groups", () => {
    render(<OriginalHomeContent />);
    const card = document.querySelector("#cta-dark-container")!;
    expect(card.closest("section")).toHaveAttribute("id", "vision");
    expect(card).toHaveClass(
      "px-6",
      "text-center",
      "items-center",
      "py-24",
      "lg:py-32",
    );
    expect(card.querySelectorAll('[class*="mesh-blob-"]')).toHaveLength(6);
    expect(card.querySelector("#cta-glow")).not.toBeNull();
    const heading = within(card as HTMLElement).getByRole("heading", {
      level: 2,
      name: title,
    });
    expect(card.querySelectorAll("h2")).toHaveLength(1);
    const groups = within(card as HTMLElement).getAllByRole("heading", {
      level: 3,
    });
    expect(groups.map((group) => group.textContent)).toEqual([
      "Product Focus",
      "Core Strengths",
    ]);
    expect(groups[0].className).toBe(groups[1].className);
    expect(groups[0].nextElementSibling).toHaveTextContent(
      "Conversational AI · Voice AI · AI Agents",
    );
    expect(groups[1].nextElementSibling).toHaveTextContent(
      "AI UX Design · Research & Data Analysis · Korea–Japan Launches",
    );
    expect(heading.nextElementSibling).toHaveTextContent(
      /^Grounded in psychology and Human-AI Interaction\.$/,
    );
    expect(card.querySelectorAll("br")).toHaveLength(0);
    expect(card).not.toHaveTextContent("Explore Qualifications");
    expect(card.querySelectorAll("a")).toHaveLength(1);
    expect(card.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  for (const base of ["/", "/breadme/"]) {
    it(`links the final CTA to Products under ${base}`, () => {
      vi.stubEnv("BASE_URL", base);
      render(<HomeCapabilities />);
      const action = screen.getByRole("link", { name: "View products" });
      expect(action).toHaveAttribute("href", `${base}projects.html`);
      expect(action).not.toHaveAttribute("target");
    });
  }

  it("makes the Products action reachable by keyboard", async () => {
    const user = userEvent.setup();
    render(<HomeCapabilities />);
    await user.tab();
    expect(screen.getByRole("link", { name: "View products" })).toHaveFocus();
  });

  it("uses the actual Academic type scale and keeps mobile text left / action centered", () => {
    const css = postcss.parse(
      readFileSync("src/pages/home/HomeCapabilities.module.css", "utf8"),
    );
    const rules = new Map<string, Record<string, string>>();
    css.walkRules((rule) => {
      const mobile =
        rule.parent?.type === "atrule" ? rule.parent.params : "desktop";
      const declarations: Record<string, string> = {};
      rule.walkDecls((declaration) => {
        expect(declaration.important).toBeFalsy();
        expect(declaration.prop).not.toBe("white-space");
        declarations[declaration.prop] = declaration.value;
      });
      rules.set(`${mobile} ${rule.selector}`, declarations);
    });
    expect(rules.get("desktop .content h2")).toMatchObject({
      "font-size": "28px",
      "font-weight": "500",
    });
    expect(rules.get("desktop .group h3")).toMatchObject({
      "font-size": "22px",
      "font-weight": "400",
    });
    expect(rules.get("desktop .group p")).toMatchObject({
      "font-size": "13px",
      "line-height": "1.6",
      color: "#f4f4f5",
    });
    expect(rules.get("(max-width: 767px) .content h2")).toEqual({
      "font-size": "24px",
    });
    expect(rules.get("(max-width: 767px) .group h3")).toEqual({
      "font-size": "20px",
    });
    expect(rules.get("(max-width: 767px) .content")).toEqual({
      "text-align": "left",
    });
    expect(rules.get("desktop .actions")).toMatchObject({
      "justify-content": "center",
    });
    expect(rules.get("desktop .productLink")).toMatchObject({
      "min-height": "44px",
      "text-align": "center",
    });
  });

  it("replaces only the original CTA text during source conversion", () => {
    const source =
      '<section id="history-2"><h2>Academic Standing</h2><p>Keep education</p></section><section id="vision"><div id="cta-dark-container" class="source-card"><div id="cta-glow"></div><h2>Old title<br>second line</h2><p>Old copy</p><a href="qualified.html">Old action</a></div></section>';
    const doc = new DOMParser().parseFromString(source, "text/html");
    const academic = doc.querySelector("#history-2")!.outerHTML;
    applyHomeCapabilitiesOverride(doc, "index.html");
    const card = doc.querySelector("#cta-dark-container")!;
    expect(card.className).toBe("source-card");
    expect(card.innerHTML).toBe(
      '<div id="cta-glow"></div><div data-home-capabilities=""></div>',
    );
    expect(doc.querySelector("#history-2")!.outerHTML).toBe(academic);
    applyHomeCapabilitiesOverride(doc, "index.html");
    expect(card.querySelectorAll("[data-home-capabilities]")).toHaveLength(1);
    const otherPage = new DOMParser().parseFromString(source, "text/html");
    applyHomeCapabilitiesOverride(otherPage, "career.html");
    expect(otherPage.body.innerHTML).toBe(source);
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain(
      "applyHomeCapabilitiesOverride(document, sourceFile)",
    );
    expect(converter).toContain('node.hasAttribute("data-home-capabilities")');
    expect(converter).toContain("<HomeCapabilities />");
  });
});
