import { originalRoutePaths } from "../../src/config/originalRoutes";
import { deployedUrl, deployment } from "./deployment";
import {
  assertAssetsReady,
  assertLocalLinks,
  assertPageIdentity,
  expect,
  test,
} from "./support";

// WHAT: Fourteen real files × two viewports, each opened directly then refreshed.
for (const [pageId, route] of Object.entries(originalRoutePaths)) {
  test(`static route and refresh: ${route}`, async ({
    page,
    audit,
  }, testInfo) => {
    const response = await page.goto(deployedUrl(route));
    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("text/html");
    await assertPageIdentity(page, pageId);
    await assertAssetsReady(page);
    await assertLocalLinks(page);

    const refresh = await page.reload();
    expect(refresh?.status()).toBe(200);
    await expect(page).toHaveURL(deployedUrl(route));
    await assertPageIdentity(page, pageId);
    await assertAssetsReady(page);
    await assertLocalLinks(page);

    if (pageId === "home") {
      await expect(page.locator("spline-viewer")).toHaveAttribute(
        "url",
        `${deployment.pathname}original-external/spline/scene.splinecode`,
      );
      await expect(page.locator("spline-viewer canvas")).toBeVisible({
        timeout: 30_000,
      });
      // WHY: Preserve the original visible attribution while verifying its local icon.
      await expect(page.locator("spline-viewer #logo")).toBeVisible();
      await expect(page.locator("spline-viewer #logo")).toHaveAttribute(
        "href",
        /^https:\/\/spline\.design\//,
      );
      expect(
        audit.responses.some(
          (resource) =>
            resource.url ===
              deployedUrl("original-external/spline/scene.splinecode") &&
            resource.status === 200,
        ),
      ).toBe(true);
      await expect
        .poll(() =>
          audit.responses.some(
            (resource) =>
              resource.url ===
                deployedUrl("original-external/spline/icon-favicon.png") &&
              resource.status === 200,
          ),
        )
        .toBe(true);
    }
    if (pageId === "home" || pageId === "llm-based-voice-ivr") {
      await page.evaluate(() => window.scrollTo(0, 0));
      for (const fullPage of [false, true]) {
        const name = `${pageId}-${page.viewportSize()!.width}-${fullPage ? "full" : "top"}`;
        const path = testInfo.outputPath(`${name}.png`);
        await page.screenshot({ path, fullPage, animations: "disabled" });
        await testInfo.attach(name, { path, contentType: "image/png" });
      }
    }
  });
}

test("Home → Projects → nested detail keeps the base through refresh and Back", async ({
  page,
}) => {
  const home = await page.goto(deployedUrl());
  expect(home?.status()).toBe(200);
  await assertPageIdentity(page, "home");
  if (page.viewportSize()!.width < 1024)
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "PROJECTS", exact: true })
    .click();
  await expect(page).toHaveURL(deployedUrl("projects.html"));
  await assertPageIdentity(page, "projects");
  const voiceIvrSelector = `a[href="${deployment.pathname}projects/llm-based-voice-ivr.html"]`;
  // WHY: The first global match belongs to permanently hidden archived cards.
  // Follow the visible LINE WORKS disclosure, as a visitor does, before its link.
  const voiceIvrProject = page.locator("main details:visible").filter({
    has: page.locator(voiceIvrSelector),
  });
  await expect(voiceIvrProject).toHaveCount(1);
  await voiceIvrProject.locator(":scope > summary").click();
  await expect(voiceIvrProject).toHaveAttribute("open", "");
  const voiceIvrLink = voiceIvrProject.locator(voiceIvrSelector);
  await expect(voiceIvrLink).toBeVisible();
  await voiceIvrLink.click();
  await expect(page).toHaveURL(
    deployedUrl("projects/llm-based-voice-ivr.html"),
  );
  await assertPageIdentity(page, "llm-based-voice-ivr");
  expect((await page.reload())?.status()).toBe(200);
  await assertPageIdentity(page, "llm-based-voice-ivr");
  await assertLocalLinks(page);
  await page.goBack();
  await expect(page).toHaveURL(deployedUrl("projects.html"));
  await assertPageIdentity(page, "projects");
  await page.goBack();
  await expect(page).toHaveURL(deployedUrl());
  await assertPageIdentity(page, "home");
});

test("Articles hash detail survives a direct load, refresh, and history navigation", async ({
  page,
}) => {
  const url = deployedUrl("articles.html#article-detail?id=47268");
  expect((await page.goto(url))?.status()).toBe(200);
  await assertPageIdentity(page, "articles");
  await expect(page.locator("#article-detail-title")).toHaveText(
    "Hockney’s iPad",
  );
  expect((await page.reload())?.status()).toBe(200);
  await expect(page).toHaveURL(url);
  await expect(page.locator("#article-detail-title")).toHaveText(
    "Hockney’s iPad",
  );
  await assertAssetsReady(page);
  await assertLocalLinks(page);
  await page
    .getByRole("button", { name: "Back to List", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("navigation", { name: "Articles pagination" }),
  ).toBeVisible();
  await expect(page).toHaveURL(deployedUrl("articles.html#articles"));
  await page.goBack();
  await expect(page).toHaveURL(url);
  await expect(page.locator("#article-detail-title")).toHaveText(
    "Hockney’s iPad",
  );
});

test("unknown files remain true 404s instead of silently rendering Home", async ({
  page,
  request,
  audit,
}) => {
  for (const route of [
    "__pages-smoke-missing__.html",
    "projects/__missing__/about.html",
  ]) {
    const url = deployedUrl(route);
    audit.expected404s.add(url);
    expect((await page.goto(url))?.status()).toBe(404);
    await expect(page.locator("[data-original-page]")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Designing Actionable AI" }),
    ).toHaveCount(0);
    expect((await page.reload())?.status()).toBe(404);
    await expect(page.locator("[data-original-page]")).toHaveCount(0);
  }
  const missingAsset = await request.get(
    deployedUrl("assets/__pages-smoke-missing__.js"),
  );
  expect(missingAsset.status()).toBe(404);
});
