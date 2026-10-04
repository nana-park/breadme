import { defineConfig } from "vitest/config";
import config from "./vite.config.ts";

// WHY: Artifact checks run after build, separately from the fast source-only tests.
export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: ["tests/static-pages/**/*.test.tsx"],
  },
});
