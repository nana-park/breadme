import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
for (const width of [390, 1440]) {
  test(`Home visual checkpoint ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Designing Actionable AI",
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const splineReady = await page
      .locator("spline-viewer canvas")
      .waitFor({ state: "visible", timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: testInfo.outputPath(`react-home-${width}-top.png`),
      animations: "disabled",
    });
    await page.screenshot({
      path: testInfo.outputPath(`react-home-${width}-full.png`),
      fullPage: true,
      animations: "disabled",
    });
    await fs.writeFile(
      testInfo.outputPath(`react-home-${width}.json`),
      JSON.stringify(
        {
          splineReady,
          errors,
          metrics: await page.evaluate(() => ({
            width: innerWidth,
            height: innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            heading: (() => {
              const node = document.querySelector("h1")!;
              const style = getComputedStyle(node);
              const rect = node.getBoundingClientRect();
              return {
                text: node.textContent,
                font: style.fontFamily,
                size: style.fontSize,
                weight: style.fontWeight,
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              };
            })(),
          })),
        },
        null,
        2,
      ),
    );
    expect(splineReady).toBe(true);
    expect(errors).toEqual([]);
  });
}
