import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeExperience } from "./HomeExperience";

afterEach(() => vi.unstubAllEnvs());

describe("Home experience actions", () => {
  for (const base of ["/", "/breadme/"]) {
    it(`places Products beside Full career with ${base} destinations`, () => {
      vi.stubEnv("BASE_URL", base);
      render(<HomeExperience />);
      const career = screen.getByRole("link", { name: "Full career" });
      const products = screen.getByRole("link", { name: "Products" });
      expect(career).toHaveAttribute("href", `${base}career.html`);
      expect(products).toHaveAttribute("href", `${base}projects.html`);
      expect(career.parentElement).toBe(products.parentElement);
      expect(career.nextElementSibling).toBe(products);
      expect(products.className).toBe(career.className);
      expect(products).not.toHaveAttribute("target");
    });
  }

  it("keeps both actions in natural keyboard order", async () => {
    const user = userEvent.setup();
    render(<HomeExperience />);
    await user.tab();
    expect(screen.getByRole("link", { name: "Full career" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Products" })).toHaveFocus();
  });
});
