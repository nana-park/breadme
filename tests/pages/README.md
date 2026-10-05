# GitHub Pages path checks

This suite is separate from the source/interaction E2E checks. It
checks the production `/breadme/` base, real static HTML entries, and deployed
resources rather than repeating the full interaction suite.

## Build and check the artifact

```sh
VITE_BASE_PATH=/breadme/ npm run build
npx playwright install --with-deps chromium
npx playwright test --config=playwright.pages.config.ts
```

The config starts `static-server.mjs` on `127.0.0.1:4180`. It serves only `dist`
under `/breadme/`; missing files and requests outside that base return HTTP 404.
It has no SPA rewrite or Vite preview fallback. `PAGES_PORT` changes the local
port if needed. The build is intentionally separate so CI tests the same
artifact it will upload.

## Check the published site

```sh
PAGES_BASE_URL=https://nana-park.github.io/breadme/ \
  npx playwright test --config=playwright.pages.config.ts
```

A `PAGES_BASE_URL` override skips the local server entirely. The URL must end in
`/breadme/`, so an accidental root-path run cannot count as production QA.

## Coverage and evidence

The suite currently discovers **34 tests**: 17 cases at both 390×844 and
1440×900.

- All 14 route files: direct HTTP 200, correct page identity, refresh, images,
  loaded local fonts/CSS, responsive overflow, and internal-link base
- Home and Voice IVR detail: top and full-page screenshots at both widths
- Home: approved text-led heading, preserved role, no Spline viewer, and no
  `.splinecode` or Spline viewer runtime request
- Home → Projects → nested Voice IVR detail: navigation, refresh, and browser Back
- Articles: direct hash-detail load, refresh, return to archive, and browser Back
- Unknown top-level and nested files: HTTP 404 and no false Home page; a missing
  JavaScript asset also stays 404

Each test attaches a JSON network/runtime report. App-origin HTTP failures,
request failures, console errors, runtime errors, and requests escaping the base
fail the suite. Expected missing-page responses and the browser's implicit
root favicon are distinguished from app resource failures. Navigation-cancelled
requests are ignored, since real document navigation can cancel media downloads.

Tests never submit contact forms. The test browser blocks all non-read HTTP
methods, including third-party embed telemetry, so no attempted write is sent.
App-origin write attempts fail the suite. Blocked external writes are recorded
separately as `blockedExternalWrites` in the JSON evidence; preserved YouTube
telemetry attempts do not count as app deployment failures. External responses
are not mocked. External console output is retained, while app-origin resource
failures and all uncaught runtime errors remain failures. The text-led Home
does not render Spline; archived assets are still hash-verified by static checks.

Reports: `playwright-report/pages/` and `test-results/pages/`. Traces stay off to
avoid duplicating the large original media in each failure report.

Discover the cases without launching Chromium:

```sh
npx playwright test --config=playwright.pages.config.ts --list
```

Passing lint, type checks, or test discovery does **not** mean browser execution
passed. CI and the post-deploy run must establish the browser results.
