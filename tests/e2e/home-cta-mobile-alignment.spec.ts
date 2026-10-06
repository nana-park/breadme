import { expect, test } from "@playwright/test";

for (const width of [320, 390, 430, 767, 768, 1440]) {
  test(`Home qualifications copy aligns left and action stays centered at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const card = page.locator("#cta-dark-container");
    const title = card.getByRole("heading", {
      name: /Creating AI dialogue experiences\s*driven by deep human intent\./,
    });
    const copy = card.getByText(
      "Discover the academic background, certifications, and working principles that shape my approach.",
    );
    const action = card.getByRole("link", { name: "Explore Qualifications" });
    await expect(title).toBeVisible();
    // Check the paragraph itself: a left-aligned parent is not sufficient.
    await expect(copy).toHaveCSS("text-align", "left");
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
    await expect(card).toHaveCSS("text-align", mobile ? "left" : "center");
    await expect(card).toHaveCSS("align-items", "center");
    await expect(copy).toHaveCSS("text-align", mobile ? "left" : "center");
    await expect(copy).toHaveCSS("font-size", mobile ? "14px" : "15px");
    await expect(action).toHaveAttribute("href", "/qualified.html");

    const layout = await card.evaluate((element) => {
      const title = element.querySelector("h2")!;
      const copy = element.querySelector("p")!;
      const action = element.querySelector("a")!;
      const cardBox = element.getBoundingClientRect();
      const cardStyle = getComputedStyle(element);
      const measure = (node: Element) => {
        const box = node.getBoundingClientRect();
        const lines: { left: number; right: number }[] = [];
        for (const child of node.childNodes) {
          if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim())
            continue;
          const range = document.createRange();
          range.setStart(child, child.textContent.search(/\S/));
          range.setEnd(child, child.textContent.search(/\s*$/));
          for (const rect of range.getClientRects()) {
            if (rect.width && rect.height)
              lines.push({ left: rect.left, right: rect.right });
          }
        }
        return { left: box.left, right: box.right, lines };
      };
      return {
        title: measure(title),
        copy: measure(copy),
        action: measure(action),
        cardLeft: cardBox.left,
        cardCenter: (cardBox.left + cardBox.right) / 2,
        contentLeft:
          cardBox.left +
          parseFloat(cardStyle.borderLeftWidth) +
          parseFloat(cardStyle.paddingLeft),
        contentRight:
          cardBox.right -
          parseFloat(cardStyle.borderRightWidth) -
          parseFloat(cardStyle.paddingRight),
      };
    });
    expect(layout.cardLeft).toBeCloseTo(width * 0.05, 1);
    expect(layout.title.lines.length).toBeGreaterThanOrEqual(2);
    expect(layout.copy.lines.length).toBeGreaterThan(0);
    expect((layout.action.left + layout.action.right) / 2).toBeCloseTo(
      layout.cardCenter,
      1,
    );
    if (mobile) {
      // Both text boxes and every actual line share the card's inner edge,
      // while the separate action remains centered at every breakpoint.
      for (const item of [layout.title, layout.copy]) {
        expect(item.left).toBeCloseTo(layout.contentLeft, 1);
        expect(item.right).toBeLessThanOrEqual(layout.contentRight + 1);
      }
      for (const item of [layout.title, layout.copy]) {
        expect(item.right).toBeCloseTo(layout.contentRight, 1);
        for (const line of item.lines) {
          expect(line.left).toBeCloseTo(layout.contentLeft, 1);
          expect(line.right).toBeLessThanOrEqual(layout.contentRight + 1);
        }
      }
    } else {
      for (const item of [layout.title, layout.copy, layout.action]) {
        expect((item.left + item.right) / 2).toBeCloseTo(layout.cardCenter, 1);
      }
      for (const item of [layout.title, layout.copy]) {
        for (const line of item.lines) {
          expect((line.left + line.right) / 2).toBeCloseTo(layout.cardCenter, 1);
        }
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const screenshotPath = testInfo.outputPath(`home-qualifications-${width}.png`);
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
