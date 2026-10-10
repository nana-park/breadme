import { readFileSync } from "node:fs";
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyLandingHeroOverride } from "../../../scripts/apply-landing-hero-override";
import { applyResearchSectionsOverride } from "../../../scripts/apply-research-sections-override";
import baseline from "../../../tests/fixtures/research-index-badges-before.json";
import {
  expectedResearchRecords,
  expectedResearchSections,
} from "../../../tests/fixtures/research-sections-expected";
import { researchSections } from "@/content/research/publications";
import { OriginalResearchContent } from "./generated/OriginalResearchContent";
import { LandingPhotoHero } from "./LandingPhotoHero";
import styles from "./ResearchSections.module.css";

const parse = (html: string) =>
  new DOMParser().parseFromString(html, "text/html");
const normalize = (text: string | null) =>
  text?.replace(/\s+/g, " ").trim() ?? "";
const papers = researchSections.flatMap((section) => section.publications);

// WHAT: Compare retained element semantics while ignoring formatting whitespace.
// WHY: A new content owner must preserve the existing hero and row treatment.
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

function expectedPublication(record: (typeof expectedResearchRecords)[number]) {
  const { preservedRecord, ...fields } = record;
  const preserved =
    preservedRecord === undefined
      ? undefined
      : baseline.papers[preservedRecord];
  return {
    ...fields,
    ...(preserved ? { description: preserved.description } : {}),
    topics: preserved?.topics ?? [],
    links: (preserved?.links ?? []).map((link) => ({
      label: link.text,
      href: link.href.startsWith("/original/")
        ? link.href.slice("/original/".length)
        : link.href,
      asset: link.href.startsWith("/original/"),
    })),
  };
}

describe("Research reviewed content source", () => {
  it("contains precisely the approved 3 journals, 2 ongoing studies and 4 unique conferences in order", () => {
    expect(
      researchSections.map(({ id, kind, title, publications }) => ({
        id,
        kind,
        title,
        count: publications.length,
      })),
    ).toEqual(expectedResearchSections);
    expect(papers).toEqual(expectedResearchRecords.map(expectedPublication));
    expect(new Set(papers.map((paper) => paper.id)).size).toBe(9);
    expect(new Set(papers.map((paper) => paper.title)).size).toBe(9);
    for (const section of researchSections)
      expect(
        section.publications.every((paper) => paper.kind === section.kind),
      ).toBe(true);
  });

  it("retains every existing summary, topic and destination while separating journal and conference metadata", () => {
    for (const expected of expectedResearchRecords.filter(
      (record) => record.preservedRecord !== undefined,
    )) {
      const original = baseline.papers[expected.preservedRecord!];
      const item = papers.find((paper) => paper.id === expected.id)!;
      expect(item.description).toBe(original.description);
      expect(item.topics).toEqual(original.topics);
      expect(
        item.links.map((link) => ({
          text: link.label,
          href: link.asset ? `/original/${link.href}` : link.href,
        })),
      ).toEqual(original.links.map(({ text, href }) => ({ text, href })));
    }
    expect(
      papers
        .filter((paper) => paper.kind === "journal")
        .map((paper) => paper.venue),
    ).toEqual([
      "Technology in Society",
      "Information Development",
      "International Telecommunications Policy Review",
    ]);
    expect(
      papers
        .filter((paper) => paper.kind === "journal")
        .map((paper) => paper.date),
    ).toEqual(["2026", "December 2025", "2022"]);
  });

  it("keeps unknown dates, abstracts, indexes and URLs absent instead of inferring metadata", () => {
    for (const paper of papers.filter((item) => item.kind === "ongoing")) {
      expect(paper.status).toBe("In Progress");
      for (const field of ["date", "description", "index"])
        expect(paper).not.toHaveProperty(field);
      expect(paper.topics).toEqual([]);
      expect(paper.links).toEqual([]);
    }
    const conferences = papers.filter((paper) => paper.kind === "conference");
    expect(
      conferences.filter((paper) =>
        paper.title.startsWith("Empowering the Omni-Channel"),
      ),
    ).toHaveLength(1);
    for (const paper of conferences) {
      expect(paper).not.toHaveProperty("index");
      expect(paper).not.toHaveProperty("status");
      if (paper.id !== "conference-ethereum") {
        expect(paper.links).toEqual([]);
        expect(paper.topics).toEqual([]);
        expect(paper).not.toHaveProperty("description");
      }
    }
  });
});

describe("Research section rendering", () => {
  it("preserves the photo hero and outer container, then renders three accessible h2 sections", () => {
    const { container } = render(<OriginalResearchContent />);
    const reference = render(<LandingPhotoHero page="research" />);
    const hero = container.querySelector(
      '[data-landing-photo-hero="research"]',
    )!;
    expect(canonical(hero)).toEqual(
      canonical(reference.container.firstElementChild!),
    );
    const outer = container.querySelector("#research")!;
    expect(outer).toHaveClass("pb-24", "bg-white");
    expect(outer).toHaveStyle({ paddingTop: "70px" });
    expect(outer.firstElementChild).toBe(hero);
    const content = outer.querySelector(":scope > .container")!;
    expect(content).toHaveClass(
      "mx-auto",
      "px-4",
      "lg:px-12",
      "max-w-[1400px]",
    );
    expect(content.children).toHaveLength(1);
    expect(content.firstElementChild).toHaveAttribute("data-research-sections");
    const sections = container.querySelectorAll<HTMLElement>(
      "[data-research-section]",
    );
    expect(sections).toHaveLength(3);
    for (const [index, expected] of expectedResearchSections.entries()) {
      const section = sections[index];
      expect(section.tagName).toBe("SECTION");
      expect(section).toHaveAttribute("id", expected.id);
      expect(section).toHaveAttribute("data-research-section", expected.kind);
      const heading = within(section).getByRole("heading", {
        level: 2,
        name: expected.title,
      });
      expect(section).toHaveAttribute("aria-labelledby", heading.id);
      expect(section).toHaveAccessibleName(expected.title);
      expect(section.querySelectorAll("[data-research-paper]")).toHaveLength(
        expected.count,
      );
    }
  });

  it("renders stable semantic rows and preserves the shared row treatment, summaries, tags and links", () => {
    const { container } = render(<OriginalResearchContent />);
    const rows = container.querySelectorAll<HTMLElement>(
      "[data-research-paper]",
    );
    expect(rows).toHaveLength(9);
    for (const [index, expected] of expectedResearchRecords.entries()) {
      const row = rows[index];
      const original =
        expected.preservedRecord === undefined
          ? undefined
          : baseline.papers[expected.preservedRecord];
      expect(row.tagName).toBe("ARTICLE");
      expect(row).toHaveAttribute("data-research-paper", expected.id);
      expect(row).toHaveAttribute("data-research-kind", expected.kind);
      expect(row).toHaveClass(styles.row);
      expect(within(row).getByRole("heading", { level: 3 })).toHaveTextContent(
        expected.title,
      );
      expect(normalize(row.querySelector("h3 + p")!.textContent)).toBe(
        expected.venue,
      );
      expect(
        Array.from(
          row.querySelectorAll("[data-research-topics] > span"),
          (node) => normalize(node.textContent),
        ),
      ).toEqual(original?.topics ?? []);
      const description = row.querySelector("[data-research-details] > p");
      if (original)
        expect(normalize(description!.textContent)).toBe(original.description);
      else expect(description).toBeNull();
      const links = row.querySelectorAll("a");
      expect(links).toHaveLength(original?.links.length ?? 0);
      for (const [linkIndex, link] of (original?.links ?? []).entries()) {
        expect(links[linkIndex]).toHaveTextContent(link.text);
        expect(links[linkIndex]).toHaveAttribute("href", link.href);
        expect(links[linkIndex]).toHaveAttribute("target", link.target!);
      }
      if (expected.kind === "ongoing") {
        expect(row.querySelectorAll("[data-research-status]")).toHaveLength(1);
        expect(row.querySelector("[data-research-status]")).toHaveTextContent(
          "In Progress",
        );
        expect(row.querySelectorAll("p")).toHaveLength(1);
      }
    }
    expect(
      container.querySelectorAll(
        '#research a[href="#"], #research a:not([href]), #research [disabled], #research [aria-disabled]',
      ),
    ).toHaveLength(0);
    expect(container.querySelector("#research")!.textContent).not.toMatch(
      /Coming Soon|TBD|Conference Proceeding/,
    );
  });

  it("shows exactly SSCI / SSCI / KCI as static journal metadata and duplicates only their responsive dates", () => {
    const { container } = render(<OriginalResearchContent />);
    expect(
      Array.from(
        container.querySelectorAll("[data-research-index]"),
        (badge) => badge.textContent,
      ),
    ).toEqual(["SSCI", "SSCI", "KCI"]);
    for (const hook of [
      "data-research-meta",
      "data-research-date-column",
      "data-research-mobile-date",
    ])
      expect(container.querySelectorAll(`[${hook}]`)).toHaveLength(3);
    for (const expected of expectedResearchRecords) {
      const row = container.querySelector(
        `[data-research-paper="${expected.id}"]`,
      )!;
      if (!expected.index) {
        expect(
          row.querySelector(
            "[data-research-index], [data-research-meta], [data-research-mobile-date], [data-research-date-column]",
          ),
        ).toBeNull();
        continue;
      }
      const badge = row.querySelector("[data-research-index]")!;
      expect(badge.tagName).toBe("SPAN");
      expect(badge).toHaveAttribute("data-research-index", expected.index);
      expect(badge).toHaveAttribute(
        "title",
        `Journal index: ${expected.index}`,
      );
      expect(badge.matches("button, a, [role], [tabindex], [onclick]")).toBe(
        false,
      );
      expect(badge.parentElement!.children).toHaveLength(2);
      expect(badge.parentElement!.nextElementSibling?.tagName).toBe("H3");
      expect(badge.nextElementSibling).toHaveAttribute(
        "data-research-mobile-date",
      );
      expect(badge.nextElementSibling).toHaveTextContent(expected.date!);
      expect(
        row.querySelector("[data-research-date-column]"),
      ).toHaveTextContent(expected.date!);
    }
    expect(
      container.querySelectorAll(
        "#research button, #research [role=button], #research [tabindex]",
      ),
    ).toHaveLength(0);
  });
});

describe("Research canonical regeneration", () => {
  function source() {
    return parse(
      `<section id="research" class="pb-24 bg-white"><div class="container mx-auto"><div>Old hero</div>${baseline.listHtml}</div></section><section id="unrelated">Unchanged</section>`,
    );
  }

  it("runs after the landing override and replaces only body content with one canonical component marker", () => {
    const document = source();
    applyLandingHeroOverride(document, "research.html");
    const hero = document.querySelector("[data-landing-photo-hero]")!.outerHTML;
    const unrelated = document.querySelector("#unrelated")!.outerHTML;
    applyResearchSectionsOverride(document, "research.html");
    const content = document.querySelector("#research > .container")!;
    expect(content.children).toHaveLength(1);
    expect(content.firstElementChild!.outerHTML).toBe(
      '<div data-research-sections=""></div>',
    );
    expect(document.querySelector("[data-landing-photo-hero]")!.outerHTML).toBe(
      hero,
    );
    expect(document.querySelector("#unrelated")!.outerHTML).toBe(unrelated);
    expect(document.querySelectorAll("#research h3")).toHaveLength(0);
  });

  it("is idempotent, ignores other routes and rejects a missing required container", () => {
    const document = source();
    const before = document.body.innerHTML;
    applyResearchSectionsOverride(document, "qualified.html");
    expect(document.body.innerHTML).toBe(before);
    applyLandingHeroOverride(document, "research.html");
    applyResearchSectionsOverride(document, "research.html");
    const once = document.body.innerHTML;
    applyResearchSectionsOverride(document, "research.html");
    applyResearchSectionsOverride(document, "research.html");
    expect(document.body.innerHTML).toBe(once);
    expect(() =>
      applyResearchSectionsOverride(
        parse('<section id="research"></section>'),
        "research.html",
      ),
    ).toThrow("Missing Research content container");
  });

  it("wires the typed renderer into the converter after the hero and retires legacy row inference", () => {
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain('from "./apply-research-sections-override.ts"');
    expect(
      converter.indexOf("applyResearchSectionsOverride(document, sourceFile)"),
    ).toBeGreaterThan(
      converter.indexOf("applyLandingHeroOverride(document, sourceFile)"),
    );
    expect(converter).toContain('node.hasAttribute("data-research-sections")');
    expect(converter).toContain("<ResearchSections />");
    expect(converter).toContain(
      "import { ResearchSections } from '../ResearchSections'",
    );
    expect(converter).not.toContain("applyResearchIndexBadges");
    const generated = readFileSync(
      "src/pages/original/generated/OriginalResearchContent.tsx",
      "utf8",
    );
    expect(generated).toContain('<LandingPhotoHero page="research" />');
    expect(generated).toContain("<ResearchSections />");
    expect(generated).not.toContain("data-research-paper");
  });
});
