import { expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import { expectedResearchSections } from "../fixtures/research-sections-expected";

export async function academicHeadingStyle(page: Page) {
  return page.locator("#history-2 h2").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color: style.color,
      marginBottom: style.marginBottom,
    };
  });
}

export async function assertResearchSections(
  page: Page,
  reference: Awaited<ReturnType<typeof academicHeadingStyle>>,
  testInfo: TestInfo,
) {
  const width = page.viewportSize()!.width;
  await expect(
    page.locator("#research > [data-landing-photo-hero=research]"),
  ).toHaveCount(1);
  await expect(
    page.locator("#research > .container > [data-research-sections]"),
  ).toHaveCount(1);
  await expect(page.locator("[data-research-section]")).toHaveCount(3);
  await expect(page.locator("[data-research-section] h2")).toHaveText(
    expectedResearchSections.map((section) => section.title),
  );
  await expect(
    page.locator("[data-research-section][data-mobile-snap-section]"),
  ).toHaveCount(3);
  await expect(
    page.locator(
      "[data-landing-photo-hero=research][data-mobile-snap-section]",
    ),
  ).toHaveCount(1);
  await expect(
    page.locator(
      "[data-research-paper][data-mobile-snap-section], #research > .container[data-mobile-snap-section], #research[data-mobile-snap-section]",
    ),
  ).toHaveCount(0);

  const layout = [];
  for (const section of expectedResearchSections) {
    const chapter = page.locator(`#${section.id}`);
    const header = chapter.locator("[data-research-section-header]");
    const heading = header.getByRole("heading", {
      level: 2,
      name: section.title,
    });
    await expect(chapter).toHaveAttribute(
      "data-research-section",
      section.kind,
    );
    await expect(chapter).toHaveAccessibleName(section.title);
    await expect(chapter.locator("[data-research-paper]")).toHaveCount(
      section.count,
    );
    await expect(chapter).toHaveCSS("padding-top", "64px");
    await expect(header).toHaveCSS("margin-bottom", "48px");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(header).toHaveCSS("border-top-width", "0px");
    await expect(header).toHaveCSS("border-bottom-width", "0px");
    await expect(header).toHaveCSS("box-shadow", "none");
    await expect(heading).toHaveCSS("font-size", width < 768 ? "24px" : "28px");
    await expect(heading).toHaveCSS("font-weight", "500");
    await expect(heading).toHaveCSS(
      "line-height",
      width < 768 ? "36px" : "42px",
    );
    await expect(heading).toHaveCSS(
      "letter-spacing",
      width < 768 ? "-0.6px" : "-0.7px",
    );
    await expect(heading).toHaveCSS("margin-bottom", "12px");
    await expect(heading).toHaveCSS("text-align", "left");
    const actual = await heading.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        color: style.color,
        marginBottom: style.marginBottom,
      };
    });
    expect(
      actual,
      `${section.title} matches the actual Qualifications heading`,
    ).toEqual(reference);
    const geometry = await chapter.evaluate((element) => {
      const title = element.querySelector("h2")!;
      const list = element.querySelector("[data-research-list]")!;
      return {
        id: element.id,
        chapter: element.getBoundingClientRect().toJSON(),
        title: title.getBoundingClientRect().toJSON(),
        list: list.getBoundingClientRect().toJSON(),
      };
    });
    expect(geometry.title.left).toBeCloseTo(geometry.list.left, 1);
    expect(geometry.title.top - geometry.chapter.top).toBeCloseTo(64, 1);
    layout.push({ ...geometry, headingStyle: actual });
  }

  for (const row of await page.locator("[data-research-paper]").all()) {
    await expect(row).toHaveCSS("padding-top", "32px");
    await expect(row).toHaveCSS("padding-bottom", "32px");
    await expect(row).toHaveCSS(
      "padding-left",
      width >= 1024 ? "32px" : "16px",
    );
    await expect(row).toHaveCSS("row-gap", width >= 1024 ? "32px" : "16px");
    await expect(row).toHaveCSS("border-bottom-width", "1px");
    await expect(row).toHaveCSS(
      "flex-direction",
      width >= 1024 ? "row" : "column",
    );
    const position = await row.evaluate((element) => {
      const dateColumn = element.firstElementChild!;
      const titleColumn = dateColumn.nextElementSibling!;
      return {
        date: dateColumn.getBoundingClientRect().toJSON(),
        title: titleColumn.getBoundingClientRect().toJSON(),
        indexed: Boolean(element.querySelector("[data-research-index]")),
      };
    });
    if (!position.indexed || width >= 768) {
      if (width >= 1024)
        expect(position.date.right).toBeLessThan(position.title.left);
      else expect(position.date.bottom).toBeLessThan(position.title.top);
    }
  }
  await testInfo.attach(`research-section-heading-layout-${width}`, {
    body: JSON.stringify(
      { url: page.url(), width, reference, layout },
      null,
      2,
    ),
    contentType: "application/json",
  });
}

export async function researchHashClearsHeader(page: Page, id: string) {
  await expect(page.locator(`#${id}`)).toBeInViewport();
  await expect
    .poll(() =>
      page.locator(`#${id} h2`).evaluate((heading) => {
        const top = heading.getBoundingClientRect().top;
        const bottom = document
          .querySelector("#navbar")!
          .getBoundingClientRect().bottom;
        return top >= bottom - 1 && top < innerHeight / 2;
      }),
    )
    .toBe(true);
}

// WHAT: Show the real chapter content and the whole page at identical viewports.
// WHY: A screenshot of only the first card conceals omitted or duplicated groups.
export async function captureResearchSections(
  page: Page,
  testInfo: TestInfo,
  label: string,
  candidate: boolean,
) {
  const targets = candidate
    ? expectedResearchSections.map(
        (section) => [section.id, page.locator(`#${section.id}`)] as const,
      )
    : [["mixed-publications", page.locator("#research > .container")] as const];
  for (const [name, target] of targets) {
    await target.scrollIntoViewIfNeeded();
    const path = testInfo.outputPath(`${label}-${name}.png`);
    await target.screenshot({
      path,
      animations: "disabled",
      // Fixed chrome is excluded only from crops; full-page context retains it.
      style:
        "#navbar, .original-skip-link, #email-popup { visibility: hidden !important; }",
    });
    await testInfo.attach(`${label}-${name}`, {
      path,
      contentType: "image/png",
    });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const path = testInfo.outputPath(`${label}-full-page.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(`${label}-full-page`, {
    path,
    contentType: "image/png",
  });
  await testInfo.attach(`${label}-structure`, {
    body: JSON.stringify(
      await page.locator("#research").evaluate((research) => ({
        url: location.href,
        width: innerWidth,
        headings: Array.from(
          research.querySelectorAll("h1, h2, h3"),
          (node) => ({
            level: node.tagName,
            text: node.textContent?.trim().replace(/\s+/g, " "),
          }),
        ),
        sections: Array.from(
          research.querySelectorAll("[data-research-section]"),
          (node) => ({
            id: node.id,
            kind: node.getAttribute("data-research-section"),
            count: node.querySelectorAll("[data-research-paper]").length,
          }),
        ),
      })),
      null,
      2,
    ),
    contentType: "application/json",
  });
}
