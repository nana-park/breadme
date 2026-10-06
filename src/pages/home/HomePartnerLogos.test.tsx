import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomePartnerLogos } from "./HomePartnerLogos";

afterEach(() => vi.unstubAllEnvs());
const names = [
  "NAVER",
  "NAVER CLOUD",
  "SK Inc.",
  "SK Telecom",
  "LINE WORKS",
  "H&M",
];

describe("Home partner companies", () => {
  it("keeps SK Telecom and adds the separate holding company and LINE WORKS", () => {
    const { container } = render(<HomePartnerLogos />);
    expect(
      screen.getAllByRole("img").map((image) => image.getAttribute("alt")),
    ).toEqual(names);
    expect(screen.queryByAltText("Google")).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(18);
    expect(container.querySelectorAll('img[aria-hidden="true"]')).toHaveLength(
      12,
    );
    const cycles = [0, 1, 2].map((cycle) =>
      Array.from(
        container.querySelectorAll(`[data-cycle="${cycle}"]`),
        (node) => node.getAttribute("data-partner"),
      ),
    );
    expect(cycles[0]).toEqual([
      "naver",
      "naver-cloud",
      "sk-inc",
      "sk-telecom",
      "line-works",
      "hm",
    ]);
    expect(cycles[1]).toEqual(cycles[0]);
    expect(cycles[2]).toEqual(cycles[0]);
  });
  for (const base of ["/", "/breadme/"]) {
    it(`keeps the old artwork and styles with the ${base} asset base`, () => {
      vi.stubEnv("BASE_URL", base);
      render(<HomePartnerLogos />);
      expect(screen.getByAltText("SK Telecom")).toHaveAttribute(
        "src",
        `${base}original/Files/Logo/SK%20Telecom-logo.svg`,
      );
      expect(screen.getByAltText("SK Telecom")).toHaveStyle({
        height: "44px",
        transform: "translateY(-10px)",
        filter: "grayscale(100%) opacity(0.45)",
      });
      expect(screen.getByAltText("NAVER")).toHaveStyle({ height: "22px" });
      expect(screen.getByAltText("NAVER CLOUD")).toHaveStyle({
        height: "24px",
      });
      expect(screen.getByAltText("H&M")).toHaveStyle({ height: "29px" });
      expect(screen.getByAltText("LINE WORKS")).toHaveStyle({ height: "26px" });
      for (const image of document.querySelectorAll(".logo-track img")) {
        expect(image).toHaveStyle({ filter: "grayscale(100%) opacity(0.45)" });
      }
    });
  }
  it("keeps both official SVG files byte-for-byte and preserves the converter hook", () => {
    for (const [file, hash] of [
      [
        "line-works-corporate.svg",
        "212aae0dcd79e567ade64651353c59a97dc3cf991eac4ac57c8642db67482088",
      ],
      [
        "sk-inc.svg",
        "8a3203c24ca4ea9cc152585ee2ac8d9777e82f5d4e6c6edca10935c48aae0930",
      ],
    ])
      expect(
        createHash("sha256")
          .update(readFileSync(`src/pages/home/assets/${file}`))
          .digest("hex"),
      ).toBe(hash);
    const converter = readFileSync(
      "scripts/convert-original-pages.mjs",
      "utf8",
    );
    expect(converter).toContain('node.classList.contains("logo-track")');
    expect(converter).toContain('node.closest("#partners")');
    expect(converter).toContain("<HomePartnerLogos />");
  });
});
