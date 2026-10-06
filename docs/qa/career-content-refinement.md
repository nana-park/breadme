# Career content refinement — 2026-10-06

## Scope

- Remove Career's duplicate Education section at every viewport. Keep Home Academic Standing, both degrees, images and publication links unchanged.
- Keep the Team Work introduction's exact words; hide its authored `br` only below 768px so mobile text wraps naturally. Keep the desktop break.
- Make mobile testimonial cards square with a maximum 350px width (viewport minus 48px on narrower screens), 16px padding, 14px/1.45 quotes, and 12px/1.35 attribution. Preserve all six quotations and authors. Let cards grow beyond square when enlarged text needs more height, rather than clipping text.
- Keep desktop testimonial dimensions/styles, career pagination, testimonial navigation, Home content, shared navigation and materials controls unchanged.

## Source and regeneration

The local base `7674290b025cff186cc340b64c2055067aceeb92` has tree `325f2396ddd23e73bb39fe459732980977200144`, verified equal to main merge `9f3aaba0cbfa581fd420058ef1ef0989fe4f5705` through GitHub's Git commit response.

`applyCareerContentOverrides` runs before the converter counts or renders elements. Tests verify its Career-only removal, idempotence, retained intro text/desktop break, and lack of Home changes. The Career manifest reflects 140 elements, 285 text nodes, and three remaining sections. The original Portfolio repository is not modified. A complete pinned-source regeneration was not run in this workspace.

## Executed checks

- `npm run check`: passed lint, typecheck, 100 unit tests and production build.
- `npm run test:pages`: passed 14 static-page tests, with 14 HTML entries and 358 byte-verified assets.
- `git diff --check`: passed.
- Home generated content, Home components and Home experience data: unchanged from the base.
- `playwright test tests/e2e/career-content-refinement.spec.ts --list`: parsed seven test cases.

## Pending browser verification

Local Chromium launch fails because the executor blocks its process socket (`socket() failed: Operation not permitted`). No local screenshot, dimension measurement, or visual pass is claimed.

The new E2E suite is included in the existing Foundation checks workflow and must pass on the exact published PR commit before calling visual QA complete. It covers 320/390/430/767/768/1440px, all six cards and full author text, career pagination, testimonial keyboard forward/back navigation, removed section/snap target, Home education, and synthetic 200% text reflow. Synthetic enlargement is not native browser zoom. Actual mobile devices and Safari remain unverified.

## First CI reflow correction

The initial PR #8 Chromium run passed all six normal-width Career cases (320/390/430/767/768/1440px), including square mobile cards, full quotes/attributions and preserved desktop sizing. Only the synthetic 200% reflow case failed its content-fit assertion. Its original failure screenshot showed the page top, not the enlarged cards, and diagnostics were attached after the failing assertion.

The mobile card now uses its width as a minimum height with automatic content-driven height and a non-shrinking quote. This preserves the normal square while allowing enlarged text to grow naturally without an aspect-ratio constraint. The test scrolls to the actual card, records every child box/font/scroll size and captures the enlarged first card before assertions. No clipping assertion was removed or relaxed; stars and horizontal containment are also covered. Exact-commit CI verification of this correction remains pending.
