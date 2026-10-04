import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { staticPages } from "./scripts/static-pages.ts";

let resolvedBase = "/";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-spline-attribution-icon",
      enforce: "pre",
      configResolved(config) {
        resolvedBase = config.base;
      },
      transform(code, id) {
        if (!id.includes("@splinetool/viewer")) return null;
        // Keep the original Spline attribution, only serve its exact icon bytes locally.
        return code.replaceAll(
          "https://app.spline.design/_assets/_icons/icon_favicon32x32.png",
          `${resolvedBase}original-external/spline/icon-favicon.png`,
        );
      },
    },
    staticPages(),
  ],
  // WHY: Local development stays at /; GitHub Pages builds set /breadme/.
  base: process.env.VITE_BASE_PATH || "/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
