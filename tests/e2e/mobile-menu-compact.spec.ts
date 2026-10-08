import { expect, test, type Page, type TestInfo } from "@playwright/test";
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
const groups = originalNavigation.filter((item) => "children" in item);
const expectedLinks = originalNavigation.flatMap<{
  label: string;
  path: string;
}>((item) => ("children" in item ? item.children : [item]));
function expectedGroup(pageId: string) {
  if (["about", "career", "qualified"].includes(pageId)) return "ABOUT";
  if (
    [
      "projects",
      "research",
      "articles",
      "lectures",
      "llm-based-voice-ivr",
      "hopzie-oneclickbuilder",
      "ai-mentoring-agent-detail",
    ].includes(pageId)
  )
    return "PROJECTS";
  return null;
}
async function assertLayout(page: Page, testInfo: TestInfo, caseId: string) {
  const menu = page.locator("#navMenu");
  const metrics = await menu.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollTop: element.scrollTop,
      controls: Array.from(element.querySelectorAll<HTMLElement>("a, button"))
        .filter((control) => control.getClientRects().length)
        .map((control) => {
          const bounds = control.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(control.querySelector("span") ?? control);
          return {
            label: control.textContent?.trim(),
            primary: control.classList.contains("nav-link"),
            fontSize: parseFloat(getComputedStyle(control).fontSize),
            bounds: bounds.toJSON(),
            textBounds: Array.from(range.getClientRects(), (rect) =>
              rect.toJSON(),
            ),
          };
        }),
    };
  });
  await testInfo.attach(`${caseId}-geometry`, {
    body: JSON.stringify(metrics, null, 2),
    contentType: "application/json",
  });
  if (caseId.startsWith("home-"))
    await page.screenshot({
      path: testInfo.outputPath(`${caseId}-menu.png`),
      animations: "disabled",
    });
  await testInfo.attach(`${caseId}-menu`, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
  expect(metrics.scrollTop).toBe(0);
  expect(
    metrics.scrollHeight,
    "each disclosure state fits normal phone heights",
  ).toBeLessThanOrEqual(metrics.clientHeight + 1);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.top).toBeGreaterThanOrEqual(69);
  expect(metrics.bottom).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  const primaries = metrics.controls.filter((control) => control.primary);
  expect(primaries.map((control) => control.label)).toEqual(
    originalNavigation.map((item) => item.label),
  );
  for (const [index, control] of metrics.controls.entries()) {
    expect(control.fontSize).toBeGreaterThanOrEqual(control.primary ? 16 : 14);
    expect(control.bounds.height).toBeGreaterThanOrEqual(43.9);
    expect(control.bounds.width).toBeGreaterThanOrEqual(43.9);
    expect(control.bounds.left).toBeCloseTo(primaries[0].bounds.left, 0);
    expect(control.bounds.top).toBeGreaterThanOrEqual(metrics.top - 1);
    expect(control.bounds.bottom).toBeLessThanOrEqual(metrics.bottom + 1);
    if (index)
      expect(control.bounds.top).toBeGreaterThanOrEqual(
        metrics.controls[index - 1].bounds.bottom - 1,
      );
    for (const text of control.textBounds) {
      expect(text.left).toBeGreaterThanOrEqual(control.bounds.left - 1);
      expect(text.right).toBeLessThanOrEqual(control.bounds.right + 1);
      expect(text.top).toBeGreaterThanOrEqual(control.bounds.top - 1);
      expect(text.bottom).toBeLessThanOrEqual(control.bounds.bottom + 1);
    }
    expect(control.textBounds[0].left).toBeCloseTo(
      control.bounds.left + (control.primary ? 0 : 16),
      0,
    );
  }
}

for (const pageId of originalPageIds) {
  test(`single-column mobile disclosures retain every destination on ${pageId}`, async ({
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
    for (const viewport of pageId === "home" ? viewports : [viewports[0]]) {
      await page.setViewportSize(viewport);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(menu.locator("a")).toHaveCount(10);
      await expect(menu.locator("button")).toHaveCount(2);
      await expect(menu.locator("[data-materials-action]")).toHaveCount(0);
      for (const action of ["resume", "portfolio"])
        await expect(
          page.locator(`#navbar [data-materials-action='${action}']`),
        ).toBeHidden();
      await expect(menu).toHaveCSS("overflow-y", "auto");
      expect(
        await menu.locator("a").evaluateAll((links) =>
          links.map((link) => ({
            label: link.textContent?.trim(),
            path: new URL((link as HTMLAnchorElement).href).pathname
              .split("/")
              .at(-1),
          })),
        ),
      ).toEqual(
        expectedLinks.map((item) => ({ label: item.label, path: item.path })),
      );
      const current = expectedGroup(pageId);
      for (const group of groups)
        await expect(
          menu.getByRole("button", { name: group.label }),
        ).toHaveAttribute("aria-expanded", String(current === group.label));
      const prefix = `${pageId}-${viewport.width}x${viewport.height}`;
      await assertLayout(page, testInfo, `${prefix}-default`);
      // Visit every child in each group; collapsed children must be absent from keyboard/accessibility navigation.
      for (const group of groups) {
        const disclosure = menu.getByRole("button", { name: group.label });
        if ((await disclosure.getAttribute("aria-expanded")) !== "true")
          await disclosure.click();
        await expect(disclosure).toHaveAttribute("aria-expanded", "true");
        await expect(menu.locator("button[aria-expanded='true']")).toHaveCount(
          1,
        );
        for (const child of group.children)
          await expect(
            menu.getByRole("link", { name: child.label, exact: true }),
          ).toBeVisible();
        const other = groups.find((item) => item.label !== group.label)!;
        for (const child of other.children)
          await expect(
            menu.getByRole("link", { name: child.label, exact: true }),
          ).toHaveCount(0);
        await assertLayout(page, testInfo, `${prefix}-${group.label}`);
        await disclosure.click();
        await expect(disclosure).toHaveAttribute("aria-expanded", "false");
        await expect(menu.locator(".lnb-link:visible")).toHaveCount(0);
      }
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#main-content")).not.toHaveAttribute("inert");
      await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    }
  });
}

for (const enlarged of [false, true]) {
  test(`disclosures retain reachable overflow on a short screen${enlarged ? " with synthetic 200% text" : ""}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 320 });
    await page.goto("./projects.html", { waitUntil: "domcontentloaded" });
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
    for (const name of ["PROJECTS", "ABOUT"]) {
      const disclosure = menu.getByRole("button", { name });
      if ((await disclosure.getAttribute("aria-expanded")) !== "true")
        await disclosure.click();
      const overflow = await menu.evaluate((element) => ({
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(overflow.scrollHeight).toBeGreaterThan(overflow.height);
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width + 1);
      for (const control of await menu
        .locator("a:visible, button:visible")
        .all()) {
        await control.focus();
        await control.scrollIntoViewIfNeeded();
        await expect(control).toBeInViewport({ ratio: 1 });
        expect(
          await control.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element.querySelector("span") ?? element);
            return Array.from(range.getClientRects()).every(
              (text) =>
                text.left >= bounds.left - 1 &&
                text.right <= bounds.right + 1 &&
                text.top >= bounds.top - 1 &&
                text.bottom <= bounds.bottom + 1,
            );
          }),
        ).toBe(true);
      }
      expect(
        await menu.evaluate((element) => element.scrollTop),
      ).toBeGreaterThan(0);
    }
    await testInfo.attach("short-menu-last-link", {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobileToggle")).toBeFocused();
    await expect(page.locator("#main-content")).not.toHaveAttribute("inert");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
}

test("disclosure keyboard interaction, navigation and Back preserve current group; desktop links remain links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("./index.html", { waitUntil: "domcontentloaded" });
  await page.locator("#mobileToggle").click();
  const menu = page.locator("#navMenu");
  const about = menu.getByRole("button", { name: "ABOUT" });
  const projects = menu.getByRole("button", { name: "PROJECTS" });
  await about.focus();
  await page.keyboard.press("Enter");
  await expect(about).toHaveAttribute("aria-expanded", "true");
  await projects.focus();
  await page.keyboard.press("Space");
  await expect(about).toHaveAttribute("aria-expanded", "false");
  await expect(projects).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(menu.getByRole("link", { name: "Products" })).toBeFocused();
  await menu.getByRole("link", { name: "Research", exact: true }).click();
  await expect(page).toHaveURL(/\/research\.html$/);
  await expect(page.locator("#mobileToggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.locator("#mobileToggle").click();
  await expect(menu.getByRole("button", { name: "PROJECTS" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(
    menu.getByRole("link", { name: "Research", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await page.goBack();
  await expect(page).toHaveURL(/\/index\.html$/);
  await page.locator("#mobileToggle").click();
  await expect(menu.locator("button[aria-expanded='true']")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#mobileToggle")).toBeHidden();
  await expect(menu.locator("button")).toHaveCount(0);
  await expect(menu.locator("a")).toHaveCount(12);
  for (const [name, path] of [
    ["ABOUT", "about.html"],
    ["PROJECTS", "projects.html"],
  ]) {
    const parent = menu.getByRole("link", { name, exact: true });
    await expect(parent).toHaveAttribute("href", `/${path}`);
    await parent.hover();
    await expect(
      menu.getByRole("link", {
        name: name === "ABOUT" ? "Career" : "Research",
        exact: true,
      }),
    ).toBeVisible();
  }
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
