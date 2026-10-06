import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useMobileScrollSnap } from "@/shared/hooks/useMobileScrollSnap";
import { OriginalAboutContent } from "./generated/OriginalAboutContent";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function AboutFixture() {
  const root = useRef<HTMLDivElement>(null);
  useMobileScrollSnap("about", root);
  return (
    <div ref={root}>
      <OriginalAboutContent />
    </div>
  );
}

describe("About mobile reading chapters", () => {
  it("marks introduction, identity and interview in order without marking diagram parts", () => {
    const { container } = render(<AboutFixture />);
    const chapters = Array.from(
      container.querySelectorAll<HTMLElement>("[data-mobile-snap-section]"),
    );
    expect(chapters.map((chapter) => chapter.dataset.aboutChapter)).toEqual([
      "introduction",
      "identity",
      "interview",
    ]);
    expect(container.querySelector("#about")).toHaveAttribute(
      "data-mobile-snap-flow",
    );
    expect(container.querySelector(".id-root-name")).not.toHaveAttribute(
      "data-mobile-snap-section",
    );
    expect(container.querySelector(".id-root-name")).toHaveTextContent(
      "Park Nahyun",
    );
    expect(container.querySelectorAll(".id-meaning-text")).toHaveLength(2);
    expect(chapters[0].querySelector("a")).toHaveAttribute(
      "href",
      "/projects.html",
    );
    expect(chapters[2].querySelector("a")).toHaveAttribute(
      "href",
      "https://youtu.be/BQGPG91YsLo?t=2231",
    );
  });

  it("keeps the existing container default and makes the About gutter mobile-only", () => {
    // Source contract only. Computed geometry and native snap need the browser suite.
    const sourceCss = readFileSync(
      resolve("src/styles/original/style.css"),
      "utf8",
    );
    const pageCss = readFileSync(
      resolve("src/pages/original/OriginalPage.module.css"),
      "utf8",
    );
    expect(sourceCss).toContain(
      "padding: 0 var(--original-container-gutter, 5vw) !important;",
    );
    expect(
      pageCss.indexOf("--original-container-gutter: 20px"),
    ).toBeGreaterThan(pageCss.indexOf("@media (max-width: 767px)"));
    expect(pageCss).toContain("min-height: calc(100svh - 70px)");
    expect(pageCss).not.toMatch(/scroll-snap-type:\s*y mandatory/);
  });
});
