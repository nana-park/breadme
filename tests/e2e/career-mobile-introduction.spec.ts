import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430, 767, 768, 1440]) {
  test(`Career introduction alignment ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/career.html", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const intro = page.locator('[data-reading-role="career-introduction"]');
    await expect(intro).toBeVisible();
    for (const selector of ["h2", "p"]) {
      const text = intro.locator(selector);
      await expect(text).toHaveCSS("text-align", width < 768 ? "left" : "center");
      const box = (await text.boundingBox())!;
      if (width < 768) {
        expect(box.x).toBeCloseTo(Math.max(20, (width - 380) / 2), 1);
        expect(box.width).toBeCloseTo(Math.min(width - 40, 380), 1);
      } else {
        expect(box.x + box.width / 2).toBeCloseTo(width / 2, 1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`career-introduction-${width}.png`), animations: "disabled" });
  });
}
