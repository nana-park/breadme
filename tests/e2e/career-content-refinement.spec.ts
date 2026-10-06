import { expect, test } from "@playwright/test";
import { enlargeComputedText } from "../mobile-ui/text-enlargement";

const intro =
  "Unfiltered voices from the cross-functional partners and leaders who have navigated complex product journeys alongside me.";

for (const width of [320, 390, 430, 767, 768, 1440]) {
  test(`Career content and testimonial layout ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/career.html");
    const root = page.locator('[data-original-page="career"]');
    await expect(root).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await root
        .locator(":scope > section")
        .evaluateAll((sections) => sections.map((section) => section.id)),
    ).toEqual(["about", "history", "testimonials"]);
    await expect(root.locator("#history-2")).toHaveCount(0);
    await expect(root.locator('[href="#history-2"]')).toHaveCount(0);
    await expect(root.locator("[data-mobile-snap-section]")).toHaveCount(3);
    await expect(root.locator("#history + #testimonials")).toHaveCount(1);
    await expect(
      root.locator('[data-reading-role="testimonial-intro"]'),
    ).toHaveText(intro);
    await expect(
      root.locator('[data-reading-role="testimonial-intro"] br'),
    ).toHaveCSS("display", width < 768 ? "none" : "inline");
    await page.getByRole("button", { name: "Next career page" }).click();
    await expect(page.locator("#career-page-indicator")).toHaveText("02 / 02");
    await page.getByRole("button", { name: "Previous career page" }).click();
    await expect(page.locator("#career-page-indicator")).toHaveText("01 / 02");
    const cards = root.locator('[data-reading-role="testimonial-card"]');
    await expect(cards).toHaveCount(6);
    await cards.nth(1).focus();
    await page.keyboard.press("ArrowLeft");
    for (let index = 0; index < 6; index += 1) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute("aria-pressed", "true");
      await card.focus();
      const dimensions = await card.evaluate((element) => ({
        width: (element as HTMLElement).offsetWidth,
        height: (element as HTMLElement).offsetHeight,
      }));
      if (width < 768) {
        expect(
          Math.abs(dimensions.width - dimensions.height),
        ).toBeLessThanOrEqual(1);
        await expect(card.locator(".card-quote")).toHaveCSS(
          "font-size",
          "14px",
        );
        await expect(card.locator(".card-author-title")).toHaveCSS(
          "font-size",
          "12px",
        );
      } else {
        expect(dimensions.height).toBe(width === 768 ? 350 : 380);
        await expect(card).toHaveCSS("padding", "40px");
        await expect(card.locator(".card-quote")).toHaveCSS(
          "font-size",
          "16px",
        );
      }
      const fits = await card.evaluate((element) => {
        const cardBox = element.getBoundingClientRect();
        return Array.from(
          element.querySelectorAll(
            ".card-stars, .card-quote, .card-signature, .card-author-title",
          ),
        ).every((child) => {
          const box = child.getBoundingClientRect();
          return (
            box.top >= cardBox.top - 1 &&
            box.bottom <= cardBox.bottom + 1 &&
            child.scrollHeight <= child.clientHeight + 1 &&
            child.scrollWidth <= child.clientWidth + 1
          );
        });
      });
      expect(
        fits,
        `testimonial ${index + 1}: complete quote and author fit`,
      ).toBe(true);
      if (index === 0) {
        const file = testInfo.outputPath(`career-testimonial-${width}.png`);
        await page.screenshot({ path: file, animations: "disabled" });
        await testInfo.attach("Career longest testimonial", {
          path: file,
          contentType: "image/png",
        });
      }
      if (index < 5) await page.keyboard.press("ArrowRight");
    }
    await cards.last().focus();
    await page.keyboard.press("ArrowLeft");
    await expect(cards.nth(4)).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    expect(errors).toEqual([]);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Academic Standing" }),
    ).toBeVisible();
    await expect(page.locator("#history-2 img")).toHaveCount(2);
  });
}

test("Career square cards expand for synthetic 200% text at 320px", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/career.html");
  await expect(page.locator("#testimonialsContainer")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const enlargement = await enlargeComputedText(page, "#testimonialsContainer");
  const cards = page.locator('[data-reading-role="testimonial-card"]');
  const results = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const card = element as HTMLElement;
      const box = card.getBoundingClientRect();
      const children = Array.from(
        card.querySelectorAll(
          ".card-quote, .card-signature, .card-author-title",
        ),
      );
      return {
        width: card.offsetWidth,
        height: card.offsetHeight,
        fits: children.every((child) => {
          const childBox = child.getBoundingClientRect();
          return (
            childBox.top >= box.top - 1 &&
            childBox.bottom <= box.bottom + 1 &&
            child.scrollHeight <= child.clientHeight + 1 &&
            child.scrollWidth <= child.clientWidth + 1
          );
        }),
      };
    }),
  );
  for (const result of results) expect(result.fits).toBe(true);
  expect(results[0].height).toBeGreaterThan(results[0].width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  await testInfo.attach("Synthetic text enlargement; not native zoom", {
    body: JSON.stringify({ enlargement, results }, null, 2),
    contentType: "application/json",
  });
});
