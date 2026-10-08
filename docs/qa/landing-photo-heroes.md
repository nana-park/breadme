# Combined portfolio review

Baseline main: `7a029aa`. Scope: Contact-style photo introductions on Qualifications/Products/Research/Articles, Products-first black / Full career white Home action, and compact mobile About/Projects accordion.

- Existing photos remain, with a 60% black overlay (white-copy minimum contrast 5.74:1). Titles are shortened and previous introductory meaning retained in small copy.
- Only mobile (through 767px) becomes left-aligned; tablet and desktop remain centered. Text grows the panel instead of clipping.
- Articles reading view, pagination and return behavior stay unchanged. Mobile snap targets follow the new hero position.
- Hero E2E coverage: every changed route at 320, 390, 430, 768, 1440px, including 320×640 and larger viewports, loaded photos, bounds, typography/alignment, overflow, screenshots and enlarged copy.
- Fresh combined verification passed lint, typecheck, 144 unit tests in 18 files and production build. `/breadme/` static verification passed all 14 page cases and 358 asset hashes.
- Actual browser testing is delegated to the existing authorized GitHub CI workflow; previously denied local/browser routes are not retried.

## Current verification

Local checks passed. For the latest exact-commit browser results and screenshots, see [PR #11](https://github.com/nana-park/breadme/pull/11). This file records the implementation and findings, not a live CI status. No claim of physical-device, Safari, Firefox or assistive-technology coverage.

## First CI findings and corrections

At head `1365dd3`, all 20 hero cases, the new menu cases and career action cases passed. Wider checks found three old menu-flow tests that still expected permanently visible submenu links; these now expand the relevant accordion before retaining their original navigation/loading assertions. The Products expanded-detail test exposed an animation-readiness race: the open attribute is set before the existing 400ms height animation restores overflow. An attempted snap suspension did not resolve this and was removed. The test now waits for the original inline box properties to return before scrolling, preserving all reachability and header-clearance assertions. Screenshot review also caught missing spacing-token fallbacks: the migrated shell does not load provisional foundation tokens, so the hero now explicitly falls back to Contact's 16px / 24px / 8px spacing. No permissions or deployment rules changed.
