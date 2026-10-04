import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  originalPageIds,
  originalRoutePaths,
} from "../../src/config/originalRoutes";
import { captureLayout, settleFirstScreen } from "./capture-layout";

const widths = [320, 360, 375, 390, 430, 767, 768, 1440] as const;
const screenshotWidths = new Set([320, 390, 430, 768, 1440]);
const captureOnly = process.env.MOBILE_UI_CAPTURE_ONLY ?? "1";
if (captureOnly !== "1") {
  throw new Error(
    "MOBILE_UI_CAPTURE_ONLY must be 1 until screenshot review establishes regression assertions.",
  );
}
const mode = "baseline";

// WHAT: 14 route loads, 112 identified viewport cases, 70 bounded top screenshots.
// WHY: Reusing each route's page avoids reloading large media eight times. These
// are resize-layout observations; fresh-navigation breakpoint tests are separate.
for (const route of originalPageIds) {
  test(`baseline ${route}: 8 viewport cases`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`./${originalRoutePaths[route]}`, {
      waitUntil: "domcontentloaded",
    });
    expect(
      response?.ok(),
      "The route must load before it can produce baseline evidence",
    ).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    testInfo.annotations.push({
      type: "baseline-evidence",
      description:
        "Capture success is not a visual QA pass; review PNGs, readiness, and candidate geometry.",
    });
    const summary: Array<Record<string, unknown>> = [];
    for (const width of widths) {
      const caseId = `${route}--w${width}--top`;
      await test.step(caseId, async () => {
        await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
        const readiness = await settleFirstScreen(page);
        if (screenshotWidths.has(width)) {
          const path = testInfo.outputPath(`${caseId}.png`);
          await page.screenshot({
            path,
            fullPage: false,
            animations: "disabled",
            timeout: 15_000,
          });
          await testInfo.attach(caseId, { path, contentType: "image/png" });
        }
        const metrics = await captureLayout(page);
        const evidence = {
          schemaVersion: 1,
          mode,
          caseId,
          route,
          width,
          readiness,
          errors: [...errors],
          metrics,
        };
        const path = testInfo.outputPath(`${caseId}.json`);
        await writeFile(path, JSON.stringify(evidence, null, 2));
        await testInfo.attach(`${caseId}-geometry`, {
          path,
          contentType: "application/json",
        });
        summary.push({
          caseId,
          readiness,
          horizontalOverflow: metrics.document.horizontalOverflow,
          headings: metrics.headings.map(({ text, font, box }) => ({
            text,
            font,
            box,
          })),
          textCoverage: metrics.textCoverage,
          clippedTextCandidates: metrics.textRuns.filter((run) =>
            run.clippingAncestors.some(
              (ancestor) =>
                ancestor.clippedFragmentsX || ancestor.clippedFragmentsY,
            ),
          ).length,
          smallTouchCandidates: metrics.controls.filter(
            (control) => control.below44px,
          ).length,
          errors: [...errors],
        });
      });
    }
    const path = testInfo.outputPath(`${route}--summary.json`);
    await writeFile(
      path,
      JSON.stringify(
        { schemaVersion: 1, mode, route, cases: summary },
        null,
        2,
      ),
    );
    await testInfo.attach(`${route}-summary`, {
      path,
      contentType: "application/json",
    });
  });
}
