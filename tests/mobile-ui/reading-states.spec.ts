import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { captureLayout, settleFirstScreen } from "./capture-layout";
import { enlargeComputedText } from "./text-enlargement";
import articleExpectations from "../../src/content/original/articles/source-expectations.json" with { type: "json" };

// WHAT: Reuse the 18 source-fidelity fixtures instead of duplicating article metadata.
// WHY: The app's unit tests verify this JSON against every React article body.
const originalArticles = articleExpectations;
const captureOnly = process.env.MOBILE_UI_CAPTURE_ONLY ?? "1";
if (captureOnly !== "1") {
  throw new Error(
    "MOBILE_UI_CAPTURE_ONLY must be 1 until screenshot review establishes regression assertions.",
  );
}
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }, testInfo) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  testInfo.annotations.push({
    type: "baseline-evidence",
    description:
      "Capture success is not a visual QA pass; review PNGs, readiness, and candidate geometry.",
  });
});

const longBodyArticleId = "52537";
const longestTitleArticle = originalArticles.reduce((longest, article) =>
  article.title.length > longest.title.length ? article : longest,
);

// WHAT: Capture the complete laid-out reading state, while keeping PNGs viewport-sized.
// WHY: Overflow-hidden can hide a defect from document-width checks. Text Range
// evidence and image aspect ratios are observations until screenshots are reviewed.
async function saveReadingEvidence(
  page: Page,
  testInfo: TestInfo,
  caseId: string,
  scope: string,
  context: Record<string, unknown> = {},
) {
  const metrics = await captureLayout(page);
  const content = await page.locator(scope).evaluate((root) => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const images = Array.from(root.querySelectorAll("img")).map((image) => {
      const box = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      const naturalAspectRatio = image.naturalHeight
        ? image.naturalWidth / image.naturalHeight
        : null;
      const renderedAspectRatio = box.height ? box.width / box.height : null;
      return {
        src: image.currentSrc || image.src,
        alt: image.alt,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: round(box.width),
        renderedHeight: round(box.height),
        naturalAspectRatio,
        renderedAspectRatio,
        aspectRatioDifference:
          naturalAspectRatio !== null && renderedAspectRatio !== null
            ? round(Math.abs(renderedAspectRatio / naturalAspectRatio - 1))
            : null,
        objectFit: style.objectFit,
        width: style.width,
        height: style.height,
        inlineWidth: image.style.width,
        inlineHeight: image.style.height,
        top: round(box.top + scrollY),
      };
    });
    const markedText = Array.from(
      root.querySelectorAll(
        "figcaption,blockquote,.cheditor-caption,.cheditor-caption-wrapper,.article-subheading",
      ),
    ).map((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        className: element.className,
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 220),
        width: round(box.width),
        height: round(box.height),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        fontSize: style.fontSize,
        overflowX: style.overflowX,
      };
    });
    return {
      textLength: root.textContent?.trim().length || 0,
      images,
      markedText,
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
    };
  });
  const evidence = {
    schemaVersion: 1,
    caseId,
    mode: "baseline",
    captureOnly: true,
    errors: [...(browserErrors.get(page) ?? [])],
    scope,
    ...context,
    content,
    metrics,
  };
  const jsonPath = testInfo.outputPath(`${caseId}.json`);
  await writeFile(jsonPath, JSON.stringify(evidence, null, 2));
  await testInfo.attach(`${caseId}-geometry`, {
    path: jsonPath,
    contentType: "application/json",
  });
  const imagePath = testInfo.outputPath(`${caseId}.png`);
  await page.screenshot({
    path: imagePath,
    fullPage: false,
    animations: "disabled",
    timeout: 15_000,
  });
  await testInfo.attach(caseId, {
    path: imagePath,
    contentType: "image/png",
  });
  return evidence;
}

async function enlargeRootFont(page: Page) {
  return page.evaluate(async () => {
    const samples = Array.from(
      document.querySelectorAll(
        "#article-detail-title,#article-detail-content p,#projects summary,#lectures h3,#lectures p,#navMenu a",
      ),
    ).slice(0, 12);
    const before = samples.map((element) => ({
      text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 100),
      fontSize: getComputedStyle(element).fontSize,
    }));
    const beforeRootPx = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    document.documentElement.style.setProperty(
      "font-size",
      `${beforeRootPx * 2}px`,
      "important",
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return {
      method:
        "root-font-size-200-percent; NOT browser zoom or full text-only zoom",
      limitation:
        "Fixed px font sizes may remain unchanged; before/after samples show the actual effect.",
      beforeRootPx,
      afterRootPx: parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      ),
      samples: before.map((sample, index) => ({
        ...sample,
        afterFontSize: getComputedStyle(samples[index]).fontSize,
      })),
    };
  });
}

// WHAT: Wait for the current reading position without resetting to the page top.
// WHY: settleFirstScreen intentionally scrolls to zero and cannot settle mid-body evidence.
async function settleReadingPosition(page: Page) {
  return page.evaluate(async () => {
    let previous = "";
    let stableFrames = 0;
    const started = performance.now();
    while (stableFrames < 4 && performance.now() - started < 2_000) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const signature = JSON.stringify([
        scrollX,
        scrollY,
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
      ]);
      stableFrames = signature === previous ? stableFrames + 1 : 0;
      previous = signature;
    }
    return { scrollY, layoutStable: stableFrames >= 4, stableFrames };
  });
}

async function readArticleMiddle(page: Page) {
  const target = await page
    .locator("#article-detail-content")
    .evaluate((root) => {
      const box = root.getBoundingClientRect();
      const requestedY =
        box.top + scrollY + Math.max(0, (box.height - innerHeight) / 2);
      window.scrollTo({ top: requestedY, behavior: "instant" });
      return {
        requestedY,
        bodyHeight: box.height,
        viewportHeight: innerHeight,
      };
    });
  return { ...target, ...(await settleReadingPosition(page)) };
}

async function settleArticle(page: Page) {
  const readiness = await settleFirstScreen(page);
  // All body images are eagerly loaded in the source. Decode them without scrolling
  // or creating huge full-height captures; record failed/timed-out images as evidence.
  const bodyImages = await page
    .locator("#article-detail-content img")
    .evaluateAll(async (elements) => {
      const images = elements.filter(
        (element): element is HTMLImageElement =>
          element instanceof HTMLImageElement,
      );
      let timer: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      await Promise.race([
        Promise.all(
          images.map((image) => image.decode().catch(() => undefined)),
        ),
        new Promise<void>((resolve) => {
          timer = setTimeout(() => {
            timedOut = true;
            resolve();
          }, 4_000);
        }),
      ]);
      if (timer) clearTimeout(timer);
      return {
        timedOut,
        count: images.length,
        ready: images.filter(
          (image) => image.complete && image.naturalWidth > 0,
        ).length,
      };
    });
  return { ...readiness, bodyImages };
}

function assertCapturedContent(
  evidence: Awaited<ReturnType<typeof saveReadingEvidence>>,
) {
  expect(
    evidence.content.textLength,
    "Reading content rendered",
  ).toBeGreaterThan(0);
  // Baseline collection must finish even when overflow or clipping is the bug.
  // Add route-specific readability regressions only after reviewing fresh evidence.
}

// WHAT: Every article gets direct-hash navigation and top, middle, and source-link captures.
// WHY: The existing reading flow only exercised two bodies; archived inline media,
// captions, and quotes vary independently across all 18 source articles.
for (const article of originalArticles) {
  test(`article ${article.id}: direct reading state at 390px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`./articles.html#article-detail?id=${article.id}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("#article-detail-content")).toBeAttached();
    const readiness = await settleArticle(page);
    const evidence = await saveReadingEvidence(
      page,
      testInfo,
      `article-${article.id}--w390--top`,
      "#article-detail",
      { articleId: article.id, title: article.title, readiness },
    );
    await expect(page.locator("#article-detail-title")).toHaveText(
      article.title,
    );
    await expect(page.locator("#article-original-link")).toHaveAttribute(
      "href",
      article.url,
    );
    assertCapturedContent(evidence);
    const reading = await readArticleMiddle(page);
    await saveReadingEvidence(
      page,
      testInfo,
      `article-${article.id}--w390--middle`,
      "#article-detail-content",
      { articleId: article.id, reading },
    );
    await page.locator("#article-original-link").scrollIntoViewIfNeeded();
    const endPosition = await settleReadingPosition(page);
    await saveReadingEvidence(
      page,
      testInfo,
      `article-${article.id}--w390--source-link`,
      "#article-detail",
      { articleId: article.id, endPosition },
    );
  });
}

test("longest-title article: 8 viewport resize cases including desktop", async ({
  page,
}, testInfo) => {
  await page.goto(
    `./articles.html#article-detail?id=${longestTitleArticle.id}`,
    {
      waitUntil: "domcontentloaded",
    },
  );
  await expect(page.locator("#article-detail-title")).toHaveText(
    longestTitleArticle.title,
  );
  for (const width of [320, 360, 375, 390, 430, 767, 768, 1440]) {
    await test.step(`reading width ${width}`, async () => {
      await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
      const readiness = await settleArticle(page);
      const evidence = await saveReadingEvidence(
        page,
        testInfo,
        `article-${longestTitleArticle.id}--w${width}--resize-top`,
        "#article-detail",
        { articleId: longestTitleArticle.id, readiness, navigation: "resize" },
      );
      assertCapturedContent(evidence);
    });
  }
});

test("long article 52537: 320px root font 200 percent (not browser zoom)", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`./articles.html#article-detail?id=${longBodyArticleId}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("#article-detail-content")).toBeAttached();
  const enlargement = await enlargeRootFont(page);
  const readiness = await settleArticle(page);
  const evidence = await saveReadingEvidence(
    page,
    testInfo,
    "article-52537--w320--root-font-200--top",
    "#article-detail",
    { articleId: longBodyArticleId, enlargement, readiness },
  );
  expect(enlargement.afterRootPx).toBe(enlargement.beforeRootPx * 2);
  assertCapturedContent(evidence);
  const reading = await readArticleMiddle(page);
  await saveReadingEvidence(
    page,
    testInfo,
    "article-52537--w320--root-font-200--middle",
    "#article-detail-content",
    { enlargement, readiness, reading },
  );
});

test("long article 52537: 320px synthetic text 200 percent (not browser zoom)", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`./articles.html#article-detail?id=${longBodyArticleId}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("#article-detail-content")).toBeAttached();
  const enlargement = await enlargeComputedText(page, "#article-detail");
  const readiness = await settleArticle(page);
  await saveReadingEvidence(
    page,
    testInfo,
    "article-52537--w320--synthetic-text-200--top",
    "#article-detail",
    { enlargement, readiness },
  );
  expect(enlargement.samples.length).toBeGreaterThan(0);
  for (const sample of enlargement.samples)
    expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
  const reading = await readArticleMiddle(page);
  await saveReadingEvidence(
    page,
    testInfo,
    "article-52537--w320--synthetic-text-200--middle",
    "#article-detail-content",
    { enlargement, readiness, reading },
  );
});

test("longest-title article: archive open at 320px root font 200 percent (not browser zoom)", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("./articles.html", { waitUntil: "domcontentloaded" });
  const enlargement = await enlargeRootFont(page);
  await settleFirstScreen(page);
  const archivePage =
    Math.floor(originalArticles.indexOf(longestTitleArticle) / 3) + 1;
  // The current longest title is on page 3, available in the first pagination window.
  await page
    .getByRole("button", { name: `Articles page ${archivePage}`, exact: true })
    .click();
  const articleLink = page.getByRole("link", {
    name: `Read Article: ${longestTitleArticle.title}`,
    exact: true,
  });
  await articleLink.scrollIntoViewIfNeeded();
  await articleLink.focus();
  await settleReadingPosition(page);
  const archiveScrollY = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await expect(page.locator("#article-detail-content")).toBeAttached();
  const readiness = await settleArticle(page);
  const evidence = await saveReadingEvidence(
    page,
    testInfo,
    `article-${longestTitleArticle.id}--w320--root-font-200--top`,
    "#article-detail",
    {
      articleId: longestTitleArticle.id,
      openedFromArchive: true,
      enlargement,
      readiness,
    },
  );
  await expect(page.locator("#article-detail-title")).toHaveText(
    longestTitleArticle.title,
  );
  await expect(page).toHaveURL(
    new RegExp(`#article-detail\\?id=${longestTitleArticle.id}$`),
  );
  assertCapturedContent(evidence);
  for (const returnMethod of ["history-back", "back-to-list"] as const) {
    if (returnMethod === "history-back") await page.goBack();
    else
      await page
        .getByRole("button", { name: "Back to List", exact: true })
        .first()
        .click();
    await expect(articleLink).toBeFocused();
    await expect(
      page.getByRole("button", {
        name: `Articles page ${archivePage}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "page");
    const restored = await settleReadingPosition(page);
    await saveReadingEvidence(
      page,
      testInfo,
      `article-${longestTitleArticle.id}--w320--${returnMethod}`,
      "#articles",
      { archiveScrollY, restored, enlargement },
    );
    // Restoration is an existing behavioral contract, not a new visual threshold.
    expect(Math.abs(restored.scrollY - archiveScrollY)).toBeLessThanOrEqual(3);
    if (returnMethod === "history-back") {
      await page.goForward();
      await expect(page.locator("#article-detail-title")).toBeFocused();
    }
  }
});

test("Projects expanded rows: 320px root font 200 percent (not browser zoom)", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("./projects.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#projects")).toBeVisible();
  const enlargement = await enlargeRootFont(page);
  const readiness = await settleFirstScreen(page);
  const details = page.locator("#projects details").first();
  await details.locator("summary").click();
  await details.locator("summary").scrollIntoViewIfNeeded();
  const evidence = await saveReadingEvidence(
    page,
    testInfo,
    "projects--w320--root-font-200--expanded",
    "#projects details[open]",
    { enlargement, readiness },
  );
  await expect(details).toHaveAttribute("open", "");
  assertCapturedContent(evidence);
});

test("Lectures long title: 320px root font 200 percent (not browser zoom)", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("./lectures.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#lectures")).toBeVisible();
  const enlargement = await enlargeRootFont(page);
  const readiness = await settleFirstScreen(page);
  const title = page.getByRole("heading", {
    name: "AI Interaction Expert Special Lecture",
    exact: true,
  });
  await title.scrollIntoViewIfNeeded();
  const evidence = await saveReadingEvidence(
    page,
    testInfo,
    "lectures--w320--root-font-200--long-title",
    "#lectures",
    { enlargement, readiness },
  );
  await expect(title).toBeVisible();
  assertCapturedContent(evidence);
});

for (const route of ["contact", "enjoy"] as const) {
  test(`${route} hero: 320px synthetic text 200 percent (not browser zoom)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto(`./${route}.html`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(`#${route}`)).toBeVisible();
    await settleFirstScreen(page);
    const enlargement = await enlargeComputedText(page, `#${route}`);
    const readiness = await settleFirstScreen(page);
    const evidence = await saveReadingEvidence(
      page,
      testInfo,
      `${route}--w320--synthetic-text-200--top`,
      `#${route}`,
      { enlargement, readiness },
    );
    expect(enlargement.samples.length).toBeGreaterThan(0);
    for (const sample of enlargement.samples)
      expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
    assertCapturedContent(evidence);
  });
}

for (const scenario of [
  { width: 844, height: 390, enlarged: false, label: "landscape" },
  { width: 320, height: 844, enlarged: true, label: "portrait-text-200" },
  { width: 844, height: 390, enlarged: true, label: "landscape-text-200" },
]) {
  test(`mobile menu: ${scenario.label} reading and repeated dismissal`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: scenario.width,
      height: scenario.height,
    });
    await page.goto("./articles.html", { waitUntil: "domcontentloaded" });
    const readiness = await settleFirstScreen(page);
    const bodyOverflowBefore = await page
      .locator("body")
      .evaluate((body) => body.style.overflow);
    const toggle = page.locator("#mobileToggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const enlargement = scenario.enlarged
      ? await enlargeComputedText(page, "#navbar")
      : null;
    if (enlargement) {
      expect(enlargement.samples.length).toBeGreaterThan(0);
      for (const sample of enlargement.samples)
        expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
    }
    const caseId = `menu--w${scenario.width}-h${scenario.height}--${scenario.label}`;
    const evidence = await saveReadingEvidence(
      page,
      testInfo,
      `${caseId}--top`,
      "#navbar",
      { readiness, enlargement },
    );
    // Inspect the final navigation link without leaving the page.
    await expect(page.locator("#navMenu [data-materials-action]")).toHaveCount(
      0,
    );
    const finalControl = page
      .locator("#navMenu")
      .getByRole("link", { name: "CONTACT", exact: true });
    await finalControl.scrollIntoViewIfNeeded();
    await finalControl.focus();
    const menuPosition = await settleReadingPosition(page);
    await saveReadingEvidence(
      page,
      testInfo,
      `${caseId}--last-control`,
      "#navbar",
      { enlargement, menuPosition },
    );
    await expect(finalControl).toBeFocused();
    await expect(finalControl).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    expect(
      await page.locator("body").evaluate((body) => body.style.overflow),
    ).toBe(bodyOverflowBefore);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    expect(
      await page.locator("body").evaluate((body) => body.style.overflow),
    ).toBe(bodyOverflowBefore);
    assertCapturedContent(evidence);
  });
}
