import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

// WHAT: Hold the lazy body chunk while inspecting the already-rendered header.
// WHY: Waiting for a page heading would miss the unstyled mobile PDF flash.
async function holdPageChunk(page: Page, chunk: string) {
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const requestSeen = new Promise<void>((resolve) => {
    requested = resolve;
  });
  const pattern = `**/${chunk}-*.js`;
  const inFlight = new Set<Promise<void>>();
  const handler = async (route: Route) => {
    let settled!: () => void;
    const completion = new Promise<void>((resolve) => {
      settled = resolve;
    });
    inFlight.add(completion);
    requested();
    try {
      await gate;
      await route.continue();
    } finally {
      settled();
      inFlight.delete(completion);
    }
  };
  await page.route(pattern, handler);
  let resuming: Promise<void> | undefined;
  return {
    requestSeen,
    async resume() {
      // Wait for held requests before unregistering: unroute during continue
      // races with Playwright's fallback and produces "Route is already handled".
      resuming ??= (async () => {
        release();
        await Promise.all(inFlight);
        await page.unroute(pattern, handler);
      })();
      await resuming;
    },
  };
}

async function verifyHeader(page: Page, width: number) {
  const desktop = page
    .locator("#navbar [data-materials-action='resume']")
    .locator("..");
  const menu = page.locator("#mobileToggle");
  await expect(page.locator("style[data-original-style]")).toHaveCount(3);
  expect(
    await page
      .locator("style[data-original-style]")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-original-style")),
      ),
  ).toEqual(["page", "utilities", "accessibility"]);
  if (width < 1024) {
    await expect(desktop).toBeHidden();
    await expect(menu).toBeVisible();
    const box = (await menu.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(70);
    expect(box.x).toBeGreaterThan(width / 2);
  } else {
    await expect(menu).toBeHidden();
    await expect(desktop).toHaveCSS("display", "flex");
    await expect(desktop.locator("button").first()).toHaveCSS(
      "text-transform",
      "uppercase",
    );
    await expect(desktop.locator("button").last()).toHaveCSS(
      "background-color",
      "rgb(34, 34, 34)",
    );
  }
}

for (const width of [320, 390, 768, 1023, 1024, 1440]) {
  test(`header is styled before the About chunk resolves at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const pending = await holdPageChunk(page, "OriginalAboutContent");
    try {
      await page.goto("/about.html", { waitUntil: "domcontentloaded" });
      await pending.requestSeen;
      await expect(page.getByLabel("Loading portfolio")).toBeVisible();
      await verifyHeader(page, width);
      await page.evaluate(() => document.fonts.ready);
      const before = await page.locator(".navbar").screenshot({
        path: testInfo.outputPath(`header-${width}-loading.png`),
      });
      await testInfo.attach(`header-${width}-loading`, {
        body: before,
        contentType: "image/png",
      });
      await pending.resume();
      await expect(page.getByLabel("Loading portfolio")).toHaveCount(0);
      await verifyHeader(page, width);
      const after = await page.locator(".navbar").screenshot();
      // Exact header pixels must remain stable when only the body chunk arrives.
      expect(after.equals(before)).toBe(true);
    } finally {
      await pending.resume();
    }
  });
}

test("repeated mobile page navigation never exposes desktop materials while loading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-original-page="home"]')).toBeVisible();
  for (const target of [
    { name: "breadme", path: "about.html", chunk: "OriginalAboutContent" },
    { name: "Career", path: "career.html", chunk: "OriginalCareerContent" },
    { name: "breadme", path: "about.html", chunk: "OriginalAboutContent" },
  ]) {
    const pending = await holdPageChunk(page, target.chunk);
    try {
      await page.locator("#mobileToggle").click();
      await page
        .locator("#navMenu")
        .getByRole("link", { name: target.name, exact: true })
        .click({ noWaitAfter: true });
      await pending.requestSeen;
      await expect(page.getByLabel("Loading portfolio")).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${target.path}$`));
      await verifyHeader(page, 390);
      await pending.resume();
      await expect(page.getByLabel("Loading portfolio")).toHaveCount(0);
      await verifyHeader(page, 390);
    } finally {
      await pending.resume();
    }
  }
});
