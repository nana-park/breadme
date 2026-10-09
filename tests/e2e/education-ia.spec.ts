import { expect, test } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";

const baselineUrl = process.env.EDUCATION_IA_BASELINE_URL;
const baselineCommit = "58a617a3bb60261f750a2cf9fb46979e81decd82";
const researchFocus =
  "Focused on human cognition, statistical modeling, and AI technical literacy, with research published in SSCI-indexed journals.";
test.setTimeout(90_000);

async function ready(page: Page) {
  await expect(page.locator("[data-original-page]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function noHorizontalOverflow(page: Page, selector: string) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(page.viewportSize()!.width);
  const overflowing = await page.locator(selector).evaluate((section) =>
    Array.from(section.querySelectorAll<HTMLElement>("h2, h3, p, a"))
      .filter((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return Array.from(range.getClientRects()).some(
          (box) =>
            box.width > 0 && (box.left < -1 || box.right > innerWidth + 1),
        );
      })
      .map((element) => element.textContent?.trim()),
  );
  expect(
    overflowing,
    "All education/principles text stays inside the viewport",
  ).toEqual([]);
}

async function hashClearsHeader(page: Page, id: string) {
  await expect(page.locator(id)).toBeInViewport();
  await expect
    .poll(() =>
      page.locator(id).evaluate((element) => {
        const top = element.querySelector("h2")!.getBoundingClientRect().top;
        const headerBottom = document
          .querySelector("#navbar")!
          .getBoundingClientRect().bottom;
        return top >= headerBottom - 1 && top < innerHeight / 2;
      }),
    )
    .toBe(true);
}

async function captureSection(
  page: Page,
  testInfo: TestInfo,
  label: string,
  selector: string,
) {
  const section = page.locator(selector);
  await expect(section).toBeVisible();
  for (const image of await section.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await section.scrollIntoViewIfNeeded();
  const geometry = await section.evaluate((element) => ({
    url: location.href,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    section: element.id,
    rect: element.getBoundingClientRect().toJSON(),
    headings: Array.from(element.querySelectorAll("h2, h3"), (heading) =>
      heading.textContent?.trim().replace(/\s+/g, " "),
    ),
    images: Array.from(element.querySelectorAll("img"), (image) => ({
      src: image.getAttribute("src"),
      loaded: image.complete && image.naturalWidth > 0,
    })),
  }));
  await testInfo.attach(`${label}-geometry`, {
    body: JSON.stringify(geometry, null, 2),
    contentType: "application/json",
  });
  const path = testInfo.outputPath(`${label}.png`);
  // Content-only crop: exclude fixed page chrome that otherwise appears halfway
  // through tall-element screenshots. Full-page context below retains it.
  await section.screenshot({
    path,
    animations: "disabled",
    style:
      "#navbar, .original-skip-link, #email-popup { visibility: hidden !important; }",
  });
  await testInfo.attach(label, { path, contentType: "image/png" });
}

for (const width of [390, 1440]) {
  test(`Education IA AS-IS and TO-BE screenshots ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      !baselineUrl,
      "AS-IS requires the CI-built immutable pre-change server via EDUCATION_IA_BASELINE_URL.",
    );
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await testInfo.attach("Comparison provenance", {
      body: JSON.stringify(
        {
          baselineCommit,
          baselineUrl,
          width,
          note: "Same browser and viewport. Baseline is evidence only; candidate has separate acceptance tests.",
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    for (const state of ["AS-IS", "TO-BE"] as const) {
      const route = (path: string) =>
        state === "AS-IS"
          ? new URL(path, `${baselineUrl!.replace(/\/$/, "")}/`).href
          : `/${path}`;
      await page.goto(route("index.html"));
      await ready(page);
      await expect(page.locator("#history-2 img")).toHaveCount(
        state === "AS-IS" ? 2 : 0,
      );
      await captureSection(
        page,
        testInfo,
        `${state}-home-education-${width}`,
        "#history-2",
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`${state}-home-full-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
      await page.goto(route("qualified.html"));
      await ready(page);
      if (state === "AS-IS") {
        await expect(page.locator("#history-2")).toHaveCount(0);
        await captureSection(
          page,
          testInfo,
          `${state}-qualified-principles-${width}`,
          "#how-work",
        );
      } else {
        await expect(page.locator("#how-work")).toHaveCount(0);
        await captureSection(
          page,
          testInfo,
          `${state}-qualified-education-${width}`,
          "#history-2",
        );
      }
      await captureSection(
        page,
        testInfo,
        `${state}-qualified-competencies-${width}`,
        "#toolkit-grid",
      );
      await captureSection(
        page,
        testInfo,
        `${state}-qualified-certifications-${width}`,
        "#certifications-runway",
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`${state}-qualified-full-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
      await page.goto(route("about.html"));
      await ready(page);
      if (state === "AS-IS")
        await expect(page.locator("#how-work")).toHaveCount(0);
      else
        await captureSection(
          page,
          testInfo,
          `${state}-about-principles-${width}`,
          "#how-work",
        );
      await captureSection(
        page,
        testInfo,
        `${state}-about-interview-${width}`,
        "#media",
      );
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`${state}-about-full-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
  });
}

for (const width of [320, 390, 767, 768, 1024, 1440]) {
  test(`Education IA content, overflow and deep links ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/index.html#history-2");
    await ready(page);
    const summary = page.locator("#history-2");
    await expect(summary).toHaveAttribute("data-education-summary", "");
    await expect(summary.getByRole("heading", { level: 2 })).toHaveText(
      "Academic Standing",
    );
    await expect(summary.locator("h3")).toHaveText([
      "M.S. in Human-AI Interaction",
      "B.A. in Psychology",
    ]);
    await expect(summary.locator("p")).toHaveText([
      "Sungkyunkwan University",
      "Sookmyung Women's University",
    ]);
    await expect(summary.locator("img, video, svg")).toHaveCount(0);
    await expect(summary).not.toContainText(
      /Research Focus|Additional Degree|SSCI|Double major|Minor in|March 20/,
    );
    await expect(summary.locator("a")).toHaveCount(1);
    const detailLink = summary.getByRole("link", {
      name: /Full education & qualifications/,
    });
    await expect(detailLink).toHaveAttribute(
      "href",
      "/qualified.html#history-2",
    );
    await noHorizontalOverflow(page, "#history-2");
    await hashClearsHeader(page, "#history-2");
    await detailLink.focus();
    await expect(detailLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/qualified\.html#history-2$/);
    await ready(page);
    const education = page.locator("#history-2");
    await expect(education).toHaveAttribute("data-education-detail", "");
    await expect(education.locator("img")).toHaveCount(2);
    await expect(
      education.getByText(researchFocus, { exact: true }),
    ).toBeVisible();
    await expect(
      education.getByText(researchFocus, { exact: true }).locator("br"),
    ).toHaveCount(0);
    await expect(education).toContainText("Double major in ESG Management");
    await expect(education).toContainText("Minor in Business Administration");
    await expect(
      education.getByRole("link", { name: /View publications/ }),
    ).toHaveAttribute("href", "/research.html");
    await expect(
      education.getByRole("link", { name: /Google Scholar/ }),
    ).toHaveAttribute(
      "href",
      "https://scholar.google.com/citations?user=CTcwlAEAAAAJ&hl=ko&oi=sra",
    );
    await expect(page.locator("#history-2 + #toolkit-grid")).toHaveCount(1);
    await expect(page.locator("#how-work")).toHaveCount(0);
    await expect(
      page.locator('[data-reading-role="competency-card"]'),
    ).toHaveCount(6);
    await noHorizontalOverflow(page, "#history-2");
    await hashClearsHeader(page, "#history-2");
    await page.reload();
    await ready(page);
    await hashClearsHeader(page, "#history-2");
    // WHAT: Exercise every retained certification filter after the relocation.
    const tabs = page.locator("#cert-tabs button");
    await expect(tabs).toHaveCount(4);
    for (const tab of await tabs.all()) {
      await tab.click();
      await expect(tab).toHaveClass(/active/);
      const target = await tab.getAttribute("data-target");
      await expect(page.locator(`#${target}`)).toBeVisible();
    }
    await page.goto("/about.html#how-work");
    await ready(page);
    await expect(page.locator("[data-about-chapter]")).toHaveCount(4);
    await expect(page.locator("#how-work + #media")).toHaveCount(1);
    await expect(page.locator("#how-work h3")).toHaveText([
      "Persuasive Storytelling",
      "Efficiency-Driven",
      "Communication Architect",
      "Inquiry-DrivenDetection",
    ]);
    await expect(page.locator("#how-work img")).toHaveCount(4);
    await expect(
      page.locator('[data-reading-role="principles-section-header"]'),
    ).toHaveCSS("text-align", width < 768 ? "left" : "center");
    await noHorizontalOverflow(page, "#how-work");
    await hashClearsHeader(page, "#how-work");
    await page.reload();
    await ready(page);
    await hashClearsHeader(page, "#how-work");
    // WHY: Old inbound links remain useful without trapping Back on the redirect.
    await page.goto("/index.html");
    await ready(page);
    await page.goto("/qualified.html#how-work");
    await expect(page).toHaveURL(/\/about\.html#how-work$/);
    await ready(page);
    await hashClearsHeader(page, "#how-work");
    await page.goBack();
    await expect(page).toHaveURL(/\/index\.html$/);
    await ready(page);
    await testInfo.attach(`education-ia-${width}-verification`, {
      body: JSON.stringify(
        {
          width,
          checked: [
            "Home degree summary",
            "Qualifications education",
            "all certification filters",
            "About principles",
            "direct/reloaded hashes",
            "legacy redirect and Back",
          ],
          errors,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    expect(errors).toEqual([]);
  });
}
