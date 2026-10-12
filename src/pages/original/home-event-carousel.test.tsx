import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyHomeEventCarouselOverrides } from "../../../scripts/apply-home-event-carousel-overrides.ts";
import { OriginalHomeContent } from "./generated/OriginalHomeContent";

const sourceTitles = [
  "APEC 2025",
  "Osaka Expo 2025",
  "NAVER AiCall JP-KR",
  "NAVER DAN24 Tech Exhibition",
  "Smart Life Week Korea",
  "Seoul Weak Companion Tech Fair",
  "EBS Documentary",
  "HCI Korea",
  "SK Telecom Creative Challenge",
  "Sungkyunkwan University",
  "SK Telecom Creative Challenge (KAIST)",
  "The Ergonomics Society of Korea",
];
const titles = [
  "APEC",
  "Osaka Expo",
  "NAVER AI CALL",
  "NAVER DAN",
  "Smart Life Week",
  "Seoul Inclusive Technology Expo",
  "EBS Documentary",
  "HCI Korea",
  "SK Telecom Creative Challenge",
  "Master’s Graduation",
  "SK Telecom Creative Challenge at KAIST",
  "Ergonomics Society Conference",
];
const subtitles = [
  "Product Launching · Oct 2025",
  "Exhibition · Sep 2025",
  "Product Launch in Japan · Jan 2025",
  "Exhibition · Nov 2024",
  "Exhibition · Oct 2024",
  "Exhibition · Nov 2023",
  "Expert Interview · Nov 2023",
  "Poster Session · 2023",
  "Exhibition (Excellence Award) · Feb 2023",
  "Master's Degree · Feb 2023",
  "Speaker (Finalist) · 2022",
  "Speaker · Jul 2022",
];

function sourceCard(
  title: string,
  subtitle: string,
  imageAlt: string,
  displayHook = false,
) {
  const [role, date] = subtitle.split(" · ");
  return `<div class="card"><img src="event.jpg" alt="${imageAlt}"><h3 class="keep"${displayHook ? ' data-home-event-title=""' : ""}>\n  ${title}</h3><p><span>${role}</span> · ${date}</p></div>`;
}

describe("Home event carousel approved display copy", () => {
  it("keeps all twelve cards, dates and original image descriptions with scoped title hooks", () => {
    const { container } = render(<OriginalHomeContent />);
    const cards = Array.from(
      container.querySelectorAll(
        "#footprint .footprint-gallery-container > div",
      ),
    );
    expect(
      cards.map((card) => card.querySelector("h3")?.textContent?.trim()),
    ).toEqual(titles);
    expect(
      cards.map((card) => card.querySelector("p")?.textContent?.trim()),
    ).toEqual(subtitles);
    expect(cards.map((card) => card.querySelector("img")?.alt)).toEqual(
      sourceTitles,
    );
    expect(container.querySelectorAll("[data-home-event-title]")).toHaveLength(
      12,
    );
    for (const card of cards) {
      expect(card.querySelector("h3")).toHaveAttribute(
        "data-home-event-title",
        "",
      );
    }
    expect(
      container.querySelectorAll("[data-home-event-title]:not(#footprint h3)"),
    ).toHaveLength(0);
  });

  it("applies only approved copy and title hooks inside Home's event carousel, idempotently", () => {
    const wrap = (cards: string) =>
      '<section id="footprint"><div class="footprint-gallery-container">' +
      cards +
      "</div><h3>APEC 2025</h3></section><section><h3>Sungkyunkwan University</h3><p>Dec 2023</p></section>";
    const source = wrap(
      sourceTitles
        .map((title, index) =>
          sourceCard(
            title,
            index === 5
              ? "Exhibition · Dec 2023"
              : index === 2
                ? "Product Launching · Jan 2025"
                : subtitles[index],
            title,
          ),
        )
        .join("") +
        sourceCard(
          "Another Event 2025",
          "Exhibition · Dec 2023",
          "Another Event 2025",
        ),
    );
    const expected = wrap(
      titles
        .map((title, index) =>
          sourceCard(title, subtitles[index], sourceTitles[index], true),
        )
        .join("") +
        sourceCard(
          "Another Event 2025",
          "Exhibition · Dec 2023",
          "Another Event 2025",
          true,
        ),
    );
    const doc = new DOMParser().parseFromString(source, "text/html");
    applyHomeEventCarouselOverrides(doc, "index.html");
    expect(doc.body.innerHTML).toBe(expected);
    applyHomeEventCarouselOverrides(doc, "index.html");
    expect(doc.body.innerHTML).toBe(expected);
    const otherPage = new DOMParser().parseFromString(source, "text/html");
    applyHomeEventCarouselOverrides(otherPage, "projects.html");
    expect(otherPage.body.innerHTML).toBe(source);
  });

  it("remains wired into the canonical page converter", () => {
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain(
      'import { applyHomeEventCarouselOverrides } from "./apply-home-event-carousel-overrides.ts"',
    );
    expect(converter).toContain(
      "applyHomeEventCarouselOverrides(document, sourceFile)",
    );
  });
});
