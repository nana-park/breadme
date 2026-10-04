import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "local-spline-attribution-icon",
      enforce: "pre",
      transform(code, id) {
        if (!id.includes("@splinetool/viewer")) return null;
        // Keep the original Spline attribution, only serve its exact icon bytes locally.
        return code.replaceAll(
          "https://app.spline.design/_assets/_icons/icon_favicon32x32.png",
          `${process.env.VITE_BASE_PATH || "/"}original-external/spline/icon-favicon.png`,
        );
      },
    },
  ],
  // WHY: Root preview works on nested source routes; a future approved host can set its base path.
  base: process.env.VITE_BASE_PATH || "/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
