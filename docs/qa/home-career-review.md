# Home career review — 2026-10-05

## Selected scope

Base: main `533d33b4c3da0488a51554561593fff263869ed8`. Local branch: `feature/home-career-visibility`.

The selected implementation reuses the existing Education hierarchy, white background, container, type sizes, spacing, button and responsive columns for Home career content. Photos and the former career-only navy motion are removed. The final company boxes add the user-approved 1px #e4e4e7 border, 10px radius and 24px padding on desktop/mobile, with no shadow; the section heading remains outside the boxes. Both companies use the role AI Product Manager. Products and Outcomes share the same h4 style, with product names listed below Products; repeated product prefixes are removed from outcome lines. Internal outcome-to-product fields and source-link titles preserve the correct association. Long product-description/contribution paragraphs are omitted. Desktop card heights use grid stretch; mobile cards retain content-driven heights. Outcomes are short factual lines, with AiCall's FY2024 Japanese market ranking before the CareCall results and the verified A.Dot GDWEB design award and subscriber reach before the SK Telecom CTR change. The award is linked to its official product entry and is not described as a government or individual award.

The user-selected Home product labels are NAVER Care Call, NAVER Care Call Console, and LINE WORKS AI Call. Source branding remains in each outcome's product field. The visible dropout and CTR lines omit qualifiers at the user's request; this changes display copy, not the scope of evidence. `measurementContext` retains: dropout 33%→8% derives from complementary completion 67%→92% in event trials with general visitors, following the user's clarification; CTR +3.74 percentage points is from staged content tests versus January, with raw CTR, click/impression definitions and sample size still needing confirmation. “AI Call dropout” remains internally associated with CLOVA CareCall, not LINE WORKS AiCall.

Hero, company carousel, footprint gallery, Qualified CTA, shared controls and other pages are unchanged. Education has one explicitly requested text-only exception: its Research Focus paragraph is one revised sentence, with the forced line break removed and natural responsive wrapping retained. Its photos, structure and styling remain unchanged. The other three protected Home sections were compared to the base source byte for byte. No dependencies or deployment settings changed.

## Local verification

Environment: Linux, Node24.19.0, npm11.9.0. Final source checks:

- `npm run check`: lint, typecheck, 97 unit tests and root production build passed.
- `VITE_BASE_PATH=/ npm run test:pages`: 14 tests passed; 14 HTML entries and358 byte-verified assets checked.
- `VITE_BASE_PATH=/breadme/ npm run build` then `VITE_BASE_PATH=/breadme/ npm run test:pages`: build and14 tests passed with the same14 entries/358 assets.
- `git diff --check`: passed.
- Cold App and Articles lazy-import assertions exceeded the previous 1-second query timeout in the test runner. They now wait up to 5 seconds for actual content with all route/path assertions preserved. No runtime error was filtered out.
- The new E2E assertions cover320/390/768/1440px, white background, no career photos/motion, Education-like title sizes/columns, untouched logo/education counts, outcome order, 1px border/10px radius/24px padding/no shadow, equal desktop card heights, links and Back. **These final browser assertions were not executed locally.**

## Browser and visual evidence limits

The repository's normal desktop Playwright launch was attempted earlier with the installed Chromium and failed before page execution: `socket() failed: Operation not permitted`, alongside Crashpad startup errors. No policy override, browser flag workaround or mobile-emulation workaround was used.

As-is evidence comes from exact-base CI [Foundation run37299633008](https://github.com/nana-park/breadme/actions/runs/37299633008), artifact `home-checkpoint`, captured2026-10-05 at390×844 and1440×900. It is historical same-SHA evidence, not a new live mobile audit.

Private To-be images are deterministic SVG layout studies built from the final content and selected style values. They are **not browser screenshots, animation tests, or proof of pixel-exact browser rendering**. As-is source pixels in comparison images were preserved and bytewise pixel-compared to the original capture regions. No private source document or raw portfolio file is placed in this repository.

## Still required before publication

- Explicit permission to publish the selected branch and its text to GitHub; no push/PR has been completed.
- Exact-candidate CI browser checks and desktop/mobile PNG inspection once the approved branch can run CI.
- Separate authorization for main merge/deployment; local tests and design approval do not authorize either.

The obsolete first local design commit must not be published on its own. The final selected tree must be the reviewed branch tip.
