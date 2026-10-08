# Education and working-principles IA — 2026-10-08

## Status and authority

- Approved scope: reorganize the existing Home, Qualifications and About content as described below. Keep menu labels/URLs and Career unchanged.
- AS-IS source: worktree starting commit `58a617a3bb60261f750a2cf9fb46979e81decd82`.
- TO-BE source: this working branch; final commit and exact-commit check results are not recorded yet.
- **Browser AS-IS/TO-BE evidence is pending.** This is a QA report skeleton, not a visual pass. No screenshots, layout measurements, browser interactions or accessibility results are claimed by this document.
- **No main merge or deployment is included.** A document update, local implementation, successful check or review request does not establish approval or completion of publication.

## Approved content and order

| Page | AS-IS | TO-BE |
| --- | --- | --- |
| Home | Full Academic Standing after career and before the lower CTA | Keep `#history-2` at that location as a compact summary: M.S. in Human-AI Interaction / Sungkyunkwan University; B.A. in Psychology / Sookmyung Women's University; link to `qualified.html#history-2` |
| Qualifications | Hero → Core Competencies → certifications → `#how-work` | Hero → full Academic Standing at `#history-2` → the same six Core Competencies cards → the same certifications and tabs |
| About | Biography/identity → Media | Biography/identity → the existing four `#how-work` principle cards → Media |
| Career and navigation | Existing career/recommendations and menu labels/URLs | Unchanged |

The old `qualified.html#how-work` deep link is preserved through a replace navigation to `about.html#how-work`; no new menu route is added. Home keeps its own `#history-2` summary anchor while Qualifications uses that ID for the full section in its separate document.

## Content-preservation inventory

The relocation must preserve the existing content, rather than recreate or summarize it at the destination:

- Academic header and introductory copy; View publications → `research.html`; the same Google Scholar destination and external-link attributes.
- M.S. in Human-AI Interaction, Sungkyunkwan University, March 2021 – February 2023; `nahyun_imported/image_source/HOME/MS.jpg`; existing Research Focus sentence, image description, crop and styling.
- B.A. in Psychology, Sookmyung Women's University, March 2015 – February 2021; `nahyun_imported/image_source/HOME/Sookmyung.jpg`; Double major in ESG Management, Minor in Business Administration and the existing Research Focus paragraph, image description, crop and styling.
- Four working-principle cards, in order: Persuasive Storytelling, Efficiency-Driven, Communication Architect, Inquiry-Driven Detection. Preserve the section introduction, card descriptions, tags and images.
- Preserve all six Core Competencies cards and existing certification content, filter labels and behavior. About's biography, identity diagram, Media and interview behavior remain present.
- Home's Hero, partner logos, footprint gallery, career and lower product CTA remain present and ordered. No full Academic Standing duplicate remains on Home, and no `#how-work` block remains on Qualifications.

The dates above are a human-readable inventory, not authorization to rewrite the original date strings. Copy and asset equality must be checked against the baseline, including the previously approved Research Focus wording.

## Source and regeneration

- The existing `generated/OriginalHomeContent.tsx`, `generated/OriginalQualifiedContent.tsx` and `generated/OriginalAboutContent.tsx` own the rendered markup. This change does not introduce new page components.
- `scripts/apply-education-ia-override.ts` is the canonical IA override, called by `scripts/convert-original-pages.mjs` before `applyLandingHeroOverride`.
- `OriginalPage.tsx` owns compatibility handling for `qualified.html#how-work` → `about.html#how-work`.
- Check the override on pinned original input and on repeated application. Confirm Home summary, full Qualifications education and About principles are each present exactly once, with the correct section order and unchanged destination content.
- Reconcile generated element/section counts in the conversion manifest only from a real conversion run; do not invent counts or overwrite unrelated changes.
- The IA SVG/PNG is intentionally unchanged: its menu hierarchy, page routes, detail links and count of 14 HTML pages are unchanged. The current intra-page mapping is documented in [routes and content](../product/routes-and-content.md).

## Browser AS-IS/TO-BE evidence — pending

Capture matched browser conditions for each comparison. Record browser/version, OS, viewport height, DPR, motion setting, fonts/assets readiness, UTC capture time, baseline commit, candidate commit and artifact paths. A diagram or generated mockup is not browser evidence.

| Evidence | Viewports and state | AS-IS | TO-BE | Visual review |
| --- | --- | --- | --- | --- |
| Home education | 390px and 1440px; career → education → lower CTA | Pending | Pending | Pending |
| Qualifications education | 390px and 1440px; Hero → full academic section → Core Competencies | Pending | Pending | Pending |
| Qualifications retained content | 390px and 1440px; all six cards, certification tabs and page bottom | Pending | Pending | Pending |
| About principles | 390px and 1440px; end of identity → all four principles → Media | Pending | Pending | Pending |
| Small width and reflow | 320px; longest academic/principle content and enlarged text | Pending | Pending | Pending |

Minimum affected-screen coverage is 320/390/767/768/1024/1440px. Use matching logical content states even where the section moved to a different route, and disclose that route difference. Separate synthetic text enlargement from native browser zoom. Preserve meaningful full-page context as well as close-ups of moved content; do not use only first-screen captures for this change.

## Interaction and regression checklist — pending

- [ ] Home education CTA resolves at `/` and `/breadme/` to Qualifications `#history-2`, including direct entry, refresh, Back/Forward and repeated navigation.
- [ ] Academic heading is visible below the fixed header after anchor navigation; no duplicate IDs exist within a page.
- [ ] Legacy `qualified.html#how-work` uses the replacement destination correctly without creating a Back loop; About `#how-work` also supports direct entry and refresh.
- [ ] Academic photographs and all principle-card images load; original paths, crops and destination content are preserved.
- [ ] View publications resolves correctly and Google Scholar preserves its exact destination/link attributes. A rendered link is not proof of remote availability.
- [ ] All six competencies remain visible; each of the four certification tabs can be selected repeatedly and displays the expected retained content.
- [ ] About's biography, identity diagram and Media/interview remain intact; missing third-party media availability is recorded separately from local content regressions.
- [ ] Mobile chapter order follows biography → identity → principles → Media, and Qualifications follows Hero → education → competencies → certifications. Long sections scroll naturally; no blank snap target or forced viewport clipping remains.
- [ ] Core competency mobile card treatment and existing header alignment survive the move; inherited About styles do not alter the working-principle layout unexpectedly.
- [ ] No horizontal document overflow, clipped content or overlapping controls at the required widths and enlarged text; existing horizontal certification scrolling remains usable where needed.
- [ ] Keyboard focus, link names, heading hierarchy and visible focus are checked. Reuse of existing styles is not an accessibility pass.
- [ ] Menu labels/URLs, Career source and unrelated page behavior are unchanged; inspect the final diff and run relevant existing regressions.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Documentation consistency and relative file links | Passed for six edited Markdown documents | Local relative file targets all exist; IA source filenames reconciled with the implementation owner. Final rendered-code verification remains separate |
| `git diff --check` | Passed at documentation handoff | 2026-10-08 UTC worktree snapshot; repeat after remaining implementation edits |
| Lint, typecheck, unit tests, build | Passed locally | `npm run check`, 2026-10-08 UTC: lint, TypeScript, 20 test files / 155 tests, production build. Exact review-commit CI results will follow. |
| Static pages under `/` and `/breadme/` | Passed locally | `npm run test:pages` after each matching build: 14 tests passed for each base. Browser paths remain subject to CI. |
| Browser automation and manual AS-IS/TO-BE review | Pending | No browser result or screenshot attached yet |
| Pinned-source regeneration and content conservation | Changed sections passed | `node scripts/convert-original-pages.mjs ../portfolio-reference-ia` against `8348159`; unit tests compare full moved DOM/media/copy against `58a617a`. Pre-existing unrelated generator output drift was excluded; repository-wide byte idempotence is not claimed. |

Do not turn an unrun test into a pass. If browser launch or a required asset is blocked, record the exact failure, affected checks and a supported next step. Historical browser failures in other reports are not evidence of the present environment's state.

## Remaining review

- Content/design review of the compact Home summary and new section order.
- Exact-commit automated results and matched browser AS-IS/TO-BE evidence.
- Actual devices, Safari/Firefox, screen readers and native browser zoom are unverified unless subsequently recorded with their own evidence.
- Main merge and deployment remain outside this work's scope.
