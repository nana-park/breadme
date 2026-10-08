import { expect, test } from "@playwright/test";
for (const width of [320, 390, 430, 768, 1440]) {
  for (const [route, title] of Object.entries({
    qualified: "Qualifications",
    projects: "Products",
    research: "Research",
    articles: "Articles",
  })) {
    test(`${route} photo hero at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 320 ? 640 : 900 });
      await page.goto(`/${route}.html`);
      const hero = page.locator(`[data-landing-photo-hero="${route}"]`);
      await expect(hero.getByRole("heading", { name: title })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(hero).toHaveCSS(
        "text-align",
        width < 768 ? "left" : "center",
      );
      await expect(hero.locator("p").first()).toHaveCSS(
        "font-size",
        width < 768 ? "13px" : "16px",
      );
      await expect
        .poll(() =>
          hero
            .locator("img")
            .evaluate(
              (img) =>
                img instanceof HTMLImageElement &&
                img.complete &&
                img.naturalWidth > 0,
            ),
        )
        .toBe(true);
      const metrics = await hero.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const heading = element.querySelector("h1")!.getBoundingClientRect();
        const paragraphs = Array.from(element.querySelectorAll("p"));
        return {
          width: bounds.width,
          headingInside:
            heading.top >= bounds.top && heading.bottom <= bounds.bottom,
          copyInside: paragraphs.every((p) => {
            const b = p.getBoundingClientRect();
            return (
              b.left >= bounds.left &&
              b.right <= bounds.right &&
              b.bottom <= bounds.bottom
            );
          }),
          overflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });
      expect(metrics).toEqual({
        width,
        headingInside: true,
        copyInside: true,
        overflow: false,
      });
      const path = testInfo.outputPath(`${route}-${width}.png`);
      await hero.screenshot({ path });
      await testInfo.attach(`${route} ${width}px`, {
        path,
        contentType: "image/png",
      });
      if (width === 320) {
        await hero.locator("p").evaluateAll((paragraphs) =>
          paragraphs.forEach((p) => {
            p.style.fontSize = "26px";
          }),
        );
        const overflow = await hero.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        );
        expect(overflow).toBe(false);
      }
    });
  }
}
