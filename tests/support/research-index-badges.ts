import { expect } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import baseline from "../fixtures/research-index-badges-before.json" with { type: "json" };

export const researchBaselineCommit = baseline.commit;

export async function researchReady(page: Page) {
  await expect(page.locator('[data-original-page="research"]')).toBeVisible();
  await expect(page.locator("#research h3")).toHaveCount(4);
  await page.evaluate(async () => {
    for (const image of document.querySelectorAll<HTMLImageElement>(
      "#research img",
    ))
      image.loading = "eager";
    await document.fonts.ready;
  });
  await expect
    .poll(() =>
      page
        .locator("#research img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
}

// WHAT: Shared acceptance checks for the production artifact, live deployment,
// and breakpoint boundaries. WHY: All runners must enforce the same design.
export async function assertResearchIndexBadges(
  page: Page,
  testInfo: TestInfo,
) {
  const width = page.viewportSize()!.width;
  const isMobile = width < 768;
  const papers = page.locator("[data-research-paper]");
  await expect(papers).toHaveCount(4);
  await expect(page.locator("[data-research-index]")).toHaveText([
    "SSCI",
    "SSCI",
    "KCI",
  ]);
  await expect(page.locator("[data-research-meta]")).toHaveCount(3);
  await expect(page.locator("[data-research-date-column]")).toHaveCount(3);
  await expect(page.locator("[data-research-mobile-date]")).toHaveCount(3);
  await expect(
    page.locator(
      "#research button, #research [tabindex], #research [role=button]",
    ),
  ).toHaveCount(0);

  const layout = [];
  for (const [index, paper] of baseline.papers.entries()) {
    const row = papers.nth(index);
    await expect(row).toHaveAttribute("data-research-paper", String(index + 1));
    await expect(row.locator("h3")).toHaveText(paper.title);
    await expect(row.locator("h3 + p")).toHaveText(paper.journalAndConference);
    await expect(row.locator("h3 + p + div > span")).toHaveText(paper.topics);
    await expect(row.locator(":scope > div:last-child > p")).toHaveText(
      paper.description,
    );
    await expect(row.locator("a")).toHaveCount(paper.links.length);
    for (const [linkIndex, link] of paper.links.entries()) {
      const anchor = row.locator("a").nth(linkIndex);
      const href = link.href.startsWith("/")
        ? new URL(link.href.slice(1), new URL("./", page.url())).pathname
        : link.href;
      await expect(anchor).toHaveText(link.text);
      await expect(anchor).toHaveAttribute("href", href);
      await expect(anchor).toHaveAttribute("target", link.target!);
    }
    const content = await row.evaluate((element) => {
      const clone = element.cloneNode(true) as Element;
      clone.querySelector("[data-research-meta]")?.remove();
      return clone.textContent?.replace(/\s+/g, " ").trim();
    });
    expect(content, `All original copy for paper ${index + 1}`).toBe(
      paper.textWithoutIndex,
    );
    const visibleDates = (await row.locator("span:visible").allTextContents())
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter((text) => text === paper.date);
    expect(
      visibleDates,
      `Exactly one visible date for paper ${index + 1}`,
    ).toEqual([paper.date]);
    await expect(row).toHaveCSS(
      "flex-direction",
      width >= 1024 ? "row" : "column",
    );

    if (!paper.index) {
      await expect(
        row.locator(
          "[data-research-index], [data-research-meta], [data-research-mobile-date], [data-research-date-column]",
        ),
      ).toHaveCount(0);
      await expect(row).not.toContainText(/SSCI|KCI/);
      continue;
    }
    const badge = row.locator("[data-research-index]");
    const meta = row.locator("[data-research-meta]");
    const originalDate = row.locator("[data-research-date-column]");
    const mobileDate = row.locator("[data-research-mobile-date]");
    await expect(badge).toHaveAttribute("data-research-index", paper.index);
    await expect(badge).toHaveAttribute(
      "title",
      `Journal index: ${paper.index}`,
    );
    await expect(badge).toHaveCSS("height", "24px");
    await expect(badge).toHaveCSS("padding-left", "8px");
    await expect(badge).toHaveCSS("padding-right", "8px");
    await expect(badge).toHaveCSS("font-size", "12px");
    await expect(badge).toHaveCSS("font-weight", "600");
    await expect(badge).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(badge).toHaveCSS("background-color", "rgb(26, 26, 26)");
    await expect(badge).toHaveCSS("border-radius", "4px");
    await expect(meta).toHaveCSS("display", "flex");
    await expect(meta).toHaveCSS("align-items", "center");
    await expect(meta).toHaveCSS("column-gap", "8px");
    await expect(mobileDate).toHaveText(paper.date);
    await expect(originalDate).toHaveText(paper.date);
    if (isMobile) {
      await expect(originalDate).toBeHidden();
      await expect(mobileDate).toBeVisible();
    } else {
      await expect(originalDate).toBeVisible();
      await expect(mobileDate).toBeHidden();
    }
    const geometry = await row.evaluate((element) => {
      const badge = element.querySelector<HTMLElement>(
        "[data-research-index]",
      )!;
      const meta = element.querySelector<HTMLElement>("[data-research-meta]")!;
      const originalDate = element.querySelector<HTMLElement>(
        "[data-research-date-column]",
      )!;
      const mobileDate = element.querySelector<HTMLElement>(
        "[data-research-mobile-date]",
      )!;
      const heading = element.querySelector<HTMLElement>("h3")!;
      const box = (node: Element) => node.getBoundingClientRect().toJSON();
      return {
        badge: box(badge),
        meta: box(meta),
        originalDate: box(originalDate),
        mobileDate: box(mobileDate),
        title: box(heading),
        row: box(element),
        badgeTag: badge.tagName,
        noninteractive: !badge.matches(
          "button, a, [tabindex], [role], [onclick]",
        ),
        badgeFont: getComputedStyle(badge).fontFamily,
        titleFont: getComputedStyle(heading).fontFamily,
        paddingLeft: parseFloat(getComputedStyle(element).paddingLeft),
        paddingTop: parseFloat(getComputedStyle(element).paddingTop),
        dateMarginTop: parseFloat(getComputedStyle(originalDate).marginTop),
        badgeBeforeDate: badge.nextElementSibling === mobileDate,
        metaBeforeTitle: meta.nextElementSibling === heading,
      };
    });
    expect(geometry.badgeTag).toBe("SPAN");
    expect(geometry.noninteractive).toBe(true);
    const normalizeFont = (value: string) =>
      value
        .split(",")
        .map((family) => family.trim().replace(/["']/g, "").toLowerCase())
        .join(",");
    expect(normalizeFont(geometry.badgeFont)).toBe(
      normalizeFont(geometry.titleFont),
    );
    expect(geometry.badgeBeforeDate).toBe(true);
    expect(geometry.metaBeforeTitle).toBe(true);
    expect(geometry.badge.height).toBe(24);
    expect(geometry.title.top - geometry.meta.bottom).toBeCloseTo(8, 1);
    expect(geometry.badge.left).toBeCloseTo(geometry.title.left, 1);
    if (isMobile) {
      expect(geometry.mobileDate.left - geometry.badge.right).toBeCloseTo(8, 1);
      expect(
        geometry.mobileDate.top + geometry.mobileDate.height / 2,
      ).toBeCloseTo(geometry.badge.top + geometry.badge.height / 2, 1);
      expect(geometry.badge.top).toBeCloseTo(
        geometry.row.top + geometry.paddingTop,
        1,
      );
    } else {
      expect(geometry.originalDate.left).toBeCloseTo(
        geometry.row.left + geometry.paddingLeft,
        1,
      );
      expect(geometry.originalDate.top).toBeCloseTo(
        geometry.row.top + geometry.paddingTop + geometry.dateMarginTop,
        1,
      );
      if (width >= 1024) {
        expect(geometry.originalDate.right).toBeLessThan(geometry.badge.left);
        expect(geometry.originalDate.top).toBeLessThan(geometry.title.top);
      } else {
        // The existing 768–1023px date remains stacked above the title column.
        expect(geometry.originalDate.bottom).toBeLessThan(geometry.meta.top);
        expect(geometry.originalDate.left).toBeCloseTo(geometry.badge.left, 1);
      }
    }
    layout.push({ paper: index + 1, ...geometry });
  }

  const overflow = await page.locator("#research").evaluate((section) => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    textOutsideViewport: Array.from(section.querySelectorAll("h3, p, a, span"))
      .filter((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return Array.from(range.getClientRects()).some(
          (rect) =>
            rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1),
        );
      })
      .map((element) => element.textContent?.trim()),
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width);
  expect(overflow.textOutsideViewport).toEqual([]);
  await testInfo.attach(`research-badge-layout-${width}`, {
    body: JSON.stringify(
      {
        baselineCommit: baseline.commit,
        url: page.url(),
        width,
        layout,
        overflow,
      },
      null,
      2,
    ),
    contentType: "application/json",
  });
}

export async function captureResearchPapers(
  page: Page,
  testInfo: TestInfo,
  label: string,
) {
  const list = page
    .locator("#research h3")
    .first()
    .locator("../..")
    .locator("..");
  await expect(list.locator("h3")).toHaveCount(4);
  const firstCard = list.locator(":scope > div").first();
  await firstCard.scrollIntoViewIfNeeded();
  const viewportPath = testInfo.outputPath(`${label}-viewport.png`);
  await page.screenshot({ path: viewportPath, animations: "disabled" });
  await testInfo.attach(`${label}-viewport`, {
    path: viewportPath,
    contentType: "image/png",
  });
  for (const [name, target] of [
    ["papers", list],
    ["first-card", firstCard],
  ] as const) {
    const path = testInfo.outputPath(`${label}-${name}.png`);
    await target.screenshot({
      path,
      animations: "disabled",
      // Content crops exclude only fixed chrome; the viewport above preserves it.
      style:
        "#navbar, .original-skip-link, #email-popup { visibility: hidden !important; }",
    });
    await testInfo.attach(`${label}-${name}`, {
      path,
      contentType: "image/png",
    });
  }
}
