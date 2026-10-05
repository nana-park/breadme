import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

// WHAT: Compare the candidate with immutable main in the same Chromium installation.
// WHY: References from another OS/browser run can conceal or invent pixel regressions.
export default defineConfig({
  testDir: "./tests/mobile-ui",
  testMatch: "desktop-unchanged.spec.ts",
  outputDir: "test-results/desktop-unchanged",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 1,
  retries: 0,
  timeout: 90_000,
  globalTimeout: 8 * 60_000,
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "playwright-report/desktop-unchanged", open: "never" },
    ],
  ],
  projects: [{ name: "desktop-unchanged" }],
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4173/",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
    reducedMotion: "reduce",
    // WHY: CI reproduced rounded-edge differences on immutable main itself.
    // Use the same software raster path for both builds instead of introducing
    // a perceptual threshold or masking otherwise static border pixels.
    // Chromium switch: https://chromium.googlesource.com/chromium/src/+/HEAD/gpu/config/gpu_switches.cc
    launchOptions: { args: ["--disable-gpu-rasterization"] },
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    // WHY: Traces duplicate the 302 MiB asset corpus; PNG/JSON evidence is enough.
    trace: "off",
    video: "off",
    navigationTimeout: 20_000,
    actionTimeout: 10_000,
  },
  webServer: [
    {
      command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
      url: "http://127.0.0.1:4173/",
      reuseExistingServer: false,
      timeout: 20_000,
    },
    {
      command: "npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
      cwd: fileURLToPath(
        new URL("./test-results/desktop-unchanged-baseline/", import.meta.url),
      ),
      url: "http://127.0.0.1:4174/desktop-unchanged-provenance.json",
      reuseExistingServer: false,
      timeout: 20_000,
    },
  ],
});
