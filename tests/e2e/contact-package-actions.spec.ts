import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const portfolioUrl = "https://nana-park.github.io/breadme/";
const copied = "포트폴리오 웹사이트 URL이 복사되었습니다";
const copyFailed =
  "자동으로 복사하지 못했습니다. 아래 포트폴리오 웹사이트 URL을 선택해 직접 복사해 주세요.";

async function openContact(page: Page) {
  await page.goto("/contact.html?source=test#contact");
  await expect(page.locator("[data-contact-package-actions]")).toBeVisible();
}

for (const width of [320, 390, 768, 1440]) {
  test(`Contact package controls remain contained and keyboard-operable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await openContact(page);
    const actions = page.locator("[data-contact-package-actions]");
    for (const name of ["Resume", "Portfolio PDF", "Copy URL"]) {
      const button = actions.getByRole("button", { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      if (width < 768) expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    for (const name of ["Resume", "Portfolio PDF"]) {
      const trigger = actions.getByRole("button", { name, exact: true });
      for (const key of ["Enter", "Space"]) {
        await trigger.focus();
        await page.keyboard.press(key);
        const close = page.getByRole("button", { name: "Minimize Popup" });
        await expect(close).toBeFocused();
        await expect(page.locator("#materials-content")).toBeVisible();
        await expect(
          page
            .locator("#materials-content")
            .getByText("Coming Soon", { exact: true }),
        ).toBeVisible();
        await expect(page.locator("#materials-content input")).toBeDisabled();
        await expect(page.locator("main")).not.toHaveAttribute("inert");
        await trigger.focus();
        await page.keyboard.press(key);
        await expect(close).toBeFocused();
        if (key === "Enter") await page.keyboard.press("Escape");
        else await close.click();
        await expect(page.locator("#materials-content")).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(new URL(page.url()).hash).toBe("#contact");
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}

test("Copy URL writes the canonical homepage and alerts after each actual clipboard write", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openContact(page);
  const copy = page.getByRole("button", { name: "Copy URL", exact: true });
  for (const activation of ["click", "Enter", "Space"]) {
    const dialogPromise = page.waitForEvent("dialog");
    const action =
      activation === "click" ? copy.click() : copy.press(activation);
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toBe(copied);
    await dialog.accept();
    await action;
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      portfolioUrl,
    );
    await expect(copy).toBeFocused();
  }
});

test("Copy URL does not announce success while its write is pending", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            document.addEventListener("test-resolve-copy", () => resolve(), {
              once: true,
            });
          }),
      },
    });
  });
  await openContact(page);
  let dialogs = 0;
  page.on("dialog", () => {
    dialogs += 1;
  });
  const copy = page.getByRole("button", { name: "Copy URL", exact: true });
  await copy.click();
  await expect(copy).toHaveAttribute("aria-busy", "true");
  await copy.click();
  expect(dialogs).toBe(0);
  const dialogPromise = page.waitForEvent("dialog");
  const resolution = page.evaluate(() =>
    document.dispatchEvent(new Event("test-resolve-copy")),
  );
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe(copied);
  await dialog.accept();
  await resolution;
  expect(dialogs).toBe(1);
});

for (const failure of ["denied", "unavailable"]) {
  test(`Copy URL reports ${failure} access and offers a selectable canonical URL`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addInitScript((state) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value:
          state === "unavailable"
            ? undefined
            : {
                writeText: () =>
                  Promise.reject(new DOMException("Denied", "NotAllowedError")),
              },
      });
    }, failure);
    await openContact(page);
    const copy = page.getByRole("button", { name: "Copy URL", exact: true });
    const dialogPromise = page.waitForEvent("dialog");
    const click = copy.click();
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("alert");
    expect(dialog.message()).toBe(copyFailed);
    expect(dialog.message()).not.toBe(copied);
    await dialog.accept();
    await click;
    const input = page.getByRole("textbox", {
      name: "Portfolio URL",
      exact: true,
    });
    await expect(input).toHaveValue(portfolioUrl);
    await expect(input).toHaveAttribute("readonly");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    expect(
      await input.evaluate((element: HTMLInputElement) => [
        element.selectionStart,
        element.selectionEnd,
      ]),
    ).toEqual([0, portfolioUrl.length]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  });
}
