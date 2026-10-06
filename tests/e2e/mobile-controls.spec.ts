import { expect, test } from "@playwright/test";

test("mobile controls leave the original Hero copy clear and center the hamburger", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Designing AI Product Experiences Across Markets",
  );
  await page.evaluate(() => document.fonts.ready);
  const toggle = page.locator("#popupToggle");
  await expect(toggle).toBeHidden();
  await page.locator("#mobileToggle").click();
  await expect(page.locator("#navMenu [data-materials-action]")).toHaveCount(0);
  await expect(page.locator("#navMenu a")).toHaveCount(12);
  await page.keyboard.press("Escape");
  await expect(page.locator("#mobileToggle")).toBeFocused();
  await expect(toggle).toBeHidden();
  const hamburger = await page.locator("#mobileToggle").boundingBox();
  const firstLine = await page
    .locator("#mobileToggle span")
    .first()
    .boundingBox();
  const lastLine = await page
    .locator("#mobileToggle span")
    .last()
    .boundingBox();
  expect(hamburger?.height).toBeGreaterThanOrEqual(44);
  expect(hamburger?.width).toBeGreaterThanOrEqual(44);
  expect(firstLine!.y).toBeGreaterThanOrEqual(27);
  expect(lastLine!.y + lastLine!.height).toBeLessThanOrEqual(43);
  await page.screenshot({
    path: testInfo.outputPath("mobile-controls-390-hero.png"),
    animations: "disabled",
  });
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector("#home")!.getBoundingClientRect().bottom +
        window.scrollY,
    ),
  );
  await expect(toggle).toBeHidden();
  await expect(page.locator("#email-popup")).toHaveCSS("position", "fixed");
  await expect(page.locator("#email-popup")).toHaveCSS("bottom", "32px");
  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect(page.locator("#email-popup")).toHaveCSS("position", "absolute");
  await expect(toggle).toBeHidden();
  // The duplicate shortcut remains available at the unchanged tablet boundary.
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(toggle).toBeVisible();
  await toggle.focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toBeHidden();
  await expect(page.locator("#mobileToggle")).toBeFocused();
});

test("mobile menu contains keyboard focus and restores inert and scroll after repeated dismissal", async ({
  page,
}, testInfo) => {
  // Three full keyboard loops plus real Spline rendering exceed the default 30s on software-GPU CI.
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => {
    document.body.style.overflow = "clip";
    document.querySelector("footer")!.setAttribute("inert", "preserved");
  });
  await expect(page.locator("footer")).toHaveAttribute("inert", "preserved");
  const toggle = page.locator("#mobileToggle");
  const logo = page.getByRole("link", { name: "breadme home" });
  for (let repeat = 0; repeat < 3; repeat += 1) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const selector of [
      "main",
      "footer",
      "#email-popup",
      ".original-skip-link",
    ]) {
      await expect(page.locator(selector)).toHaveAttribute("inert");
    }
    await expect(page.locator("footer")).toHaveAttribute("inert", "preserved");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await toggle.focus();
    await page.keyboard.press("Tab");
    await expect(logo).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(
      page
        .locator("#navMenu")
        .getByRole("link", { name: "CONTACT", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(toggle).toBeFocused();
    await page.evaluate(() =>
      document.querySelector<HTMLElement>("#home a")!.focus(),
    );
    await expect(toggle).toBeFocused();
    if (repeat === 0)
      await page.screenshot({
        path: testInfo.outputPath("mobile-controls-menu.png"),
      });
    if (repeat === 1) await toggle.click();
    else await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    await expect(page.locator("#email-popup")).not.toHaveAttribute("inert");
    await expect(page.locator("footer")).toHaveAttribute("inert", "preserved");
    await expect(page.locator("body")).toHaveCSS("overflow", "clip");
  }
});

test("1023 and 1024 resize transitions keep focus on a visible counterpart without stealing page focus", async ({
  page,
}) => {
  // Every breakpoint resize also relayouts the original interactive Spline scene.
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1023, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const toggle = page.locator("#mobileToggle");
  await expect(toggle).toBeVisible();
  await toggle.focus();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(
    page.locator("#navMenu .nav-link[aria-current='page']"),
  ).toBeFocused();
  await expect(toggle).toBeHidden();
  await page.setViewportSize({ width: 1023, height: 900 });
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.getByRole("link", { name: "Research", exact: true }).focus();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(
    page.getByRole("link", { name: "PROJECTS", exact: true }),
  ).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  const outside = page.getByRole("link", { name: "View my work" });
  await outside.focus();
  await page.setViewportSize({ width: 1023, height: 900 });
  await expect(outside).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(outside).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(outside).toBeFocused();
});

test("desktop Escape collapses the active submenu and restores its visible parent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const projects = page.getByRole("link", { name: "PROJECTS", exact: true });
  await projects.focus();
  const research = page.getByRole("link", { name: "Research", exact: true });
  await expect(research).toBeVisible();
  await research.focus();
  await page.keyboard.press("Escape");
  await expect(projects).toBeFocused();
  await expect(research).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(projects).toBeFocused();
});

test("materials remain nonmodal and disabled with reliable focus on open and close", async ({
  page,
}) => {
  // Keep all repeated pointer/focus checks while allowing software-rendered Spline to share the page.
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const writes: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  const toggle = page.locator("#popupToggle");
  await expect(toggle).toBeHidden();
  await page.evaluate(() =>
    window.scrollTo(
      0,
      document.querySelector("#home")!.getBoundingClientRect().bottom +
        window.scrollY,
    ),
  );
  await expect(toggle).toBeHidden();
  const menuToggle = page.locator("#mobileToggle");
  for (const [action, escape] of [
    ["resume", false],
    ["portfolio", true],
    ["resume", false],
  ] as const) {
    // The panel can remain open during a resize; mobile no longer has materials links.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(`#navbar [data-materials-action='${action}']`).click();
    await page.setViewportSize({ width: 390, height: 844 });
    const minimize = page.getByRole("button", { name: "Minimize Popup" });
    await expect(minimize).toBeFocused();
    await expect(toggle).toHaveAttribute("tabindex", "-1");
    await expect(toggle).toHaveAttribute("aria-hidden", "true");
    await expect(
      page.getByRole("textbox", { name: "Email address (coming soon)" }),
    ).toBeDisabled();
    await expect(page.locator(".popup-submit-btn")).toBeDisabled();
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    if (escape) await page.keyboard.press("Escape");
    else await minimize.click();
    await expect(menuToggle).toBeFocused();
    await expect(toggle).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#materials-content")).toBeHidden();
  }
  await menuToggle.click();
  await expect(page.locator("#navMenu [data-materials-action]")).toHaveCount(0);
  await expect(page.locator("#email-popup")).toHaveAttribute("inert");
  await page.keyboard.press("Escape");
  await expect(menuToggle).toBeFocused();
  await expect(page.locator("#email-popup")).not.toHaveAttribute("inert");
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(
    page.getByRole("button", { name: "Minimize Popup" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  expect(writes).toEqual([]);
});
