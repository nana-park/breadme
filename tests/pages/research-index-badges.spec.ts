import { deployedUrl } from "./deployment";
import { expect, test } from "./support";
import {
  assertResearchIndexBadges,
  captureResearchPapers,
  researchBaselineCommit,
  researchReady,
} from "../support/research-index-badges";

// WHAT: The real /breadme/ artifact and verify-live workflow both discover this
// spec at 390 and 1440px. WHY: A dev-only pass is not production verification.
test("Research index badges preserve content and responsive publication layout", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(deployedUrl("research.html")))?.status()).toBe(200);
  await researchReady(page);
  await assertResearchIndexBadges(page, testInfo);
  await captureResearchPapers(
    page,
    testInfo,
    `research-${page.viewportSize()!.width}`,
  );
  expect((await page.reload())?.status()).toBe(200);
  await researchReady(page);
  await expect(page.locator("[data-research-index]")).toHaveText([
    "SSCI",
    "SSCI",
    "KCI",
  ]);
  await expect(
    page.locator('[data-research-paper="4"] [data-research-meta]'),
  ).toHaveCount(0);
});

test("Research badge AS-IS and TO-BE review uses the immutable baseline", async ({
  page,
}, testInfo) => {
  const baselineUrl = process.env.RESEARCH_BADGES_BASELINE_URL;
  test.skip(
    !baselineUrl,
    "Comparison requires the immutable cf2da139 baseline server; core production assertions always run separately.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const width = page.viewportSize()!.width;
  await testInfo.attach("research-comparison-provenance", {
    body: JSON.stringify(
      {
        baselineCommit: researchBaselineCommit,
        baselineUrl,
        candidateUrl: deployedUrl("research.html"),
        width,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  for (const state of ["AS-IS", "TO-BE"] as const) {
    const url =
      state === "AS-IS"
        ? new URL("research.html", `${baselineUrl!.replace(/\/$/, "")}/`).href
        : deployedUrl("research.html");
    expect((await page.goto(url))?.status()).toBe(200);
    await researchReady(page);
    await expect(page.locator("[data-research-index]")).toHaveCount(
      state === "AS-IS" ? 0 : 3,
    );
    await captureResearchPapers(page, testInfo, `${state}-research-${width}`);
  }
});
