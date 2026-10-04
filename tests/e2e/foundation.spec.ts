import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const widths = [320, 390, 767, 768, 1024, 1025, 1440];

for (const width of widths) {
  test(`Home reflows with working destinations at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Designing Actionable AI",
    );
    await expect(
      page.getByText("구조 미리보기", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("상세 콘텐츠 이관 예정")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const cards = page.getByRole("listitem");
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (width < 768) {
      expect(second!.y).toBeGreaterThan(first!.y);
      await expect(page.getByRole("navigation")).toBeHidden();
      await page.getByRole("button", { name: "메뉴 열기" }).click();
      await expect(page.getByRole("navigation")).toBeVisible();
    } else {
      expect(second!.y).toBe(first!.y);
      await expect(
        page.getByRole("button", { name: "메뉴 열기" }),
      ).toBeHidden();
    }
    for (const control of await page
      .locator("a:visible, button:visible")
      .all()) {
      if ((await control.getAttribute("class")) === "skipLink") continue;
      const bounds = await control.boundingBox();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("link", { name: "프로젝트", exact: true }).click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator("#projects")).toBeFocused();
    await page.reload();
    await expect(page.locator("#projects")).toBeInViewport();
    for (const link of await page.locator('a[href^="#"]').all()) {
      const href = await link.getAttribute("href");
      expect(await page.locator(href!).count()).toBe(1);
    }
    for (const link of await page
      .getByRole("link", { name: "기존 포트폴리오 보기" })
      .all()) {
      await expect(link).toHaveAttribute(
        "href",
        "https://nana-park.github.io/Portfolio/",
      );
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
    await page.goto("/");
    await page.screenshot({
      path: testInfo.outputPath(`home-${width}.png`),
      fullPage: true,
    });
  });
}

test("mobile menu supports repeated use, Escape, navigation history, and resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /메뉴/ });
  for (let index = 0; index < 3; index += 1) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  }
  await toggle.click();
  await page.getByRole("link", { name: "프로젝트", exact: true }).click();
  await toggle.click();
  await page.getByRole("link", { name: "연락 안내", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/#projects$/);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.goForward();
  await expect(page).toHaveURL(/#contact$/);
  await toggle.click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation")).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("keyboard skip link, enlarged text, and reduced motion remain usable", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문 바로가기" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("link", { name: "연락 안내", exact: true }).click();
  await expect(page.locator("#contact")).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath("home-390-text-200.png"),
    fullPage: true,
  });
});

test("breakpoint changes and Back never leave focus on a hidden menu control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 767, height: 900 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /메뉴/ });
  const overview = page.getByRole("link", { name: "소개", exact: true });
  await toggle.focus();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(overview).toBeFocused();
  await page.setViewportSize({ width: 767, height: 900 });
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("link", { name: "프로젝트", exact: true }).click();
  await toggle.click();
  await page.getByRole("link", { name: "연락 안내", exact: true }).focus();
  await page.goBack();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});
