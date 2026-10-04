import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

// WHAT: Compare the published Home with the branch build in identical viewports.
// WHY: A canvas centered in CSS does not prove its visible artwork is centered.
// Capture-only is for an honest before-state; it deliberately makes no claim
// that the old layout already meets the new acceptance criteria.
const captureOnly = process.env.HOME_LAYOUT_CAPTURE_ONLY === "1";
const baselineUrl = process.env.HOME_BASELINE_URL;
const currentUrl = process.env.HOME_CURRENT_URL || "/";
const widths = [320, 375, 390, 430, 1440];

test.setTimeout(180_000);

async function measureHome(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
    };
    const viewer = document.querySelector("#home spline-viewer");
    const canvas = viewer?.shadowRoot?.querySelector("canvas") || null;
    const badge = viewer?.shadowRoot?.querySelector<HTMLAnchorElement>("#logo") || null;
    const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>("#home a"))
      .filter((link) => /View My Work|Get in Touch/.test(link.textContent || ""))
      .map((link) => {
        // WHAT: Measure rendered text fragments, including the separately colored
        // brand spans, rather than guessing wrapping from button height.
        const fragments: Array<{ text: string; x: number; y: number; width: number; height: number }> = [];
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim() || node.parentElement?.closest("svg")) continue;
          const text = node.textContent;
          const start = text.search(/\S/);
          const end = text.search(/\s*$/);
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0 && rect.height > 0)
              fragments.push({ text: text.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height });
          }
        }
        const lineTops: number[] = [];
        for (const fragment of fragments)
          if (!lineTops.some((top) => Math.abs(top - fragment.y) <= 2)) lineTops.push(fragment.y);
        const style = getComputedStyle(link);
        return {
          text: link.textContent?.replace(/\s+/g, " ").trim(),
          href: link.href,
          box: box(link)!,
          lineCount: lineTops.length,
          fragments,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          whiteSpace: style.whiteSpace,
          overflowWrap: style.overflowWrap,
          scrollWidth: link.scrollWidth,
          clientWidth: link.clientWidth,
        };
      });
    const clippingAncestors = [];
    let ancestor: Element | null = badge;
    while (ancestor) {
      const style = getComputedStyle(ancestor);
      if (/(hidden|clip|auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`))
        clippingAncestors.push({ tag: ancestor.tagName, id: ancestor.id, box: box(ancestor), overflowX: style.overflowX, overflowY: style.overflowY });
      ancestor = ancestor.parentElement || (ancestor.getRootNode() instanceof ShadowRoot ? (ancestor.getRootNode() as ShadowRoot).host : null);
    }
    const badgeRect = badge?.getBoundingClientRect();
    const badgeHitTests = badgeRect && viewer ? [
      [badgeRect.left + 3, badgeRect.top + badgeRect.height / 2],
      [badgeRect.right - 3, badgeRect.top + badgeRect.height / 2],
      [badgeRect.left + badgeRect.width / 2, badgeRect.top + 3],
      [badgeRect.left + badgeRect.width / 2, badgeRect.bottom - 3],
    ].map(([x, y]) => {
      const outer = document.elementFromPoint(x, y);
      const inner = viewer.shadowRoot?.elementFromPoint(x, y);
      return { x, y, unobscured: outer === viewer && !!inner && (inner === badge || badge!.contains(inner)) };
    }) : [];
    const paragraphs = Array.from(document.querySelectorAll("#home p"));
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
      hero: box(document.querySelector("#home")),
      heading: box(document.querySelector("#home h1")),
      caption: box(paragraphs.find((node) => node.textContent?.includes("Helping people follow through")) || null),
      viewer: box(viewer),
      canvas: box(canvas),
      badge: badge ? { box: box(badge)!, href: badge.href, display: getComputedStyle(badge).display, opacity: getComputedStyle(badge).opacity, clippingAncestors, hitTests: badgeHitTests } : null,
      ctas,
      popup: box(document.querySelector("#popupToggle")),
      mobileToggle: box(document.querySelector("#mobileToggle")),
    };
  });
}

async function captureHome(page: Page, testInfo: TestInfo, label: string, url: string) {
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(error.message);
  page.on("pageerror", onError);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#home h1")).toHaveText("Designing Actionable AI");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#home spline-viewer canvas")).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("#home spline-viewer #logo")).toBeVisible({ timeout: 30_000 });
  // WHY: Give the real WebGL scene the same settling period on both URLs.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  const width = page.viewportSize()!.width;
  for (const fullPage of [false, true]) {
    const name = `${label}-home-${width}-${fullPage ? "full" : "top"}`;
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage, animations: "disabled" });
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
  const metrics = await measureHome(page);
  const canvasName = `${label}-home-${width}-canvas`;
  const canvasPath = testInfo.outputPath(`${canvasName}.png`);
  await page.locator("#home spline-viewer canvas").screenshot({ path: canvasPath, animations: "disabled" });
  await testInfo.attach(canvasName, { path: canvasPath, contentType: "image/png" });
  await testInfo.attach(`${label}-home-${width}-geometry`, {
    body: Buffer.from(JSON.stringify({ ...metrics, errors, captureOnly }, null, 2)),
    contentType: "application/json",
  });
  page.off("pageerror", onError);
  expect(errors, `${label}: uncaught runtime errors`).toEqual([]);
  return metrics;
}

for (const width of widths) {
  test(`Home layout evidence ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    // WHY: Before and after evidence must use the same engine, viewport and run.
    if (baselineUrl) await captureHome(page, testInfo, "published-before", baselineUrl);
    const metrics = await captureHome(page, testInfo, "branch-current", currentUrl);
    if (captureOnly) {
      testInfo.annotations.push({ type: "capture-only", description: "Before-state evidence; new mobile layout acceptance assertions intentionally disabled." });
      return;
    }
    expect(metrics.viewport.scrollWidth).toBeLessThanOrEqual(width);
    expect(metrics.ctas).toHaveLength(2);
    for (const cta of metrics.ctas) {
      expect(cta.lineCount, `${cta.text}: rendered text lines`).toBeLessThanOrEqual(2);
      expect(cta.box.height).toBeGreaterThanOrEqual(44);
      expect(cta.box.x).toBeGreaterThanOrEqual(0);
      expect(cta.box.right).toBeLessThanOrEqual(width);
    }
  });
}
