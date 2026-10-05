import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { originalRoutePaths } from "../../src/config/originalRoutes";
import { captureLayout, settleFirstScreen } from "./capture-layout";

// WHAT: Fresh-navigation menu evidence compares listing and project-detail routes.
// WHY: Color and small-text observations must come from the final CSS cascade.
for (const route of ["projects", "articles", "llm-based-voice-ivr"] as const) {
  for (const width of [320, 390]) {
    const caseId = `${route}--w${width}--menu-open`;
    test(`baseline ${caseId}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      const response = await page.goto(`./${originalRoutePaths[route]}`, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.ok()).toBe(true);
      await expect(page.locator("main h1, main h2").first()).toBeVisible();
      await settleFirstScreen(page);
      await page.locator("#mobileToggle").click();
      await expect(page.locator("#mobileToggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      const readiness = await settleFirstScreen(page);
      const screenshotPath = testInfo.outputPath(`${caseId}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        animations: "disabled",
      });
      await testInfo.attach(caseId, {
        path: screenshotPath,
        contentType: "image/png",
      });
      const metrics = await captureLayout(page);
      const path = testInfo.outputPath(`${caseId}.json`);
      await writeFile(
        path,
        JSON.stringify(
          {
            schemaVersion: 1,
            mode: "baseline",
            caseId,
            route,
            width,
            readiness,
            metrics,
          },
          null,
          2,
        ),
      );
      await testInfo.attach(`${caseId}-geometry`, {
        path,
        contentType: "application/json",
      });
    });
  }
}
