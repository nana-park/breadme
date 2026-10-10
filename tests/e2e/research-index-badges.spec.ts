import { expect, test } from "@playwright/test";
import {
  assertResearchIndexBadges,
  researchReady,
} from "../support/research-index-badges";
import {
  academicHeadingStyle,
  assertResearchSections,
} from "../support/research-sections";

// WHAT: Exercise both sides of the mobile boundary and the existing lg columns.
// WHY: The production suite covers 390/1440; these catch breakpoint-only drift.
for (const width of [320, 767, 768, 1024]) {
  test(`Research section and index badge breakpoint ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/qualified.html");
    await expect(page.locator("#history-2 h2")).toHaveText("Academic Standing");
    await page.evaluate(() => document.fonts.ready);
    const reference = await academicHeadingStyle(page);
    await page.goto("/research.html");
    await researchReady(page);
    await assertResearchIndexBadges(page, testInfo);
    await assertResearchSections(page, reference, testInfo);
  });
}
