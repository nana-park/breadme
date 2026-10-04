import type { Page } from "@playwright/test";

// WHAT: Wait on actual font/image/layout signals, without a fixed settling sleep.
// WHY: Only first-screen images are decoded; long detail routes remain inexpensive.
export async function settleFirstScreen(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
  return page.evaluate(async () => {
    const visibleImages = Array.from(document.images).filter((image) => {
      const box = image.getBoundingClientRect();
      return (
        box.width > 0 &&
        box.height > 0 &&
        box.bottom > 0 &&
        box.top < innerHeight
      );
    });
    const results = await Promise.all(
      visibleImages.map(async (image) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let timedOut = false;
        await Promise.race([
          image.decode().catch(() => undefined),
          new Promise<void>((resolve) => {
            timer = setTimeout(() => {
              timedOut = true;
              resolve();
            }, 4_000);
          }),
        ]);
        if (timer) clearTimeout(timer);
        return {
          src: image.currentSrc || image.src,
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          timedOut,
        };
      }),
    );
    let previous = "";
    let stableFrames = 0;
    const start = performance.now();
    while (stableFrames < 4 && performance.now() - start < 2_000) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const signature = JSON.stringify([
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
        ...Array.from(document.querySelectorAll("h1,h2,main,header,img"))
          .filter(
            (element) => element.getBoundingClientRect().top < innerHeight,
          )
          .map((element) => {
            const box = element.getBoundingClientRect();
            return [box.x, box.y, box.width, box.height].map((value) =>
              Math.round(value * 10),
            );
          }),
      ]);
      stableFrames = signature === previous ? stableFrames + 1 : 0;
      previous = signature;
    }
    return {
      fonts: document.fonts.status,
      images: results,
      imagesReady: results.every(
        (image) => image.complete && image.naturalWidth > 0 && !image.timedOut,
      ),
      layoutStable: stableFrames >= 4,
      stableFrames,
      layoutWaitMs: Math.round(performance.now() - start),
    };
  });
}

// WHAT: Record computed typography and real text Range rectangles before judging bugs.
// WHY: Decorative overflow, off-screen content, and intentional small labels are evidence,
// not universal failures. A visual review must establish route-specific regressions.
export async function captureLayout(page: Page) {
  return page.evaluate(() => {
    const round = (value: number) => Math.round(value * 100) / 100;
    const rect = (box: DOMRect) => ({
      x: round(box.x),
      y: round(box.y),
      width: round(box.width),
      height: round(box.height),
      top: round(box.top),
      right: round(box.right),
      bottom: round(box.bottom),
      left: round(box.left),
    });
    const selector = (element: Element): string => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const parts: string[] = [];
      let node: Element | null = element;
      while (node && parts.length < 5) {
        let part = node.tagName.toLowerCase();
        if (node.id) {
          parts.unshift(`#${CSS.escape(node.id)}`);
          break;
        }
        const siblings = node.parentElement
          ? Array.from(node.parentElement.children)
          : [];
        part += `:nth-child(${siblings.indexOf(node) + 1})`;
        parts.unshift(part);
        node = node.parentElement;
      }
      return parts.join(" > ");
    };
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.visibility !== "collapse" &&
        Number(style.opacity) !== 0 &&
        box.width > 0 &&
        box.height > 0 &&
        !element.closest("[hidden],[inert]") &&
        element.checkVisibility({
          checkOpacity: true,
          checkVisibilityCSS: true,
        })
      );
    };
    const inViewport = (box: DOMRect) =>
      box.bottom > 0 &&
      box.top < innerHeight &&
      box.right > 0 &&
      box.left < innerWidth;
    const font = (style: CSSStyleDeclaration) => ({
      color: style.color,
      backgroundColor: style.backgroundColor,
      family: style.fontFamily,
      size: style.fontSize,
      weight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      whiteSpace: style.whiteSpace,
      overflowWrap: style.overflowWrap,
      wordBreak: style.wordBreak,
      textOverflow: style.textOverflow,
      lineClamp: style.webkitLineClamp,
      textTransform: style.textTransform,
    });
    const describe = (element: Element) => {
      const box = element.getBoundingClientRect();
      return {
        selector: selector(element),
        tag: element.tagName.toLowerCase(),
        text: (element.textContent || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 400),
        box: rect(box),
        inViewport: inViewport(box),
        font: font(getComputedStyle(element)),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    };
    const clippingAncestors = (element: Element, fragments: DOMRect[]) => {
      const ancestors = [];
      let ancestor: Element | null = element;
      while (ancestor) {
        const style = getComputedStyle(ancestor);
        const clipsX = /hidden|clip|auto|scroll/.test(style.overflowX);
        const clipsY = /hidden|clip|auto|scroll/.test(style.overflowY);
        if (clipsX || clipsY || style.clipPath !== "none") {
          const box = ancestor.getBoundingClientRect();
          // Client box excludes borders and scrollbars; it is the relevant clip edge.
          const left = box.left + ancestor.clientLeft;
          const top = box.top + ancestor.clientTop;
          const right = left + ancestor.clientWidth;
          const bottom = top + ancestor.clientHeight;
          ancestors.push({
            selector: selector(ancestor),
            box: rect(box),
            clientBox: {
              left: round(left),
              top: round(top),
              right: round(right),
              bottom: round(bottom),
            },
            overflowX: style.overflowX,
            overflowY: style.overflowY,
            clipPath: style.clipPath,
            clippedFragmentsX: clipsX
              ? fragments.filter(
                  (fragment) =>
                    fragment.left < left - 1 || fragment.right > right + 1,
                ).length
              : 0,
            clippedFragmentsY: clipsY
              ? fragments.filter(
                  (fragment) =>
                    fragment.top < top - 1 || fragment.bottom > bottom + 1,
                ).length
              : 0,
            scrollableX: ancestor.scrollWidth > ancestor.clientWidth + 1,
            scrollableY: ancestor.scrollHeight > ancestor.clientHeight + 1,
          });
        }
        ancestor = ancestor.parentElement;
      }
      return ancestors;
    };
    const allElements = Array.from(document.body.querySelectorAll("*"));
    const renderedElements = allElements.filter(visible);
    const textRuns = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    let textNode: Node | null;
    let renderedTextCount = 0;
    const textLimit = 2_000;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentElement;
      const text = (textNode.textContent || "").trim();
      if (
        !parent ||
        !text ||
        /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName) ||
        !visible(parent)
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const fragments = Array.from(range.getClientRects()).filter(
        (box) => box.width > 0 && box.height > 0,
      );
      if (!fragments.length) continue;
      renderedTextCount += 1;
      if (textRuns.length >= textLimit) continue;
      const lines: ReturnType<typeof rect>[] = [];
      for (const fragment of fragments) {
        const line = lines.find(
          (candidate) => Math.abs(candidate.top - fragment.top) <= 1,
        );
        if (!line) lines.push(rect(fragment));
        else {
          line.left = line.x = round(Math.min(line.left, fragment.left));
          line.right = round(Math.max(line.right, fragment.right));
          line.bottom = round(Math.max(line.bottom, fragment.bottom));
          line.width = round(line.right - line.left);
          line.height = round(line.bottom - line.top);
        }
      }
      textRuns.push({
        selector: selector(parent),
        text: text.slice(0, 600),
        font: font(getComputedStyle(parent)),
        box: rect(range.getBoundingClientRect()),
        inViewport: fragments.some(inViewport),
        lineCount: lines.length,
        lineRects: lines,
        fragments: fragments.map(rect),
        clippingAncestors: clippingAncestors(parent, fragments),
      });
    }
    const controls = renderedElements
      .filter((element) =>
        element.matches(
          "a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[tabindex]",
        ),
      )
      .map((element) => ({
        ...describe(element),
        name:
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          (element.textContent || "").trim().slice(0, 180),
        disabled: element.matches(":disabled,[aria-disabled=true]"),
        below44px:
          element.getBoundingClientRect().width < 44 ||
          element.getBoundingClientRect().height < 44,
      }));
    return {
      url: location.href,
      title: document.title,
      viewport: {
        width: innerWidth,
        height: innerHeight,
        devicePixelRatio,
        scrollX,
        scrollY,
      },
      document: {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        bodyScrollWidth: document.body.scrollWidth,
        horizontalOverflow:
          document.documentElement.scrollWidth > innerWidth + 1,
      },
      headings: renderedElements
        .filter((element) =>
          element.matches("h1,h2,h3,h4,h5,h6,[role=heading]"),
        )
        .map(describe),
      bodySamples: renderedElements
        .filter((element) =>
          element.matches("main p,main li,main dd,main blockquote,article p"),
        )
        .slice(0, 150)
        .map(describe),
      textRuns,
      textCoverage: {
        renderedTextCount,
        capturedTextCount: textRuns.length,
        truncated: renderedTextCount > textLimit,
      },
      controls,
      overflowCandidates: renderedElements
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return (
            box.left < -1 ||
            box.right > innerWidth + 1 ||
            element.scrollWidth > element.clientWidth + 1
          );
        })
        .slice(0, 250)
        .map((element) => ({
          ...describe(element),
          overflowX: getComputedStyle(element).overflowX,
          position: getComputedStyle(element).position,
        })),
      fonts: Array.from(document.fonts).map((face) => ({
        family: face.family,
        weight: face.weight,
        style: face.style,
        status: face.status,
      })),
    };
  });
}
