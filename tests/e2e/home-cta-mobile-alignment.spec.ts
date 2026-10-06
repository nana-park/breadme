import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1440]) {
  test(`Home qualifications heading preserves its card at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page.locator("#cta-dark-container");
    const title = card.getByRole("heading", {
      name: /Creating AI dialogue experiences\s*driven by deep human intent\./,
    });
    await expect(title).toBeVisible();
    // Crossing 767px also checks that the mobile rule does not survive resize.
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await card.scrollIntoViewIfNeeded();

    const mobile = width < 768;
    await expect(title).toHaveCSS(
      "font-size",
      mobile ? "24px" : width === 768 ? "36px" : "42px",
    );
    await expect(title).toHaveCSS("text-align", mobile ? "left" : "center");
    await expect(title.locator("br")).toHaveCount(1);
    await expect(card).toHaveCSS("padding-left", "24px");
    await expect(card).toHaveCSS("padding-right", "24px");
    await expect(card).toHaveCSS("text-align", "center");
    await expect(card).toHaveCSS("align-items", "center");
    await expect(card.locator("p")).toHaveCSS("text-align", "center");
    await expect(
      card.getByRole("link", { name: "Explore Qualifications" }),
    ).toHaveAttribute("href", "/qualified.html");

    const layout = await title.evaluate((element) => {
      const titleBox = element.getBoundingClientRect();
      const parent = element.parentElement!;
      const cardBox = parent.getBoundingClientRect();
      const cardStyle = getComputedStyle(parent);
      const lines: { left: number; right: number }[] = [];
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim())
          continue;
        const range = document.createRange();
        range.setStart(node, node.textContent.search(/\S/));
        range.setEnd(node, node.textContent.search(/\s*$/));
        for (const rect of range.getClientRects()) {
          if (rect.width && rect.height)
            lines.push({ left: rect.left, right: rect.right });
        }
      }
      return {
        titleLeft: titleBox.left,
        titleRight: titleBox.right,
        cardLeft: cardBox.left,
        contentLeft:
          cardBox.left +
          parseFloat(cardStyle.borderLeftWidth) +
          parseFloat(cardStyle.paddingLeft),
        contentRight:
          cardBox.right -
          parseFloat(cardStyle.borderRightWidth) -
          parseFloat(cardStyle.paddingRight),
        lines,
      };
    });
    expect(layout.cardLeft).toBeCloseTo(width * 0.05, 1);
    expect(layout.lines.length).toBeGreaterThanOrEqual(2);
    if (mobile) {
      expect(layout.titleLeft).toBeCloseTo(layout.contentLeft, 1);
      expect(layout.titleRight).toBeCloseTo(layout.contentRight, 1);
      for (const line of layout.lines) {
        expect(line.left).toBeCloseTo(layout.contentLeft, 1);
        expect(line.right).toBeLessThanOrEqual(layout.contentRight + 1);
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const screenshotPath = testInfo.outputPath(
      `home-qualifications-${width}.png`,
    );
    await card.screenshot({ path: screenshotPath, animations: "disabled" });
    await testInfo.attach("Home qualifications CTA", {
      path: screenshotPath,
      contentType: "image/png",
    });
    await testInfo.attach("Home qualifications CTA layout", {
      body: Buffer.from(JSON.stringify({ width, ...layout }, null, 2)),
      contentType: "application/json",
    });
  });
}
