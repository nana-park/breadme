import { expect, test } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import {
  originalPageIds,
  originalRoutePaths,
} from "../../src/config/originalRoutes";
import type { OriginalPageId } from "../../src/config/originalRoutes";

// WHAT: Native document-scroll evidence across the complete original route inventory.
// WHY: Proximity snapping assists near section boundaries, without forcing every
// wheel gesture to advance a section or treating long articles as fixed-height slides.
const MOBILE = { width: 390, height: 844 };
const SNAP_SECTION = "[data-mobile-snap-section]";
const ALIGNMENT_TOLERANCE = 3;
test.setTimeout(60_000);

async function openRoute(page: Page, pageId: OriginalPageId, hash = "") {
  await page.goto(`/${originalRoutePaths[pageId]}${hash}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("[data-original-page]")).toHaveAttribute(
    "data-original-page",
    pageId,
  );
  await expect(page.locator("main h1, main h2").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    Array.from(document.images).every(
      (image) => image.loading === "lazy" || image.complete,
    ),
  );
}

async function settleScroll(page: Page) {
  // WHY: A wheel promise resolves before native snap animation finishes. Wait for
  // a stable position, including a short minimum observation window for dispatch.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const started = performance.now();
        let lastX = scrollX;
        let lastY = scrollY;
        let stableSince = started;
        const sample = (now: number) => {
          if (
            Math.abs(lastX - scrollX) > 0.25 ||
            Math.abs(lastY - scrollY) > 0.25
          )
            stableSince = now;
          lastX = scrollX;
          lastY = scrollY;
          if (now - started >= 350 && now - stableSince >= 250) resolve();
          else if (now - started > 5_000)
            reject(
              new Error("Document scrolling did not settle within 5 seconds"),
            );
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
}

async function geometry(page: Page) {
  return page.evaluate((selector) => {
    const root = document.documentElement;
    const rootStyle = getComputedStyle(root);
    const paddingTop = Number.parseFloat(rootStyle.scrollPaddingTop) || 0;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    )
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
        return {
          index,
          id: element.id,
          label: element.dataset.mobileSnapSection,
          heading: element.querySelector("h1, h2, h3, h4")?.textContent?.trim(),
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          documentTop: rect.top + scrollY,
          snapY: rect.top + scrollY - paddingTop - marginTop,
          snapAlign: style.scrollSnapAlign,
          snapStop: style.scrollSnapStop,
          overflowY: style.overflowY,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          visible:
            rect.width > 0 && rect.height > 0 && style.visibility !== "hidden",
        };
      })
      .filter((section) => section.visible);
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      scrollY,
      scrollWidth: root.scrollWidth,
      maxScrollY: root.scrollHeight - innerHeight,
      documentIsScroller: document.scrollingElement === root,
      snapType: rootStyle.scrollSnapType,
      scrollBehavior: rootStyle.scrollBehavior,
      paddingTop,
      headerBottom:
        document.querySelector(".navbar")?.getBoundingClientRect().bottom ?? 0,
      sections,
    };
  }, SNAP_SECTION);
}

async function attachEvidence(
  page: Page,
  testInfo: TestInfo,
  label: string,
  data?: unknown,
) {
  await testInfo.attach(`${label}-geometry`, {
    body: Buffer.from(JSON.stringify(data ?? (await geometry(page)), null, 2)),
    contentType: "application/json",
  });
  const path = testInfo.outputPath(`${label}.png`);
  await page.screenshot({ path, animations: "disabled" });
  await testInfo.attach(label, { path, contentType: "image/png" });
}

async function approachSection(page: Page) {
  const before = await geometry(page);
  const target = before.sections.find(
    (section) => section.snapY > 120 && section.snapY < before.maxScrollY - 40,
  );
  expect(
    target,
    "A downstream major section has a reachable native snap position",
  ).toBeDefined();
  const section = page.locator(SNAP_SECTION).nth(target!.index);
  // WHAT: Stop 24px before the target, using a real input event.
  // WHY: This tests proximity capture; stopping deep inside a tall section is
  // intentionally allowed and must not be mistaken for a failed mandatory snap.
  await page.mouse.move(MOBILE.width - 8, MOBILE.height / 2);
  await page.mouse.wheel(0, target!.snapY - before.scrollY - 24);
  await expect
    .poll(() =>
      section.evaluate((element) => {
        const padding =
          Number.parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop,
          ) || 0;
        const margin =
          Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
        return Math.abs(element.getBoundingClientRect().top - padding - margin);
      }),
    )
    .toBeLessThanOrEqual(ALIGNMENT_TOLERANCE);
  await settleScroll(page);
  return { before, after: await geometry(page), target };
}

for (const pageId of originalPageIds) {
  test(`native mobile section snap 390 ${originalRoutePaths[pageId]}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(MOBILE);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await openRoute(page, pageId);
    await expect(page.locator("html")).toHaveCSS(
      "scroll-snap-type",
      "y proximity",
    );
    const initial = await geometry(page);
    expect(initial.documentIsScroller).toBe(true);
    expect(initial.paddingTop).toBe(70);
    expect(initial.sections.length).toBeGreaterThanOrEqual(2);
    expect(initial.scrollWidth).toBeLessThanOrEqual(MOBILE.width);
    for (const section of initial.sections) {
      expect(
        section.snapAlign,
        `${section.id || section.label}: section start`,
      ).toBe("start");
      expect(
        section.snapStop,
        `${section.id || section.label}: no forced stops`,
      ).toBe("normal");
    }
    const evidence = await approachSection(page);
    await attachEvidence(page, testInfo, `${pageId}-390-native-snap`, evidence);
    expect(evidence.after.scrollY).toBeGreaterThan(initial.scrollY);
    expect(errors).toEqual([]);
  });
}

test("desktop 1440 retains free document scrolling on all 14 routes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const evidence: Array<{
    pageId: OriginalPageId;
    before: Awaited<ReturnType<typeof geometry>>;
    after: Awaited<ReturnType<typeof geometry>>;
  }> = [];
  for (const pageId of originalPageIds) {
    await test.step(originalRoutePaths[pageId], async () => {
      await openRoute(page, pageId);
      await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
      const before = await geometry(page);
      expect(before.documentIsScroller).toBe(true);
      await page.mouse.move(1432, 450);
      await page.mouse.wheel(0, 137);
      await settleScroll(page);
      const after = await geometry(page);
      expect(
        Math.abs(
          after.scrollY - Math.min(before.scrollY + 137, before.maxScrollY),
        ),
      ).toBeLessThanOrEqual(2);
      expect(
        after.sections.every((section) => section.snapAlign === "none"),
      ).toBe(true);
      evidence.push({ pageId, before, after });
    });
  }
  await attachEvidence(page, testInfo, "desktop-1440-free-scroll", evidence);
});

test("767 enables snapping, 768 disables it, and reduced motion restores free scrolling", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "home");
  await page.setViewportSize({ width: 767, height: 844 });
  await expect(page.locator("html")).toHaveCSS(
    "scroll-snap-type",
    "y proximity",
  );
  await page.setViewportSize({ width: 768, height: 844 });
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
  await page.setViewportSize(MOBILE);
  await expect(page.locator("html")).toHaveCSS(
    "scroll-snap-type",
    "y proximity",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  const before = await geometry(page);
  const partner = before.sections.find((section) => section.id === "partners")!;
  const freeY = partner.snapY - 24;
  await page.mouse.move(382, 422);
  await page.mouse.wheel(0, freeY - before.scrollY);
  await settleScroll(page);
  expect(Math.abs((await geometry(page)).scrollY - freeY)).toBeLessThanOrEqual(
    2,
  );
  await attachEvidence(page, testInfo, "mobile-reduced-motion-free-scroll");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveCSS(
    "scroll-snap-type",
    "y proximity",
  );
});

test("native hash anchors and keyboard skip navigation clear the fixed header", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "qualified", "#how-work");
  const target = page.locator("#how-work");
  await expect(page).toHaveURL(/qualified\.html#how-work$/);
  await expect
    .poll(() =>
      target.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(69);
  await expect
    .poll(() =>
      target.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeLessThanOrEqual(73);
  await attachEvidence(page, testInfo, "mobile-native-hash-anchor");
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.locator("#main-content")).toBeFocused();
  await settleScroll(page);
  expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(1);
  await page.goBack();
  await expect(page).toHaveURL(/#how-work$/);
  await settleScroll(page);
  expect(
    await target.evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(69);
  expect(
    await target.evaluate((element) => element.getBoundingClientRect().top),
  ).toBeLessThanOrEqual(73);
});

async function readMiddleOfTallContent(page: Page, content: Locator) {
  const metrics = await content.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + scrollY,
      height: rect.height,
      viewportHeight: innerHeight,
    };
  });
  expect(
    metrics.height,
    "The reading fixture is genuinely taller than two viewports",
  ).toBeGreaterThan(metrics.viewportHeight * 2);
  const readingY = metrics.top + (metrics.height - metrics.viewportHeight) / 2;
  await page.mouse.move(382, 422);
  await page.mouse.wheel(0, readingY - (await page.evaluate(() => scrollY)));
  await settleScroll(page);
  const middle = await page.evaluate(() => scrollY);
  expect(
    Math.abs(middle - readingY),
    "Proximity leaves an interior reading position intact",
  ).toBeLessThanOrEqual(3);
  const visibleContent = await content.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const clippedAncestors = [];
    for (
      let ancestor: HTMLElement | null = element as HTMLElement;
      ancestor && ancestor !== document.body;
      ancestor = ancestor.parentElement
    ) {
      if (
        /(hidden|clip)/.test(getComputedStyle(ancestor).overflowY) &&
        ancestor.scrollHeight > ancestor.clientHeight + 2
      )
        clippedAncestors.push(ancestor.id || ancestor.tagName);
    }
    return { top: rect.top, bottom: rect.bottom, clippedAncestors };
  });
  expect(visibleContent.top).toBeLessThan(70);
  expect(visibleContent.bottom).toBeGreaterThan(MOBILE.height);
  expect(visibleContent.clippedAncestors).toEqual([]);
  await page.keyboard.press("PageDown");
  await settleScroll(page);
  const later = await page.evaluate(() => scrollY);
  expect(
    later,
    "Keyboard scrolling can continue through long content",
  ).toBeGreaterThan(middle + 100);
  return { metrics, readingY, middle, later, visibleContent };
}

test("Articles preserve long-form reading, pagination, hash and back-forward restoration", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "articles");
  await page.getByRole("button", { name: "Articles page 2" }).click();
  await settleScroll(page);
  const article = page.getByRole("link", {
    name: "Read Article: Art, a unique human domain that AI cannot invade",
  });
  await article.scrollIntoViewIfNeeded();
  await article.focus();
  await settleScroll(page);
  const listY = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#article-detail\?id=64006$/);
  await expect(page.locator("#article-detail-title")).toBeFocused();
  await expect(page.locator("#articles")).toBeHidden();
  await page.waitForFunction(() =>
    Array.from(
      document.querySelectorAll<HTMLImageElement>(
        "#article-detail-content img",
      ),
    ).every((image) => image.complete),
  );
  const reading = await readMiddleOfTallContent(
    page,
    page.locator("#article-detail-content"),
  );
  await attachEvidence(page, testInfo, "mobile-long-article-reading", {
    reading,
    page: await geometry(page),
  });
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Articles page 2" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(article).toBeFocused();
  await settleScroll(page);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - listY),
  ).toBeLessThanOrEqual(3);
  await page.goForward();
  await expect(page).toHaveURL(/#article-detail\?id=64006$/);
  await expect(page.locator("#article-detail-title")).toBeFocused();
  await page
    .getByRole("button", { name: "Back to List", exact: true })
    .first()
    .click();
  await expect(article).toBeFocused();
  await settleScroll(page);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - listY),
  ).toBeLessThanOrEqual(3);
});

test("expanded project content remains reachable before and after disclosure collapse", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "projects");
  const disclosure = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "NAVER CareCall" }) });
  const summary = disclosure.locator("summary");
  await summary.click();
  await expect(disclosure).toHaveAttribute("open", "");
  const tail = disclosure.getByText(
    "From Complex Flows to Simple Conversations",
    { exact: true },
  );
  await tail.scrollIntoViewIfNeeded();
  await settleScroll(page);
  await expect(tail).toBeInViewport();
  const tailBox = await tail.boundingBox();
  expect(tailBox!.y).toBeGreaterThanOrEqual(70);
  expect(tailBox!.y + tailBox!.height).toBeLessThanOrEqual(MOBILE.height);
  await attachEvidence(page, testInfo, "mobile-expanded-project-tail");
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).not.toHaveAttribute("open");
  await expect(summary).toBeFocused();
  await expect(tail).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await tail.scrollIntoViewIfNeeded();
  await expect(tail).toBeInViewport();
});

test("mobile menu suspends snap, locks background, traps focus and restores scrolling", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "home");
  await approachSection(page);
  const toggle = page.locator("#mobileToggle");
  const originalOverflow = await page
    .locator("body")
    .evaluate((element) => element.style.overflow);
  for (const dismissal of ["Escape", "toggle"] as const) {
    const before = await page.evaluate(() => scrollY);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await expect(page.locator("main")).toHaveAttribute("inert");
    await toggle.focus();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "breadme home" }),
    ).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.locator(
        ".original-mobile-materials [data-materials-action='portfolio']",
      ),
    ).toBeFocused();
    await page.mouse.move(200, 420);
    await page.mouse.wheel(0, 400);
    await settleScroll(page);
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before),
    ).toBeLessThanOrEqual(1);
    if (dismissal === "Escape") {
      await attachEvidence(page, testInfo, "mobile-menu-snap-suspended");
      await page.keyboard.press("Escape");
    } else await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    await expect(page.locator("html")).toHaveCSS(
      "scroll-snap-type",
      "y proximity",
    );
    expect(
      await page.locator("body").evaluate((element) => element.style.overflow),
    ).toBe(originalOverflow);
    await settleScroll(page);
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - before),
    ).toBeLessThanOrEqual(3);
  }
  const resumedY = await page.evaluate(() => scrollY);
  await page.mouse.move(382, 422);
  await page.mouse.wheel(0, 400);
  await settleScroll(page);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(resumedY + 100);
});

test("nested horizontal gallery retains its own native snap without moving the page", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "home");
  const gallery = page.locator(".footprint-gallery-container");
  await gallery.scrollIntoViewIfNeeded();
  await settleScroll(page);
  await expect(gallery).toHaveCSS("scroll-snap-type", "x mandatory");
  await expect(gallery.locator(SNAP_SECTION)).toHaveCount(0);
  const before = await gallery.evaluate((element) => ({
    left: element.scrollLeft,
    pageY: scrollY,
    scrollWidth: element.scrollWidth,
    width: element.clientWidth,
  }));
  expect(before.scrollWidth).toBeGreaterThan(before.width);
  const box = await gallery.boundingBox();
  await page.mouse.move(
    box!.x + box!.width / 2,
    Math.max(100, box!.y + box!.height / 2),
  );
  await page.mouse.wheel(300, 0);
  await expect
    .poll(() => gallery.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(before.left + 100);
  await settleScroll(page);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - before.pageY),
  ).toBeLessThanOrEqual(3);
  await expect(page.locator("html")).toHaveCSS(
    "scroll-snap-type",
    "y proximity",
  );
  await attachEvidence(
    page,
    testInfo,
    "mobile-independent-horizontal-gallery",
    {
      before,
      after: await gallery.evaluate((element) => ({
        left: element.scrollLeft,
        pageY: scrollY,
      })),
    },
  );
});

test("Home uses equal mobile section spacing from CTAs to the partner introduction", async ({
  page,
}, testInfo) => {
  await page.setViewportSize(MOBILE);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openRoute(page, "home");
  const spacing = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>("#home")!;
    const partners = document.querySelector<HTMLElement>("#partners")!;
    const actions = hero.querySelector<HTMLElement>("[data-home-actions]")!;
    const introduction = partners.querySelector<HTMLElement>(
      ":scope > .container > p",
    )!;
    return {
      heroPaddingBottom: Number.parseFloat(
        getComputedStyle(hero).paddingBottom,
      ),
      partnersPaddingTop: Number.parseFloat(
        getComputedStyle(partners).paddingTop,
      ),
      ctaBottom: actions.getBoundingClientRect().bottom,
      heroBottom: hero.getBoundingClientRect().bottom,
      partnersTop: partners.getBoundingClientRect().top,
      introductionTop: introduction.getBoundingClientRect().top,
      token: getComputedStyle(hero)
        .getPropertyValue("--home-mobile-section-space")
        .trim(),
    };
  });
  expect(spacing.token).toBe("40px");
  expect(spacing.heroPaddingBottom).toBe(40);
  expect(spacing.partnersPaddingTop).toBe(spacing.heroPaddingBottom);
  expect(
    Math.abs(spacing.heroBottom - spacing.partnersTop),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(spacing.heroBottom - spacing.ctaBottom - 40),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(spacing.introductionTop - spacing.ctaBottom - 80),
  ).toBeLessThanOrEqual(1);
  await attachEvidence(
    page,
    testInfo,
    "home-mobile-equal-section-spacing",
    spacing,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#home")).toHaveCSS("padding-bottom", "104px");
  await expect(page.locator("#partners")).toHaveCSS("padding-top", "80px");
});
