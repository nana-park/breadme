import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OriginalHeader } from "./OriginalHeader";
import headerStyles from "./OriginalHeader.module.css";
import { OriginalFooter } from "../OriginalFooter/OriginalFooter";
import footerStyles from "../OriginalFooter/OriginalFooter.module.css";
import { MaterialsPopup } from "@/shared/ui/MaterialsPopup/MaterialsPopup";
import popupStyles from "@/shared/ui/MaterialsPopup/MaterialsPopup.module.css";

describe("shared mobile readability ownership", () => {
  it.each(["home", "projects", "articles", "llm-based-voice-ivr"])(
    "uses the same menu typography hooks on %s",
    (pageId) => {
      render(<OriginalHeader pageId={pageId} onOpenMaterials={vi.fn()} />);
      const navigation = screen.getByRole("navigation");
      expect(navigation).toHaveClass(headerStyles.navigation);
      const primaryLinks = navigation.querySelectorAll(".nav-link");
      const secondaryLinks = navigation.querySelectorAll(".lnb-link");
      const submenus = navigation.querySelectorAll("[data-submenu]");
      expect(primaryLinks).toHaveLength(5);
      expect(secondaryLinks).toHaveLength(7);
      expect(submenus).toHaveLength(2);
      submenus.forEach((submenu) =>
        expect(submenu).toHaveClass(
          submenu.hasAttribute("hidden")
            ? headerStyles.collapsedSubmenu
            : headerStyles.submenu,
        ),
      );
      primaryLinks.forEach((link) =>
        expect(link).toHaveClass(headerStyles.primaryLink),
      );
      secondaryLinks.forEach((link) =>
        expect(link).toHaveClass(headerStyles.secondaryLink),
      );
    },
  );

  it("preserves footer destinations, pending controls, and the snap boundary", () => {
    const onPending = vi.fn();
    render(<OriginalFooter onPending={onPending} />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("footer", footerStyles.footer);
    expect(footer).toHaveAttribute("data-mobile-snap-section", "footer");
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/__breadme",
    );
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute(
      "href",
      "mailto:breadme00@gmail.com",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("link", { name: "Interviews" }));
    fireEvent.click(screen.getByRole("link", { name: "Seminars" }));
    fireEvent.click(screen.getByRole("button", { name: "Korean" }));
    expect(onPending).toHaveBeenCalledTimes(3);
  });

  it("owns the inert visibility hook without changing popup IDs", () => {
    render(
      <MaterialsPopup isOpen={false} onToggle={vi.fn()} onClose={vi.fn()} />,
    );
    const toggle = screen.getByRole("button", { name: "Open Email Popup" });
    expect(toggle.closest("#email-popup")).toHaveClass(popupStyles.popup);
    expect(toggle).toHaveAttribute("aria-controls", "materials-content");
  });

  it("keeps new visual rules behind their mobile boundaries without new important declarations", () => {
    // WHAT: Source-level guard only; browser QA verifies computed sizes and hit targets.
    const readCss = (path: string) =>
      readFileSync(new URL(path, import.meta.url), "utf8");
    const headerCss = readCss("./OriginalHeader.module.css");
    const footerCss = readCss("../OriginalFooter/OriginalFooter.module.css");
    const popupCss = readCss(
      "../../ui/MaterialsPopup/MaterialsPopup.module.css",
    );
    for (const [css, breakpoint] of [
      [headerCss, 1023],
      [footerCss, 767],
      [popupCss, 1023],
    ] as const) {
      expect(css).toContain(`@media (max-width: ${breakpoint}px)`);
      expect(css).not.toContain("!important");
    }
    expect(popupCss).toMatch(/\.popup\[inert\]\s*\{\s*display:\s*none;/);
  });
});
