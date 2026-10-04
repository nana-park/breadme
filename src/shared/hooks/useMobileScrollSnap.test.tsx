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
        <div className="container">
          <div id="intro" />
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

describe("mobile section annotations", () => {
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
