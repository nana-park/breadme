# Research journal-index labels — 2026-10-09

## Scope and source
- Approved mobile and desktop mockups were read before implementation. Mobile date and label are on one row, no separator dot. Desktop date stays left, label aligns above its title.
- Baseline: `cf2da1396f888ba217e174d9e65b67a932b2a4e1`.
- Index labels are derived exclusively from existing inline journal metadata: first two SSCI, third KCI. Conference-only fourth entry remains unbadged.
- This presentation change does not correct or independently validate bibliography. Existing paper titles, actual dates, journal/conference names, descriptions, topic tags and destinations are preserved.

## Implementation
- Canonical source override: `scripts/apply-research-index-badges.ts`, wired in `convert-original-pages.mjs`.
- Generated output: `OriginalResearchContent.tsx`; page-owned styling: `OriginalPage.module.css`.
- Small static badge: #1a1a1a / white, 24px high, 8px horizontal padding, 12px semibold, 4px radius; 8px space to title.
- Mobile through 767px: original date-column presentation is hidden; a source-derived date presentation follows the badge with 8px gap and vertical centering. At larger widths this copy is hidden and the original date presentation remains. Only one is visually and accessibly exposed at a time.
- Existing 1024px row-layout boundary is preserved. No new buttons, keyboard stops or simulated links.

## Verification and evidence
- Content-conservation and canonical regeneration/idempotence unit tests.
- Focused production-path browser checks run at mobile 390px and desktop 1440px, including after publication, plus responsive boundaries in focused checks.
- Dedicated review workflow captures immutable AS-IS and candidate TO-BE. Content-only crops omit fixed Header/skip/materials chrome during capture; actual behavior tests keep the real UI.
- Current exact-commit results and artifact links are recorded on the review PR. No screenshots or browser outcomes are claimed until that workflow completes.
- Actual-device, Safari/Firefox, screen-reader and native zoom verification are outside this browser run.
