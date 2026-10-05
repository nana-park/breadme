import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

// WHAT: Same-viewport evidence of published Home and its text-led replacement.
// WHY: The old 3D baseline is evidence only, never subject to new-copy assertions.
const baselineUrl = process.env.HOME_BASELINE_URL;
const currentUrl = process.env.HOME_CURRENT_URL || "/";
const captureOnly = process.env.HOME_LAYOUT_CAPTURE_ONLY === "1";
const widths = [320, 375, 390, 430, 1440];
const approvedCopy = {
  eyebrow: "NAHYUN PARK · AI PRODUCT MANAGER",
  heading: "Designing AI Product Experiences Across Markets",
  removedSummary:
    "Grounded in psychology and Human–AI Interaction, I shape conversational AI and agent workflows around user needs—from product planning to launches in Korea and Japan.",
  proof: "Previously at NAVER Cloud · SK Telecom",
};
test.setTimeout(120_000);

async function measureHome(page: Page) {
  return page.evaluate(() => {
    const box = (element: Element) => {
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
    const textMetrics = (element: Element) => {
      const fragments = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim() || node.parentElement?.closest("svg"))
          continue;
        const range = document.createRange();
        range.setStart(node, node.textContent.search(/\S/));
        range.setEnd(node, node.textContent.search(/\s*$/));
        for (const rect of range.getClientRects())
          if (rect.width > 0 && rect.height > 0)
            fragments.push({
              x: rect.x,
              y: rect.y,
              right: rect.right,
              bottom: rect.bottom,
            });
      }
      const lineTops: number[] = [];
      for (const fragment of fragments)
        if (!lineTops.some((top) => Math.abs(top - fragment.y) <= 2))
          lineTops.push(fragment.y);
      const style = getComputedStyle(element);
      const clippingAncestors = [];
      for (
        let ancestor: Element | null = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const overflow = getComputedStyle(ancestor).overflowY;
        if (/(hidden|clip|auto|scroll)/.test(overflow))
          clippingAncestors.push({ box: box(ancestor), tag: ancestor.tagName });
      }
      const glyphBounds = fragments.length
        ? {
            x: Math.min(...fragments.map((line) => line.x)),
            y: Math.min(...fragments.map((line) => line.y)),
            right: Math.max(...fragments.map((line) => line.right)),
            bottom: Math.max(...fragments.map((line) => line.bottom)),
            width:
              Math.max(...fragments.map((line) => line.right)) -
              Math.min(...fragments.map((line) => line.x)),
            height:
              Math.max(...fragments.map((line) => line.bottom)) -
              Math.min(...fragments.map((line) => line.y)),
          }
        : box(element);
      const rgb = style.color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
      const luminance = rgb
        .map((channel) => channel / 255)
        .map((channel) =>
          channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4,
        );
      return {
        text: element.textContent?.replace(/\s+/g, " ").trim(),
        box: box(element),
        fragments,
        glyphBounds,
        clippingAncestors,
        lines: lineTops.length,
        textAlign: style.textAlign,
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        fontWeight: Number.parseFloat(style.fontWeight),
        contrastOnWhite:
          1.05 /
          (0.2126 * luminance[0] +
            0.7152 * luminance[1] +
            0.0722 * luminance[2] +
            0.05),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      };
    };
    const hero = document.querySelector("#home")!;
    const texts = Array.from(hero.querySelectorAll("h1, p")).map(textMetrics);
    const ctas = Array.from(hero.querySelectorAll<HTMLAnchorElement>("a"))
      .filter((link) =>
        /View my work|Get in touch/i.test(link.textContent || ""),
      )
      .map((link) => ({ ...textMetrics(link), href: link.href }));
    const viewer = hero.querySelector("spline-viewer");
    const canvas = viewer?.shadowRoot?.querySelector("canvas");
    const badge = viewer?.shadowRoot?.querySelector("#logo");
    return {
      url: location.href,
      width: innerWidth,
      height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      hero: box(hero),
      heroBackground: getComputedStyle(hero).backgroundColor,
      texts,
      ctas,
      baselineArtwork: {
        viewer: viewer ? box(viewer) : null,
        canvas: canvas ? box(canvas) : null,
        badge: badge ? box(badge) : null,
      },
    };
  });
}

type HomeMetrics = Awaited<ReturnType<typeof measureHome>>;
type Box = HomeMetrics["hero"];
function noOverlap(first: Box, second: Box, message: string) {
  const width =
    Math.min(first.right, second.right) - Math.max(first.x, second.x);
  const height =
    Math.min(first.bottom, second.bottom) - Math.max(first.y, second.y);
  expect(width <= 0 || height <= 0, message).toBe(true);
}

async function captureHome(
  page: Page,
  testInfo: TestInfo,
  label: string,
  url: string,
) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#home h1")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (
    label === "published-before" &&
    (await page.locator("#home spline-viewer").count())
  ) {
    await expect(page.locator("#home spline-viewer canvas")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.locator("#home spline-viewer #logo")).toBeVisible({
      timeout: 30_000,
    });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(2000);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const metrics = await measureHome(page);
  for (const fullPage of [false, true]) {
    const name = `${label}-home-${metrics.width}-${fullPage ? "full" : "top"}`;
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage, animations: "disabled" });
    await testInfo.attach(name, { path, contentType: "image/png" });
  }
  await testInfo.attach(`${label}-home-${metrics.width}-geometry`, {
    body: Buffer.from(JSON.stringify(metrics, null, 2)),
    contentType: "application/json",
  });
  return metrics;
}

async function verifyMobileControls(page: Page, testInfo: TestInfo) {
  const toggle = page.locator("#mobileToggle");
  const popup = page.locator("#popupToggle");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(popup).toBeHidden();
  const originalOverflow = await page
    .locator("body")
    .evaluate((element) => element.style.overflow);
  for (const dismissal of ["Escape", "toggle"] as const) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("main")).toHaveAttribute("inert");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    const menu = await page.locator("#navMenu").boundingBox();
    expect(menu!.x).toBeGreaterThanOrEqual(0);
    expect(menu!.x + menu!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    if (dismissal === "Escape") {
      const path = testInfo.outputPath(
        `branch-current-home-${page.viewportSize()!.width}-menu.png`,
      );
      await page.screenshot({ path, animations: "disabled" });
      await testInfo.attach("Mobile menu", { path, contentType: "image/png" });
      await page.keyboard.press("Escape");
    } else await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    expect(
      await page.locator("body").evaluate((element) => element.style.overflow),
    ).toBe(originalOverflow);
  }
  // WHY: Hiding a duplicate floating entry must not remove access to materials.
  await toggle.click();
  await page
    .locator(".original-mobile-materials [data-materials-action='resume']")
    .click();
  await expect(
    page.getByRole("button", { name: "Minimize Popup" }),
  ).toBeFocused();
  await expect(page.locator("#materials-content")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(popup).toBeHidden();
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector("#home")!.getBoundingClientRect().bottom + scrollY,
    ),
  );
  await expect(popup).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(popup).toBeHidden();
}

for (const width of widths) {
  test(`Home text-led layout ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    if (baselineUrl)
      await captureHome(page, testInfo, "published-before", baselineUrl);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const metrics = await captureHome(
      page,
      testInfo,
      "branch-current",
      currentUrl,
    );
    if (captureOnly) {
      testInfo.annotations.push({
        type: "capture-only",
        description: "Evidence only; text-led acceptance checks disabled.",
      });
      return;
    }
    const home = page.locator("#home");
    await expect(
      home.locator("spline-viewer, canvas, [data-home-artwork]"),
    ).toHaveCount(0);
    await expect(
      home.getByText("Helping people follow through:", { exact: true }),
    ).toHaveCount(0);
    await expect(home.getByRole("heading", { level: 1 })).toHaveText(
      approvedCopy.heading,
    );
    for (const text of [approvedCopy.eyebrow, approvedCopy.proof])
      await expect(home.getByText(text, { exact: true })).toBeVisible();
    expect(
      metrics.heroBackground,
      "Contrast checks use the actual white Hero backdrop",
    ).toBe("rgb(255, 255, 255)");
    expect(metrics.scrollWidth).toBeLessThanOrEqual(width);
    const heading = metrics.texts.find(
      (entry) => entry.text === approvedCopy.heading,
    )!;
    await expect(
      home.getByText(approvedCopy.removedSummary, { exact: true }),
    ).toHaveCount(0);
    expect(metrics.texts).toHaveLength(3);
    const proof = metrics.texts.find(
      (entry) => entry.text === approvedCopy.proof,
    )!;
    const eyebrow = metrics.texts.find(
      (entry) => entry.text === approvedCopy.eyebrow,
    )!;
    expect(heading.fontSize).toBeGreaterThanOrEqual(32);
    expect(heading.fontSize).toBeGreaterThan(proof.fontSize * 1.5);
    expect(heading.fontWeight).toBeGreaterThanOrEqual(500);
    expect(heading.textAlign).toBe(width < 768 ? "left" : "center");
    expect(eyebrow.textAlign).toBe(width < 768 ? "left" : "center");
    expect(proof.textAlign).toBe(width < 768 ? "left" : "center");
    if (width < 768) {
      for (const text of [eyebrow, proof])
        expect(
          Math.abs(text.glyphBounds.x - heading.glyphBounds.x),
          "All three mobile text blocks share the same left starting edge",
        ).toBeLessThanOrEqual(1);
    }
    expect(proof.fontSize).toBeGreaterThanOrEqual(12);
    expect(eyebrow.fontSize).toBeGreaterThanOrEqual(10);
    for (const text of metrics.texts) {
      expect(text.lines, `${text.text}: visible text lines`).toBeGreaterThan(0);
      expect(
        text.contrastOnWhite,
        `${text.text}: readable contrast`,
      ).toBeGreaterThanOrEqual(text === heading ? 3 : 4.5);
      expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
      for (const line of text.fragments) {
        expect(line.x).toBeGreaterThanOrEqual(Math.max(0, text.box.x - 1));
        expect(line.right).toBeLessThanOrEqual(
          Math.min(width, text.box.right + 1),
        );
        // WHAT: Verify actual clipping, not an arbitrary font-metric allowance.
        // WHY: At 80.64px the Inter Range rectangle extends 6px above its tight
        // CSS line box while the fully visible ink has ample surrounding space.
        expect(line.y).toBeGreaterThanOrEqual(metrics.hero.y);
        expect(line.bottom).toBeLessThanOrEqual(metrics.hero.bottom);
        for (const ancestor of text.clippingAncestors) {
          expect(
            line.y,
            `${ancestor.tag}: glyphs are not vertically clipped`,
          ).toBeGreaterThanOrEqual(ancestor.box.y - 1);
          expect(
            line.bottom,
            `${ancestor.tag}: glyphs are not vertically clipped`,
          ).toBeLessThanOrEqual(ancestor.box.bottom + 1);
        }
      }
    }
    for (let index = 1; index < metrics.texts.length; index += 1)
      noOverlap(
        metrics.texts[index - 1].glyphBounds,
        metrics.texts[index].glyphBounds,
        "Actual Hero text glyph regions do not overlap",
      );
    expect(metrics.ctas).toHaveLength(2);
    expect(metrics.ctas.map((cta) => cta.href)).toEqual([
      new URL("projects.html", metrics.url).href,
      new URL("contact.html", metrics.url).href,
    ]);
    for (const cta of metrics.ctas) {
      expect(cta.lines).toBeGreaterThan(0);
      expect(
        cta.lines,
        `${cta.text}: at most two actual rendered lines`,
      ).toBeLessThanOrEqual(2);
      expect(cta.fontSize).toBeGreaterThanOrEqual(14);
      expect(cta.box.height).toBeGreaterThanOrEqual(44);
      expect(cta.scrollWidth).toBeLessThanOrEqual(cta.clientWidth + 1);
      expect(cta.box.x).toBeGreaterThanOrEqual(0);
      expect(cta.box.right).toBeLessThanOrEqual(width);
      expect(cta.box.bottom).toBeLessThanOrEqual(metrics.hero.bottom);
      for (const line of cta.fragments) {
        expect(line.x).toBeGreaterThanOrEqual(cta.box.x - 1);
        expect(line.right).toBeLessThanOrEqual(cta.box.right + 1);
        expect(line.y).toBeGreaterThanOrEqual(cta.box.y - 1);
        expect(line.bottom).toBeLessThanOrEqual(cta.box.bottom + 1);
      }
      for (const text of metrics.texts)
        noOverlap(
          cta.box,
          text.glyphBounds,
          "CTA clears every Hero glyph region",
        );
    }
    noOverlap(
      metrics.ctas[0].box,
      metrics.ctas[1].box,
      "CTA buttons do not overlap",
    );
    const actions = home.locator("[data-home-actions] a");
    await actions.first().focus();
    await page.keyboard.press("Tab");
    await expect(actions.nth(1)).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(actions.first()).toBeFocused();
    if (width < 768) {
      expect(
        metrics.ctas[1].box.y - metrics.ctas[0].box.bottom,
        "Separate vertical CTA rows",
      ).toBeGreaterThanOrEqual(8);
      for (const cta of metrics.ctas)
        expect(
          Math.abs(cta.box.x + cta.box.width / 2 - width / 2),
        ).toBeLessThanOrEqual(1);
      await verifyMobileControls(page, testInfo);
    }
    // WHAT: Guard the reviewed partner-caption word boundary at every Home width.
    // WHY: A hidden <br> needs a literal separator; desktop retains its line break.
    const partnerCaption = page.locator("#partners p");
    await partnerCaption.scrollIntoViewIfNeeded();
    await expect(partnerCaption).toBeVisible();
    await expect(partnerCaption).toBeInViewport();
    await expect(partnerCaption).toHaveText(
      "Experience & collaboration with industry leading organizations:",
      { useInnerText: true },
    );
    await expect(partnerCaption.locator("br")).toHaveCSS(
      "display",
      width < 640 ? "none" : "block",
    );
    const renderedCaption = await partnerCaption.innerText();
    if (width < 640) expect(renderedCaption).toContain("with industry");
    else expect(renderedCaption).toMatch(/with[ \t]*\n+industry/);
    expect(errors, "Branch runtime errors").toEqual([]);
  });
}
