import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  originalPageIds,
  originalRoutePaths,
} from "../../src/config/originalRoutes";
import { settleFirstScreen } from "./capture-layout";
import { enlargeComputedText } from "./text-enlargement";

// WHAT: Strict, role-scoped regressions for screenshot-reviewed mobile defects.
// WHY: Decorative overflow, offscreen carousel siblings, and product mockups are
// intentional; a whole-document "every text node must fit" rule would misclassify them.
const mobileWidths = [320, 360, 375, 390, 430, 767] as const;
const role = (name: string) => `[data-reading-role="${name}"]`;
const TOLERANCE = 2;

async function inspectText(locator: Locator) {
  return locator.evaluateAll((roots) =>
    roots.map((root) => {
      const rect = (box: DOMRect) => ({
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      });
      const style = getComputedStyle(root);
      const fragments: Array<{
        text: string;
        fontSize: number;
        box: ReturnType<typeof rect>;
        clips: Array<{ ancestor: string; axis: "x" | "y"; edge: number }>;
      }> = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        const text = node.textContent || "";
        if (
          !parent ||
          !text.trim() ||
          parent.closest(
            '[aria-hidden="true"], [data-reading-role="identity-decorator-slash"]',
          )
        )
          continue;
        if (
          !parent.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          })
        )
          continue;
        const range = document.createRange();
        // Trim indentation, retaining the actual glyph fragment boxes of wrapped lines.
        range.setStart(node, text.length - text.trimStart().length);
        range.setEnd(node, text.trimEnd().length);
        for (const box of Array.from(range.getClientRects()).filter(
          (box) => box.width > 0 && box.height > 0,
        )) {
          const clips: Array<{
            ancestor: string;
            axis: "x" | "y";
            edge: number;
          }> = [];
          for (
            let ancestor: HTMLElement | null = parent;
            ancestor &&
            ancestor !== document.body &&
            ancestor !== document.documentElement;
            ancestor = ancestor.parentElement
          ) {
            const ancestorStyle = getComputedStyle(ancestor);
            const bounds = ancestor.getBoundingClientRect();
            const left = bounds.left + ancestor.clientLeft;
            const top = bounds.top + ancestor.clientTop;
            const label =
              ancestor.dataset.readingRole ||
              ancestor.id ||
              ancestor.tagName.toLowerCase();
            // Auto/scroll regions are deliberately reachable through scrolling. Hidden
            // and clip are not: those are the actual lost-text defect under test.
            if (/^(hidden|clip)$/.test(ancestorStyle.overflowX)) {
              if (box.left < left - 2)
                clips.push({ ancestor: label, axis: "x", edge: left });
              if (box.right > left + ancestor.clientWidth + 2)
                clips.push({
                  ancestor: label,
                  axis: "x",
                  edge: left + ancestor.clientWidth,
                });
            }
            if (/^(hidden|clip)$/.test(ancestorStyle.overflowY)) {
              if (box.top < top - 2)
                clips.push({ ancestor: label, axis: "y", edge: top });
              if (box.bottom > top + ancestor.clientHeight + 2)
                clips.push({
                  ancestor: label,
                  axis: "y",
                  edge: top + ancestor.clientHeight,
                });
            }
          }
          fragments.push({
            text: text.trim().slice(0, 140),
            fontSize: parseFloat(getComputedStyle(parent).fontSize),
            box: rect(box),
            clips,
          });
        }
      }
      return {
        text: root.textContent?.trim().replace(/\s+/g, " ").slice(0, 180),
        fontSize: parseFloat(style.fontSize),
        whiteSpace: style.whiteSpace,
        textOverflow: style.textOverflow,
        box: rect(root.getBoundingClientRect()),
        viewportWidth: innerWidth,
        fragments,
      };
    }),
  );
}

type TextEvidence = Awaited<ReturnType<typeof inspectText>>;
function assertReadable(
  evidence: TextEvidence,
  label: string,
  minimumFont?: number,
) {
  expect(evidence.length, `${label}: fixture exists`).toBeGreaterThan(0);
  for (const item of evidence) {
    expect(
      item.fragments.length,
      `${label}: visible text ${item.text}`,
    ).toBeGreaterThan(0);
    if (minimumFont !== undefined) {
      expect(item.fontSize, `${label}: computed font`).toBeGreaterThanOrEqual(
        minimumFont - 0.1,
      );
      expect(
        item.fragments.filter(
          (fragment) => fragment.fontSize < minimumFont - 0.1,
        ),
        `${label}: nested text font`,
      ).toEqual([]);
    }
    expect(
      item.fragments.filter(
        (fragment) =>
          fragment.box.left < -TOLERANCE ||
          fragment.box.right > item.viewportWidth + TOLERANCE,
      ),
      `${label}: glyphs stay horizontally visible`,
    ).toEqual([]);
    expect(
      item.fragments.flatMap((fragment) => fragment.clips),
      `${label}: glyphs are not clipped by non-scrollable ancestors`,
    ).toEqual([]);
  }
}

async function attachEvidence(
  page: Page,
  testInfo: TestInfo,
  caseId: string,
  data: unknown,
  screenshot = true,
) {
  const path = testInfo.outputPath(`${caseId}.json`);
  await writeFile(path, JSON.stringify(data, null, 2));
  await testInfo.attach(`${caseId}-geometry`, {
    path,
    contentType: "application/json",
  });
  if (screenshot) {
    const imagePath = testInfo.outputPath(`${caseId}.png`);
    await page.screenshot({
      path: imagePath,
      fullPage: false,
      animations: "disabled",
    });
    await testInfo.attach(caseId, {
      path: imagePath,
      contentType: "image/png",
    });
  }
}

// WHAT: Observe the actual element rectangles until stable, with no fixed sleeps.
async function settleGeometry(locator: Locator) {
  return locator.evaluate(async (element) => {
    let previous = "";
    let stableFrames = 0;
    const start = performance.now();
    while (stableFrames < 4 && performance.now() - start < 3_000) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const signature = JSON.stringify([
        scrollY,
        ...[element, ...element.querySelectorAll("*")].map((child) => {
          const box = child.getBoundingClientRect();
          return [box.x, box.y, box.width, box.height].map((value) =>
            Math.round(value * 10),
          );
        }),
      ]);
      stableFrames = signature === previous ? stableFrames + 1 : 0;
      previous = signature;
    }
    return stableFrames >= 4;
  });
}

async function checkMenu(page: Page, testInfo: TestInfo, caseId: string) {
  // WHAT: A normal short phone fits every link; a much shorter viewport can scroll.
  // WHY: Overflow is a fallback for constrained/enlarged layouts, not the default.
  const width = page.viewportSize()!.width;
  await page.setViewportSize({ width, height: 640 });
  await page.locator("footer").scrollIntoViewIfNeeded();
  const toggle = page.locator("#mobileToggle");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menu = page.locator("#navMenu");
  await expect(menu).toHaveCSS("overflow-y", "auto");
  await expect(menu.locator("[data-materials-action]")).toHaveCount(0);
  await expect(page.locator(".original-mobile-materials")).toHaveCount(0);
  const primary = await inspectText(menu.locator(".nav-link"));
  const secondary = await inspectText(menu.locator(".lnb-link"));
  const scrollBox = await menu.evaluate((element) => ({
    height: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }));
  await attachEvidence(page, testInfo, `${caseId}--h640--menu-top`, {
    primary,
    secondary,
    scrollBox,
  });
  assertReadable(primary, "menu primary labels", 16);
  assertReadable(secondary, "menu secondary labels", 14);
  expect(primary).toHaveLength(5);
  expect(secondary).toHaveLength(7);
  expect(
    scrollBox.scrollHeight,
    "All navigation fits at 640px height without scrolling",
  ).toBeLessThanOrEqual(scrollBox.height + TOLERANCE);
  expect(scrollBox.scrollTop).toBe(0);
  for (const link of await menu.locator("a").all())
    await expect(link).toBeInViewport({ ratio: 1 });
  await expect(page.locator("#main-content")).toHaveAttribute("inert");
  const popup = page.locator("#email-popup");
  if (await popup.count()) {
    await expect(popup).toHaveAttribute("inert");
    await expect(popup).toBeHidden();
  }

  await page.setViewportSize({ width, height: 320 });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const shortScrollBox = await menu.evaluate((element) => ({
    height: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(
    shortScrollBox.scrollHeight,
    "The menu retains its scroll fallback in a very short viewport",
  ).toBeGreaterThan(shortScrollBox.height);
  const contact = menu.getByRole("link", { name: "CONTACT", exact: true });
  await contact.scrollIntoViewIfNeeded();
  await contact.focus();
  await expect(contact).toBeInViewport({ ratio: 1 });
  const reached = await menu.evaluate((element) => ({
    scrollTop: element.scrollTop,
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
  }));
  const control = await contact.boundingBox();
  await attachEvidence(page, testInfo, `${caseId}--h320--menu-contact`, {
    shortScrollBox,
    reached,
    control,
  });
  expect(reached.scrollTop).toBeGreaterThan(0);
  expect(control!.y).toBeGreaterThanOrEqual(reached.top - TOLERANCE);
  expect(control!.y + control!.height).toBeLessThanOrEqual(
    reached.bottom + TOLERANCE,
  );
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
  await expect(page.locator("#main-content")).not.toHaveAttribute("inert");
  if (await popup.count()) await expect(popup).toBeHidden();
}

async function checkFooter(page: Page, testInfo: TestInfo, caseId: string) {
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  await settleGeometry(footer);
  const columns = await footer
    .locator(".footer-columns")
    .evaluate((element) =>
      getComputedStyle(element)
        .gridTemplateColumns.split(/\s+/)
        .filter(Boolean),
    );
  const text = await inspectText(
    footer.locator(".footer-links a,.lang-btn,.footer-copyright p"),
  );
  const controls = await footer
    .locator(".footer-links a,.social-icon,.lang-btn")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          label:
            element.textContent?.trim() || element.getAttribute("aria-label"),
          width: box.width,
          height: box.height,
        };
      }),
    );
  await attachEvidence(page, testInfo, `${caseId}--footer`, {
    columns,
    text,
    controls,
  });
  expect(columns, "mobile footer uses two columns").toHaveLength(2);
  assertReadable(text, "footer text", 14);
  expect(controls.length).toBeGreaterThan(0);
  expect(
    controls.filter((control) => control.width < 43.9 || control.height < 43.9),
    "footer links and buttons have 44px targets",
  ).toEqual([]);
}

for (const pageId of originalPageIds) {
  test(`readability regression ${pageId}: six mobile widths, menu and footer`, async ({
    page,
  }, testInfo) => {
    const unchangedMentoring = pageId === "ai-mentoring-agent-detail";
    if (unchangedMentoring)
      testInfo.annotations.push({
        type: "pending-typography-hook",
        description:
          "Mentoring source is intentionally unchanged; this tests its original 32px/14px typography and the shared menu/footer, not the pending 16px copy upgrade.",
      });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(`./${originalRoutePaths[pageId]}`, {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok()).toBe(true);
    await expect(page.locator("[data-original-page]")).toHaveAttribute(
      "data-original-page",
      pageId,
    );
    for (const width of mobileWidths) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 844 });
        const readiness = await settleFirstScreen(page);
        const minimizedMaterials = page.locator("#email-popup.minimized");
        if (await minimizedMaterials.count())
          await expect(
            minimizedMaterials,
            "The mobile shortcut must not cover editorial text",
          ).toBeHidden();
        const title = await inspectText(
          page.locator(
            pageId === "home"
              ? "#home-title"
              : unchangedMentoring
                ? "main h1"
                : role("landing-title"),
          ),
        );
        const copySelector = [role("landing-copy"), role("director-copy")].join(
          ",",
        );
        const copy = await inspectText(
          page.locator(
            pageId === "home"
              ? "[data-home-description] p"
              : unchangedMentoring
                ? "main h1 + div p"
                : copySelector,
          ),
        );
        const caseId = `${pageId}--w${width}--regression`;
        await attachEvidence(
          page,
          testInfo,
          caseId,
          { readiness, title, copy },
          [320, 390, 767].includes(width),
        );
        const homeAlignedHero = pageId === "home" || pageId === "contact";
        assertReadable(title, "landing headline", homeAlignedHero ? 32 : 30);
        for (const heading of title)
          expect(heading.fontSize).toBeLessThanOrEqual(
            homeAlignedHero ? 40.1 : 36.1,
          );
        // Home and the requested matching Contact Hero use 13px; Qualified categories
        // and Awards' art heading have no common editorial body role.
        if (copy.length)
          assertReadable(
            copy,
            "landing editorial copy",
            homeAlignedHero ? 13 : unchangedMentoring ? 14 : 16,
          );
        if (unchangedMentoring) {
          expect(title[0].fontSize, "unchanged Mentoring title baseline").toBe(
            32,
          );
          expect(
            copy[0].fontSize,
            "unchanged Mentoring copy baseline; upgrade remains pending",
          ).toBe(14);
        }
        if ([320, 390, 767].includes(width))
          await checkFooter(page, testInfo, caseId);
        if ([320, 390].includes(width)) await checkMenu(page, testInfo, caseId);
      });
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [320, 390]) {
  test(`Lectures: all 12 complete text fields at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./lectures.html", { waitUntil: "domcontentloaded" });
    await settleFirstScreen(page);
    const fields = page.locator(role("lecture-copy"));
    await expect(fields).toHaveCount(12);
    const evidence = await inspectText(fields);
    await attachEvidence(
      page,
      testInfo,
      `lectures--w${width}--all-copy`,
      evidence,
      false,
    );
    assertReadable(evidence, "lecture titles and facts");
    for (const field of evidence) {
      expect(field.whiteSpace).toBe("normal");
      expect(field.textOverflow).not.toBe("ellipsis");
    }
    const cards = page.locator(role("lecture-content"));
    for (let index = 0; index < (await cards.count()); index += 1) {
      await cards.nth(index).scrollIntoViewIfNeeded();
      await attachEvidence(
        page,
        testInfo,
        `lectures--w${width}--card-${index + 1}`,
        await inspectText(cards.nth(index)),
      );
    }
  });
}

for (const width of [320, 390, 767]) {
  test(`About identity meaning stays visible at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./about.html", { waitUntil: "domcontentloaded" });
    await settleFirstScreen(page);
    const diagram = page.locator(role("identity-diagram-container"));
    await diagram.scrollIntoViewIfNeeded();
    await settleGeometry(diagram);
    await expect(page.locator(role("identity-meaning-text"))).toHaveCount(2);
    for (const meaning of await page
      .locator(role("identity-meaning-text"))
      .all())
      await expect(meaning.locator("..")).toHaveCSS("opacity", "1");
    const evidence = await inspectText(diagram);
    const meanings = await inspectText(
      page.locator(role("identity-meaning-text")),
    );
    assertReadable(meanings, "both BREAD and ME glyph bounds");
    await attachEvidence(
      page,
      testInfo,
      `about--w${width}--identity`,
      evidence,
    );
    assertReadable(evidence, "complete identity diagram");
  });

  test(`Awards caption clears artwork at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./awards.html", { waitUntil: "domcontentloaded" });
    await settleFirstScreen(page);
    const media = await page.locator(role("artwork-media")).boundingBox();
    const caption = await page.locator(role("artwork-caption")).boundingBox();
    const title = await inspectText(page.locator(role("landing-title")));
    await attachEvidence(page, testInfo, `awards--w${width}--caption`, {
      media,
      caption,
      title,
    });
    expect(caption!.y).toBeGreaterThanOrEqual(
      media!.y + media!.height - TOLERANCE,
    );
    assertReadable(title, "Awards title", 30);
  });

  test(`Career: every testimonial signature stays inside its card at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("./career.html", { waitUntil: "domcontentloaded" });
    await settleFirstScreen(page);
    const carousel = page.locator("#testimonialsContainer");
    const cards = carousel.locator(role("testimonial-card"));
    await expect(cards).toHaveCount(6);
    await carousel.scrollIntoViewIfNeeded();
    let active = carousel.locator(
      `${role("testimonial-card")}[aria-pressed="true"]`,
    );
    await active.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
    for (let index = 0; index < 6; index += 1) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute("aria-pressed", "true");
      await card.focus();
      expect(await settleGeometry(card), "card animation settles").toBe(true);
      const signature = card.locator(role("card-signature"));
      const quote = card.locator(role("card-quote"));
      const cardBox = await card.boundingBox();
      const signatureBox = await signature.boundingBox();
      const quoteBox = await quote.boundingBox();
      const text = await inspectText(
        card.locator(`${role("card-quote")},${role("card-signature")}`),
      );
      await attachEvidence(
        page,
        testInfo,
        `career--w${width}--testimonial-${index + 1}`,
        { cardBox, signatureBox, quoteBox, text },
      );
      assertReadable(text, `testimonial ${index + 1}`);
      expect(signatureBox!.y).toBeGreaterThanOrEqual(cardBox!.y - TOLERANCE);
      expect(signatureBox!.y + signatureBox!.height).toBeLessThanOrEqual(
        cardBox!.y + cardBox!.height + TOLERANCE,
      );
      expect(signatureBox!.y).toBeGreaterThanOrEqual(
        quoteBox!.y + quoteBox!.height - TOLERANCE,
      );
      if (index < 5) await page.keyboard.press("ArrowRight");
    }
    // Also cover reverse keyboard navigation after the final card.
    active = cards.last();
    await active.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(cards.nth(4)).toHaveAttribute("aria-pressed", "true");
  });
}

for (const pageId of ["contact", "enjoy"] as const) {
  test(`${pageId}: synthetic 200% title and copy reflow at 320px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`./${pageId}.html`, { waitUntil: "domcontentloaded" });
    await settleFirstScreen(page);
    const enlargement = await enlargeComputedText(page, `#${pageId}`);
    const readiness = await settleFirstScreen(page);
    const text = await inspectText(
      page.locator(`${role("landing-title")},${role("landing-copy")}`),
    );
    await attachEvidence(
      page,
      testInfo,
      `${pageId}--w320--synthetic-200-regression`,
      { enlargement, readiness, text },
    );
    expect(enlargement.samples.length).toBeGreaterThan(0);
    for (const sample of enlargement.samples)
      expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
    assertReadable(text, `${pageId} enlarged title and copy`);
    const hero = page.locator(
      role(pageId === "contact" ? "contact-hero" : "photo-hero"),
    );
    const heroBox = await hero.boundingBox();
    for (const item of text)
      for (const fragment of item.fragments) {
        expect(fragment.box.top).toBeGreaterThanOrEqual(heroBox!.y - TOLERANCE);
        expect(fragment.box.bottom).toBeLessThanOrEqual(
          heroBox!.y + heroBox!.height + TOLERANCE,
        );
      }
  });
}
