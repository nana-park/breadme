import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import {
  originalPageIds,
  originalRoutePaths,
} from "../../src/config/originalRoutes";
import { settleFirstScreen } from "./capture-layout";

const BASELINE_COMMIT = "4f026a3dd816c11bb1a4718379e2ba9d6f7527af";
const baselineURL = "http://127.0.0.1:4174/";
const candidateURL = "http://127.0.0.1:4173/";
const widths = [768, 1440] as const;
const dynamicMedia = "video, iframe, canvas, spline-viewer";
// This player bootstrap is deliberately blocked with the excluded iframe pixels.
// Unexpected external scripts and every failed local render asset still fail.
const excludedMediaScripts = new Set(["https://www.youtube.com/iframe_api"]);
const screenshotStyle = `${dynamicMedia} { visibility: hidden !important; }
  *, *::before, *::after { caret-color: transparent !important; }`;
const candidateCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();

// WHAT: 28 fresh-navigation cases, 56 exact-pixel comparisons (top and footer).
// WHY: 768 catches a leaked <=767 rule; 1440 protects the requested desktop view.
// This is not a full-page or interaction-state equivalence claim. Dynamic media
// pixels are excluded with visibility:hidden, preserving overlaid text and boxes.
test.beforeEach(async ({ request }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-unchanged",
    "Use playwright.desktop-unchanged.config.ts and its immutable baseline build.",
  );
  const response = await request.get(
    `${baselineURL}desktop-unchanged-provenance.json`,
  );
  expect(
    response.ok(),
    "The immutable baseline build must expose provenance",
  ).toBe(true);
  expect(await response.json()).toMatchObject({
    schemaVersion: 1,
    commit: BASELINE_COMMIT,
    buildBase: "/",
  });
});

async function preparePage(page: Page, url: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(new Date("2026-10-05T00:00:00.000Z"));
  await page.addInitScript(() => {
    let seed = 1;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  });
  const blockedExternal: string[] = [];
  const failedAssets: string[] = [];
  const appOrigin = new URL(url).origin;
  await page.route("**/*", async (route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (target.protocol === "http:" || target.protocol === "https:") {
      if (target.origin !== appOrigin) {
        blockedExternal.push(request.url());
        await route.abort();
        return;
      }
    }
    await route.continue();
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      ["image", "font", "stylesheet", "script"].includes(
        response.request().resourceType(),
      )
    ) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (
      blockedExternal.includes(request.url()) &&
      excludedMediaScripts.has(request.url())
    )
      return;
    if (
      ["image", "font", "stylesheet", "script"].includes(request.resourceType())
    ) {
      failedAssets.push(`${request.failure()?.errorText} ${request.url()}`);
    }
  });
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(response?.ok(), "Each reference and candidate route must load").toBe(
    true,
  );
  // The mentoring demo contains its own nested main; select the app landmark.
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator("main h1, main h2").first()).toBeVisible();
  // Keep actual typography, images, layout, and viewport unchanged. Motion only is
  // disabled; the same fixed clock, random seed, and local assets serve both builds.
  await page.addStyleTag({
    content: `${screenshotStyle}\n*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }`,
  });
  await page.evaluate(() =>
    document.querySelectorAll("video").forEach((video) => {
      video.autoplay = false;
      video.pause();
    }),
  );
  const readiness = await settleFirstScreen(page);
  expect(
    readiness.imagesReady,
    "First-screen images must decode, not silently fall back",
  ).toBe(true);
  expect(readiness.layoutStable, "First-screen layout must settle").toBe(true);
  return { readiness, blockedExternal, failedAssets };
}

// WHAT: Await the viewport actually being captured without resetting footer scroll.
async function settleViewport(page: Page, footer: boolean) {
  return page.evaluate(
    async ({ footer, dynamicMedia }) => {
      await document.fonts.ready;
      if (footer)
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        });
      const visibleImages = Array.from(document.images).filter((image) => {
        const box = image.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.bottom > 0 &&
          box.top < innerHeight &&
          image.checkVisibility({
            checkVisibilityCSS: true,
            checkOpacity: true,
          })
        );
      });
      const images = await Promise.all(
        visibleImages.map(async (image) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          const decoded = await Promise.race([
            image.decode().then(
              () => true,
              () => false,
            ),
            new Promise<boolean>((resolve) => {
              timer = setTimeout(() => resolve(false), 5_000);
            }),
          ]);
          if (timer) clearTimeout(timer);
          return {
            src: new URL(image.currentSrc || image.src).pathname,
            decoded,
            naturalWidth: image.naturalWidth,
          };
        }),
      );
      let previous = "";
      let stableFrames = 0;
      const start = performance.now();
      const geometry = () => {
        const box = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return [rect.x, rect.y, rect.width, rect.height];
        };
        return {
          scrollX,
          scrollY,
          documentWidth: document.documentElement.scrollWidth,
          documentHeight: document.documentElement.scrollHeight,
          footer: Array.from(document.querySelectorAll("footer")).map(box),
          visible: Array.from(
            document.querySelectorAll(
              "h1,h2,p,img,button,[role=button],header,footer *",
            ),
          )
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.bottom > 0 && rect.top < innerHeight;
            })
            .map(box),
        };
      };
      while (stableFrames < 4 && performance.now() - start < 3_000) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        if (footer)
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          });
        const signature = JSON.stringify(geometry());
        stableFrames = previous === signature ? stableFrames + 1 : 0;
        previous = signature;
      }
      const media = Array.from(document.querySelectorAll(dynamicMedia)).map(
        (element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            tag: element.tagName,
            source: Array.from(element.querySelectorAll("source")).map(
              (source) => new URL(source.src).pathname,
            ),
            box: [rect.x, rect.y, rect.width, rect.height],
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            objectFit: style.objectFit,
            objectPosition: style.objectPosition,
          };
        },
      );
      return {
        images,
        stable: stableFrames >= 4,
        geometry: geometry(),
        media,
        fontErrors: Array.from(document.fonts)
          .filter((font) => font.status === "error")
          .map((font) => `${font.family} ${font.weight}`),
        loadedFonts: Array.from(document.fonts)
          .filter((font) => font.status === "loaded")
          .map((font) => `${font.family} ${font.weight} ${font.style}`)
          .sort(),
      };
    },
    { footer, dynamicMedia },
  );
}

// WHAT: Decode each screenshot in Chromium and compare every RGBA pixel exactly.
// WHY: PNG byte hashes include encoding details, and perceptual image matchers may
// ignore anti-aliasing changes even with their tolerance configured to zero.
async function comparePixels(page: Page, reference: Buffer, candidate: Buffer) {
  return page.evaluate(
    async ({ reference, candidate }) => {
      const decode = async (base64: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { willReadFrequently: true })!;
        context.drawImage(image, 0, 0);
        return {
          canvas,
          context,
          pixels: context.getImageData(0, 0, canvas.width, canvas.height),
        };
      };
      const [before, after] = await Promise.all([
        decode(reference),
        decode(candidate),
      ]);
      if (
        before.canvas.width !== after.canvas.width ||
        before.canvas.height !== after.canvas.height
      ) {
        return {
          dimensionsMatch: false,
          changedPixels: -1,
          totalPixels: 0,
          changedPoints: [],
          diff: null,
        };
      }
      const diff = before.context.createImageData(
        before.canvas.width,
        before.canvas.height,
      );
      let changedPixels = 0;
      const changedPoints: Array<{
        x: number;
        y: number;
        before: number[];
        after: number[];
      }> = [];
      for (let index = 0; index < before.pixels.data.length; index += 4) {
        const changed = [0, 1, 2, 3].some(
          (channel) =>
            before.pixels.data[index + channel] !==
            after.pixels.data[index + channel],
        );
        if (changed) {
          changedPixels += 1;
          if (changedPoints.length < 20) {
            changedPoints.push({
              x: (index / 4) % before.canvas.width,
              y: Math.floor(index / 4 / before.canvas.width),
              before: Array.from(before.pixels.data.slice(index, index + 4)),
              after: Array.from(after.pixels.data.slice(index, index + 4)),
            });
          }
        }
        diff.data[index] = changed ? 255 : after.pixels.data[index];
        diff.data[index + 1] = changed ? 0 : after.pixels.data[index + 1];
        diff.data[index + 2] = changed ? 255 : after.pixels.data[index + 2];
        diff.data[index + 3] = changed ? 255 : 80;
      }
      before.context.putImageData(diff, 0, 0);
      return {
        dimensionsMatch: true,
        changedPixels,
        changedPoints,
        totalPixels: before.canvas.width * before.canvas.height,
        diff: changedPixels
          ? before.canvas.toDataURL("image/png").split(",")[1]
          : null,
      };
    },
    {
      reference: reference.toString("base64"),
      candidate: candidate.toString("base64"),
    },
  );
}

async function save(
  testInfo: TestInfo,
  name: string,
  body: Buffer | string,
  contentType: string,
) {
  const path = testInfo.outputPath(name);
  await writeFile(path, body);
  await testInfo.attach(name, { path, contentType });
}

// WHAT: Require two consecutive, exact RGBA-identical captures of each foreground
// page before comparing builds. Like Playwright's screenshot settling, this waits
// for raster stability rather than accepting a small number of changed pixels.
// WHY: The first CI run differed only at 2–5 rounded-border edge pixels on five
// captures. Matching geometry alone cannot establish renderer nondeterminism.
async function stableScreenshot(
  page: Page,
  comparison: Page,
  testInfo: TestInfo,
  name: string,
) {
  await page.bringToFront();
  let previous: Buffer | undefined;
  const attempts: Array<Record<string, unknown>> = [];
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const current = await page.screenshot({
      fullPage: false,
      animations: "disabled",
      caret: "hide",
    });
    if (previous) {
      const { diff, ...pixels } = await comparePixels(
        comparison,
        previous,
        current,
      );
      attempts.push({ attempt, ...pixels });
      if (diff) {
        await save(
          testInfo,
          `${name}--settling-${attempt - 1}.png`,
          previous,
          "image/png",
        );
        await save(
          testInfo,
          `${name}--settling-${attempt}-diff.png`,
          Buffer.from(diff, "base64"),
          "image/png",
        );
      }
      if (pixels.dimensionsMatch && pixels.changedPixels === 0) {
        return { image: current, attempts };
      }
    }
    previous = current;
  }
  await save(
    testInfo,
    `${name}--unstable.json`,
    JSON.stringify(attempts, null, 2),
    "application/json",
  );
  throw new Error(
    `${name}: no two consecutive exact screenshots matched in four captures; renderer stability is unverified.`,
  );
}

for (const width of widths) {
  for (const route of originalPageIds) {
    test(`${route} at ${width}: top and footer unchanged`, async ({
      context,
      page,
    }, testInfo) => {
      const baseline = await context.newPage();
      const comparison = await context.newPage();
      const path = originalRoutePaths[route];
      const before = await preparePage(
        baseline,
        new URL(path, baselineURL).href,
        width,
      );
      const after = await preparePage(
        page,
        new URL(path, candidateURL).href,
        width,
      );
      const results: Array<Record<string, unknown>> = [];
      for (const position of ["top", "footer"] as const) {
        await test.step(position, async () => {
          const beforeState = await settleViewport(
            baseline,
            position === "footer",
          );
          const afterState = await settleViewport(page, position === "footer");
          for (const state of [beforeState, afterState]) {
            expect(state.stable, `${position} layout must settle`).toBe(true);
            expect(
              state.images.every(
                (image) => image.decoded && image.naturalWidth > 0,
              ),
              `${position} images must decode`,
            ).toBe(true);
            expect(
              state.fontErrors,
              "Web fonts must not silently fail",
            ).toEqual([]);
            if (position === "footer") {
              expect(
                state.geometry.footer,
                "Each route must contain one footer",
              ).toHaveLength(1);
              const [, top, , height] = state.geometry.footer[0];
              expect(
                top,
                "The footer must be wholly inside this captured viewport",
              ).toBeGreaterThanOrEqual(0);
              // scrollHeight/scrollY are integer CSS pixels, but DOMRects retain
              // fractions. Immutable main itself ends at 900.06–900.44 here.
              // Compare the rounded CSSOM boundary, not an invented pixel allowance;
              // screenshot equivalence still requires every decoded pixel to match.
              expect(Math.round(top + height)).toBeLessThanOrEqual(900);
            }
          }
          const caseId = `${route}--w${width}--${position}`;
          const referenceCapture = await stableScreenshot(
            baseline,
            comparison,
            testInfo,
            `${caseId}--main`,
          );
          const candidateCapture = await stableScreenshot(
            page,
            comparison,
            testInfo,
            `${caseId}--candidate`,
          );
          const reference = referenceCapture.image;
          const candidate = candidateCapture.image;
          await save(testInfo, `${caseId}--main.png`, reference, "image/png");
          await save(
            testInfo,
            `${caseId}--candidate.png`,
            candidate,
            "image/png",
          );
          const { diff, ...pixels } = await comparePixels(
            comparison,
            reference,
            candidate,
          );
          if (diff)
            await save(
              testInfo,
              `${caseId}--diff.png`,
              Buffer.from(diff, "base64"),
              "image/png",
            );
          // A fresh immutable-main page diagnoses baseline-only raster variability.
          // This is evidence only: it never substitutes a more convenient reference,
          // masks a region, or changes the cross-build zero-pixel acceptance gate.
          let baselineRepeat: Record<string, unknown> | undefined;
          let candidateRepeat: Record<string, unknown> | undefined;
          if (pixels.changedPixels !== 0 || !pixels.dimensionsMatch) {
            const repeat = await context.newPage();
            try {
              const readiness = await preparePage(
                repeat,
                new URL(path, baselineURL).href,
                width,
              );
              const state = await settleViewport(repeat, position === "footer");
              const capture = await stableScreenshot(
                repeat,
                comparison,
                testInfo,
                `${caseId}--main-repeat`,
              );
              await save(
                testInfo,
                `${caseId}--main-repeat.png`,
                capture.image,
                "image/png",
              );
              const { diff: repeatedDiff, ...repeatPixels } =
                await comparePixels(comparison, reference, capture.image);
              if (repeatedDiff)
                await save(
                  testInfo,
                  `${caseId}--main-self-diff.png`,
                  Buffer.from(repeatedDiff, "base64"),
                  "image/png",
                );
              const {
                diff: candidateBaselineDiff,
                ...candidateBaselinePixels
              } = await comparePixels(comparison, candidate, capture.image);
              baselineRepeat = {
                readiness,
                state,
                attempts: capture.attempts,
                pixels: repeatPixels,
                candidatePixels: candidateBaselinePixels,
              };
              if (candidateBaselineDiff)
                await save(
                  testInfo,
                  `${caseId}--candidate-vs-main-repeat-diff.png`,
                  Buffer.from(candidateBaselineDiff, "base64"),
                  "image/png",
                );
            } finally {
              await repeat.close();
            }
            const repeatCandidate = await context.newPage();
            try {
              const readiness = await preparePage(
                repeatCandidate,
                new URL(path, candidateURL).href,
                width,
              );
              const state = await settleViewport(
                repeatCandidate,
                position === "footer",
              );
              const capture = await stableScreenshot(
                repeatCandidate,
                comparison,
                testInfo,
                `${caseId}--candidate-repeat`,
              );
              await save(
                testInfo,
                `${caseId}--candidate-repeat.png`,
                capture.image,
                "image/png",
              );
              const { diff: repeatedDiff, ...repeatPixels } =
                await comparePixels(comparison, candidate, capture.image);
              const { diff: referenceDiff, ...referencePixels } =
                await comparePixels(comparison, reference, capture.image);
              if (repeatedDiff)
                await save(
                  testInfo,
                  `${caseId}--candidate-self-diff.png`,
                  Buffer.from(repeatedDiff, "base64"),
                  "image/png",
                );
              if (referenceDiff)
                await save(
                  testInfo,
                  `${caseId}--main-vs-candidate-repeat-diff.png`,
                  Buffer.from(referenceDiff, "base64"),
                  "image/png",
                );
              candidateRepeat = {
                readiness,
                state,
                attempts: capture.attempts,
                pixels: repeatPixels,
                referencePixels,
              };
            } finally {
              await repeatCandidate.close();
            }
          }
          const result = {
            caseId,
            pixels,
            before: beforeState,
            after: afterState,
            rasterStability: {
              reference: referenceCapture.attempts,
              candidate: candidateCapture.attempts,
            },
            baselineRepeat,
            candidateRepeat,
            referencePngSha256: createHash("sha256")
              .update(reference)
              .digest("hex"),
            candidatePngSha256: createHash("sha256")
              .update(candidate)
              .digest("hex"),
          };
          results.push(result);
          await save(
            testInfo,
            `${caseId}.json`,
            JSON.stringify(result, null, 2),
            "application/json",
          );
          // Soft pixel/geometry assertions preserve both top and footer evidence.
          expect
            .soft(pixels.dimensionsMatch, `${caseId}: screenshot dimensions`)
            .toBe(true);
          expect
            .soft(
              pixels.changedPixels,
              `${caseId}: every decoded RGBA pixel must match immutable main`,
            )
            .toBe(0);
          expect
            .soft(
              afterState.media,
              `${caseId}: excluded media geometry and styling`,
            )
            .toEqual(beforeState.media);
          expect
            .soft(afterState.loadedFonts, `${caseId}: actual loaded web fonts`)
            .toEqual(beforeState.loadedFonts);
          expect
            .soft(afterState.geometry.documentHeight, `${caseId}: page height`)
            .toBe(beforeState.geometry.documentHeight);
          expect
            .soft(afterState.geometry.documentWidth, `${caseId}: page width`)
            .toBe(beforeState.geometry.documentWidth);
        });
      }
      await save(
        testInfo,
        "comparison-summary.json",
        JSON.stringify(
          {
            baselineCommit: BASELINE_COMMIT,
            candidateCommit,
            route,
            width,
            height: 900,
            coverage:
              "Top viewport and complete footer viewport only; no full-page or interaction-state equivalence claim.",
            deterministicTreatment:
              "Same Chromium run/software rasterization/DPR 1/UTC/en-US/light; local pinned assets and loaded web fonts; fixed Date and seeded Math.random; reduced motion, animations and transitions disabled; video paused; video/iframe/canvas/spline pixels persistently hidden while boxes and overlays remain; external network blocked (the excluded YouTube player bootstrap is an expected abort); foreground captures must be consecutively pixel-identical; persistent cross-build differences remain failures and trigger diagnostic fresh immutable-main and candidate captures.",
            readiness: { before, after },
            results,
          },
          null,
          2,
        ),
        "application/json",
      );
      expect(before.failedAssets, "Reference render assets must load").toEqual(
        [],
      );
      expect(after.failedAssets, "Candidate render assets must load").toEqual(
        [],
      );
    });
  }
}
