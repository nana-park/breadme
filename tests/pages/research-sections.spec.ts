import { deployedUrl } from "./deployment";
import { expect, test } from "./support";
import {
  assertResearchIndexBadges,
  researchReady,
} from "../support/research-index-badges";
import {
  academicHeadingStyle,
  assertResearchSections,
  captureResearchSections,
  researchHashClearsHeader,
} from "../support/research-sections";
import {
  expectedResearchSections,
  researchSectionsBaselineCommit,
} from "../fixtures/research-sections-expected";

// WHAT: Both the static /breadme/ artifact and future verify-live runs discover
// this core test at 390px and 1440px, independently of baseline availability.
test("Research sections preserve approved content, academic headings, navigation and responsive rows", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(deployedUrl("qualified.html")))?.status()).toBe(200);
  await expect(page.locator("#history-2 h2")).toHaveText("Academic Standing");
  await page.evaluate(() => document.fonts.ready);
  const reference = await academicHeadingStyle(page);
  const publications = page
    .locator("#history-2")
    .getByRole("link", { name: /View publications/ });
  await expect(publications).toHaveAttribute("href", "/breadme/research.html");
  await publications.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(deployedUrl("research.html"));
  await researchReady(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await assertResearchSections(page, reference, testInfo);
  await assertResearchIndexBadges(page, testInfo);
  await expect(page.locator("#navbar")).not.toContainText(
    /Journal Publications|Ongoing Research|Conference Presentations/,
  );
  await captureResearchSections(
    page,
    testInfo,
    `research-sections-${page.viewportSize()!.width}`,
    true,
  );

  // Back/Forward retain the original page route and the existing education link.
  await page.goBack();
  await expect(page).toHaveURL(deployedUrl("qualified.html"));
  await expect(page.locator("#history-2 h2")).toHaveText("Academic Standing");
  await page.goForward();
  await expect(page).toHaveURL(deployedUrl("research.html"));
  await researchReady(page);
  for (const section of expectedResearchSections) {
    await page.goto(deployedUrl(`research.html#${section.id}`));
    await researchReady(page);
    await researchHashClearsHeader(page, section.id);
    expect((await page.reload())?.status()).toBe(200);
    await researchReady(page);
    await researchHashClearsHeader(page, section.id);
  }
});

// WHAT: Optional visual evidence has its own explicit skip, never a skip for
// core acceptance. WHY: Comparison screenshots cannot substitute for assertions.
test("Research sections AS-IS and TO-BE show the immutable mixed list and all three new chapters", async ({
  page,
}, testInfo) => {
  const baselineUrl = process.env.RESEARCH_SECTIONS_BASELINE_URL;
  test.skip(
    !baselineUrl,
    "Only AS-IS comparison requires the immutable ecc017c baseline server; core production checks always run separately.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  const width = page.viewportSize()!.width;
  await testInfo.attach("research-sections-comparison-provenance", {
    body: JSON.stringify(
      {
        baselineCommit: researchSectionsBaselineCommit,
        baselineUrl,
        candidateUrl: deployedUrl("research.html"),
        width,
        note: "The same browser and viewport capture the actual content plus full-page context. The legacy four-row fixture is unchanged.",
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
  for (const state of ["AS-IS", "TO-BE"] as const) {
    const candidate = state === "TO-BE";
    const url = candidate
      ? deployedUrl("research.html")
      : new URL("research.html", `${baselineUrl!.replace(/\/$/, "")}/`).href;
    expect((await page.goto(url))?.status()).toBe(200);
    await expect(page.locator('[data-original-page="research"]')).toBeVisible();
    await expect(page.locator("#research h3")).toHaveCount(candidate ? 9 : 4);
    await expect(page.locator("[data-research-section]")).toHaveCount(
      candidate ? 3 : 0,
    );
    // ecc017c already includes the previously approved journal badges.
    await expect(page.locator("[data-research-index]")).toHaveText([
      "SSCI",
      "SSCI",
      "KCI",
    ]);
    await page.evaluate(async () => {
      for (const image of document.querySelectorAll<HTMLImageElement>(
        "#research img",
      ))
        image.loading = "eager";
      await document.fonts.ready;
    });
    await expect
      .poll(() =>
        page.locator("#research img").evaluateAll((images) =>
          images.every((node) => {
            const image = node as HTMLImageElement;
            return image.complete && image.naturalWidth > 0;
          }),
        ),
      )
      .toBe(true);
    await captureResearchSections(
      page,
      testInfo,
      `${state}-research-sections-${width}`,
      candidate,
    );
  }
});
