import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

async function cardSurface(card: Locator) {
  return card.evaluate((element) => {
    const style = getComputedStyle(element);
    // WHY: Tailwind's two transparent zero-size ring shadows paint nothing;
    // compare the real visible shadow, not its utility implementation detail.
    const paintedShadow = style.boxShadow
      .split(/,(?![^(]*\))/)
      .map((layer) => layer.trim())
      .filter((layer) => !layer.startsWith("rgba(0, 0, 0, 0) "))
      .join(", ");
    return {
      background: style.backgroundColor,
      border: style.border,
      radius: style.borderRadius,
      padding: style.padding,
      paintedShadow,
      transitionDuration: style.transitionDuration,
      transitionTimingFunction: style.transitionTimingFunction,
    };
  });
}

// WHAT: Check compact career typography while protecting the original Home order.
// WHY: The user explicitly keeps the carousel, gallery, and full education unchanged.
for (const width of [320, 390, 768, 1023, 1024, 1440]) {
  test(`Home career visibility ${width}px`, async ({ page }, testInfo) => {
    const height = width < 768 ? 844 : 900;
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/contact.html");
    const domain = page.locator('[data-contact-card="domain"]');
    await expect(domain).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    const referenceSurface = await cardSurface(domain);
    let hoverSurface: Awaited<ReturnType<typeof cardSurface>> | undefined;
    if (width === 1440) {
      await domain.hover();
      await domain.evaluate(async (element) => {
        await Promise.all(
          element.getAnimations().map((animation) => animation.finished),
        );
      });
      hoverSurface = await cardSurface(domain);
    }
    await page.mouse.move(0, 0);
    await page.goto("/");
    await expect(page.locator("#experience-title")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const measures = await page.evaluate(() => {
      const measure = (selector: string) => {
        const element = document.querySelector(selector)!;
        const box = element.getBoundingClientRect();
        return {
          top: box.top + scrollY,
          bottom: box.bottom + scrollY,
          height: box.height,
        };
      };
      return {
        career: measure("#history"),
        gallery: measure("#footprint"),
        education: measure("#history-2"),
        headingSize: parseFloat(
          getComputedStyle(document.querySelector("#experience-title")!)
            .fontSize,
        ),
        educationHeadingSize: parseFloat(
          getComputedStyle(document.querySelector("#history-2 h2")!).fontSize,
        ),
        bodySizes: Array.from(
          document.querySelectorAll("[data-home-company] li"),
        ).map((element) => parseFloat(getComputedStyle(element).fontSize)),
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(measures.gallery.bottom).toBeLessThanOrEqual(measures.career.top);
    expect(measures.career.bottom).toBeLessThanOrEqual(measures.education.top);
    expect(measures.headingSize).toBe(measures.educationHeadingSize);
    expect(measures.headingSize).toBe(width < 768 ? 24 : 28);
    expect(Math.min(...measures.bodySizes)).toBe(13);
    for (const list of await page
      .locator("[data-home-products], [data-home-outcomes]")
      .all()) {
      await expect(list).toHaveCSS("row-gap", "4px");
      await expect(list).toHaveCSS("font-size", "13px");
      await expect(list).toHaveCSS("line-height", "20.8px");
    }
    expect(measures.scrollWidth).toBeLessThanOrEqual(width);
    if (width < 768) {
      await expect(page.locator("#history")).toHaveAttribute(
        "data-mobile-snap-section",
      );
    }
    const careers = page.locator("[data-home-company]");
    await expect(careers).toHaveCount(2);
    for (const card of await careers.all()) {
      expect(await cardSurface(card)).toEqual(referenceSurface);
      await expect(card).toHaveCSS("border-top-width", "1px");
      await expect(card).toHaveCSS("border-top-color", "rgb(229, 231, 235)");
      await expect(card).toHaveCSS("border-radius", "8px");
      await expect(card).toHaveCSS("padding", width < 1024 ? "24px" : "32px");
      await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(card).toHaveCSS(
        "box-shadow",
        "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
      );
    }
    for (const company of ["NAVER Cloud", "SK Telecom"]) {
      await expect(
        page
          .locator("#history")
          .getByRole("heading", { name: company, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.locator("#history #career-page-1, #history #career-page-2"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Full career", exact: false }),
    ).toHaveAttribute("href", "/career.html");
    const actions = page.locator("[data-home-experience-actions]");
    await expect(actions.getByRole("link")).toHaveCount(2);
    await expect(actions.getByRole("link").first()).toHaveText("Products↗");
    await expect(actions.getByRole("link").last()).toHaveText("Full career↗");
    const primary = actions.getByRole("link", { name: "Products" });
    const secondary = actions.getByRole("link", { name: "Full career" });
    const academicSecondary = page
      .locator("#history-2")
      .getByRole("link", { name: /Full education & qualifications/ });
    await expect(primary).toHaveCSS("background-color", "rgb(26, 26, 26)");
    for (const property of [
      "background-color",
      "color",
      "border",
      "border-radius",
    ]) {
      const reference = await academicSecondary.evaluate(
        (node, name) => getComputedStyle(node).getPropertyValue(name),
        property,
      );
      await expect(secondary).toHaveCSS(property, reference);
    }
    if (width === 1440) {
      await secondary.hover();
      await expect(secondary).toHaveCSS(
        "background-color",
        "rgb(250, 250, 250)",
      );
      await page.mouse.move(0, 0);
      await secondary.focus();
      await expect(secondary).toHaveCSS("outline-color", "rgb(20, 93, 204)");
    }
    await expect(
      actions.getByRole("link", { name: "Products" }),
    ).toHaveAttribute("href", "/projects.html");
    const actionBoxes = await actions.getByRole("link").evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        return { x: box.x, y: box.y, right: box.right, height: box.height };
      }),
    );
    for (const box of actionBoxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
    }
    expect(Math.abs(actionBoxes[0].y - actionBoxes[1].y)).toBeLessThanOrEqual(
      1,
    );
    expect(actionBoxes[1].x - actionBoxes[0].right).toBeGreaterThanOrEqual(12);
    await expect(
      page.getByRole("heading", { name: "Academic Standing" }),
    ).toBeVisible();
    await expect(page.locator("#partners .logo-track img")).toHaveCount(18);
    await expect(page.locator("#history")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(
      page.locator(
        "#history img, #history canvas, #history #history-dark-container, #history #history-glow",
      ),
    ).toHaveCount(0);
    await expect(page.locator("#history-2 img")).toHaveCount(0);
    await expect(page.locator("#history-2")).not.toContainText(
      "Research Focus",
    );
    await expect(page.locator("#history-2 a")).toHaveAttribute(
      "href",
      "/qualified.html#history-2",
    );

    await expect(
      page.locator("#history [data-home-company] h3").first(),
    ).toHaveCSS("font-size", width < 768 ? "20px" : "22px");
    await expect(
      page
        .locator("[data-home-company='naver-cloud'] [data-home-outcomes] li")
        .first(),
    ).toContainText("No. 1 in Japan’s voicebot market (FY2024)");
    await expect(
      page
        .locator("[data-home-company='sk-telecom'] [data-home-outcomes] li")
        .first(),
    ).toHaveText("2024 GDWEB GRAND PRIZE");
    await expect(
      page.locator("[data-home-company='naver-cloud'] [data-home-products] li"),
    ).toHaveText([
      "NAVER Care Call",
      "NAVER Care Call Console",
      "LINE WORKS AI Call",
    ]);
    await expect(
      page.locator("[data-home-company='sk-telecom'] [data-home-products]"),
    ).toHaveText("A.Dot");
    for (const card of await careers.all()) {
      await expect(card.locator("h4")).toHaveText(["Products", "Outcomes"]);
      for (const label of await card.locator("h4").all()) {
        await expect(label).toHaveCSS("font-size", "10px");
        await expect(label).toHaveCSS("font-weight", "500");
        await expect(label).toHaveCSS("color", "rgb(161, 161, 170)");
      }
      await expect(
        card.getByText("AI Product Manager", { exact: true }),
      ).toBeVisible();
    }
    const companyBoxes = await careers.evaluateAll((items) =>
      items.map((item) => {
        const r = item.getBoundingClientRect();
        return { x: r.x, y: r.y, bottom: r.bottom, height: r.height };
      }),
    );
    if (width < 768)
      expect(companyBoxes[1].y - companyBoxes[0].bottom).toBeGreaterThanOrEqual(
        32,
      );
    else {
      expect(
        Math.abs(companyBoxes[0].y - companyBoxes[1].y),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(companyBoxes[0].height - companyBoxes[1].height),
        "Desktop grid stretches both cards to the same natural row height",
      ).toBeLessThanOrEqual(1);
    }
    if (width === 390 || width === 1440) {
      // WHAT: Capture a normal viewport for user review, not only tall element
      // screenshots where the fixed header can overlap a scrolled section.
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        const section = document.querySelector("#history")!;
        window.scrollTo({
          top: section.getBoundingClientRect().top + scrollY - 70,
          behavior: "instant",
        });
      });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const viewportPath = testInfo.outputPath(
        `home-${width}-career-viewport.png`,
      );
      await page.screenshot({ path: viewportPath, animations: "disabled" });
      await testInfo.attach(`career-viewport-${width}`, {
        path: viewportPath,
        contentType: "image/png",
      });
      for (const [label, target] of [
        ["career", "#history"],
        ["education", "#history-2"],
      ]) {
        const path = testInfo.outputPath(`home-${width}-${label}.png`);
        await page.locator(target).screenshot({ path, animations: "disabled" });
        await testInfo.attach(`${label}-${width}`, {
          path,
          contentType: "image/png",
        });
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const path = testInfo.outputPath(`home-${width}-full.png`);
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      await testInfo.attach(`full-${width}`, {
        path,
        contentType: "image/png",
      });
    }
    await testInfo.attach("career-hierarchy", {
      body: JSON.stringify(measures, null, 2),
      contentType: "application/json",
    });
    await testInfo.attach("Contact and Home actual card surfaces", {
      body: JSON.stringify(
        {
          width,
          referenceSurface,
          homeSurface: await cardSurface(careers.first()),
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    if (hoverSurface) {
      await careers.first().hover();
      await expect
        .poll(() => cardSurface(careers.first()))
        .toEqual(hoverSurface);
      await expect(careers.first()).toHaveCSS("transform", "none");
      await page.mouse.move(0, 0);
    }
    expect(errors, "Home runtime errors").toEqual([]);
    await page.getByRole("link", { name: "Full career", exact: false }).click();
    await expect(page).toHaveURL(/\/career\.html$/);
    await expect(page.locator("[data-original-page]")).toHaveAttribute(
      "data-original-page",
      "career",
    );
    await page.goBack();
    await expect(page.locator("#history")).toBeVisible();
    await page
      .locator("[data-home-experience-actions]")
      .getByRole("link", { name: "Products" })
      .click();
    await expect(page).toHaveURL(/\/projects\.html$/);
    await expect(page.locator("[data-original-page]")).toHaveAttribute(
      "data-original-page",
      "projects",
    );
    await page.goBack();
    await expect(page.locator("[data-home-experience-actions]")).toBeVisible();
  });
}

test("Home experience actions wrap at 320px with doubled text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  const actions = page.locator("[data-home-experience-actions]");
  await expect(actions).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  // WHAT: Text-only enlargement, separate from browser zoom or device QA.
  await actions.getByRole("link").evaluateAll((links) => {
    for (const link of links) {
      (link as HTMLElement).style.fontSize =
        `${parseFloat(getComputedStyle(link).fontSize) * 2}px`;
    }
  });
  const boxes = await actions.getByRole("link").evaluateAll((links) =>
    links.map((link) => {
      const box = link.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        bottom: box.bottom,
        right: box.right,
        height: box.height,
        clientWidth: link.clientWidth,
        scrollWidth: link.scrollWidth,
      };
    }),
  );
  expect(boxes[1].y - boxes[0].bottom).toBeGreaterThanOrEqual(12);
  for (const box of boxes) {
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});
