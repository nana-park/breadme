import { expect, test } from "@playwright/test";
import { assertHomeEventCarousel } from "../support/home-event-carousel";

for (const width of [320, 390, 768, 1440]) {
  test(`Home event titles and normal-case subtitles reflow at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const cards = await assertHomeEventCarousel(page);
    await expect
      .poll(() =>
        cards
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    const gallery = page.locator("#footprint .footprint-gallery-container");
    await gallery.scrollIntoViewIfNeeded();
    for (const index of [0, 2, 5, 9, 10, 11]) {
      const card = cards.nth(index);
      await gallery.evaluate((node, index) => {
        const card = node.children[index].getBoundingClientRect();
        const clip = node.getBoundingClientRect();
        node.scrollTo({
          left: node.scrollLeft + card.left - clip.left,
          behavior: "instant",
        });
      }, index);
      // Mandatory snapping must settle with the whole selected card visible.
      await expect
        .poll(() =>
          card.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            const clip = node.parentElement!.getBoundingClientRect();
            return rect.left >= clip.left - 1 && rect.right <= clip.right + 1;
          }),
        )
        .toBe(true);
      await expect(card).toBeInViewport({ ratio: 1 });
      const path = testInfo.outputPath(`home-event-${index + 1}-${width}.png`);
      await card.screenshot({ path, animations: "disabled" });
      await testInfo.attach(`Event ${index + 1} at ${width}px`, {
        path,
        contentType: "image/png",
      });
    }
    // Moving back through the horizontal gallery must preserve the first card.
    await cards.first().scrollIntoViewIfNeeded();
    await expect(cards.first()).toBeInViewport({ ratio: 1 });
    await expect
      .poll(() => gallery.evaluate((node) => node.scrollLeft))
      .toBeLessThanOrEqual(1);
    await assertHomeEventCarousel(page);
  });
}
