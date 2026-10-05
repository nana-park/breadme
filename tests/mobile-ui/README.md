# Mobile UI evidence capture

This bounded diagnostic harness captures the 14 routes from `src/config/originalRoutes.ts` and all 18 article identities from the source-fidelity fixtures. It adds reading, menu, and text-enlargement states without changing normal e2e gates or screenshot baselines. A green run means capture and existing navigation contracts succeeded, **not that visual QA passed**.

## Run

Build first, then run using the authorized CI browser renderer:

```sh
MOBILE_UI_CAPTURE_ONLY=1 npx playwright test --config=playwright.mobile-ui.config.ts
```

List cases without starting a server or browser:

```sh
npx playwright test --config=playwright.mobile-ui.config.ts --list
```

The preview server uses port 4173. `MOBILE_UI_BASE_URL` optionally selects a built deployment; include its trailing slash. `MOBILE_UI_CAPTURE_ONLY=1` is the default and only accepted mode until screenshot review establishes precise visual regression assertions. Do not treat a browser that could not launch as a tested environment.

## Coverage

- `mobile-baseline.spec.ts`: 14 fresh route loads, each resized to 320, 360, 375, 390, 430, 767, 768, and 1440 CSS pixels. All 112 viewport steps save geometry. Top screenshots are saved at 320, 390, 430, 768, and 1440. Resizing avoids loading large detail media eight times; it does not prove fresh-navigation behavior at every width.
- `menu-baseline.spec.ts`: Projects, Articles, and Voice IVR menus opened after fresh navigation at 320 and 390, with screenshots and final computed typography/colors.
- `reading-states.spec.ts`: all 18 articles directly opened at 390, each captured at the top, body midpoint, and original-source link. The original-source links are inspected without visiting the external site. Body image decoding, intrinsic/rendered aspect ratios, captions, quotes, and body geometry are recorded.
- The longest-title article also has eight resize steps at the same widths as the route baseline, including 1440. This is representative reading-layout coverage, not an 18-article × eight-width matrix.
- At 320, the long Clubhouse article has top/middle root-font and synthetic text-enlargement probes. The longest-title article opens from archive page 3, then tests browser Back/Forward and Back to List, including pagination, focus, and scroll restoration. Projects expanded content and the long Lectures title also have root-font probes.
- Contact and Enjoy have 320px synthetic computed-text-200% hero captures for inspecting reflow inside their fixed-height media/overlay structures. These record evidence without asserting a defect.
- Menu states cover 844×390 landscape at normal text, plus synthetic text enlargement at 320×844 and 844×390. They capture the top and final materials control and check Escape, repeated open/close, focus return, removal of background inertness, and restoration of the body's prior inline overflow.

The fixture JSON is already checked against the React article metadata and body fingerprints by `src/content/original/articles/articles.test.tsx`. It can be imported without loading React bodies or Vite-only asset imports.

### What “200%” means here

These two probes are deliberately distinguished in test names and JSON:

1. **Root font 200%** doubles the root element's computed font size. Fixed-pixel text may remain unchanged. Actual before/after font samples are recorded; this is not a claim that all visible text doubled.
2. **Synthetic computed text 200%** freezes all HTML font sizes and numeric line heights in the selected subtree, then doubles them. It records before/after text samples and checks the requested scale actually applied. This stresses fixed-pixel text without doubling inherited values repeatedly. It is not native browser zoom, OS text scaling, or an accessibility conformance result. Pseudo-elements and browser settings are not emulated.

Neither probe replaces real browser text zoom or device accessibility-setting checks. No application styles are changed by these isolated browser-fixture mutations.

## Evidence and review

- `test-results/mobile-ui/`: viewport-sized PNGs, geometry JSON, and route summaries.
- `playwright-report/mobile-ui/`: independent HTML report with screenshot/JSON attachments.
- Landing case IDs: `<route>--w<width>--top`; reading states append `top`, `middle`, `source-link`, or a named enlargement/navigation state.
- Actual computed heading/body fonts, element boxes, rendered text-node Range fragments and grouped line rectangles, clipping ancestors/client boxes, touch-control dimensions, document overflow, and individual overflow candidates are captured.
- Laid-out text outside the screenshot is retained as `inViewport: false`; hidden/inert text is excluded. Range evidence caps at 2,000 rendered text nodes and explicitly reports truncation. Body samples cap at 150; overflow candidates cap at 250. Synthetic enlargement samples cap at 60 and also report truncation.
- First-screen readiness awaits fonts, bounded image decoding, and four stable animation frames. Article readiness additionally attempts decoding every article body image. Mid-body settling preserves the current scroll position rather than calling the first-screen helper, which intentionally resets to the top. There is no `networkidle` dependency.
- Reading-state JSON includes runtime page errors. Missing/undecoded images, incomplete layout settling, image crops/stretch candidates, and off-viewport controls remain reviewable observations. A midpoint screenshot does not show every paragraph or image.

This baseline does not assert universal font-size, wrapping, clipping, touch-target, or overflow thresholds. Scroll containers, display labels, transforms, and decorative overflow require screenshot review before becoming defects. No detail-page full-height screenshots are generated. The 1440 captures are comparison evidence; screenshots alone do not prove desktop pixels stayed unchanged.

## Existing behavioral regression coverage

The diagnostic config only runs `tests/mobile-ui`. Run the ordinary e2e suite separately; the diagnostic run does not replace or imply a pass for these tests:

```sh
npx playwright test tests/e2e/mobile-scroll-snap.spec.ts tests/e2e/mobile-controls.spec.ts tests/e2e/articles.spec.ts --workers=2 --retries=0
```

- `mobile-scroll-snap.spec.ts`: native section snap on all 14 routes at 390; free document scrolling across all 14 routes at 1440; the 767/768 boundary; reduced-motion behavior; fixed-header hash anchors and keyboard skip navigation; article history and interior reading; expanded project content; independent horizontal gallery scrolling; detail/gallery overlap contracts.
- `mobile-controls.spec.ts`: repeated keyboard focus containment and dismissal, preservation of existing inert/overflow values, header transitions at 1023/1024, desktop Escape, and materials-panel behavior.
- `articles.spec.ts`: archive pagination, reading and original-source links, direct detail links, and Back/Forward/list restoration at 390 and 1440.

Remaining manual/extended checks include real iOS Safari/Android devices, touch gestures and carousel swipes (the existing gallery test uses horizontal wheel input), screen readers, native browser text zoom, every article image in-view, and fresh navigation at every width. Default diagnostic captures use reduced motion; normal-motion snapping is exercised by the separate regression suite above.

## Strict regressions and desktop guard

The evidence-only descriptions above apply to the baseline/reading capture files. `readability-regressions.spec.ts` now adds screenshot-grounded assertions for landing text, menus, footer controls, Lectures, About, Awards, Career, and enlarged Contact/Enjoy. `interactive-states.spec.ts` covers non-default tabs, disclosures, table scrolling and photo controls. `article-image-ratios.spec.ts` checks every original body image's decoded aspect ratio. These strict cases must pass; capture completion is still not a substitute for reviewing the actual PNGs.

The independent desktop guard is excluded from the mobile config. Run after the candidate build:

```sh
node scripts/prepare-desktop-unchanged.mjs
npx playwright test --config=playwright.desktop-unchanged.config.ts
```

It builds immutable main `4f026a3`, verifies reused original assets, and compares the first viewport and complete footer of all14 routes at768/1440 in the same Chromium installation. Exact decoded-pixel comparisons are required. Dynamic video/iframe/canvas pixels are hidden on both sides while their geometry is recorded. This does not claim full-page, all-state, video-frame, Safari or physical-device equivalence. Reference output lives in `test-results/desktop-unchanged-baseline/`; evidence in `test-results/desktop-unchanged/`.

Explicit pending item: the original Mentoring detail JSX remains unchanged because uploading its preexisting demo payload was blocked. Its two optional typography hooks are not applied. The corresponding strict route case is annotated `pending-typography-hook` and verifies the original32px headline/14px copy plus the shared menu/footer. It does not count as the16px editorial-copy upgrade being complete.
