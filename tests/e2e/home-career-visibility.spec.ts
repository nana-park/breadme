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
    await expect(
      page.getByRole("heading", { name: "Academic Standing" }),
    ).toBeVisible();
    await expect(page.locator("#partners .logo-track img")).toHaveCount(15);
    await expect(page.locator("#history")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)",
    );
    await expect(
      page.locator(
        "#history img, #history canvas, #history #history-dark-container, #history #history-glow",
      ),
    ).toHaveCount(0);
    await expect(page.locator("#history-2 img")).toHaveCount(2);
    const researchFocus = page
      .locator("#history-2")
      .getByText(
        "Focused on human cognition, statistical modeling, and AI technical literacy, with research published in SSCI-indexed journals.",
      );
    await expect(researchFocus).toBeVisible();
    await expect(researchFocus.locator("br")).toHaveCount(0);

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
  });
}
