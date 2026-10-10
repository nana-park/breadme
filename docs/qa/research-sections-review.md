# Research three-section review — 2026-10-09

## Status and scope

- **Review-only candidate. No main merge or deployment is included.** Creating a preview, updating documentation or passing tests does not authorize publication.
- **AS-IS baseline:** [`ecc017c66e645f156c87e447b3442d3d5f8b8ff3`](https://github.com/nana-park/breadme/commit/ecc017c66e645f156c87e447b3442d3d5f8b8ff3), the existing four-row Research list with previously approved journal badges.
- **TO-BE:** the existing Research photo Hero → Journal Publications (3) → Ongoing Research (2) → Conference Presentations (4 unique). Same route and global navigation; no new page/filter.
- **Candidate commit, PR, exact-head CI and matched browser captures: pending.** None is implied by the baseline or by an older QA report. Fill in verified links/results when available.
- Content evidence: the user-supplied publication-list screenshot and retained baseline/publisher references in the [source audit](../content/research-source-audit.md). The screenshot is a content source, not a new visual design specification.

## Implementation ownership and regeneration

| Concern | Candidate owner |
| --- | --- |
| Explicit titles, journal/institution lines, dates, statuses, descriptions, tags and destinations | `src/content/research/publications.ts` |
| Three semantic research sections and optional actions | `src/pages/original/ResearchSections.tsx` |
| Page-owned section layout, heading typography and spacing | `src/pages/original/ResearchSections.module.css` |
| Retained journal label and responsive date presentation | Existing `src/pages/original/OriginalPage.module.css` rules |
| Mobile proximity-snap boundaries | `src/config/mobileScrollSnap.ts`: Research Hero plus the three sections, not individual papers |
| Replacement of legacy list with the component during canonical regeneration | `scripts/apply-research-sections-override.ts`, called by `scripts/convert-original-pages.mjs` |
| Existing top Research Hero and generated page connection | `generated/OriginalResearchContent.tsx` / existing `LandingPhotoHero` |

The explicit content source supersedes the old generated list as the place to edit research items. The earlier `apply-research-index-badges.ts` behavior remains historical provenance for the accepted labels; it must not reintroduce mixed metadata, old titles or the four-row list after regeneration. Preserve the fixed canonical original source `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0` and demonstrate this override on that input. Do not infer whole-repository idempotence from a focused unit test or hand-edited generated output.

The page README, component-adoption table and [current intra-page IA](../product/routes-and-content.md#research의-본문-ia-2026-10-09-검토용) are updated together. Existing IA SVG/PNG files remain unchanged because all menu routes, detail links and the count of 14 HTML pages remain unchanged.

## Visual acceptance contract

### Three section headings

Use Qualifications' actual **Academic Standing** heading as the reference, not a new style proposal:

| Property | Expected value |
| --- | --- |
| Semantic role | `h2` for Journal Publications, Ongoing Research, Conference Presentations |
| Font family | `var(--font-sans)` |
| Font size | 24px through 767px; 28px at 768px and above |
| Weight / line height | 500 / 1.5 |
| Letter spacing / color | -0.025em / #18181b |
| Title bottom margin | 12px |
| Header-block bottom spacing | 48px |
| Surface/decorations | No box, border treatment, icon or decorative heading variant |

Compare computed values with the retained Qualifications reference at both mobile and desktop widths. Inspect alignment and section rhythm visually; equal CSS declarations alone are not proof of a matching rendering. Do not alter Qualifications or shared global typography to make this comparison pass.

### Journal labels and list behavior

- Keep the approved noninteractive SSCI / SSCI / KCI appearance: #1a1a1a fill, white 12px semibold text, 24px height, 8px horizontal padding, 4px radius and 8px gap to title.
- Mobile through 767px: label and displayed date share one row, 8px gap, vertically centered, without a new separator dot. Only one date presentation is exposed visually and accessibly at any breakpoint.
- Preserve the established tablet/desktop date layout, including the stacked tablet arrangement and desktop date column; test both the 768px typography boundary and the 1024px row-layout boundary.
- Ongoing and conference sections have no journal-index badge. `In Progress` is a status. Long new titles and institution lines wrap naturally without ellipsis or fixed-height clipping.
- Retain existing light topic tags and journal/C3 summaries, and their reading hierarchy. New items without descriptions/tags do not receive filler copy or empty decorative placeholders.
- No invented link controls. A row with no destination contains readable content without a fake button or keyboard stop.
- Retain the existing Hero, common navigation, Footer/materials behavior and native mobile proximity-scroll behavior. Targets are the Hero and three full research sections; avoid individual-paper targets, empty legacy-list headings, blank section space and obsolete targets. The list stays within 1200px, with 64px top padding per section and the 48px header spacing above.

## Content and source-conservation checks

| Check | Expected outcome | Status |
| --- | --- | --- |
| Section order and unique counts | 3 journals → 2 ongoing → 4 conferences, 9 entries total | Pending runtime check |
| Journal classifications | SSCI, SSCI, KCI only, no badges on other sections | Pending runtime check |
| J1 title/date | Screenshot's journal title, year `2026`; retain original ScienceDirect destination | Pending runtime check |
| J2 normalization | Proposed publisher title, `December 2025`, retained DOI; user-approval caveat recorded | Pending runtime and content review |
| J3 wording/date | Existing English title retained, year `2022`, retained DOI; no KCI-title normalization | Pending runtime check |
| Ongoing metadata | Exact two titles/institution lines; `In Progress` only; no date, index, abstract or action | Pending runtime check |
| Conference deduplication | Omni-Channel appears once, not twice | Pending runtime check |
| Conference dates | Source-listed dates retained with no assertion of independent event-date validation | Pending runtime and content review |
| Existing actions | Three journal links and C3 Conference/PDF preserved exactly; asset helper respects base path | Pending runtime/link check |
| Missing destinations | No new links/buttons on O1/O2/C1/C2/C4; no new Research Google Scholar link | Pending runtime check |
| Retained summaries/tags | Existing three journal and C3 copy preserved; no invented summaries/tags for new rows | Pending source/runtime comparison |
| Mixed legacy metadata | ICA/ergonomics conference labels removed from journal metadata, no precursor claims | Pending runtime check |
| Canonical override | Pinned-source regeneration contains one `ResearchSections` connection, no legacy list or duplicate sections | Pending execution |
| Repeat regeneration | Focused research output remains stable after repeating the canonical conversion | Pending execution |

The [source audit](../content/research-source-audit.md) is the authority for exact strings and unresolved conflicts. A successful render or content-equality assertion does not settle J2 approval, the J1/J3 date conflicts, institutional roles or conference-date provenance.

## Browser evidence plan — pending

Capture AS-IS and TO-BE from the pinned baseline and an identified candidate commit using the same browser, viewport, device scale and font/asset readiness conditions. Record exact commits, capture time, browser version, base path and artifact link. Existing unrelated screenshots or supplied content screenshots do not establish that the candidate renders correctly.

| Evidence | Required scope | Current state |
| --- | --- | --- |
| Full Research reading flow | Matched 390px and 1440px full-page captures with retained Hero/common chrome | Not captured in this documentation pass |
| Section close-ups | All three complete sections at 390px and 1440px, including long ongoing titles and last conference row | Pending |
| Heading style reference | Qualifications Academic Standing and each Research section header at matching 390px and 1440px widths; computed-style report | Pending |
| Responsive boundaries | 320, 390, 430, 767, 768, 1024 and 1440px; no document overflow/clipping; title/date behavior | Pending |
| Enlarged text | Clearly identified synthetic text enlargement at small/mobile and desktop widths; labels, dates, institution wrapping and actions | Pending; not native browser zoom |
| Navigation/regression | Direct route entry, refresh, menu navigation, repeated visit and Back/Forward; `/` and `/breadme/` production paths | Pending |
| Keyboard/accessibility | Heading order, named sections/actions, focus visibility, no false interactive labels, one accessible date per item | Pending; not a full accessibility audit |

Section-only crops may omit fixed chrome solely for a legible capture if that is documented. Keep full-page context separately and test actual navigation/interactions with the real UI. Inspect images rather than relying only on screenshot generation or DOM counts. Native browser zoom, screen-reader use, actual phones and Safari/Firefox remain unverified unless separately executed and documented.

## Executed checks

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Screenshot transcription and existing-source inspection | Completed for documentation | Nine unique entries mapped; duplicate, title/date conflicts and absent destinations recorded in source audit |
| Documentation consistency / local file links | Passed at documentation handoff | 123 relative file targets across the five edited/new documents exist; component/data/override/CSS/snap ownership reconciled with source |
| Documentation whitespace check | Passed at documentation handoff | Scoped `git diff --check` plus explicit whitespace/newline checks of all five documents; no code/runtime result implied |
| Whole-worktree `git diff --check` | Pending final candidate pass | Implementation/test edits continue independently; the scoped documentation check does not certify the aggregate diff |
| Lint / TypeScript / unit tests / production build | Not run by documentation task | Implementation owner must record exact command/result and candidate revision |
| Static production paths `/` and `/breadme/` | Not run by documentation task | Do not infer from earlier branch tests |
| Canonical regeneration and repeated-output checks | Not run by documentation task | Record the actual pinned input and changed-file scope |
| Focused browser/AS-IS–TO-BE evidence | Pending | No new screenshot or CI pass is claimed here |
| Exact-head CI | Pending | Add verified run/PR links when available; older commits do not certify the candidate |

## Remaining review and release boundary

- [ ] User accepts or rejects J2's proposed formal publisher-title normalization.
- [ ] User reviews the nine-item content, source-listed dates, year-only conflict handling and exact institution strings.
- [ ] All three section headings match Academic Standing, and retained badges pass responsive visual inspection.
- [ ] No regression to Research Hero/navigation, Qualifications reference content or existing journal/C3 actions.
- [ ] Applicable local aggregate checks and exact-candidate CI results are recorded, with failed/blocked/unrun scopes explicit.
- [ ] Matched AS-IS/TO-BE screenshots are captured, inspected and linked with immutable revision provenance.
- [ ] Any main merge or deployment receives separate explicit approval.

Report failed or unavailable checks with their actual tool/environment error and impact. Do not convert pending checks into passes, copy a historical environment failure as the present blocker, or call the candidate ready to publish while review decisions are unresolved.
