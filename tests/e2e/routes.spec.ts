import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

const routes = [
  "index.html",
  "about.html",
  "career.html",
  "qualified.html",
  "enjoy.html",
  "projects.html",
  "research.html",
  "articles.html",
  "lectures.html",
  "awards.html",
  "contact.html",
  "projects/llm-based-voice-ivr.html",
  "projects/hopzie-oneclickbuilder.html",
  "projects/ai-mentoring-agent-detail.html",
];
for (const width of [390, 1440]) {
  for (const route of routes) {
    test(`route smoke ${width} ${route}`, async ({ page }, testInfo) => {
      test.setTimeout(60000);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      const errors: string[] = [],
        badResources: string[] = [];
      const consoleErrors: Array<{ text: string; url: string }> = [];
      page.on("console", (message) => {
        if (message.type() === "error")
          consoleErrors.push({
            text: message.text(),
            url: message.location().url,
          });
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (
          response.url().startsWith("http://127.0.0.1:4173/") &&
          response.status() >= 400
        )
          badResources.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(`/${route}`);
      const expectedPage =
        route === "index.html"
          ? "home"
          : route
              .split("/")
              .at(-1)!
              .replace(/\.html$/, "");
      await expect(page.locator("[data-original-page]")).toHaveAttribute(
        "data-original-page",
        expectedPage,
      );
      if (route.startsWith("projects/"))
        await expect(page.locator("#email-popup")).toHaveCount(0);
      if (route === "awards.html")
        await expect(page.locator("#awards")).toHaveCSS(
          "background-color",
          "rgb(243, 241, 235)",
        );
      if (route === "enjoy.html" && width === 390) {
        expect(
          await page
            .locator("#life-tabs button")
            .evaluateAll((buttons) =>
              buttons.every(
                (button) => button.scrollWidth <= button.clientWidth + 1,
              ),
            ),
        ).toBe(true);
      }
      // Original standalone pages retain their h1/h2 source hierarchy.
      await expect(page.locator("main h1, main h2").first()).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const height = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      for (let y = 0; y < Math.min(height, 30000); y += 700) {
        await page.evaluate((value) => window.scrollTo(0, value), y);
        await page.waitForTimeout(100);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(
        () => Array.from(document.images).every((image) => image.complete),
        undefined,
        { timeout: 15000 },
      );
      const imageFailures = await page.evaluate(() =>
        Array.from(document.images)
          .filter((image) => image.naturalWidth === 0)
          .map((image) => ({ src: image.src, alt: image.alt })),
      );
      const evidence = await page.evaluate(() => ({
        viewport: {
          width: innerWidth,
          height: innerHeight,
          scrollWidth: document.documentElement.scrollWidth,
        },
        title: document.querySelector("main h1, main h2")?.textContent?.trim(),
        localLinks: Array.from(
          document.querySelectorAll<HTMLAnchorElement>("a[href]"),
        )
          .map((link) => link.getAttribute("href"))
          .filter((href) => href?.startsWith("/")),
        mediaEmbeds: Array.from(
          document.querySelectorAll<HTMLIFrameElement>("iframe"),
        ).map((frame) => frame.src),
      }));
      await fs.writeFile(
        testInfo.outputPath("evidence.json"),
        JSON.stringify(
          {
            route,
            width,
            errors,
            consoleErrors,
            badResources,
            imageFailures,
            ...evidence,
          },
          null,
          2,
        ),
      );
      await page.screenshot({
        path: testInfo.outputPath("page-top.png"),
        animations: "disabled",
      });
      await page.screenshot({
        path: testInfo.outputPath("page-full.png"),
        fullPage: true,
        animations: "disabled",
      });
      expect(errors).toEqual([]);
      expect(
        consoleErrors.filter((entry) =>
          entry.url.startsWith("http://127.0.0.1:4173/"),
        ),
      ).toEqual([]);
      expect(badResources).toEqual([]);
      expect(imageFailures).toEqual([]);
      expect(evidence.viewport.scrollWidth).toBeLessThanOrEqual(width);
      for (const href of evidence.localLinks) {
        const path = href!.split("#")[0].split("?")[0].replace(/^\//, "");
        if (path.endsWith(".html")) expect(routes).toContain(path);
      }
    });
  }
}

test("source interactions remain usable across actual routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/qualified.html");
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(4);
  await tabs.last().click();
  await expect(tabs.last()).toHaveAttribute("aria-selected", "true");
  await page.goto("/enjoy.html");
  const filter = page.locator("#life-tabs .life-filter-btn").last();
  await filter.click();
  await expect(filter).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await expect(
    page.locator(`#gallery-${await filter.getAttribute("data-target")}`),
  ).toBeVisible();
  await page.goto("/projects.html");
  const first = page.locator("details").first();
  await first.locator("summary").click();
  await expect(first).toHaveAttribute("open", "");
  await first.locator("summary").click();
  await expect(first).not.toHaveAttribute("open", "");
  await page.goto("/contact.html");
  await expect(page.locator("form input").first()).toBeDisabled();
  await page.goto("/projects/ai-mentoring-agent-detail.html");
  await expect(page.locator(".original-mentoring-mockup")).toHaveCount(1);
  await expect(
    page.locator('iframe[src*="mentoring_agent_mockup"]'),
  ).toHaveCount(0);
});
