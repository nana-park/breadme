import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { deployment } from "./deployment";

type Resource = { url: string; status: number; type: string };
export type ResourceAudit = {
  responses: Resource[];
  expected404s: Set<string>;
};

export const test = base.extend<{ audit: ResourceAudit }>({
  audit: [
    async ({ page }, use, testInfo) => {
      const audit: ResourceAudit = { responses: [], expected404s: new Set() };
      const errors: string[] = [];
      const consoleErrors: Array<{ text: string; url: string }> = [];
      const failedRequests: Array<{ url: string; error: string }> = [];
      const escapedBase: string[] = [];
      const blockedAppWrites: string[] = [];
      const blockedExternalWrites: string[] = [];
      const isAppUrl = (value: string) => {
        const url = new URL(value);
        // WHY: Chromium may request its implicit root favicon; no app uses that URL.
        return (
          url.origin === deployment.origin && url.pathname !== "/favicon.ico"
        );
      };
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
          // WHY: Preserved embeds can attempt telemetry; block it without treating
          // external analytics as an app deployment regression.
          const writes =
            new URL(request.url()).origin === deployment.origin
              ? blockedAppWrites
              : blockedExternalWrites;
          writes.push(`${request.method()} ${request.url()}`);
          await route.abort("blockedbyclient");
        } else await route.continue();
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error")
          consoleErrors.push({
            text: message.text(),
            url: message.location().url,
          });
      });
      page.on("request", (request) => {
        if (
          isAppUrl(request.url()) &&
          !new URL(request.url()).pathname.startsWith(deployment.pathname)
        )
          escapedBase.push(request.url());
      });
      page.on("response", (response) => {
        if (isAppUrl(response.url()))
          audit.responses.push({
            url: response.url(),
            status: response.status(),
            type: response.request().resourceType(),
          });
      });
      page.on("requestfailed", (request) => {
        const error = request.failure()?.errorText || "Unknown request failure";
        // WHY: Leaving/reloading a real document legitimately cancels pending media.
        if (isAppUrl(request.url()) && !error.includes("ERR_ABORTED"))
          failedRequests.push({ url: request.url(), error });
      });
      await use(audit);
      const unexpectedResponses = audit.responses.filter(
        (response) =>
          response.status >= 400 &&
          !(response.status === 404 && audit.expected404s.has(response.url)),
      );
      const appConsoleErrors = consoleErrors.filter(
        (entry) =>
          entry.url &&
          isAppUrl(entry.url) &&
          !audit.expected404s.has(entry.url),
      );
      await testInfo.attach("deployment-resources", {
        body: Buffer.from(
          JSON.stringify(
            {
              baseURL: deployment.href,
              viewport: page.viewportSize(),
              errors,
              consoleErrors,
              failedRequests,
              escapedBase,
              blockedAppWrites,
              blockedExternalWrites,
              responses: audit.responses,
            },
            null,
            2,
          ),
        ),
        contentType: "application/json",
      });
      expect(errors, "Uncaught runtime errors").toEqual([]);
      expect(appConsoleErrors, "App console errors").toEqual([]);
      expect(unexpectedResponses, "App resource HTTP failures").toEqual([]);
      expect(failedRequests, "App network failures").toEqual([]);
      expect(escapedBase, "Resources escaping /breadme/").toEqual([]);
      expect(
        blockedAppWrites,
        "The app must not attempt writes during production QA",
      ).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export async function assertPageIdentity(page: Page, pageId: string) {
  await expect(page.locator("[data-original-page]")).toHaveAttribute(
    "data-original-page",
    pageId,
  );
  await expect(
    page.locator("main h1:visible, main h2:visible").first(),
  ).toBeVisible();
}

export async function assertLocalLinks(page: Page) {
  const links = await page
    .locator("a[href]")
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLAnchorElement).href),
    );
  expect(links.length).toBeGreaterThan(0);
  for (const href of links) {
    const url = new URL(href);
    if (url.origin === deployment.origin)
      expect(url.pathname, `Internal link: ${href}`).toMatch(/^\/breadme\//);
  }
}

export async function assertAssetsReady(page: Page) {
  // WHAT: Force image URLs into the network audit, including lazy images below the fold.
  // WHY: A base-path check should not depend on scrolling through every prior behavior test.
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = "eager";
    await document.fonts.ready;
  });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.images)
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.src),
        ),
      {
        message: "Every rendered image loads from the static artifact",
        timeout: 30_000,
      },
    )
    .toEqual([]);
  const styles = await page.evaluate(() => ({
    loadedFonts: Array.from(document.fonts).filter(
      (font) => font.status === "loaded",
    ).length,
    failedFonts: Array.from(document.fonts)
      .filter((font) => font.status === "error")
      .map((font) => font.family),
    stylesheets: Array.from(document.styleSheets)
      .filter((sheet) => sheet.href)
      .map((sheet) => ({
        url: sheet.href!,
        rules: sheet.cssRules.length,
      })),
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(styles.failedFonts).toEqual([]);
  expect(styles.loadedFonts, "Local fonts actually load").toBeGreaterThan(0);
  expect(
    styles.stylesheets.length,
    "Built CSS stylesheet is present",
  ).toBeGreaterThan(0);
  for (const sheet of styles.stylesheets) {
    expect(sheet.url).toContain(`${deployment.href}assets/`);
    expect(sheet.rules).toBeGreaterThan(0);
  }
  expect(styles.scrollWidth).toBeLessThanOrEqual(styles.width);
}
