import { expect, type Page } from "@playwright/test";

/** Verify the real rendered scale on preview and the published Pages site. */
export async function assertLineWorksLogoScale(page: Page) {
  const track = page.locator("#partners .logo-track");
  // Restore the pre-change transform only during this synchronous measurement.
  // Scaling must affect ink bounds, never layout or the other marks.
  const scaleMetrics = await track.evaluate((node) => {
    const marks = Array.from(node.querySelectorAll<HTMLImageElement>("img"));
    const measure = () => ({
      trackWidth: node.getBoundingClientRect().width,
      marks: marks.map((mark) => {
        const rect = mark.getBoundingClientRect();
        const style = getComputedStyle(mark);
        return {
          partner: mark.parentElement!.dataset.partner,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          centerX: (rect.left + rect.right) / 2,
          centerY: (rect.top + rect.bottom) / 2,
          layoutWidth: parseFloat(style.width),
          layoutHeight: parseFloat(style.height),
          transform: style.transform,
        };
      }),
    });
    const after = measure();
    const lineWorks = marks.filter(
      (mark) => mark.parentElement!.dataset.partner === "line-works",
    );
    for (const mark of lineWorks) mark.style.transform = "none";
    const before = measure();
    for (const mark of lineWorks) mark.style.removeProperty("transform");
    return { before, after };
  });
  expect(scaleMetrics.after.trackWidth).toBe(scaleMetrics.before.trackWidth);
  expect(
    scaleMetrics.after.marks.filter((mark) => mark.partner === "line-works"),
  ).toHaveLength(3);
  scaleMetrics.after.marks.forEach((mark, index) => {
    const original = scaleMetrics.before.marks[index];
    if (mark.partner !== "line-works") {
      expect(mark).toEqual(original);
      return;
    }
    expect(original.height).toBe(26);
    expect(original.width).toBeCloseTo((26 * 495) / 64, 2);
    expect(mark.transform).toBe("matrix(0.75, 0, 0, 0.75, 0, 0)");
    expect(mark.width).toBeCloseTo(original.width * 0.75, 2);
    expect(mark.height).toBe(19.5);
    expect(mark.centerX).toBeCloseTo(original.centerX, 2);
    expect(mark.centerY).toBeCloseTo(original.centerY, 2);
    expect(mark.layoutWidth).toBe(original.layoutWidth);
    expect(mark.layoutHeight).toBe(original.layoutHeight);
  });
  return scaleMetrics;
}
