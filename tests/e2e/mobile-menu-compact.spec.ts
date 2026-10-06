import { expect, test } from "@playwright/test";
import {
  originalPageIds,
  originalRoutePaths,
} from "../../src/config/originalRoutes";
import { originalNavigation } from "../../src/content/original/navigation";
import { enlargeComputedText } from "../mobile-ui/text-enlargement";

const viewports = [
  { width: 390, height: 844 },
  { width: 390, height: 740 },
  { width: 375, height: 667 },
  { width: 320, height: 640 },
];
const expectedLinks = originalNavigation.flatMap((item) => [
  { label: item.label, path: item.path },
  ...("children" in item ? item.children : []),
]);

for (const pageId of originalPageIds) {
  test(`compact mobile menu exposes the complete hierarchy on ${pageId}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewports[0]);
    await page.goto(`./${originalRoutePaths[pageId]}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("[data-original-page]")).toHaveAttribute(
      "data-original-page",
      pageId,
    );
    await page.evaluate(() => document.fonts.ready);
    const menu = page.locator("#navMenu");
    const toggle = page.locator("#mobileToggle");
    // All routes cover page-CSS interference; Home covers the remaining shared sizes.
    const routeViewports = pageId === "home" ? viewports : [viewports[0]];
    for (const viewport of routeViewports) {
      await page.setViewportSize(viewport);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(menu.locator("a")).toHaveCount(12);
      await expect(menu.locator("[data-materials-action], button")).toHaveCount(
        0,
      );
      await expect(
        page.locator("#navbar [data-materials-action='resume']"),
      ).toBeHidden();
      await expect(
        page.locator("#navbar [data-materials-action='portfolio']"),
      ).toBeHidden();
      await expect(menu).toHaveCSS("overflow-y", "auto");
      const metrics = await menu.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          width: box.width,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollTop: element.scrollTop,
          links: Array.from(element.querySelectorAll("a")).map((link) => {
            const bounds = link.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(link);
            return {
              label: link.textContent?.trim(),
              path: new URL(link.href).pathname,
              primary: link.classList.contains("nav-link"),
              fontSize: parseFloat(getComputedStyle(link).fontSize),
              bounds: bounds.toJSON(),
              textBounds: Array.from(range.getClientRects()).map((rect) =>
                rect.toJSON(),
              ),
            };
          }),
        };
      });
      const caseId = `${pageId}-${viewport.width}x${viewport.height}`;
      await testInfo.attach(`${caseId}-geometry`, {
        body: JSON.stringify(metrics, null, 2),
        contentType: "application/json",
      });
      // Capture before assertions so a failed cascade/geometry case still has evidence.
      await testInfo.attach(`${caseId}-menu`, {
        body: await page.screenshot({ animations: "disabled" }),
        contentType: "image/png",
      });
      expect(metrics.scrollTop).toBe(0);
      expect(
        metrics.scrollHeight,
        "all menu items fit without vertical scrolling",
      ).toBeLessThanOrEqual(metrics.clientHeight + 1);
      expect(
        metrics.scrollWidth,
        "menu has no horizontal scrolling",
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.top).toBeGreaterThanOrEqual(69);
      expect(metrics.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(metrics.links.map((link) => link.label)).toEqual(
        expectedLinks.map((link) => link.label),
      );
      for (const [index, link] of metrics.links.entries()) {
        expect(link.path).toMatch(
          new RegExp(`/${expectedLinks[index].path.replaceAll(".", "\\.")}$`),
        );
        expect(link.fontSize).toBeGreaterThanOrEqual(link.primary ? 16 : 14);
        expect(link.bounds.height).toBeGreaterThanOrEqual(43.9);
        expect(link.bounds.width).toBeGreaterThanOrEqual(43.9);
        expect(link.bounds.top).toBeGreaterThanOrEqual(metrics.top - 1);
        expect(link.bounds.bottom).toBeLessThanOrEqual(metrics.bottom + 1);
        for (const text of link.textBounds) {
          expect(text.left).toBeGreaterThanOrEqual(link.bounds.left - 1);
          expect(text.right).toBeLessThanOrEqual(link.bounds.right + 1);
          expect(text.top).toBeGreaterThanOrEqual(link.bounds.top - 1);
          expect(text.bottom).toBeLessThanOrEqual(link.bounds.bottom + 1);
        }
      }
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("main")).not.toHaveAttribute("inert");
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    }
  });
}

for (const enlarged of [false, true]) {
  test(`compact menu retains reachable overflow on a short screen${enlarged ? " with synthetic 200% text" : ""}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 320 });
    await page.goto("./projects.html", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-original-page]")).toHaveAttribute(
      "data-original-page",
      "projects",
    );
    await page.locator("#mobileToggle").click();
    const menu = page.locator("#navMenu");
    if (enlarged) {
      const enlargement = await enlargeComputedText(page, "#navMenu");
      expect(enlargement.samples).toHaveLength(12);
      for (const sample of enlargement.samples)
        expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
      await testInfo.attach("synthetic-enlargement-method", {
        body: JSON.stringify(enlargement, null, 2),
        contentType: "application/json",
      });
    }
    const overflow = await menu.evaluate((element) => ({
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(overflow.scrollHeight).toBeGreaterThan(overflow.height);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width + 1);
    for (const link of await menu.locator("a").all()) {
      await link.focus();
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport({ ratio: 1 });
      const textFits = await link.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        return Array.from(range.getClientRects()).every(
          (text) =>
            text.left >= bounds.left - 1 &&
            text.right <= bounds.right + 1 &&
            text.top >= bounds.top - 1 &&
            text.bottom <= bounds.bottom + 1,
        );
      });
      expect(textFits).toBe(true);
    }
    expect(await menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(
      0,
    );
    await testInfo.attach("short-menu-last-link", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobileToggle")).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
}

test("compact mobile links navigate and desktop materials remain available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("./index.html", { waitUntil: "domcontentloaded" });
  await page.locator("#mobileToggle").click();
  await page
    .locator("#navMenu")
    .getByRole("link", { name: "Research", exact: true })
    .click();
  await expect(page).toHaveURL(/\/research\.html$/);
  await expect(page.locator("#mobileToggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#mobileToggle")).toBeHidden();
  for (const action of ["resume", "portfolio"]) {
    const button = page.locator(`#navbar [data-materials-action='${action}']`);
    await expect(button).toBeVisible();
    await button.click();
    await expect(
      page.getByRole("button", { name: "Minimize Popup" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#materials-content")).toBeHidden();
  }
});
