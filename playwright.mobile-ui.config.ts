import { defineConfig } from "@playwright/test";

// WHAT: An isolated, bounded evidence run; it does not change normal e2e gates.
export default defineConfig({
  testDir: "./tests/mobile-ui",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results/mobile-ui",
  fullyParallel: true,
  timeout: 120_000,
  globalTimeout: 10 * 60_000,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/mobile-ui", open: "never" }],
  ],
  use: {
    baseURL: process.env.MOBILE_UI_BASE_URL || "http://127.0.0.1:4173",
    browserName: "chromium",
    viewport: { width: 320, height: 844 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    locale: "en-US",
    colorScheme: "light",
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: process.env.MOBILE_UI_BASE_URL
    ? undefined
    : {
        command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 20_000,
      },
});
