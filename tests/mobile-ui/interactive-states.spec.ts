import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { originalRoutePaths } from "../../src/config/originalRoutes";
import { settleFirstScreen } from "./capture-layout";

// WHAT: Exercise lower-page controls omitted by the first-screen route captures.
// WHY: Real touch capability exposes the lecture controls without simulated hover.
test.use({ hasTouch: true, isMobile: true });
const widths = [320, 390] as const;
const limits = [
  "Chromium touch emulation at 320/390 CSS pixels; not real-device or screen-reader certification.",
  "Each state has viewport-sized start/end screenshots, not exhaustive pixels between them.",
  "Miniature demo typography and intentionally offscreen carousel siblings are not readability failures.",
  "External video playback, third-party navigation, downloads, and live service actions are not exercised.",
  "Comparison-table rightmost access uses the existing scroll container, not an OS-level touch gesture or keyboard-accessibility certification.",
];
const manifests = new WeakMap<TestInfo, Array<Record<string, unknown>>>();

test.beforeEach(async ({ page }, testInfo) => {
  manifests.set(testInfo, []);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  manifests.get(testInfo)!.push({ browserErrors: errors });
  testInfo.annotations.push({
    type: "interactive-evidence",
    description:
      "Focused assertions plus screenshots; capture success alone is not visual approval.",
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const path = testInfo.outputPath("interactive-state-manifest.json");
  await writeFile(
    path,
    JSON.stringify(
      {
        schemaVersion: 1,
        test: testInfo.title,
        url: page.url(),
        viewport: page.viewportSize(),
        status: testInfo.status,
        limits,
        states: manifests.get(testInfo) ?? [],
      },
      null,
      2,
    ),
  );
  await testInfo.attach("interactive-state-manifest", {
    path,
    contentType: "application/json",
  });
  const errors = manifests.get(testInfo)?.[0]?.browserErrors ?? [];
  expect(
    errors,
    "Interaction states must not emit runtime page errors",
  ).toEqual([]);
});

async function settlePosition(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Four unchanged animation frames settle local disclosure and tab reflow.
    let previous = "";
    let stable = 0;
    const started = performance.now();
    while (stable < 4 && performance.now() - started < 2_000) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const current = `${scrollY}:${document.documentElement.scrollHeight}`;
      stable = current === previous ? stable + 1 : 0;
      previous = current;
    }
  });
}

// WHAT: Inspect laid-out text fragments against clipping ancestors, not only page width.
// WHY: overflow:hidden can conceal missing content while document.scrollWidth still passes.
async function textGeometry(scope: Locator) {
  return scope.evaluate((root) => {
    const runs: Array<{
      text: string;
      top: number;
      bottom: number;
      left: number;
      right: number;
      clippedBy: string[];
    }> = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      const text = node.textContent?.trim().replace(/\s+/g, " ");
      if (
        !parent ||
        !text ||
        parent.closest("[hidden],[inert],[aria-hidden='true'],svg,script,style")
      )
        continue;
      if (
        !parent.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        })
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const fragments = Array.from(range.getClientRects()).filter(
        (rect) => rect.width && rect.height,
      );
      if (!fragments.length) continue;
      const clippedBy: string[] = [];
      for (
        let ancestor: Element | null = parent;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const style = getComputedStyle(ancestor);
        const box = ancestor.getBoundingClientRect();
        const left = box.left + ancestor.clientLeft;
        const top = box.top + ancestor.clientTop;
        const clipX = /hidden|clip|auto|scroll/.test(style.overflowX);
        const clipY =
          /hidden|clip/.test(style.overflowY) &&
          ancestor !== document.body &&
          ancestor !== document.documentElement;
        if (
          fragments.some(
            (rect) =>
              (clipX &&
                (rect.left < left - 2 ||
                  rect.right > left + ancestor!.clientWidth + 2)) ||
              (clipY &&
                (rect.top < top - 2 ||
                  rect.bottom > top + ancestor!.clientHeight + 2)),
          )
        )
          clippedBy.push(
            ancestor.id
              ? `#${ancestor.id}`
              : `${ancestor.tagName.toLowerCase()}.${String(ancestor.className).split(" ").slice(0, 2).join(".")}`,
          );
      }
      runs.push({
        text,
        top: Math.min(...fragments.map((r) => r.top)) + scrollY,
        bottom: Math.max(...fragments.map((r) => r.bottom)) + scrollY,
        left: Math.min(...fragments.map((r) => r.left)),
        right: Math.max(...fragments.map((r) => r.right)),
        clippedBy,
      });
    }
    return {
      textRuns: runs,
      documentHeight: document.documentElement.scrollHeight,
      viewportWidth: innerWidth,
    };
  });
}

async function assertReadable(scope: Locator, description: string) {
  const geometry = await textGeometry(scope);
  expect
    .soft(geometry.textRuns.length, `${description}: rendered text`)
    .toBeGreaterThan(0);
  expect
    .soft(
      geometry.textRuns.filter(
        (run) =>
          run.clippedBy.length ||
          run.left < -2 ||
          run.right > geometry.viewportWidth + 2,
      ),
      `${description}: clipped text`,
    )
    .toEqual([]);
  expect
    .soft(
      geometry.textRuns.filter(
        (run) => run.top < -2 || run.bottom > geometry.documentHeight + 2,
      ),
      `${description}: document reachability`,
    )
    .toEqual([]);
  return geometry;
}

async function screenshot(page: Page, testInfo: TestInfo, caseId: string) {
  await settlePosition(page);
  const path = testInfo.outputPath(`${caseId}.png`);
  await page.screenshot({
    path,
    fullPage: false,
    animations: "disabled",
    timeout: 15_000,
  });
  await testInfo.attach(caseId, { path, contentType: "image/png" });
  return `${caseId}.png`;
}

async function saveState(
  page: Page,
  testInfo: TestInfo,
  caseId: string,
  scope: Locator,
  context: Record<string, unknown> = {},
) {
  await scope.evaluate((root) => {
    window.scrollTo({
      top: Math.max(0, root.getBoundingClientRect().top + scrollY - 88),
      behavior: "instant",
    });
  });
  const start = await screenshot(page, testInfo, `${caseId}--start`);
  const geometry = await textGeometry(scope);
  // Reach the final rendered text through normal document scrolling, retaining the
  // start/end evidence even if focused soft assertions find a layout defect.
  const endpoint = await scope.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let last: Element | null = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (
        !parent ||
        !node.textContent?.trim() ||
        parent.closest("[hidden],[inert],[aria-hidden='true'],svg,script,style")
      )
        continue;
      if (
        parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      )
        last = parent;
    }
    last?.scrollIntoView({ block: "center", behavior: "instant" });
    const box = last?.getBoundingClientRect();
    return {
      text: last?.textContent?.trim().replace(/\s+/g, " ").slice(0, 180),
      intersectsViewport: Boolean(
        box && box.bottom > 0 && box.top < innerHeight,
      ),
    };
  });
  const end = await screenshot(page, testInfo, `${caseId}--end`);
  expect
    .soft(
      endpoint.intersectsViewport,
      `${caseId}: last rendered text can be scrolled into view`,
    )
    .toBe(true);
  manifests.get(testInfo)!.push({
    caseId,
    screenshots: [start, end],
    endpoint,
    geometry,
    ...context,
  });
}

async function openRoute(
  page: Page,
  width: number,
  route: keyof typeof originalRoutePaths,
) {
  await page.setViewportSize({ width, height: 844 });
  const response = await page.goto(`./${originalRoutePaths[route]}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.ok()).toBe(true);
  await expect(page.locator("main")).toBeVisible();
  await settleFirstScreen(page);
}

const certifications = [
  "cert-ai",
  "cert-data",
  "cert-psycho",
  "cert-lang",
] as const;
const detailRoutes = [
  {
    route: "hopzie-oneclickbuilder",
    prefix: "hopzie",
    targets: [
      "tab-storefront",
      "tab-building",
      "tab-commission",
      "tab-resilience",
      "tab-youtube",
    ],
    finalColumn: "With Hopzie",
  },
  {
    route: "ai-mentoring-agent-detail",
    prefix: "mentoring",
    targets: [
      "tab-learner-memory",
      "tab-session-tracking",
      "tab-meeting-parsing",
      "tab-insight-extraction",
      "tab-teaching-retrospective",
    ],
    finalColumn: "With AI Agent",
  },
  {
    route: "llm-based-voice-ivr",
    prefix: "aicall",
    targets: [
      "tab-aicall-routing",
      "tab-aicall-building",
      "tab-aicall-scenarios",
      "tab-aicall-builder",
      "tab-aicall-demo",
    ],
    finalColumn: "With AI IVR",
  },
] as const;

for (const width of widths) {
  test(`Qualified: all certification tabs at ${width}px`, async ({
    page,
  }, testInfo) => {
    await openRoute(page, width, "qualified");
    await expect(page.locator("#cert-tabs [role='tab']")).toHaveCount(4);
    for (const target of certifications) {
      const tab = page.locator(`#cert-tabs [data-target='${target}']`);
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const panel = page.locator(`#${target}`);
      await expect(panel).toHaveAttribute("aria-hidden", "false");
      await expect(page.locator(".cert-panel:visible")).toHaveCount(1);
      await assertReadable(tab, target);
      await saveState(page, testInfo, `qualified--w${width}--${target}`, panel);
      await assertReadable(panel, `${target}: certification content`);
    }
    const first = page.locator("#cert-tabs [role='tab']").first();
    await first.focus();
    await page.keyboard.press("End");
    await expect(page.locator("#cert-lang-tab")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute("aria-selected", "true");
  });

  test(`Projects: all nine disclosures and nested lists at ${width}px`, async ({
    page,
  }, testInfo) => {
    await openRoute(page, width, "projects");
    const expanders = page.locator(
      "#projects [data-original-click='expandProjects(this)']",
    );
    const unavailableExpanders: number[] = [];
    for (let i = 0; i < (await expanders.count()); i += 1) {
      const button = expanders.nth(i);
      if (!(await button.isVisible())) {
        unavailableExpanders.push(i);
        continue;
      }
      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
    }
    manifests.get(testInfo)!.push({
      showMore:
        "Activated every visible top-level expander; hidden desktop-only variants are not forced open.",
      unavailableExpanders,
    });
    const details = page.locator("#projects details");
    await expect(details).toHaveCount(9);
    for (let index = 0; index < 9; index += 1) {
      const detail = details.nth(index);
      const summary = detail.locator(":scope > summary");
      await summary.click();
      await expect(detail).toHaveAttribute("open", "");
      await expect(summary).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#projects details[open]")).toHaveCount(1);
      const nested = detail.locator(
        "button[aria-controls^='original-project-group-']",
      );
      for (let group = 0; group < (await nested.count()); group += 1) {
        await nested.nth(group).click();
        await expect(nested.nth(group)).toHaveAttribute(
          "aria-expanded",
          "true",
        );
      }
      const label = (await summary.innerText()).trim().replace(/\s+/g, " ");
      await saveState(
        page,
        testInfo,
        `projects--w${width}--disclosure-${index + 1}`,
        detail,
        { label, expandedNestedGroups: await nested.count() },
      );
      await assertReadable(detail, `Projects disclosure ${index + 1}`);
      await summary.click();
      await expect(detail).not.toHaveAttribute("open");
      await expect(summary).toHaveAttribute("aria-expanded", "false");
    }
  });

  for (const { route, prefix, targets, finalColumn } of detailRoutes) {
    test(`${route}: all tabs and rightmost comparison at ${width}px`, async ({
      page,
    }, testInfo) => {
      await openRoute(page, width, route);
      const tabs = page.locator(`#${prefix}-tabs [role='tab']`);
      await expect(tabs).toHaveCount(5);
      for (const target of targets) {
        // Filtering the known tab set avoids matching similarly named mockup controls.
        const selected = page.locator(
          `#${prefix}-tabs [data-target='${target}']`,
        );
        await selected.click();
        await expect(selected).toHaveAttribute("aria-selected", "true");
        const panel = page.locator(`#${target}`);
        await expect(panel).toHaveAttribute("aria-hidden", "false");
        await expect(
          page.locator(`.${prefix}-tab-content:visible`),
        ).toHaveCount(1);
        await assertReadable(selected, `${route}: ${target} control`);
        await saveState(
          page,
          testInfo,
          `${route}--w${width}--${target}`,
          panel,
        );
        const narrative = panel.locator(".concept-note").first();
        await expect(narrative).toBeVisible();
        await assertReadable(narrative, `${route}: ${target} explanation`);
      }
      await tabs.first().focus();
      await page.keyboard.press("End");
      await expect(tabs.last()).toBeFocused();
      await page.keyboard.press("Home");
      await expect(tabs.first()).toBeFocused();
      const table = page.locator("table").filter({
        has: page.getByRole("columnheader", {
          name: finalColumn,
          exact: true,
        }),
      });
      await expect(table).toHaveCount(1);
      const scroll = table.locator("..");
      await scroll.scrollIntoViewIfNeeded();
      const scrolling = await scroll.evaluate((element) => {
        element.scrollLeft = element.scrollWidth - element.clientWidth;
        return {
          overflowX: getComputedStyle(element).overflowX,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          scrollLeft: element.scrollLeft,
        };
      });
      expect(scrolling.overflowX).toMatch(/auto|scroll/);
      expect(scrolling.scrollWidth).toBeGreaterThan(scrolling.clientWidth);
      expect(scrolling.scrollLeft).toBeGreaterThan(0);
      await saveState(
        page,
        testInfo,
        `${route}--w${width}--comparison-rightmost`,
        table,
        { scrolling },
      );
      const finalCells = table.locator("tr > :last-child");
      for (let cell = 0; cell < (await finalCells.count()); cell += 1) {
        await assertReadable(
          finalCells.nth(cell),
          `${route}: final column row ${cell}`,
        );
      }
    });
  }

  test(`Lectures: usable photo controls at ${width}px`, async ({
    page,
  }, testInfo) => {
    await openRoute(page, width, "lectures");
    const carousels = page.locator("[data-lecture-carousel]");
    await expect(carousels).toHaveCount(2);
    for (let index = 0; index < 2; index += 1) {
      const carousel = carousels.nth(index);
      const track = carousel.locator(".lecture-slides");
      const slides = track.locator("img");
      const count = await slides.count();
      expect(count).toBeGreaterThan(1);
      await carousel.scrollIntoViewIfNeeded();
      const previous = carousel.getByRole("button", {
        name: "Previous photo",
        exact: true,
      });
      const next = carousel.getByRole("button", {
        name: "Next photo",
        exact: true,
      });
      await expect(previous).toHaveCSS("opacity", "1");
      await expect(next).toHaveCSS("opacity", "1");
      for (let slide = 0; slide < count; slide += 1) {
        const dot = carousel.getByRole("button", {
          name: `Show photo ${slide + 1} of ${count}`,
          exact: true,
        });
        await dot.click();
        await expect(track).toHaveAttribute(
          "data-current-index",
          String(slide),
        );
        await expect(dot).toHaveAttribute("aria-current", "true");
        await expect(slides.nth(slide)).toHaveAttribute("aria-hidden", "false");
        const image = await slides.nth(slide).evaluate(async (element) => {
          const img = element as HTMLImageElement;
          await img.decode().catch(() => undefined);
          const box = img.getBoundingClientRect();
          return {
            loaded: img.complete && img.naturalWidth > 0,
            left: box.left,
            right: box.right,
            width: innerWidth,
          };
        });
        expect.soft(image.loaded).toBe(true);
        expect.soft(image.left).toBeGreaterThanOrEqual(-2);
        expect.soft(image.right).toBeLessThanOrEqual(image.width + 2);
        const caseId = `lectures--w${width}--carousel-${index + 1}-photo-${slide + 1}`;
        const path = await screenshot(page, testInfo, caseId);
        manifests.get(testInfo)!.push({ caseId, screenshots: [path], image });
      }
      await next.click();
      await expect(track).toHaveAttribute("data-current-index", "0");
      await previous.click();
      await expect(track).toHaveAttribute(
        "data-current-index",
        String(count - 1),
      );
      await carousel.focus();
      await page.keyboard.press("ArrowRight");
      await expect(track).toHaveAttribute("data-current-index", "0");
    }
  });
}
