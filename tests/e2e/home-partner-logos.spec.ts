import { expect, test } from "@playwright/test";

for (const width of [300, 390, 768, 1440]) {
  test(`Home company logos and loop seam at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const partners = page.locator("#partners");
    const track = partners.locator(".logo-track");
    await expect(track.locator("img")).toHaveCount(18);
    await expect(partners.getByRole("img")).toHaveCount(6);
    await expect(partners.getByAltText("SK Telecom")).toHaveCount(1);
    await expect(partners.getByAltText("SK Inc.")).toHaveCount(1);
    await expect(partners.getByAltText("LINE WORKS")).toHaveCount(1);
    await expect(partners.getByAltText("Google")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        track
          .locator("img")
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
    await partners.scrollIntoViewIfNeeded();
    await expect(track).toHaveCSS("animation-duration", "40s");
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await expect(track).toHaveCSS(
      "column-gap",
      width < 640 ? "64px" : width < 768 ? "96px" : "144px",
    );
    await expect(partners.getByAltText("LINE WORKS")).toHaveCSS(
      "filter",
      "none",
    );
    await expect(partners.getByAltText("LINE WORKS")).toHaveCSS(
      "height",
      "26px",
    );
    await expect(partners.getByAltText("SK Inc.")).toHaveCSS("filter", "none");
    const metrics = await track.evaluate((node) => {
      const style = getComputedStyle(node);
      const starts = [0, 1, 2].map(
        (cycle) =>
          node
            .querySelector(`[data-cycle="${cycle}"][data-partner="naver"] img`)!
            .getBoundingClientRect().left,
      );
      return {
        width: node.getBoundingClientRect().width,
        gap: parseFloat(style.columnGap),
        endGap: parseFloat(style.paddingRight),
        spans: [starts[1] - starts[0], starts[2] - starts[1]],
      };
    });
    expect(metrics.endGap).toBe(metrics.gap);
    expect(metrics.spans[0]).toBeCloseTo(metrics.spans[1], 1);
    expect(metrics.spans[0]).toBeCloseTo(metrics.width / 3, 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const partner of ["sk-inc", "line-works"]) {
      // Inspect a real paused animation position so added marks are visible on phones.
      await track.evaluate((node, id) => {
        const animation = node.getAnimations()[0];
        animation.pause();
        animation.currentTime = 0;
        const frame = node.parentElement!.getBoundingClientRect();
        const target = node.querySelector(
          `[data-cycle="0"][data-partner="${id}"]`,
        )!;
        const mark = id === "sk-inc" ? target : target.querySelector("img")!;
        const distance = mark.getBoundingClientRect().left - frame.left - 24;
        animation.currentTime =
          (Math.max(0, distance) /
            (node.getBoundingClientRect().width * 0.33333)) *
          40000;
      }, partner);
      const path = testInfo.outputPath(`home-partners-${partner}-${width}.png`);
      // Do not disable the animation: this capture records the selected paused frame.
      await partners.screenshot({ path });
      await testInfo.attach(`Home companies ${partner} ${width}px`, {
        path,
        contentType: "image/png",
      });
    }
    await testInfo.attach("Carousel cycle metrics", {
      body: Buffer.from(JSON.stringify(metrics, null, 2)),
      contentType: "application/json",
    });
  });
}
