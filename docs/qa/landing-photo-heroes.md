# Combined portfolio review

Baseline main: `7a029aa`. Scope: Contact-style photo introductions on Qualifications/Products/Research/Articles, Products-first black / Full career white Home action, and compact mobile About/Projects accordion.

- Existing photos remain, with a 60% black overlay (white-copy minimum contrast 5.74:1). Titles are shortened and previous introductory meaning retained in small copy.
- Only mobile (through 767px) becomes left-aligned; tablet and desktop remain centered. Text grows the panel instead of clipping.
- Articles reading view, pagination and return behavior stay unchanged. Mobile snap targets follow the new hero position.
- Hero E2E coverage: every changed route at 320, 390, 430, 768, 1440px, including 320×640 and larger viewports, loaded photos, bounds, typography/alignment, overflow, screenshots and enlarged copy.
- Fresh combined verification passed lint, typecheck, 144 unit tests in 18 files and production build. `/breadme/` static verification passed all 14 page cases and 358 asset hashes.
- Actual browser testing is delegated to the existing authorized GitHub CI workflow; previously denied local/browser routes are not retried.

## Current verification

Local checks passed. CI browser screenshots and interaction results pending. No claim of physical-device, Safari, Firefox or assistive-technology coverage.
