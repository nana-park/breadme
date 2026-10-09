import { readFileSync } from "node:fs";
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyEducationIaOverride } from "../../../scripts/apply-education-ia-override";
import baseline from "../../../tests/fixtures/education-ia-before.json";
import { OriginalHomeContent } from "./generated/OriginalHomeContent";
import { OriginalQualifiedContent } from "./generated/OriginalQualifiedContent";
import { OriginalAboutContent } from "./generated/OriginalAboutContent";
import manifest from "./generated/conversion-manifest.json";

const parse = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");
const normalize = (text: string | null) =>
  text?.replace(/\s+/g, " ").trim() ?? "";

// WHAT: Compare the complete pre-change element tree, attributes and copy.
// WHY: A moved section must conserve more than its headline or item count.
function canonical(node: Node): unknown {
  if (node.nodeType === Node.TEXT_NODE)
    return normalize(node.textContent) || null;
  if (!(node instanceof Element)) return null;
  const attributes = Array.from(node.attributes, ({ name, value }) => [
    name,
    name === "style" ? (node as HTMLElement).style.cssText : value,
  ]).sort(([a], [b]) => a.localeCompare(b));
  return {
    tag: node.tagName,
    attributes,
    children: Array.from(node.childNodes, canonical).filter(
      (child) => child !== null,
    ),
  };
}

function expectConserved(
  section: Element,
  key: keyof typeof baseline.sections,
) {
  const clone = section.cloneNode(true) as Element;
  clone.removeAttribute("data-education-detail");
  clone.removeAttribute("data-about-chapter");
  if (key === "principles") {
    clone
      .querySelector('[data-reading-role="principles-section-header"]')
      ?.setAttribute("data-reading-role", "qualification-section-header");
  }
  const original = parse(baseline.sections[key]).body.firstElementChild!;
  expect(canonical(clone)).toEqual(canonical(original));
}

function expectSummary(section: HTMLElement, href: string) {
  expect(normalize(section.querySelector("h2")?.textContent ?? null)).toBe(
    "Academic Standing",
  );
  expect(
    Array.from(section.querySelectorAll("h3"), (node) =>
      normalize(node.textContent),
    ),
  ).toEqual(["M.S. in Human-AI Interaction", "B.A. in Psychology"]);
  expect(
    Array.from(section.querySelectorAll("p"), (node) =>
      normalize(node.textContent),
    ),
  ).toEqual(["Sungkyunkwan University", "Sookmyung Women's University"]);
  expect(section.querySelectorAll("img, video, canvas, svg")).toHaveLength(0);
  expect(normalize(section.textContent)).not.toMatch(
    /Research Focus|Additional Degree|Double major|Minor in|March 20|SSCI|Rooted in academic rigor/,
  );
  const links = section.querySelectorAll("a");
  expect(links).toHaveLength(1);
  expect(links[0].getAttribute("href")).toBe(href);
  expect(normalize(links[0].textContent)).toMatch(
    /Full education & qualifications/,
  );
}

describe("Education and working-principles information architecture", () => {
  it("leaves only the two real school/degree/major summaries and one detail link on Home", () => {
    const { container } = render(<OriginalHomeContent />);
    const section = container.querySelector<HTMLElement>("#history-2")!;
    expect(section).toHaveAttribute("data-education-summary");
    expectSummary(section, "/qualified.html");
    expect(
      within(section).getByRole("link", {
        name: /Full education & qualifications/,
      }),
    ).toHaveAccessibleName(/Full education & qualifications/);
    expect(container.querySelectorAll("#history-2")).toHaveLength(1);
  });

  it("moves all original education content before the unchanged competencies and certifications", () => {
    const { container } = render(<OriginalQualifiedContent />);
    const education = container.querySelector("#history-2")!;
    expect(education).toHaveAttribute("data-education-detail");
    expect(education.nextElementSibling?.id).toBe("toolkit-grid");
    expectConserved(education, "education");
    expectConserved(container.querySelector("#toolkit-grid")!, "competencies");
    expectConserved(
      container.querySelector("#certifications-runway")!,
      "certifications",
    );
    expect(
      container.querySelectorAll('[data-reading-role="competency-card"]'),
    ).toHaveLength(6);
    expect(container.querySelectorAll("#history-2 img")).toHaveLength(2);
    expect(container.querySelector("#how-work")).toBeNull();
  });

  it("moves all four original principle cards into About before the interview", () => {
    const { container } = render(<OriginalAboutContent />);
    const principles = container.querySelector("#how-work")!;
    expect(principles).toHaveAttribute("data-about-chapter", "principles");
    expect(principles.nextElementSibling).toHaveAttribute("id", "media");
    expect(principles.querySelector("h2")?.parentElement).toHaveAttribute(
      "data-reading-role",
      "principles-section-header",
    );
    expect(principles.querySelectorAll("h3")).toHaveLength(4);
    expectConserved(principles, "principles");
    expect(container.querySelectorAll("#how-work")).toHaveLength(1);
  });

  it("records each relocated section once in its new page manifest", () => {
    const ids = (source: string) =>
      manifest.pages.find((page) => page.sourceFile === source)!.sectionIds;
    expect(ids("index.html")).toContain("history-2");
    expect(ids("qualified.html")).not.toContain("how-work");
    expect(ids("qualified.html").indexOf("history-2")).toBeLessThan(
      ids("qualified.html").indexOf("toolkit-grid"),
    );
    expect(ids("about.html").filter((id) => id === "how-work")).toHaveLength(1);
    expect(ids("about.html").indexOf("how-work")).toBeLessThan(
      ids("about.html").indexOf("media"),
    );
  });
});

describe("Education IA source regeneration", () => {
  function sources() {
    return {
      home: parse(baseline.sections.education),
      qualified: parse(
        baseline.sections.competencies +
          baseline.sections.certifications +
          baseline.sections.principles,
      ),
    };
  }

  it("recreates the same Home summary without changing the preserved source documents", () => {
    const originals = sources();
    const originalHome = originals.home.body.innerHTML;
    const originalQualified = originals.qualified.body.innerHTML;
    const home = parse(
      `<section id="history">Career</section>${originalHome}<section id="vision">Products</section>`,
    );
    applyEducationIaOverride(home, "index.html", originals);
    // Detached HTML is inspected by DOM queries rather than visibility assertions.
    const section = home.querySelector<HTMLElement>("#history-2")!;
    expectSummary(section, "qualified.html");
    expect(home.querySelector("#history")?.outerHTML).toBe(
      '<section id="history">Career</section>',
    );
    expect(home.querySelector("#vision")?.outerHTML).toBe(
      '<section id="vision">Products</section>',
    );
    expect(originals.home.body.innerHTML).toBe(originalHome);
    expect(originals.qualified.body.innerHTML).toBe(originalQualified);
  });

  it("clones education with the approved research sentence and leaves all evidence intact", () => {
    const originals = sources();
    const focus = Array.from(originals.home.querySelectorAll("p")).find(
      (node) =>
        normalize(node.textContent).startsWith("Focused on human cognition,"),
    )!;
    focus.innerHTML =
      "Focused on human cognition,<br>legacy forced-break wording.";
    const sourceBefore = originals.home.body.innerHTML;
    const qualified = parse(originals.qualified.body.innerHTML);
    applyEducationIaOverride(qualified, "qualified.html", originals);
    const education = qualified.querySelector("#history-2")!;
    expect(education.nextElementSibling?.id).toBe("toolkit-grid");
    expectConserved(education, "education");
    expectConserved(qualified.querySelector("#toolkit-grid")!, "competencies");
    expectConserved(
      qualified.querySelector("#certifications-runway")!,
      "certifications",
    );
    expect(qualified.querySelector("#how-work")).toBeNull();
    expect(originals.home.body.innerHTML).toBe(sourceBefore);
  });

  it("clones principles into About without deleting or rewriting its original copy", () => {
    const originals = sources();
    const before = originals.qualified.body.innerHTML;
    const about = parse(
      '<section id="about">Identity</section><section id="media">Interview</section>',
    );
    applyEducationIaOverride(about, "about.html", originals);
    expect(
      Array.from(about.querySelectorAll("section"), (node) => node.id),
    ).toEqual(["about", "how-work", "media"]);
    expectConserved(about.querySelector("#how-work")!, "principles");
    expect(originals.qualified.body.innerHTML).toBe(before);
  });

  it("does not alter other routes and fails when required source sections are absent", () => {
    const other = parse(
      '<section id="history-2">Unrelated education</section>',
    );
    const before = other.body.innerHTML;
    applyEducationIaOverride(other, "career.html", {
      home: parse(""),
      qualified: parse(""),
    });
    expect(other.body.innerHTML).toBe(before);
    expect(() =>
      applyEducationIaOverride(other, "about.html", {
        home: parse(""),
        qualified: parse(""),
      }),
    ).toThrow("Expected original education and work-principles sections");
  });

  it("wires the override into the converter after page-specific reading roles", () => {
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain('from "./apply-education-ia-override.ts"');
    const invocation = converter.indexOf(
      "applyEducationIaOverride(document, sourceFile, iaSources)",
    );
    expect(invocation).toBeGreaterThan(
      converter.indexOf('"qualification-section-header"'),
    );
    expect(invocation).toBeGreaterThan(
      converter.indexOf('"data-about-chapter"'),
    );
  });
});
