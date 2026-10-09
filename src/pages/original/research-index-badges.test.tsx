import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyResearchIndexBadges } from "../../../scripts/apply-research-index-badges";
import baseline from "../../../tests/fixtures/research-index-badges-before.json";
import { OriginalResearchContent } from "./generated/OriginalResearchContent";

const parse = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");
const normalize = (text: string | null) =>
  text?.replace(/\s+/g, " ").trim() ?? "";
const source = () =>
  parse(`<section id="research">${baseline.listHtml}</section>`);
const rows = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>("[data-research-paper]"));

// WHAT: Preserve the full publication element tree, not just selected strings.
// WHY: Only the inline index labels and explicitly added metadata may differ.
function canonical(node: Node): unknown {
  if (node.nodeType === Node.TEXT_NODE)
    return normalize(node.textContent) || null;
  if (!(node instanceof Element)) return null;
  return {
    tag: node.tagName,
    attributes: Array.from(node.attributes, ({ name, value }) => [
      name,
      value,
    ]).sort(([a], [b]) => a.localeCompare(b)),
    children: Array.from(node.childNodes, canonical).filter(
      (child) => child !== null,
    ),
  };
}

function expectedRow(index: number) {
  const row = parse(baseline.papers[index].html).body.firstElementChild!;
  if (baseline.papers[index].index) {
    const journal = row.querySelector("h3 + p")!;
    for (const child of journal.childNodes) {
      if (child.nodeType === Node.TEXT_NODE)
        child.textContent = child.textContent!.replace(/\((SSCI|KCI)\)/, "");
    }
  }
  return row;
}

function expectConserved(root: ParentNode) {
  const publications = rows(root);
  expect(publications).toHaveLength(4);
  publications.forEach((row, index) => {
    const clone = row.cloneNode(true) as Element;
    clone.removeAttribute("data-research-paper");
    clone.querySelector("[data-research-meta]")?.remove();
    clone
      .querySelector("[data-research-date-column]")
      ?.removeAttribute("data-research-date-column");
    expect(canonical(clone), `Complete paper ${index + 1}`).toEqual(
      canonical(expectedRow(index)),
    );
    // The browser suite uses these semantic fields from the same frozen fixture.
    expect(normalize(clone.textContent)).toBe(
      baseline.papers[index].textWithoutIndex,
    );
    expect(normalize(clone.querySelector("h3 + p")!.textContent)).toBe(
      baseline.papers[index].journalAndConference,
    );
  });
}

function expectBadges(root: ParentNode) {
  expect(rows(root).map((row) => row.dataset.researchPaper)).toEqual([
    "1",
    "2",
    "3",
    "4",
  ]);
  const badges = Array.from(root.querySelectorAll("[data-research-index]"));
  expect(badges.map((badge) => badge.textContent)).toEqual([
    "SSCI",
    "SSCI",
    "KCI",
  ]);
  expect(root.querySelectorAll("[data-research-meta]")).toHaveLength(3);
  expect(root.querySelectorAll("[data-research-date-column]")).toHaveLength(3);
  expect(root.querySelectorAll("[data-research-mobile-date]")).toHaveLength(3);
  badges.forEach((badge, index) => {
    expect(badge.tagName).toBe("SPAN");
    expect(badge.getAttribute("data-research-index")).toBe(
      baseline.papers[index].index,
    );
    expect(badge.getAttribute("title")).toBe(
      `Journal index: ${baseline.papers[index].index}`,
    );
    expect(badge.matches("button, a, [role], [tabindex], [onclick]")).toBe(
      false,
    );
    expect(badge.querySelector("button, a, [role], [tabindex]")).toBeNull();
    expect(badge.parentElement!.hasAttribute("data-research-meta")).toBe(true);
    const meta = badge.parentElement!;
    expect(meta.nextElementSibling?.tagName).toBe("H3");
    const mobileDate = badge.nextElementSibling!;
    expect(meta.children).toHaveLength(2);
    expect(mobileDate.hasAttribute("data-research-mobile-date")).toBe(true);
    expect(normalize(mobileDate.textContent)).toBe(baseline.papers[index].date);
    const originalDate = rows(root)[index].querySelector(
      "[data-research-date-column] span",
    )!;
    const clonedDate = mobileDate.cloneNode(true) as Element;
    clonedDate.removeAttribute("data-research-mobile-date");
    expect(canonical(clonedDate)).toEqual(canonical(originalDate));
  });
  expect(
    rows(root)[3].querySelector(
      "[data-research-meta], [data-research-index], [data-research-mobile-date], [data-research-date-column]",
    ),
  ).toBeNull();
  expect(
    root.querySelectorAll("button, [tabindex], [role=button]"),
  ).toHaveLength(0);
}

describe("Research journal index badges", () => {
  it("renders exactly the two existing SSCI labels and one KCI label as noninteractive metadata", () => {
    const { container } = render(<OriginalResearchContent />);
    expectBadges(container);
    expect(container.querySelector("#research")?.textContent).not.toMatch(
      /\((SSCI|KCI)\)/,
    );
  });

  it("conserves every date, title, journal, conference, description, link, topic tag and existing attribute", () => {
    const { container } = render(<OriginalResearchContent />);
    expectConserved(container);
  });

  it("leaves the conference-only fourth publication unchanged except for its row marker", () => {
    const { container } = render(<OriginalResearchContent />);
    const fourth = rows(container)[3].cloneNode(true) as Element;
    fourth.removeAttribute("data-research-paper");
    expect(canonical(fourth)).toEqual(
      canonical(parse(baseline.papers[3].html).body.firstElementChild!),
    );
    expect(fourth.textContent).not.toMatch(/SSCI|KCI/);
  });
});

describe("Research badge canonical regeneration", () => {
  it("rebuilds the checked-in runtime structure from the immutable pre-change list", () => {
    const document = source();
    applyResearchIndexBadges(document, "research.html");
    expectBadges(document);
    expectConserved(document);
    const { container } = render(<OriginalResearchContent />);
    expect(rows(container).map(canonical)).toEqual(
      rows(document).map(canonical),
    );
  });

  it("is idempotent and does not duplicate badges or dates", () => {
    const document = source();
    applyResearchIndexBadges(document, "research.html");
    const once = document.body.innerHTML;
    applyResearchIndexBadges(document, "research.html");
    applyResearchIndexBadges(document, "research.html");
    expect(document.body.innerHTML).toBe(once);
    expectBadges(document);
  });

  it("derives each index and mobile date from its actual source after row reordering", () => {
    const document = source();
    const list = document.querySelector("#research > div")!;
    list.prepend(list.lastElementChild!);
    const firstIndexed = list.children[1];
    firstIndexed.querySelector("h3 + p span")!.nextSibling!.textContent =
      " (KCI)";
    firstIndexed.firstElementChild!.querySelector("span")!.textContent =
      "January 2030";
    applyResearchIndexBadges(document, "research.html");
    expect(
      rows(document).map(
        (row) =>
          row.querySelector("[data-research-index]")?.textContent ?? null,
      ),
    ).toEqual([null, "KCI", "SSCI", "KCI"]);
    expect(
      rows(document)[1].querySelector("[data-research-mobile-date]")
        ?.textContent,
    ).toBe("January 2030");
    expect(rows(document)[0].querySelector("[data-research-meta]")).toBeNull();
  });

  it("does not infer indexing from titles, topics, descriptions, or conference parentheses", () => {
    const document = source();
    const fourth = document.querySelector("#research > div")!.lastElementChild!;
    fourth.querySelector("h3")!.append(" (SSCI)");
    fourth.querySelector("h3 + p + div span")!.append(" (KCI)");
    fourth.lastElementChild!.querySelector("p")!.append(" (SSCI)");
    const before = fourth.outerHTML;
    applyResearchIndexBadges(document, "research.html");
    fourth.removeAttribute("data-research-paper");
    expect(fourth.outerHTML).toBe(before);
    expect(document.querySelectorAll("[data-research-index]")).toHaveLength(3);
    expect(document.querySelectorAll("h3 + p")[0].textContent).toContain(
      "(Conference",
    );
  });

  it("does not change other routes", () => {
    const document = source();
    const before = document.body.innerHTML;
    applyResearchIndexBadges(document, "qualified.html");
    expect(document.body.innerHTML).toBe(before);
  });

  it("wires the same canonical helper into the source converter", () => {
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain('from "./apply-research-index-badges.ts"');
    expect(converter).toContain(
      "applyResearchIndexBadges(document, sourceFile)",
    );
  });
});
