import { expect, test } from "@playwright/test";
import type { Locator, Page, TestInfo } from "@playwright/test";
import { settleFirstScreen } from "../mobile-ui/capture-layout";
import { enlargeComputedText } from "../mobile-ui/text-enlargement";

const chapter = (name: string) => `[data-about-chapter="${name}"]`;
const introduction = '[data-reading-role="about-introduction"]';
const proximity = /^y(?: proximity)?$/;
test.setTimeout(60_000);

async function openAbout(page: Page, width: number, reducedMotion = false) {
  await page.setViewportSize({ width, height: 844 });
  await page.emulateMedia({
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  await page.goto("/about.html", { waitUntil: "domcontentloaded" });
  await expect(page.locator(`${introduction} h2`)).toBeVisible();
  await settleFirstScreen(page);
}

async function capture(page: Page, testInfo: TestInfo, label: string) {
  const data = await page.evaluate(() => ({
    width: innerWidth,
    scrollY,
    scrollWidth: document.documentElement.scrollWidth,
    snapType: getComputedStyle(document.documentElement).scrollSnapType,
    chapters: Array.from(
      document.querySelectorAll<HTMLElement>("[data-about-chapter]"),
    ).map((element) => ({
      name: element.dataset.aboutChapter,
      rect: element.getBoundingClientRect().toJSON(),
      height: getComputedStyle(element).height,
      minHeight: getComputedStyle(element).minHeight,
      snapAlign: getComputedStyle(element).scrollSnapAlign,
      snapStop: getComputedStyle(element).scrollSnapStop,
    })),
  }));
  await testInfo.attach(`${label}-geometry`, {
    body: Buffer.from(JSON.stringify(data, null, 2)),
    contentType: "application/json",
  });
  const path = testInfo.outputPath(`${label}.png`);
  await page.screenshot({ path, animations: "disabled" });
  await testInfo.attach(label, { path, contentType: "image/png" });
}

async function approach(page: Page, target: Locator) {
  const distance = await target.evaluate((element) => {
    const padding =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) ||
      0;
    const margin = parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
    return element.getBoundingClientRect().top - padding - margin;
  });
  await page.mouse.move((page.viewportSize()?.width ?? 390) - 8, 400);
  await page.mouse.wheel(0, distance - 24);
  await expect
    .poll(() =>
      target.evaluate((element) => {
        const padding =
          parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop,
          ) || 0;
        const margin =
          parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
        return Math.abs(element.getBoundingClientRect().top - padding - margin);
      }),
    )
    .toBeLessThanOrEqual(3);
}

for (const width of [320, 390, 430, 767]) {
  test(`About mobile chapters align and snap at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#home-title")).toBeVisible();
    await settleFirstScreen(page);
    const home = {
      title: (await page.locator("#home-title").boundingBox())!,
      body: (await page.locator("[data-home-description] p").boundingBox())!,
    };
    await testInfo.attach(`home-${width}-reading-reference`, {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
    await openAbout(page, width);
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", proximity);
    expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(1);
    for (const selector of [
      `${introduction} h2`,
      `${introduction} p`,
      `${introduction} a`,
    ]) {
      const element = page.locator(selector);
      expect((await element.boundingBox())!.x).toBeCloseTo(home.title.x, 1);
    }
    const about = {
      title: (await page.locator(`${introduction} h2`).boundingBox())!,
      body: (await page.locator(`${introduction} p`).boundingBox())!,
      action: (await page.locator(`${introduction} a`).boundingBox())!,
    };
    expect(about.title.width).toBeCloseTo(home.title.width, 1);
    expect(about.body.x).toBeCloseTo(home.body.x, 1);
    expect(about.body.width).toBeCloseTo(home.body.width, 1);
    expect(about.title.x).toBeCloseTo(Math.max(20, (width - 380) / 2), 1);
    await testInfo.attach(`home-about-${width}-reading-columns`, {
      body: JSON.stringify({ width, home, about }, null, 2),
      contentType: "application/json",
    });
    await expect(page.locator(introduction)).toHaveCSS("text-align", "left");
    await expect(page.locator(".id-root-name")).toHaveCSS("font-size", "36px");
    await expect(page.locator(".id-phonetic-symbol").first()).toHaveCSS(
      "font-size",
      "27px",
    );
    await expect(page.locator(".id-connector").first()).toHaveCSS(
      "height",
      "70px",
    );
    const chapters = page.locator("[data-about-chapter]");
    await expect(chapters).toHaveCount(3);
    for (const item of await chapters.all()) {
      await expect(item).toHaveCSS("scroll-snap-align", "start");
      await expect(item).toHaveCSS("scroll-snap-stop", "normal");
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(774);
    }
    await capture(page, testInfo, `about-${width}-intro`);
    for (const name of ["identity", "interview"]) {
      await approach(page, page.locator(chapter(name)));
      await capture(page, testInfo, `about-${width}-${name}`);
    }
    await page.locator(`${chapter("interview")} a`).scrollIntoViewIfNeeded();
    await expect(page.locator(`${chapter("interview")} a`)).toBeInViewport();
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(page.locator("footer")).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}

test("About menu and reduced motion retain free-scroll escape paths", async ({
  page,
}) => {
  await openAbout(page, 390);
  for (let repeat = 0; repeat < 2; repeat += 1) {
    await page.locator("#mobileToggle").click();
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", proximity);
    await expect(page.locator("#mobileToggle")).toBeFocused();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

test("About enlarged intro grows and remains readable inside a tall chapter", async ({
  page,
}, testInfo) => {
  await openAbout(page, 320);
  const scale = await enlargeComputedText(page, introduction);
  expect(scale.samples.length).toBeGreaterThan(0);
  for (const sample of scale.samples)
    expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
  const hero = page.locator(chapter("introduction"));
  const content = page.locator(introduction);
  const heroBox = (await hero.boundingBox())!;
  const contentBox = (await content.boundingBox())!;
  expect(heroBox.height).toBeGreaterThan(774);
  expect(contentBox.y).toBeGreaterThanOrEqual(heroBox.y);
  expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(
    heroBox.y + heroBox.height,
  );
  await page.mouse.move(312, 400);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(200);
  const after = await hero.boundingBox();
  expect(after!.y + after!.height).toBeGreaterThan(70);
  await page.locator(`${introduction} a`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${introduction} a`)).toBeInViewport();
  await capture(page, testInfo, "about-320-enlarged-intro-end");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

for (const width of [768, 1440]) {
  test(`About retains original desktop layout at ${width}px`, async ({
    page,
  }, testInfo) => {
    await openAbout(page, width);
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
    await expect(page.locator(introduction)).toHaveCSS("text-align", "center");
    await expect(page.locator(introduction)).toHaveCSS("align-items", "center");
    await expect(page.locator(".id-root-name")).toHaveCSS("font-size", "40px");
    await expect(page.locator(".id-phonetic-symbol").first()).toHaveCSS(
      "font-size",
      "30px",
    );
    await expect(page.locator(".id-connector").first()).toHaveCSS(
      "height",
      "80px",
    );
    expect(
      await page
        .locator(introduction)
        .evaluate((element) =>
          parseFloat(getComputedStyle(element).paddingLeft),
        ),
    ).toBeCloseTo(width * 0.05, 1);
    await capture(page, testInfo, `about-${width}-desktop-intro`);
    await page.locator(".id-root-name").scrollIntoViewIfNeeded();
    await capture(page, testInfo, `about-${width}-desktop-identity`);
  });
}
