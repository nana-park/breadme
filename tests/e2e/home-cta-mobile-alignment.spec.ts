import { expect, test } from "@playwright/test";

for (const width of [300, 320, 360, 375, 390, 414, 430, 767, 768, 1440]) {
  test(`Home capabilities follow Academic type and mobile alignment at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page.locator("#cta-dark-container");
    const content = card.locator("[data-home-capabilities]");
    const title = card.getByRole("heading", { level: 2 });
    const intro = content.locator(":scope > p");
    const groups = card.getByRole("heading", { level: 3 });
    const action = card.getByRole("link", { name: "View products" });
    await expect(title).toHaveText(
      "From human understanding to AI product experiences.",
    );
    await expect(intro).toHaveText(
      "Grounded in psychology and Human-AI Interaction.",
    );
    await expect(intro).toHaveCSS("text-align", "left");
    // Crossing the breakpoint in both directions exposes stale mobile styles.
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await card.scrollIntoViewIfNeeded();
    const mobile = width < 768;
    await expect(title).toHaveCSS("font-size", mobile ? "24px" : "28px");
    await expect(title).toHaveCSS("text-align", mobile ? "left" : "center");
    await expect(intro).toHaveCSS("font-size", mobile ? "13px" : "14px");
    await expect(groups).toHaveText(["Product Focus", "Core Strengths"]);
    await expect(content.locator(":scope > div > div > p")).toHaveText([
      "AI Agents · Conversational & Voice AI · Personalized Recommendations",
      "AI UX Design · Research & Data Analysis · Launches in Korea & Japan",
    ]);
    for (const group of await groups.all()) {
      await expect(group).toHaveCSS("font-size", mobile ? "20px" : "22px");
      await expect(group).toHaveCSS("text-align", mobile ? "left" : "center");
    }
    for (const body of await content.locator(":scope > div > div > p").all()) {
      await expect(body).toHaveCSS("font-size", "13px");
      await expect(body).toHaveCSS("color", "rgb(244, 244, 245)");
      await expect(body).toHaveCSS("line-height", "20.8px");
    }
    // Compare the live source section, not an unused typography token.
    expect(
      await title.evaluate((node) => getComputedStyle(node).fontSize),
    ).toBe(
      await page
        .locator("#history-2 h2")
        .evaluate((node) => getComputedStyle(node).fontSize),
    );
    expect(
      await groups.first().evaluate((node) => getComputedStyle(node).fontSize),
    ).toBe(
      await page
        .locator("#history-2 h3")
        .first()
        .evaluate((node) => getComputedStyle(node).fontSize),
    );
    await expect(content.locator("br")).toHaveCount(0);
    await expect(card).toHaveCSS("padding-left", "24px");
    await expect(card).toHaveCSS("padding-right", "24px");
    await expect(card).toHaveCSS("align-items", "center");
    await expect(action).toHaveAttribute("href", "/projects.html");
    const layout = await card.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const actionBox = element.querySelector("a")!.getBoundingClientRect();
      return {
        cardLeft: box.left,
        cardCenter: (box.left + box.right) / 2,
        contentLeft:
          box.left +
          parseFloat(style.borderLeftWidth) +
          parseFloat(style.paddingLeft),
        contentRight:
          box.right -
          parseFloat(style.borderRightWidth) -
          parseFloat(style.paddingRight),
        actionCenter: (actionBox.left + actionBox.right) / 2,
        actionHeight: actionBox.height,
        text: Array.from(element.querySelectorAll("h2, h3, p"), (node) => {
          const rect = node.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(node);
          return {
            text: node.textContent,
            left: rect.left,
            right: rect.right,
            lines: Array.from(range.getClientRects(), (line) => ({
              left: line.left,
              right: line.right,
            })),
          };
        }),
      };
    });
    expect(layout.cardLeft).toBeCloseTo(width * 0.05, 1);
    expect(layout.actionCenter).toBeCloseTo(layout.cardCenter, 1);
    expect(layout.actionHeight).toBeGreaterThanOrEqual(44);
    expect(layout.text).toHaveLength(6);
    for (const item of layout.text) {
      expect(item.lines.length).toBeGreaterThan(0);
      expect(item.left).toBeGreaterThanOrEqual(layout.contentLeft - 1);
      expect(item.right).toBeLessThanOrEqual(layout.contentRight + 1);
      for (const line of item.lines) {
        expect(line.left).toBeGreaterThanOrEqual(layout.contentLeft - 1);
        expect(line.right).toBeLessThanOrEqual(layout.contentRight + 1);
        if (mobile) expect(line.left).toBeCloseTo(layout.contentLeft, 1);
        else
          expect((line.left + line.right) / 2).toBeCloseTo(
            layout.cardCenter,
            1,
          );
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const path = testInfo.outputPath(`home-capabilities-${width}.png`);
    await card.screenshot({ path, animations: "disabled" });
    await testInfo.attach("Home product focus and strengths", {
      path,
      contentType: "image/png",
    });
    await testInfo.attach("Home CTA measured layout", {
      body: Buffer.from(JSON.stringify({ width, ...layout }, null, 2)),
      contentType: "application/json",
    });
    if (width === 390) {
      await action.focus();
      await expect(action).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/projects\.html$/);
      await expect(page.getByRole("main")).toBeVisible();
      await page.goBack();
      await expect(title).toBeVisible();
      await action.click();
      await expect(page).toHaveURL(/\/projects\.html$/);
      await page.goBack();
      await expect(title).toBeVisible();
    }
  });
}

test("Home CTA reflows with doubled text at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const content = page.locator("[data-home-capabilities]");
  await expect(content).toBeVisible();
  // Text-resize coverage, not a claim of real browser zoom or device testing.
  await content.evaluate((element) => {
    for (const node of element.querySelectorAll<HTMLElement>("h2, h3, p, a")) {
      node.style.fontSize = `${parseFloat(getComputedStyle(node).fontSize) * 2}px`;
    }
  });
  expect(
    await content.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll("h2, h3, p, a"), (node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return Array.from(range.getClientRects()).every(
          (line) => line.left >= box.left - 1 && line.right <= box.right + 1,
        );
      }).every(Boolean);
    }),
  ).toBe(true);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
