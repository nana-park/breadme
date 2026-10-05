import type { Page } from "@playwright/test";

// WHAT: Stress fixed-pixel text as well as relative text using frozen computed sizes.
// WHY: Root font enlargement alone leaves the app's px body/title fonts unchanged.
// This is an artificial reflow probe, not native browser zoom or WCAG certification.
export async function enlargeComputedText(page: Page, scope: string) {
  return page.locator(scope).evaluate(async (root) => {
    const elements = [root, ...root.querySelectorAll("*")].filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    // Disable animation before sampling: transition-all can otherwise report an
    // intermediate font size even after two frames (observed on Contact in CI).
    elements.forEach((element) => {
      element.style.setProperty("transition", "none", "important");
      element.style.setProperty("animation", "none", "important");
    });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    // Freeze every baseline before mutating parents, avoiding compounded inheritance.
    const before = elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        element,
        fontPx: parseFloat(style.fontSize),
        lineHeightPx: parseFloat(style.lineHeight),
        text: Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent || "")
          .join(" ")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 160),
      };
    });
    before.forEach(({ element, fontPx, lineHeightPx }) => {
      element.style.setProperty("font-size", `${fontPx * 2}px`, "important");
      if (Number.isFinite(lineHeightPx))
        element.style.setProperty(
          "line-height",
          `${lineHeightPx * 2}px`,
          "important",
        );
    });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const textSamples = before.filter((sample) => sample.text);
    const samples = textSamples.slice(0, 60).map((sample) => ({
      text: sample.text,
      beforeFontPx: sample.fontPx,
      afterFontPx: parseFloat(getComputedStyle(sample.element).fontSize),
    }));
    return {
      method: "synthetic-computed-text-200-percent; NOT native browser zoom",
      limitation:
        "Only this DOM subtree's computed HTML font sizes and numeric line heights are doubled; pseudo-elements, browser settings, and OS text scaling are not emulated.",
      elementCount: before.length,
      textSampleCount: textSamples.length,
      samplesTruncated: textSamples.length > samples.length,
      samples,
    };
  });
}
