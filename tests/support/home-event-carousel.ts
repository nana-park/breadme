import { expect, type Page } from "@playwright/test";

// Independent approved display fixture, not imported from production overrides.
export const expectedHomeEventCards = [
  ["APEC", "Product Launching · Oct 2025", "APEC 2025"],
  ["Osaka Expo", "Exhibition · Sep 2025", "Osaka Expo 2025"],
  ["NAVER AI CALL", "Product Launch in Japan · Jan 2025", "NAVER AiCall JP-KR"],
  ["NAVER DAN", "Exhibition · Nov 2024", "NAVER DAN24 Tech Exhibition"],
  ["Smart Life Week", "Exhibition · Oct 2024", "Smart Life Week Korea"],
  [
    "Seoul Inclusive Technology Expo",
    "Exhibition · Nov 2023",
    "Seoul Weak Companion Tech Fair",
  ],
  ["EBS Documentary", "Expert Interview · Nov 2023", "EBS Documentary"],
  ["HCI Korea", "Poster Session · 2023", "HCI Korea"],
  [
    "SK Telecom Creative Challenge",
    "Exhibition (Excellence Award) · Feb 2023",
    "SK Telecom Creative Challenge",
  ],
  [
    "Master’s Graduation",
    "Master's Degree · Feb 2023",
    "Sungkyunkwan University",
  ],
  [
    "SK Telecom Creative Challenge at KAIST",
    "Speaker (Finalist) · 2022",
    "SK Telecom Creative Challenge (KAIST)",
  ],
  [
    "Ergonomics Society Conference",
    "Speaker · Jul 2022",
    "The Ergonomics Society of Korea",
  ],
] as const;

export async function assertHomeEventCarousel(page: Page) {
  const gallery = page.locator("#footprint .footprint-gallery-container");
  const cards = gallery.locator(":scope > div");
  await expect(cards).toHaveCount(12);
  await expect(gallery.locator("[data-home-event-title]")).toHaveCount(12);
  await expect(cards.locator("h3")).toHaveText(
    expectedHomeEventCards.map(([title]) => title),
  );
  await expect(cards.locator("p")).toHaveText(
    expectedHomeEventCards.map(([, subtitle]) => subtitle),
  );
  await page.evaluate(() => document.fonts.ready);
  for (let index = 0; index < expectedHomeEventCards.length; index++) {
    const card = cards.nth(index);
    await expect(card.locator("img")).toHaveAttribute(
      "alt",
      expectedHomeEventCards[index][2],
    );
    await expect(card.locator("h3")).toHaveCSS("text-transform", "uppercase");
    await expect(card.locator("p")).toHaveCSS("text-transform", "none");
    await expect(card.locator("h3")).toHaveCSS(
      "font-size",
      page.viewportSize()!.width < 768 ? "18px" : "20px",
    );
    await expect(card.locator("h3")).toHaveCSS("font-weight", "400");
  }
  const geometry = await cards.evaluateAll((nodes) =>
    nodes.map((card) => {
      const box = card.getBoundingClientRect();
      return {
        width: box.width,
        textFits: Array.from(card.querySelectorAll("h3, p")).every((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          const textBox = node.getBoundingClientRect();
          return (
            node.scrollWidth <= node.clientWidth &&
            Array.from(range.getClientRects()).every(
              (line) =>
                line.left >= box.left - 1 &&
                line.right <= box.right + 1 &&
                line.top >= textBox.top - 1 &&
                line.bottom <= textBox.bottom + 1,
            )
          );
        }),
      };
    }),
  );
  const width = page.viewportSize()!.width;
  for (const card of geometry) {
    expect(card.width).toBe(width < 768 ? 260 : width < 1024 ? 320 : 380);
    expect(card.textFits).toBe(true);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(width);
  return cards;
}
