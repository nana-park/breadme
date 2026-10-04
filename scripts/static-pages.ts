import type { Plugin } from "vite";
import { originalRoutePaths } from "../src/config/originalRoutes.ts";

export function staticPageEntries(indexHtml: string | Uint8Array) {
  return Object.values(originalRoutePaths)
    .filter((fileName) => fileName !== "index.html")
    .map((fileName) => ({ fileName, source: indexHtml }));
}

export function staticPages(): Plugin {
  return {
    name: "original-static-pages",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") {
        throw new Error(
          "The static route build requires a compiled index.html.",
        );
      }
      // WHY: GitHub Pages serves real files, without Vite's development fallback.
      // Vite has already made scripts and styles base-absolute, including nested pages.
      for (const entry of staticPageEntries(index.source)) {
        this.emitFile({ type: "asset", ...entry });
      }
      this.emitFile({ type: "asset", fileName: ".nojekyll", source: "" });
    },
  };
}
