import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430, 767, 768, 1440]) {
  test(`Qualifications layout ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/qualified.html");
    const cards = page.locator('[data-reading-role="competency-card"]');
    await expect(cards).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS("border-top-width", width < 768 ? "1px" : "0px");
      if (width < 768) {
        await expect(card).toHaveCSS("border-radius", "8px");
        await expect(card).toHaveCSS("padding-left", "24px");
        await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
        expect(await card.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      }
    }
    const headers = page.locator('[data-reading-role="qualification-section-header"]');
    await expect(headers).toHaveCount(3);
    for (const header of await headers.all()) {
      await expect(header).toHaveCSS("text-align", width < 768 ? "left" : "center");
      if (width < 768) {
        const inset = await header.evaluate((node) => {
          const container = node.parentElement!;
          return node.querySelector("h2")!.getBoundingClientRect().left -
            container.getBoundingClientRect().left - parseFloat(getComputedStyle(container).paddingLeft);
        });
        expect(Math.abs(inset)).toBeLessThan(1);
      }
    }
    if (width === 390 || width === 1440) {
      await page.locator("#toolkit-grid").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`qualified-core-${width}.png`), animations: "disabled" });
    }
    const tabs = page.locator("#cert-tabs button");
    if (width < 768) {
      const boxes = await tabs.evaluateAll((nodes) => nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { top: rect.top, height: rect.height };
      }));
      expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
      expect(boxes.every((box) => box.height >= 44)).toBe(true);
      await expect(page.locator("#cert-tabs")).toHaveCSS("overflow-x", "auto");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator("#cert-tabs").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath(`qualified-certifications-${width}.png`), animations: "disabled" });
      // The same filters still select their existing panels, including repeats.
      for (const name of ["Languages", "Data & Statistics", "AI & Tools", "AI & Tools"]) {
        const tab = tabs.filter({ hasText: name });
        await tab.click();
        await expect(tab).toHaveClass(/active/);
        const target = await tab.getAttribute("data-target");
        await expect(page.locator(`#${target}`)).toBeVisible();
      }
    }
  });
}
