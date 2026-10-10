import { deployedUrl } from "./deployment";
import { expect, test } from "./support";
import {
  assertResearchIndexBadges,
  researchReady,
} from "../support/research-index-badges";

// WHAT: Keep the approved badge contract in production/live verification.
// WHY: The new nine-record structure must not grant indexes to other kinds.
test("Research journal badges retain responsive behavior across all nine records", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(deployedUrl("research.html")))?.status()).toBe(200);
  await researchReady(page);
  await assertResearchIndexBadges(page, testInfo);
  expect((await page.reload())?.status()).toBe(200);
  await researchReady(page);
  await expect(page.locator("[data-research-index]")).toHaveText([
    "SSCI",
    "SSCI",
    "KCI",
  ]);
  await expect(
    page.locator(
      '[data-research-kind="ongoing"] [data-research-meta], [data-research-kind="conference"] [data-research-meta]',
    ),
  ).toHaveCount(0);
});
