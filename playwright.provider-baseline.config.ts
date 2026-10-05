import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import mobileConfig from "./playwright.mobile-ui.config";

// WHAT: Run the identical Voice IVR UI cases against unchanged, immutable main.
// WHY: Preserve provider/runtime errors as failures and capture their stacks;
// never whitelist an error string or attribute it to a vendor without evidence.
export default defineConfig(mobileConfig, {
  testMatch: "interactive-states.spec.ts",
  grep: /llm-based-voice-ivr: all tabs and rightmost comparison/,
  outputDir: "test-results/provider-baseline",
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "playwright-report/provider-baseline", open: "never" },
    ],
  ],
  use: { ...mobileConfig.use, baseURL: "http://127.0.0.1:4174/" },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
    cwd: fileURLToPath(
      new URL("./test-results/desktop-unchanged-baseline/", import.meta.url),
    ),
    url: "http://127.0.0.1:4174/desktop-unchanged-provenance.json",
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
