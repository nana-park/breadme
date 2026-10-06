import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { applyCareerContentOverrides } from "../../../scripts/apply-career-content-overrides";
import { OriginalCareerContent } from "./generated/OriginalCareerContent";
import { OriginalHomeContent } from "./generated/OriginalHomeContent";
import manifest from "./generated/conversion-manifest.json";

const intro =
  "Unfiltered voices from the cross-functional partners and leaders who have navigated complex product journeys alongside me.";

describe("Career content boundaries", () => {
  it("removes the duplicate education section without a blank chapter or anchor", () => {
    const { container } = render(<OriginalCareerContent />);
    expect(
      Array.from(
        container.querySelectorAll("section"),
        (section) => section.id,
      ),
    ).toEqual(["about", "history", "testimonials"]);
    expect(container.querySelector("#history-2")).toBeNull();
    expect(container.querySelector('a[href="#history-2"]')).toBeNull();
    expect(screen.queryByText("Education")).not.toBeInTheDocument();
    expect(
      container.querySelectorAll("#career-container > div[id^='career-page-']"),
    ).toHaveLength(2);
    expect(container.querySelectorAll(".testimonial-card")).toHaveLength(6);
    expect(screen.getByText(intro)).toHaveAttribute(
      "data-reading-role",
      "testimonial-intro",
    );
    expect(screen.getByText(intro).querySelectorAll("br")).toHaveLength(1);
    expect(
      manifest.pages.find((page) => page.sourceFile === "career.html")
        ?.sectionIds,
    ).toEqual(["about", "history", "testimonials"]);
  });
  it("keeps Home Academic Standing, both degrees and research links", () => {
    const { container } = render(<OriginalHomeContent />);
    expect(
      screen.getByRole("heading", { name: "Academic Standing" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("#history-2 img")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "M.S. in Human-AI Interaction" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "B.A. in Psychology" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View publications/ }),
    ).toHaveAttribute("href", "/research.html");
  });
  it("preserves the removal and intro role during regeneration, only for Career", () => {
    const source = `<section id="history">Careers</section><section id="history-2">Education</section><section id="testimonials"><p>Unfiltered voices from the cross-functional partners and leaders<br> who have navigated complex product journeys alongside me.</p></section>`;
    const career = new DOMParser().parseFromString(source, "text/html");
    applyCareerContentOverrides(career, "career.html");
    applyCareerContentOverrides(career, "career.html");
    expect(career.querySelector("#history-2")).toBeNull();
    expect(career.querySelector("#history")?.textContent).toBe("Careers");
    expect(
      career.querySelector('[data-reading-role="testimonial-intro"]')
        ?.textContent,
    ).toBe(intro);
    expect(career.querySelectorAll("#testimonials br")).toHaveLength(1);
    const home = new DOMParser().parseFromString(source, "text/html");
    applyCareerContentOverrides(home, "index.html");
    expect(home.querySelector("#history-2")?.textContent).toBe("Education");
    expect(home.querySelector("[data-reading-role]")).toBeNull();
  });
});
