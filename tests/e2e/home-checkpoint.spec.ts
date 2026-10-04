import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
// Capture the approved text-led Home without requiring a WebGL runtime.
test.setTimeout(90_000);
for (const width of [390, 1440]) {
  test(`Home visual checkpoint ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Designing AI Product Experiences Across Markets",
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page.locator("#home spline-viewer, #home canvas")).toHaveCount(
      0,
    );
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
          textLed: true,
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
    expect(errors).toEqual([]);
  });
}
