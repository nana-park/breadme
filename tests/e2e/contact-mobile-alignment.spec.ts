import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { enlargeComputedText } from "../mobile-ui/text-enlargement";

// WHAT: Compare Contact with Home's actual rendered title and visible paragraph.
// WHY: The unused Home summary class is not an authoritative typography reference.
async function measureText(locator: Locator) {
  return locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const fragments = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.setStart(node, node.textContent.search(/\S/));
      range.setEnd(node, node.textContent.search(/\s*$/));
      for (const rect of range.getClientRects())
        if (rect.width && rect.height)
          fragments.push({
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          });
    }
    return {
      left: box.left,
      right: box.right,
      width: box.width,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      textAlign: style.textAlign,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      fragments,
    };
  });
}

async function ready(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(
        document.querySelectorAll<HTMLImageElement>("#contact img"),
      ).map((image) => image.decode().catch(() => undefined)),
    );
    window.scrollTo(0, 0);
  });
}

for (const width of [320, 390, 430, 767]) {
  test(`Contact mobile Hero matches Home ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator("#home-title")).toBeVisible();
    await ready(page);
    const homeTitle = await measureText(page.locator("#home-title"));
    const homeCopy = await measureText(
      page.locator("[data-home-description] p"),
    );
    const homePadding = await page.locator("#home").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingLeft, style.paddingRight];
    });
    const homePath = testInfo.outputPath(`home-reference-${width}.png`);
    await page.screenshot({ path: homePath, animations: "disabled" });
    await testInfo.attach("Actual Home mobile reference", {
      path: homePath,
      contentType: "image/png",
    });

    await page.goto("/contact.html");
    const hero = page.locator('[data-reading-role="contact-hero"]');
    await expect(hero).toBeVisible();
    await ready(page);
    const title = await measureText(hero.locator("h2"));
    const copy = await measureText(hero.locator("p"));
    for (const [contactText, homeText] of [
      [title, homeTitle],
      [copy, homeCopy],
    ]) {
      expect(contactText.textAlign).toBe("left");
      expect(contactText.left).toBeCloseTo(homeText.left, 1);
      expect(contactText.width).toBeCloseTo(homeText.width, 1);
      expect(contactText.fontSize).toBe(homeText.fontSize);
      expect(contactText.lineHeight).toBe(homeText.lineHeight);
      expect(contactText.scrollWidth).toBeLessThanOrEqual(
        contactText.clientWidth + 1,
      );
      expect(contactText.fragments.length).toBeGreaterThan(0);
      expect(
        Math.min(...contactText.fragments.map((line) => line.left)),
      ).toBeCloseTo(contactText.left, 1);
      for (const line of contactText.fragments) {
        expect(line.left).toBeGreaterThanOrEqual(contactText.left - 1);
        expect(line.right).toBeLessThanOrEqual(contactText.right + 1);
      }
    }
    const padding = await hero.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingLeft, style.paddingRight];
    });
    expect(padding).toEqual(homePadding);
    expect(padding).toEqual(["20px", "20px"]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await expect(hero.locator("img")).toHaveAttribute(
      "src",
      /Contact\/bg\.png$/,
    );
    await expect(hero.locator("img")).toHaveCSS("object-fit", "cover");
    await expect(page.locator("html")).toHaveCSS(
      "scroll-snap-type",
      /^y(?: proximity)?$/,
    );
    await expect(
      page.getByRole("link", { name: "Review Projects" }),
    ).toHaveAttribute("href", "/projects.html");
    const path = testInfo.outputPath(`contact-after-${width}.png`);
    await page.screenshot({ path, animations: "disabled" });
    await testInfo.attach("Contact mobile after", {
      path,
      contentType: "image/png",
    });
    await testInfo.attach("Contact and Home computed layout", {
      body: Buffer.from(
        JSON.stringify(
          { width, homeTitle, homeCopy, homePadding, title, copy, padding },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
    expect(errors).toEqual([]);
  });
}

for (const width of [768, 1440]) {
  test(`Contact tablet and desktop source layout stays unchanged ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact.html");
    const hero = page.locator('[data-reading-role="contact-hero"]');
    await expect(hero).toBeVisible();
    // WHY: Resize from the modified layout to prove its overrides stop at 767px.
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    await expect(hero).toHaveCSS("text-align", "center");
    await expect(hero).toHaveCSS("padding-left", "16px");
    await expect(hero).toHaveCSS("padding-right", "16px");
    await expect(hero).toHaveCSS("padding-top", "0px");
    await expect(hero).toHaveCSS("height", width === 768 ? "350px" : "500px");
    await expect(hero.locator("h2")).toHaveCSS(
      "font-size",
      width === 768 ? "48px" : "56px",
    );
    await expect(hero.locator("h2")).toHaveCSS(
      "line-height",
      width === 768 ? "52.8px" : "61.6px",
    );
    await expect(hero.locator("p")).toHaveCSS("font-size", "16px");
    await expect(hero.locator("p")).toHaveCSS("line-height", "25.6px");
    await expect(page.locator("html")).toHaveCSS("scroll-snap-type", "none");
    const path = testInfo.outputPath(`contact-unchanged-${width}.png`);
    await page.screenshot({ path, animations: "disabled" });
    await testInfo.attach("Contact unchanged tablet/desktop", {
      path,
      contentType: "image/png",
    });
  });
}

test("Contact mobile Hero retains synthetic 200% reflow at 320px", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact.html");
  const hero = page.locator('[data-reading-role="contact-hero"]');
  await expect(hero).toBeVisible();
  await ready(page);
  const enlargement = await enlargeComputedText(
    page,
    '[data-reading-role="contact-hero"]',
  );
  const bounds = await hero.boundingBox();
  const texts = [
    await measureText(hero.locator("h2")),
    await measureText(hero.locator("p")),
  ];
  expect(enlargement.samples.length).toBeGreaterThan(0);
  for (const sample of enlargement.samples)
    expect(sample.afterFontPx).toBeCloseTo(sample.beforeFontPx * 2, 1);
  for (const text of texts) {
    expect(text.fragments.length).toBeGreaterThan(0);
    for (const line of text.fragments) {
      expect(line.left).toBeGreaterThanOrEqual(bounds!.x);
      expect(line.right).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      expect(line.top).toBeGreaterThanOrEqual(bounds!.y);
      expect(line.bottom).toBeLessThanOrEqual(bounds!.y + bounds!.height);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
  const path = testInfo.outputPath("contact-320-synthetic-200.png");
  await page.screenshot({ path, animations: "disabled" });
  await testInfo.attach("Contact synthetic 200% reflow; not native zoom", {
    path,
    contentType: "image/png",
  });
});
