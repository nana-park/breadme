import { render, waitFor } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useMobileScrollSnap } from "./useMobileScrollSnap";

function HomeFixture() {
  const root = useRef<HTMLDivElement>(null);
  useMobileScrollSnap("home", root);
  return (
    <div ref={root}>
      <section id="home">
        <div>
          <section id="nested-demo" />
        </div>
      </section>
      <section id="partners" />
    </div>
  );
}
function ArticlesFixture({ reading = false }: { reading?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useMobileScrollSnap("articles", root);
  return (
    <div ref={root}>
      <section id="articles">
        <div id="intro" data-landing-photo-hero="articles" />
        <div className="container">
          <div id="articles-list-container">
            <article id="card" />
          </div>
        </div>
      </section>
      {reading && (
        <section id="article-detail">
          <p id="paragraph">Long reading body</p>
        </section>
      )}
    </div>
  );
}
function ResearchFixture() {
  const root = useRef<HTMLDivElement>(null);
  useMobileScrollSnap("research", root);
  return (
    <div ref={root}>
      <section id="research">
        <div data-landing-photo-hero="research" />
        <div className="container">
          <section id="journal-publications" data-research-section="journal">
            <div data-research-paper="journal-example">
              <h3>Journal title</h3>
            </div>
          </section>
          <section id="ongoing-research" data-research-section="ongoing">
            <div data-research-paper="ongoing-example">
              <h3>Ongoing title</h3>
            </div>
          </section>
          <section
            id="conference-presentations"
            data-research-section="conference"
          >
            <div data-research-paper="conference-example">
              <h3>Conference title</h3>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

describe("mobile section annotations", () => {
  it("marks the Research hero and three chapters without snapping individual publications", () => {
    const { container } = render(<ResearchFixture />);
    const chapters = container.querySelectorAll("[data-research-section]");
    expect(chapters).toHaveLength(3);
    expect(
      container.querySelectorAll("[data-mobile-snap-section]"),
    ).toHaveLength(4);
    expect(Array.from(chapters, (chapter) => chapter.id)).toEqual([
      "journal-publications",
      "ongoing-research",
      "conference-presentations",
    ]);
    chapters.forEach((chapter) =>
      expect(chapter).toHaveAttribute("data-mobile-snap-section"),
    );
    expect(
      container.querySelector("[data-landing-photo-hero]"),
    ).toHaveAttribute("data-mobile-snap-section");
    expect(container.querySelector("#research")).not.toHaveAttribute(
      "data-mobile-snap-section",
    );
    expect(
      container.querySelector("#research > .container"),
    ).not.toHaveAttribute("data-mobile-snap-section");
    expect(
      container.querySelectorAll(
        "[data-research-paper][data-mobile-snap-section], h3[data-mobile-snap-section]",
      ),
    ).toHaveLength(0);
  });
  it("marks major sections, not a nested demo or its content", () => {
    const { container } = render(<HomeFixture />);
    expect(
      container.querySelectorAll("[data-mobile-snap-section]"),
    ).toHaveLength(2);
    expect(container.querySelector("#nested-demo")).not.toHaveAttribute(
      "data-mobile-snap-section",
    );
    expect(document.documentElement).toHaveAttribute("data-mobile-scroll-snap");
  });
  it("picks up and removes a hash-driven reading region without marking paragraphs", async () => {
    const { container, rerender } = render(<ArticlesFixture />);
    expect(
      container.querySelectorAll("[data-mobile-snap-section]"),
    ).toHaveLength(2);
    expect(container.querySelector("#card")).not.toHaveAttribute(
      "data-mobile-snap-section",
    );
    rerender(<ArticlesFixture reading />);
    await waitFor(() =>
      expect(container.querySelector("#article-detail")).toHaveAttribute(
        "data-mobile-snap-section",
      ),
    );
    expect(container.querySelector("#paragraph")).not.toHaveAttribute(
      "data-mobile-snap-section",
    );
    rerender(<ArticlesFixture />);
    expect(container.querySelector("#article-detail")).toBeNull();
  });
  it("restores root and element attributes during cleanup", () => {
    document.documentElement.setAttribute(
      "data-mobile-scroll-snap",
      "prior-value",
    );
    const { container, unmount } = render(<HomeFixture />);
    const home = container.querySelector("#home")!;
    unmount();
    expect(document.documentElement).toHaveAttribute(
      "data-mobile-scroll-snap",
      "prior-value",
    );
    expect(home).not.toHaveAttribute("data-mobile-snap-section");
    document.documentElement.removeAttribute("data-mobile-scroll-snap");
  });
});
