import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`Articles archive and reading flow at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/articles.html");
    await expect(
      page.getByRole("link", { name: /^Read Article:/ }),
    ).toHaveCount(3);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page.getByAltText("Articles Environment")).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByAltText("Articles Environment")
          .evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`articles-${width}-top.png`),
      animations: "disabled",
    });
    await page.screenshot({
      path: testInfo.outputPath(`articles-${width}-full.png`),
      fullPage: true,
      animations: "disabled",
    });

    await page.getByRole("button", { name: "Articles page 2" }).click();
    await expect(
      page.getByRole("button", { name: "Articles page 2" }),
    ).toHaveAttribute("aria-current", "page");
    const firstArticle = page.getByRole("link", {
      name: "Read Article: Art, a unique human domain that AI cannot invade",
    });
    await firstArticle.scrollIntoViewIfNeeded();
    await firstArticle.focus();
    const scrollBeforeReading = await page.evaluate(() => scrollY);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#article-detail\?id=64006$/);
    await expect(page.locator("#article-detail-title")).toHaveText(
      "Art, a unique human domain that AI cannot invade",
    );
    await expect(page.locator("#article-detail-title")).toBeFocused();
    await expect(
      page.getByRole("link", { name: "View Original (KR)" }),
    ).toHaveAttribute(
      "href",
      "https://www.artinsight.co.kr/news/view.php?no=64006",
    );
    await expect
      .poll(() =>
        page
          .locator("#article-detail-content img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`article-detail-${width}-top.png`),
      animations: "disabled",
    });
    await page.screenshot({
      path: testInfo.outputPath(`article-detail-${width}-full.png`),
      fullPage: true,
      animations: "disabled",
    });

    await page.goBack();
    await expect(firstArticle).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Articles page 2" }),
    ).toHaveAttribute("aria-current", "page");
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(scrollBeforeReading, 0);
    await page.goForward();
    await expect(page.locator("#article-detail-title")).toBeVisible();
    await page
      .getByRole("button", { name: "Back to List", exact: true })
      .last()
      .click();
    await expect(firstArticle).toBeVisible();
    await expect(firstArticle).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeCloseTo(scrollBeforeReading, 0);
    expect(errors).toEqual([]);
  });
}

test("Articles sixth page and direct detail links", async ({ page }) => {
  await page.goto("/articles.html");
  await page.getByRole("button", { name: "Articles page 5" }).click();
  await page.getByRole("button", { name: "Articles page 6" }).click();
  await expect(
    page.getByRole("button", { name: "Next articles page" }),
  ).toBeDisabled();
  await expect(page.getByRole("link", { name: /^Read Article:/ })).toHaveCount(
    3,
  );
  await expect(
    page.getByRole("link", { name: "Read Article: Hockney’s iPad" }),
  ).toHaveAttribute("href", "#article-detail?id=47268");
  await page.goto("/articles.html#article-detail?id=47268");
  await expect(page.locator("#article-detail-title")).toHaveText(
    "Hockney’s iPad",
  );
  await expect(page.locator("#article-detail-meta")).toHaveText(
    "Published on 2020.04.14",
  );
  await expect(
    page.getByRole("link", { name: "View Original (KR)" }),
  ).toHaveAttribute(
    "href",
    "https://www.artinsight.co.kr/news/view.php?no=47268",
  );
  await page
    .getByRole("button", { name: "Back to List", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("navigation", { name: "Articles pagination" }),
  ).toBeVisible();
});
