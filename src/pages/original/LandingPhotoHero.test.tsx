import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingPhotoHero } from "./LandingPhotoHero";
import {
  landingHeroes,
  type LandingHeroPage,
} from "@/content/original/landingHeroes";
import { applyLandingHeroOverride } from "../../../scripts/apply-landing-hero-override";
afterEach(cleanup);
describe("Contact-style landing heroes", () => {
  for (const page of Object.keys(landingHeroes) as LandingHeroPage[]) {
    it(`${page} keeps a concise heading, existing photo and supporting copy`, () => {
      const { container } = render(<LandingPhotoHero page={page} />);
      const content = landingHeroes[page];
      expect(
        screen.getByRole("heading", { level: 1, name: content.title }),
      ).toBeVisible();
      expect(screen.getByAltText(content.imageAlt)).toHaveAttribute(
        "src",
        `/original/${content.image}`,
      );
      expect(container.querySelectorAll("p")).toHaveLength(2);
      for (const paragraph of content.paragraphs)
        expect(screen.getByText(paragraph)).toBeVisible();
    });
    it(`${page} survives conversion while keeping the following content`, () => {
      const id = page === "qualified" ? "about" : page;
      const children =
        page === "qualified"
          ? "<div>old hero</div>"
          : '<div class="container"><div>old hero</div><article>Keep this content</article></div>';
      const document = window.document.implementation.createHTMLDocument();
      document.body.innerHTML = `<section id="${id}">${children}</section>`;
      applyLandingHeroOverride(document, `${page}.html`);
      expect(
        document.querySelector(`[data-landing-photo-hero="${page}"]`),
      ).not.toBeNull();
      expect(document.body.textContent).not.toContain("old hero");
      if (page !== "qualified")
        expect(document.querySelector("article")?.textContent).toBe(
          "Keep this content",
        );
    });
  }
});
