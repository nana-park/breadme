import { expect, test } from "@playwright/test";

// Full-page captures and media below the text-led Hero run on GitHub CI.
test.setTimeout(90_000);

const widths = [320, 390, 767, 768, 1024, 1025, 1440];
for (const width of widths) {
  test(`original Home rendering at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Designing AI Product Experiences Across Markets",
    );
    await expect(
      page.getByRole("heading", { name: "Academic Standing" }),
    ).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page.locator("#home spline-viewer, #home canvas")).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}-top.png`),
      animations: "disabled",
    });
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}-full.png`),
      fullPage: true,
      animations: "disabled",
    });
    const imageFailures = await page
      .locator("img")
      .evaluateAll((images) =>
        images
          .filter(
            (image) =>
              image instanceof HTMLImageElement &&
              (!image.complete || image.naturalWidth === 0),
          )
          .map((image) => (image as HTMLImageElement).src),
      );
    expect(imageFailures).toEqual([]);
    expect(errors).toEqual([]);
    for (const link of await page
      .getByRole("link", { name: "View my work" })
      .all())
      await expect(link).toHaveAttribute("href", "/projects.html");
  });
}

test("mobile menu and honest materials state", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  const about = page
    .locator("#navMenu")
    .getByRole("button", { name: "ABOUT", exact: true });
  await expect(about).toHaveAttribute("aria-expanded", "false");
  await about.click();
  await expect(about).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: "Career", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#navMenu [data-materials-action]")).toHaveCount(0);
  await expect(page.locator(".original-mobile-materials")).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("mobile-menu-open.png") });
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await expect(page.locator("#popupToggle")).toBeHidden();
  // WHAT: Exercise the retained desktop materials entry, then its mobile panel.
  await page.setViewportSize({ width: 1440, height: 900 });
  const resume = page.locator("#navbar [data-materials-action='resume']");
  await expect(resume).toBeVisible();
  await expect(
    page.locator("#navbar [data-materials-action='portfolio']"),
  ).toBeVisible();
  await resume.click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("Coming Soon", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Email address (coming soon)" }),
  ).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("materials-pending.png") });
  await page.getByRole("button", { name: "Minimize Popup" }).click();
  await expect(page.locator("#popupToggle")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("Career controls keep the original second-panel content", async ({
  page,
}) => {
  await page.goto("/career.html");
  await page.locator("#btn-career-next").click();
  await expect(page.locator("#career-page-2")).toHaveCSS("opacity", "1");
  await expect(page.locator("#career-role-title")).toContainText(
    "As an IT Innovator,",
  );
  await page.locator("#btn-career-prev").click();
  await expect(page.locator("#career-page-1")).toHaveCSS("opacity", "1");
});
