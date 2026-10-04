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
    const badge =
      viewer?.shadowRoot?.querySelector<HTMLAnchorElement>("#logo") || null;
    const ctas = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("#home a"),
    )
      .filter((link) =>
        /View My Work|Get in Touch/i.test(link.textContent || ""),
      )
      .map((link) => {
        // WHAT: Measure rendered text fragments, including the separately colored
        // brand spans, rather than guessing wrapping from button height.
        const fragments: Array<{
          text: string;
          x: number;
          y: number;
          width: number;
          height: number;
        }> = [];
        const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim() || node.parentElement?.closest("svg"))
            continue;
          const text = node.textContent;
          const start = text.search(/\S/);
          const end = text.search(/\s*$/);
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, end);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0 && rect.height > 0)
              fragments.push({
                text: text.trim(),
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              });
          }
        }
        const lineTops: number[] = [];
        for (const fragment of fragments)
          if (!lineTops.some((top) => Math.abs(top - fragment.y) <= 2))
            lineTops.push(fragment.y);
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
      if (
        /(hidden|clip|auto|scroll)/.test(
          `${style.overflowX} ${style.overflowY}`,
        )
      )
        clippingAncestors.push({
          tag: ancestor.tagName,
          id: ancestor.id,
          box: box(ancestor),
          overflowX: style.overflowX,
          overflowY: style.overflowY,
        });
      ancestor =
        ancestor.parentElement ||
        (ancestor.getRootNode() instanceof ShadowRoot
          ? (ancestor.getRootNode() as ShadowRoot).host
          : null);
    }
    const badgeRect = badge?.getBoundingClientRect();
    const badgeHitTests =
      badgeRect && viewer
        ? [
            [badgeRect.left + 3, badgeRect.top + badgeRect.height / 2],
            [badgeRect.right - 3, badgeRect.top + badgeRect.height / 2],
            [badgeRect.left + badgeRect.width / 2, badgeRect.top + 3],
            [badgeRect.left + badgeRect.width / 2, badgeRect.bottom - 3],
          ].map(([x, y]) => {
            const outer = document.elementFromPoint(x, y);
            const inner = viewer.shadowRoot?.elementFromPoint(x, y);
            return {
              x,
              y,
              unobscured:
                outer === viewer &&
                !!inner &&
                (inner === badge || badge!.contains(inner)),
            };
          })
        : [];
    const paragraphs = Array.from(document.querySelectorAll("#home p"));
    return {
      url: location.href,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      },
      hero: box(document.querySelector("#home")),
      heading: box(document.querySelector("#home h1")),
      artworkStage: box(document.querySelector("[data-home-artwork]")),
      caption: box(
        document.querySelector("[data-home-description]") ||
          paragraphs.find((node) =>
            node.textContent?.includes("Helping people follow through"),
          ) ||
          null,
      ),
      viewer: box(viewer),
      canvas: box(canvas),
      badge: badge
        ? {
            box: box(badge)!,
            href: badge.href,
            display: getComputedStyle(badge).display,
            opacity: getComputedStyle(badge).opacity,
            clippingAncestors,
            hitTests: badgeHitTests,
          }
        : null,
      ctas,
      popup: box(document.querySelector("#popupToggle")),
      mobileToggle: box(document.querySelector("#mobileToggle")),
      // WHY: Text, controls and attribution are separate DOM overlays, not
      // part of the WebGL artwork. Exclude their pixels from silhouette bounds.
      artworkExclusions: [
        ...document.querySelectorAll(
          "#home h1, #home p, #home a, #popupToggle, #navbar",
        ),
        ...(badge ? [badge] : []),
      ].map((element) => box(element)!),
    };
  });
}

type HomeGeometry = Awaited<ReturnType<typeof measureHome>>;
type Box = NonNullable<HomeGeometry["canvas"]>;

async function measureArtwork(
  page: Page,
  screenshot: Buffer,
  geometry: HomeGeometry,
) {
  // WHAT: Measure the visible object from actual browser-rendered pixels.
  // WHY: Reading WebGL directly can produce a blank backbuffer; a screenshot
  // decoded into a detached 2D canvas measures what a visitor actually sees.
  return page.evaluate(
    async ({ png, canvasBox, exclusions }) => {
      if (!canvasBox) return null;
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const sample = document.createElement("canvas");
      sample.width = image.naturalWidth;
      sample.height = image.naturalHeight;
      const context = sample.getContext("2d", { willReadFrequently: true })!;
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, sample.width, sample.height);
      const left = Math.max(0, Math.ceil(canvasBox.x));
      const top = Math.max(0, Math.ceil(canvasBox.y));
      const right = Math.min(sample.width, Math.floor(canvasBox.right));
      const bottom = Math.min(sample.height, Math.floor(canvasBox.bottom));
      let minX = right,
        minY = bottom,
        maxX = -1,
        maxY = -1;
      let pixels = 0,
        totalX = 0,
        totalY = 0;
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          if (
            exclusions.some(
              (rect) =>
                x >= rect.x - 3 &&
                x <= rect.right + 3 &&
                y >= rect.y - 3 &&
                y <= rect.bottom + 3,
            )
          )
            continue;
          const index = (y * sample.width + x) * 4;
          // WHY: The approved scene has a white backdrop. Ignore near-white
          // antialiasing/shadows, retaining both dark and iridescent object faces.
          if (
            data[index + 3] < 128 ||
            Math.min(data[index], data[index + 1], data[index + 2]) >= 235
          )
            continue;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          pixels += 1;
          totalX += x;
          totalY += y;
        }
      }
      if (pixels < 100) return null;
      return {
        box: {
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          right: maxX + 1,
          bottom: maxY + 1,
        },
        center: { x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2 },
        pixelCentroid: { x: totalX / pixels, y: totalY / pixels },
        horizontalOffset: (minX + maxX + 1) / 2 - innerWidth / 2,
        pixels,
        threshold: "Visible non-overlay pixels with minimum RGB channel < 235",
      };
    },
    {
      png: screenshot.toString("base64"),
      canvasBox: geometry.canvas,
      exclusions: geometry.artworkExclusions,
    },
  );
}

async function captureHome(
  page: Page,
  testInfo: TestInfo,
  label: string,
  url: string,
) {
  const errors: string[] = [];
  const onError = (error: Error) => errors.push(error.message);
  page.on("pageerror", onError);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  // WHY: This is a layout check shared by the original and revised Hero copy.
  await expect(page.locator("#home h1")).toBeVisible();
  await expect(page.locator("#home h1")).not.toHaveText("");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#home spline-viewer canvas")).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.locator("#home spline-viewer #logo")).toBeVisible({
    timeout: 30_000,
  });
  // WHY: Give the real WebGL scene the same settling period on both URLs.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  const width = page.viewportSize()!.width;
  const metrics = await measureHome(page);
  const artworkSamples = [];
  for (let frame = 0; frame < 3; frame += 1) {
    if (frame > 0) await page.waitForTimeout(400);
    const name = `${label}-home-${width}-${frame === 0 ? "top" : `artwork-frame-${frame + 1}`}`;
    const path = testInfo.outputPath(`${name}.png`);
    const screenshot = await page.screenshot({
      path,
      animations: "disabled",
      scale: "css",
    });
    await testInfo.attach(name, { path, contentType: "image/png" });
    artworkSamples.push(await measureArtwork(page, screenshot, metrics));
  }
  const fullName = `${label}-home-${width}-full`;
  const fullPath = testInfo.outputPath(`${fullName}.png`);
  await page.screenshot({
    path: fullPath,
    fullPage: true,
    animations: "disabled",
  });
  await testInfo.attach(fullName, { path: fullPath, contentType: "image/png" });
  const canvasName = `${label}-home-${width}-canvas`;
  const canvasPath = testInfo.outputPath(`${canvasName}.png`);
  await page
    .locator("#home spline-viewer canvas")
    .screenshot({ path: canvasPath, animations: "disabled" });
  await testInfo.attach(canvasName, {
    path: canvasPath,
    contentType: "image/png",
  });
  await testInfo.attach(`${label}-home-${width}-geometry`, {
    body: Buffer.from(
      JSON.stringify(
        { ...metrics, artworkSamples, errors, captureOnly },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
  if (width < 768) {
    // WHAT: Keep a before/after menu screenshot even in capture-only mode.
    // WHY: The Home-only change must leave the existing navigation intact.
    const toggle = page.locator("#mobileToggle");
    await toggle.click();
    await expect(page.locator("#navMenu")).toBeVisible();
    const name = `${label}-home-${width}-menu`;
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, animations: "disabled" });
    await testInfo.attach(name, { path, contentType: "image/png" });
    await toggle.click();
  }
  page.off("pageerror", onError);
  expect(errors, `${label}: uncaught runtime errors`).toEqual([]);
  return { ...metrics, artworkSamples };
}

function assertNoOverlap(first: Box, second: Box, label: string) {
  const overlapWidth =
    Math.min(first.right, second.right) - Math.max(first.x, second.x);
  const overlapHeight =
    Math.min(first.bottom, second.bottom) - Math.max(first.y, second.y);
  expect(overlapWidth <= 0 || overlapHeight <= 0, label).toBe(true);
}

async function verifyMobileMenu(page: Page, testInfo: TestInfo) {
  const toggle = page.locator("#mobileToggle");
  const originalOverflow = await page
    .locator("body")
    .evaluate((element) => element.style.overflow);
  for (const dismissal of ["Escape", "toggle"] as const) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("main")).toHaveAttribute("inert");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await expect(page.locator("#navMenu")).toBeVisible();
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
      await testInfo.attach("Mobile menu remains usable", {
        path,
        contentType: "image/png",
      });
      await page.keyboard.press("Escape");
    } else await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    expect(
      await page.locator("body").evaluate((element) => element.style.overflow),
    ).toBe(originalOverflow);
  }
}

for (const width of widths) {
  test(`Home layout evidence ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    // WHY: Before and after evidence must use the same engine, viewport and run.
    if (baselineUrl)
      await captureHome(page, testInfo, "published-before", baselineUrl);
    const metrics = await captureHome(
      page,
      testInfo,
      "branch-current",
      currentUrl,
    );
    if (captureOnly) {
      testInfo.annotations.push({
        type: "capture-only",
        description:
          "Before-state evidence; new mobile layout acceptance assertions intentionally disabled.",
      });
      return;
    }
    expect(metrics.viewport.scrollWidth).toBeLessThanOrEqual(width);
    expect(metrics.ctas).toHaveLength(2);
    expect(metrics.ctas.map((cta) => cta.href)).toEqual([
      new URL("projects.html", metrics.url).href,
      new URL("contact.html", metrics.url).href,
    ]);
    for (const cta of metrics.ctas) {
      expect(cta.lineCount, `${cta.text}: text is rendered`).toBeGreaterThan(0);
      expect(
        cta.lineCount,
        `${cta.text}: rendered text lines`,
      ).toBeLessThanOrEqual(2);
      if (width < 768) expect(cta.box.height).toBeGreaterThanOrEqual(44);
      expect(cta.box.x).toBeGreaterThanOrEqual(0);
      expect(cta.box.right).toBeLessThanOrEqual(width);
      expect(
        cta.scrollWidth,
        `${cta.text}: no hidden horizontal text`,
      ).toBeLessThanOrEqual(cta.clientWidth + 1);
      for (const fragment of cta.fragments) {
        expect(
          fragment.x,
          `${cta.text}: text stays inside button`,
        ).toBeGreaterThanOrEqual(cta.box.x - 1);
        expect(fragment.x + fragment.width).toBeLessThanOrEqual(
          cta.box.right + 1,
        );
        expect(fragment.y).toBeGreaterThanOrEqual(cta.box.y - 1);
        expect(fragment.y + fragment.height).toBeLessThanOrEqual(
          cta.box.bottom + 1,
        );
      }
      assertNoOverlap(
        cta.box,
        metrics.caption!,
        `${cta.text}: description does not overlap button`,
      );
      assertNoOverlap(
        cta.box,
        metrics.badge!.box,
        `${cta.text}: attribution does not overlap button`,
      );
      if (metrics.popup)
        assertNoOverlap(
          cta.box,
          metrics.popup,
          `${cta.text}: materials control does not overlap button`,
        );
    }
    assertNoOverlap(
      metrics.ctas[0].box,
      metrics.ctas[1].box,
      "CTA buttons do not overlap",
    );
    const badge = metrics.badge!;
    expect(badge.href).toMatch(/^https:\/\/spline\.design\//);
    expect(Number(badge.opacity)).toBe(1);
    expect(
      badge.box.width,
      "Full native Spline badge width is preserved",
    ).toBeGreaterThanOrEqual(136);
    expect(
      badge.box.height,
      "Full native Spline badge height is preserved",
    ).toBeGreaterThanOrEqual(35);
    expect(badge.box.x).toBeGreaterThanOrEqual(0);
    expect(badge.box.y).toBeGreaterThanOrEqual(0);
    expect(badge.box.right).toBeLessThanOrEqual(width);
    expect(badge.box.bottom).toBeLessThanOrEqual(metrics.hero!.bottom);
    for (const ancestor of badge.clippingAncestors) {
      if (/(hidden|clip|auto|scroll)/.test(ancestor.overflowX)) {
        expect(
          badge.box.x,
          `${ancestor.tag} does not crop badge left`,
        ).toBeGreaterThanOrEqual(ancestor.box!.x - 1);
        expect(
          badge.box.right,
          `${ancestor.tag} does not crop badge right`,
        ).toBeLessThanOrEqual(ancestor.box!.right + 1);
      }
      if (/(hidden|clip|auto|scroll)/.test(ancestor.overflowY)) {
        expect(
          badge.box.y,
          `${ancestor.tag} does not crop badge top`,
        ).toBeGreaterThanOrEqual(ancestor.box!.y - 1);
        expect(
          badge.box.bottom,
          `${ancestor.tag} does not crop badge bottom`,
        ).toBeLessThanOrEqual(ancestor.box!.bottom + 1);
      }
    }
    expect(badge.hitTests).toHaveLength(4);
    expect(
      badge.hitTests.every((point) => point.unobscured),
      "All four badge edges remain unobscured and clickable",
    ).toBe(true);
    if (width < 768) {
      expect(
        metrics.artworkStage,
        "Home artwork has a dedicated layout region",
      ).not.toBeNull();
      // WHY: Masking text out of the screenshot must not hide a layout overlap.
      // The entire artwork region also needs its own space in the mobile flow.
      assertNoOverlap(
        metrics.artworkStage!,
        metrics.heading!,
        "Artwork region clears the heading",
      );
      assertNoOverlap(
        metrics.artworkStage!,
        metrics.caption!,
        "Artwork region clears the description",
      );
      for (const cta of metrics.ctas)
        assertNoOverlap(
          metrics.artworkStage!,
          cta.box,
          "Artwork region clears the CTA stack",
        );
      const [first, second] = metrics.ctas;
      expect(
        second.box.y - first.box.bottom,
        "Mobile CTAs form separate vertical rows",
      ).toBeGreaterThanOrEqual(8);
      expect(
        Math.abs(first.box.x + first.box.width / 2 - width / 2),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(second.box.x + second.box.width / 2 - width / 2),
      ).toBeLessThanOrEqual(1);
      expect(second.box.bottom).toBeLessThanOrEqual(metrics.hero!.bottom);
      for (const artwork of metrics.artworkSamples) {
        expect(
          artwork,
          "Actual rendered artwork, not just an empty canvas, is present",
        ).not.toBeNull();
        expect(artwork!.pixels).toBeGreaterThan(1000);
        expect(
          Math.abs(artwork!.horizontalOffset),
          "Visible 3D object bounding-box center is near viewport center",
        ).toBeLessThanOrEqual(Math.max(10, width * 0.03));
        expect(
          artwork!.box.x,
          "Artwork is not clipped at the left canvas edge",
        ).toBeGreaterThan(Math.max(0, metrics.canvas!.x) + 1);
        expect(
          artwork!.box.right,
          "Artwork is not clipped at the right canvas edge",
        ).toBeLessThan(Math.min(width, metrics.canvas!.right) - 1);
        assertNoOverlap(
          artwork!.box,
          metrics.heading!,
          "Artwork clears the heading",
        );
        assertNoOverlap(
          artwork!.box,
          metrics.caption!,
          "Artwork clears the description",
        );
        assertNoOverlap(
          artwork!.box,
          badge.box,
          "Artwork clears its full attribution badge",
        );
        for (const cta of metrics.ctas)
          assertNoOverlap(
            artwork!.box,
            cta.box,
            "Artwork clears the CTA stack",
          );
      }
      const actions = page
        .locator("#home")
        .getByRole("link")
        .filter({ hasText: /View My Work|Get in Touch/i });
      await actions.first().focus();
      await expect(actions.first()).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(actions.nth(1)).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(actions.first()).toBeFocused();
      await verifyMobileMenu(page, testInfo);
    }
  });
}
