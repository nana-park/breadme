import { act, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { OriginalPage } from "./OriginalPage";

const delayed = vi.hoisted(() => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { ready, release };
});

vi.mock("./generated/OriginalAboutContent", async () => {
  await delayed.ready;
  return {
    OriginalAboutContent: () => <section>Loaded About content</section>,
  };
});

it("keeps one ordered style stack mounted while the lazy body is pending and after it resolves", async () => {
  render(<OriginalPage pageId="about" onOpenMaterials={() => {}} />);
  expect(screen.getByLabelText("Loading portfolio")).toBeInTheDocument();
  const styles = Array.from(
    document.querySelectorAll("style[data-original-style]"),
  );
  expect(
    styles.map((style) => style.getAttribute("data-original-style")),
  ).toEqual(["page", "utilities", "accessibility"]);
  // Vitest stubs CSS imports; the browser suite verifies the actual hide,
  // layout and button rules while a real route chunk is held pending.
  await act(async () => {
    delayed.release();
  });
  expect(await screen.findByText("Loaded About content")).toBeInTheDocument();
  expect(screen.queryByLabelText("Loading portfolio")).not.toBeInTheDocument();
  expect(
    Array.from(document.querySelectorAll("style[data-original-style]")),
  ).toEqual(styles);
});
