import { expect, test, type Page, type TestInfo } from "@playwright/test";
import articleExpectations from "../../src/content/original/articles/source-expectations.json" with { type: "json" };
import { settleFirstScreen } from "./capture-layout";

// WHAT: Assert the distortion and reading-overlay defects found in saved mobile pixels.
// WHY: Inline source heights must yield to the mobile override without changing any
// source images or desktop sizing. Reading-state tests already capture full viewports.
const RATIO_TOLERANCE = 0.005;
const PIXEL_TOLERANCE = 1;

async function openArticle(page: Page, articleId: string, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`./articles.html#article-detail?id=${articleId}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.locator("#article-detail-content")).toBeVisible();
  await settleFirstScreen(page);
}

async function imageEvidence(page: Page) {
  return page.locator("#article-detail-content").evaluate(async (root) => {
    const images = await Promise.all(
      Array.from(root.querySelectorAll("img")).map(async (image) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const decoded = await Promise.race([
          image.decode().then(
            () => true,
            () => false,
          ),
          new Promise<boolean>((resolve) => {
            timer = setTimeout(() => resolve(false), 8_000);
          }),
        ]);
        if (timer) clearTimeout(timer);
        return { image, decoded };
      }),
    );
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const contentBox = root.getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      contentBox: { left: contentBox.left, right: contentBox.right },
      images: images.map(({ image, decoded }) => {
        const box = image.getBoundingClientRect();
        const naturalRatio = image.naturalHeight
          ? image.naturalWidth / image.naturalHeight
          : null;
        const renderedRatio = box.height ? box.width / box.height : null;
        return {
          src: image.currentSrc || image.src,
          alt: image.alt,
          decoded,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: box.width,
          renderedHeight: box.height,
          left: box.left,
          right: box.right,
          visible: image.checkVisibility({
            checkOpacity: true,
            checkVisibilityCSS: true,
          }),
          naturalRatio,
          renderedRatio,
          relativeRatioError:
            naturalRatio && renderedRatio
              ? Math.abs(renderedRatio / naturalRatio - 1)
              : null,
          inlineHeight: image.style.height,
          computedHeight: getComputedStyle(image).height,
        };
      }),
    };
  });
}

async function assertArticleImages(
  page: Page,
  testInfo: TestInfo,
  article: (typeof articleExpectations)[number],
  width: number,
) {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await openArticle(page, article.id, width);
  await expect(page.locator("#article-detail-title")).toHaveText(article.title);
  const evidence = await imageEvidence(page);
  await testInfo.attach(`article-${article.id}--w${width}--image-ratios`, {
    body: JSON.stringify(
      {
        articleId: article.id,
        expectedImageCount: article.images.length,
        browserErrors,
        ...evidence,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });

  expect(browserErrors).toEqual([]);
  expect(evidence.images).toHaveLength(article.images.length);
  expect(evidence.images.map((image) => image.alt)).toEqual(
    article.images.map((image) => image.alt),
  );
  expect(
    evidence.documentWidth,
    "document has no horizontal overflow",
  ).toBeLessThanOrEqual(evidence.clientWidth + PIXEL_TOLERANCE);
  expect(
    evidence.bodyWidth,
    "body has no horizontal overflow",
  ).toBeLessThanOrEqual(evidence.clientWidth + PIXEL_TOLERANCE);
  for (const image of evidence.images) {
    const label = `${article.id}: ${image.alt}`;
    expect(image.decoded, `${label} decodes successfully`).toBe(true);
    expect(image.complete, `${label} finishes loading`).toBe(true);
    expect(image.visible, `${label} is not hidden`).toBe(true);
    expect(image.naturalWidth, `${label} has source pixels`).toBeGreaterThan(0);
    expect(image.naturalHeight, `${label} has source pixels`).toBeGreaterThan(
      0,
    );
    expect(image.renderedWidth, `${label} has rendered width`).toBeGreaterThan(
      0,
    );
    expect(
      image.renderedHeight,
      `${label} has rendered height`,
    ).toBeGreaterThan(0);
    expect(
      image.relativeRatioError,
      `${label} has a measurable ratio`,
    ).not.toBeNull();
    expect(
      image.relativeRatioError!,
      `${label} retains its natural aspect ratio`,
    ).toBeLessThanOrEqual(RATIO_TOLERANCE);
    expect(
      image.left,
      `${label} stays within its reading column`,
    ).toBeGreaterThanOrEqual(evidence.contentBox.left - PIXEL_TOLERANCE);
    expect(
      image.right,
      `${label} stays within its reading column`,
    ).toBeLessThanOrEqual(evidence.contentBox.right + PIXEL_TOLERANCE);
  }
  const popup = page.locator("#email-popup");
  await expect(popup).toHaveClass(/\bminimized\b/);
  await expect(
    popup,
    "minimized materials control must not cover reading text",
  ).toBeHidden();
}

for (const article of articleExpectations) {
  test(`article ${article.id}: decoded images retain natural ratios at 390px`, async ({
    page,
  }, testInfo) => {
    await assertArticleImages(page, testInfo, article, 390);
  });
}

test("long article 52537: image widths clamp without distortion at 320px", async ({
  page,
}, testInfo) => {
  const article = articleExpectations.find((item) => item.id === "52537")!;
  await assertArticleImages(page, testInfo, article, 320);
});

test("article reading retains materials access through the mobile menu", async ({
  page,
}) => {
  await openArticle(page, "52537", 390);
  const popup = page.locator("#email-popup");
  const menuToggle = page.locator("#mobileToggle");
  await expect(popup).toBeHidden();
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
  await page
    .locator(".original-mobile-materials [data-materials-action='portfolio']")
    .click();
  await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
  await expect(popup).toBeVisible();
  await expect(popup).not.toHaveAttribute("inert");
  await expect(page.locator("#materials-content")).toBeVisible();
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  const minimize = page.getByRole("button", { name: "Minimize Popup" });
  await expect(minimize).toBeFocused();
  await minimize.click();
  await expect(popup).toBeHidden();
  await expect(menuToggle).toBeFocused();
  await expect(page.locator("#article-detail-content")).toBeVisible();
  await menuToggle.click();
  await page
    .locator(".original-mobile-materials [data-materials-action='resume']")
    .click();
  await expect(minimize).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(popup).toBeHidden();
  await expect(menuToggle).toBeFocused();

  await page.setViewportSize({ width: 768, height: 900 });
  const shortcut = page.locator("#popupToggle");
  await expect(shortcut).toBeVisible();
  await shortcut.focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(popup).toBeHidden();
  await expect(menuToggle).toBeFocused();
});
