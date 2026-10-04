# Mobile UI baseline capture

This evidence-only harness captures all 14 routes from `src/config/originalRoutes.ts` at 320, 360, 375, 390, 430, 767, 768, and 1440 CSS pixels. It makes 14 route navigations and 112 named viewport steps. Resizing reuses the loaded route to keep large-media detail pages inexpensive; these observations do not prove fresh-navigation or interaction behavior.

Run after the production build, using the authorized CI browser renderer:

```sh
MOBILE_UI_CAPTURE_ONLY=1 npx playwright test --config=playwright.mobile-ui.config.ts
```

List cases without launching a browser:

```sh
npx playwright test --config=playwright.mobile-ui.config.ts --list
```

The preview server uses port 4173. `MOBILE_UI_BASE_URL` optionally selects a built deployment (include its trailing slash). `MOBILE_UI_CAPTURE_ONLY=1` is the default and only accepted mode until screenshot review establishes precise regression assertions.

## Evidence

- `test-results/mobile-ui/`: top viewport PNGs at 320, 390, 430, 768, 1440; geometry JSON at every width; one short route summary.
- `playwright-report/mobile-ui/`: independent HTML report with named screenshot/JSON attachments.
- Case IDs: `<route>--w<width>--top`.
- Actual computed heading and body fonts, element boxes, rendered text-node Range fragments and grouped line rectangles, clipping ancestors and their client boxes, touch-control dimensions, document overflow, and individual overflow candidates.
- Text outside the top viewport is retained when laid out and marked `inViewport: false`. Hidden/inert text is excluded. Range evidence is bounded to 2,000 rendered text nodes and reports truncation explicitly. Body samples cap at 150; overflow candidates cap at 250.
- Readiness records awaited fonts, decoded first-screen images, and four stable animation frames, with bounded image/layout waits. There is no `networkidle` dependency or fixed settling sleep. Fonts await the real font-ready promise inside the overall test timeout.

This baseline does not assert universal text size, wrapping, clipping, touch-target, or overflow thresholds. Scroll containers, intentional display labels, transforms, and decorative overflow require screenshot review. A green run means evidence capture succeeded, not that the page passed visual QA. Readiness flags and browser errors must be reviewed; missing or undecoded images are recorded rather than silently called ready. Fresh-navigation open-menu PNG/geometry cases also cover Projects, Articles, and Voice IVR at 320 and 390. They record the final computed colors and font sizes without assuming the source-CSS candidates are defects. No detail-page full-height screenshots are made. Existing app sources, workflows, normal e2e gates, and snapshot baselines are untouched.
