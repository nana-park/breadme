import { test } from "@playwright/test";
import {
  assertResearchIndexBadges,
  researchReady,
} from "../support/research-index-badges";

// WHAT: Exercise both sides of the mobile boundary and the existing lg columns.
// WHY: The production suite covers 390/1440; these catch breakpoint-only drift.
for (const width of [320, 767, 768, 1024]) {
  test(`Research index badge breakpoint ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/research.html");
    await researchReady(page);
    await assertResearchIndexBadges(page, testInfo);
  });
}
