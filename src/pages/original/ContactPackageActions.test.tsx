import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { contactPackage } from "@/content/site/contactPackage";
import { ContactPackageActions } from "./ContactPackageActions";

const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const originalWidth = window.innerWidth;
function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/contact.html?test=1#contact");
  vi.spyOn(window, "alert").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalWidth,
  });
  if (clipboardDescriptor)
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("Contact package direct actions", () => {
  it.each([390, 1440])(
    "opens the shared pending panel and restores body focus at %spx",
    async (width) => {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: width,
      });
      const user = userEvent.setup();
      const fetch = vi.spyOn(window, "fetch");
      render(<App />);
      await waitFor(() =>
        expect(
          document.querySelector("[data-contact-package-actions]"),
        ).toBeInTheDocument(),
      );
      const actions = within(
        document.querySelector<HTMLElement>("[data-contact-package-actions]")!,
      );
      for (const name of ["Resume", "Portfolio PDF"]) {
        const trigger = actions.getByRole("button", { name });
        for (const key of ["{Enter}", " "]) {
          trigger.focus();
          await user.keyboard(key);
          const close = screen.getByRole("button", { name: "Minimize Popup" });
          expect(close).toHaveFocus();
          expect(document.querySelector("#materials-content")).toBeVisible();
          expect(
            screen.getByRole("textbox", {
              name: "Email address (coming soon)",
            }),
          ).toBeDisabled();
          expect(document.querySelector("main")).not.toHaveAttribute("inert");
          // Repeated activation must leave it open and focus the visible close control.
          trigger.focus();
          await user.keyboard(key);
          expect(close).toHaveFocus();
          if (key === "{Enter}") await user.keyboard("{Escape}");
          else await user.click(close);
          expect(
            document.querySelector("#materials-content"),
          ).not.toBeVisible();
          expect(trigger).toHaveFocus();
          expect(window.location.hash).toBe("#contact");
        }
      }
      expect(fetch).not.toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
    },
  );

  it("copies the canonical homepage and only alerts after the write resolves", async () => {
    const user = userEvent.setup();
    let resolveWrite!: () => void;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        }),
    );
    setClipboard({ writeText });
    render(<ContactPackageActions onOpenMaterials={vi.fn()} />);
    const copy = screen.getByRole("button", { name: "Copy URL" });
    await user.click(copy);
    await user.click(copy);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(
      "https://nana-park.github.io/breadme/",
    );
    expect(window.alert).not.toHaveBeenCalled();
    expect(copy).toHaveAttribute("aria-busy", "true");
    await act(async () => resolveWrite());
    expect(window.alert).toHaveBeenCalledExactlyOnceWith(
      "포트폴리오 웹사이트 URL이 복사되었습니다",
    );
    expect(copy).toHaveAttribute("aria-busy", "false");
    expect(copy).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    writeText.mockResolvedValue(undefined);
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(writeText).toHaveBeenCalledTimes(3);
    expect(window.alert).toHaveBeenCalledTimes(3);
  });

  it.each(["denied", "unavailable"])(
    "provides an honest manual fallback when clipboard is %s",
    async (failure) => {
      const user = userEvent.setup();
      const writeText = vi
        .fn()
        .mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
      setClipboard(failure === "denied" ? { writeText } : undefined);
      render(<ContactPackageActions onOpenMaterials={vi.fn()} />);
      const copy = screen.getByRole("button", { name: "Copy URL" });
      await user.click(copy);
      expect(window.alert).toHaveBeenCalledExactlyOnceWith(
        contactPackage.copyFailed,
      );
      expect(window.alert).not.toHaveBeenCalledWith(contactPackage.copied);
      expect(screen.getByRole("status")).toHaveTextContent(
        contactPackage.copyFailed,
      );
      const manual = screen.getByRole("textbox", { name: "Portfolio URL" });
      expect(manual).toHaveValue(contactPackage.portfolioUrl);
      expect(manual).toHaveAttribute("readonly");
      await user.tab();
      expect(manual).toHaveFocus();
      expect((manual as HTMLInputElement).selectionStart).toBe(0);
      expect((manual as HTMLInputElement).selectionEnd).toBe(
        contactPackage.portfolioUrl.length,
      );
      setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
      fireEvent.click(copy);
      await waitFor(() =>
        expect(window.alert).toHaveBeenLastCalledWith(contactPackage.copied),
      );
      expect(
        screen.queryByRole("textbox", { name: "Portfolio URL" }),
      ).not.toBeInTheDocument();
    },
  );
});
