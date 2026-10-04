import { defineConfig } from "@playwright/test";
import { pagesBaseUrl, pagesPort } from "./tests/pages/deployment";

// WHAT: Exercise only deployed-path regressions against real static files.
// WHY: Vite preview's SPA fallback can hide missing GitHub Pages HTML entries.
export default defineConfig({
  testDir: "./tests/pages",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "test-results/pages",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/pages" }],
  ],
  use: {
    baseURL: pagesBaseUrl,
    trace: "off",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    {
      name: "pages-mobile-390",
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "pages-desktop-1440",
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  // WHY: A production override must hit the published site, not start a local preview.
  webServer: process.env.PAGES_BASE_URL
    ? undefined
    : {
        command: "node tests/pages/static-server.mjs",
        url: pagesBaseUrl,
        env: { PAGES_PORT: String(pagesPort) },
        reuseExistingServer: false,
      },
});
