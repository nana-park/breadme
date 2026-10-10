# Research content source audit — 2026-10-09

## Review scope and evidence

This is the content ledger for the **review-only** reorganization of `research.html`: Journal Publications (3) → Ongoing Research (2) → Conference Presentations (4 unique). It is not a publication approval, comprehensive bibliography validation or proof of a main merge/deployment.

- **Existing site source:** [breadme at `ecc017c66e645f156c87e447b3442d3d5f8b8ff3`](https://github.com/nana-park/breadme/blob/ecc017c66e645f156c87e447b3442d3d5f8b8ff3/src/pages/original/generated/OriginalResearchContent.tsx). Four old rows provide the retained descriptions, light topic tags and destinations. The canonical HTML conversion baseline remains `nana-park/Portfolio@834815915647e4b3fbf9285b88b8001e37b94aa0`; that older baseline does not contain all of this reviewed content.
- **User-supplied content source:** mobile publication-list screenshot, `154328.jpg`, inspected on 2026-10-09. It provides the displayed titles, institution/journal strings and dates below. Its buttons do not reveal their target URLs. The screenshot itself is not committed or republished with this audit.
- **Publisher checks supplied with the source audit:** [Technology in Society / ScienceDirect PII S0160791X26000412](https://www.sciencedirect.com/science/article/pii/S0160791X26000412), [Information Development / SAGE DOI 10.1177/02666669251399814](https://journals.sagepub.com/doi/10.1177/02666669251399814), and [KCI article ART002885523](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002885523). These checks were supplied by the source-mapping research; the documentation pass does not claim a separate live publisher verification.
- **Explicit content source for the candidate:** [publications.ts](../../src/content/research/publications.ts). [ResearchSections](../../src/pages/original/ResearchSections.tsx) renders it; [canonical override](../../scripts/apply-research-sections-override.ts) preserves the component connection on regeneration.

The J1/J2/J3, O1/O2 and C1–C4 labels below are audit references, not new user-facing labels or promises about implementation IDs. Index labels are retained source classifications; this pass does not independently certify the journals' current indexing status. Raw institutional strings are not evidence of authorship order, an employment relationship, funding or each institution's role.

## Journal Publications — 3 entries

### J1 — Technology in Society / SSCI

- **Candidate title:** `User perceptions of credibility signals: A conjoint analysis of technological features in news platform`
- **Evidence:** the screenshot uses this title and lists Technology in Society with `2026-01-31`; the source-mapping audit associates it with the existing ScienceDirect PII. The baseline used `Monetary value of credibility signals: Exploring user experience on online news platforms`, `February 2026`, Technology in Society and International Communication Association conference metadata in one row.
- **Candidate date:** `2026`. January 31 in the screenshot and February in the baseline conflict; the review candidate does not silently choose an exact day/month or infer online-first versus issue dates.
- **Retained destination:** `https://www.sciencedirect.com/science/article/abs/pii/S0160791X26000412?via%3Dihub`. Preserve the existing actual link, even though the audit's publisher lookup has a different path.
- **Retained content:** existing journal-row summary and `Online News Platform` / `User Credibility` topic tags, plus approved SSCI label treatment.
- **Separation:** remove the International Communication Association conference metadata from this journal row. C1 has its own screenshot-supplied title/date. A similar topic or the old mixed row does not establish that C1 was a precursor to J1.

### J2 — Information Development / SSCI

- **Candidate title, proposed normalization:** `Improvement of the delivery of information about books online: Focusing on book-flipping behavior`
- **Publisher evidence:** the source-mapping audit verified this formal title against the [SAGE DOI record](https://journals.sagepub.com/doi/10.1177/02666669251399814).
- **Screenshot alias:** `Information delivery UX improvement with digital transformation in book sales e-commerce platform`.
- **Baseline title:** `Information delivery UX improvement with digital transformation in e-commerce`.
- **Review state:** **user approval of this title normalization is still required.** The candidate uses the proposed formal title for review; publisher verification does not itself authorize changing the user's intended display wording.
- **Candidate date:** `December 2025`. The screenshot lists `2025-12-01` and the baseline already uses December 2025; no day-level precision is added.
- **Retained destination:** `https://doi.org/10.1177/02666669251399814`.
- **Retained content:** existing summary and `E-commerce` / `Digital Transformation` topic tags, plus approved SSCI label treatment.
- **Separation:** remove the old `The Ergonomics Society of Korea (Conference Proceeding)` metadata from this journal row. Do not infer that C4 is an earlier version of J2.

### J3 — International Telecommunications Policy Review / KCI

- **Candidate title, deliberately unchanged:** `Impact of cloud developers' work environment in Fintech`
- **Evidence:** screenshot and baseline use this English display title. The screenshot lists `2022-09-01`; baseline lists `October 2022`.
- **Candidate date:** `2022`. The conflicting source months remain unresolved; do not silently assign a month or day.
- **Official-record wording, audit provenance only:** the [KCI record](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002885523) has `A Study on the Effect of Network Separation Policy on the Development Environment of Fintech Companies`. This title is **not adopted** in this review. The scope explicitly retains the existing English display wording.
- **Retained destination:** `https://doi.org/10.37793/ITPR.29.3.2`.
- **Retained content:** existing journal-row summary and `Fintech` / `Developer UX` topic tags, plus approved KCI label treatment. Do not rename the journal or add a new translation.

## Ongoing Research — 2 entries

Both entries carry **`In Progress` only**, without journal-index badges or a displayed date. The screenshot's `2025-11-30` value is an entry date of unverified meaning; it is not established as a research start, acceptance or publication date. No abstract, role, link, author list or new tag is supplied.

| Ref | Candidate title | Exact institution line |
| --- | --- | --- |
| O1 | Digital speech biomarkers from an AI call-based memory assessment and their structural and amyloid correlates | Seoul National University Boramae Medical Center, Boston University, NAVER Cloud |
| O2 | When 'My AI' Interacts with Others: Scale Development for Measuring Romantic Jealousy in Human-AI Intimacy | Sungkyunkwan University, Pukyong National University |

The screenshot uses quotation marks around “My AI”; the reviewed candidate's single-quote punctuation is shown above. Institution order and scope are preserved. In particular, do not relabel these lines as partners, employers, funders or an author-affiliation list without additional source evidence.

## Conference Presentations — 4 unique entries

These dates are **source-listed screenshot dates**, not independently verified conference/event dates. No index badge is shown. The screenshot has five conference rows, but the last two contain the same Omni-Channel title, organization and date; they produce one C4 entry.

| Ref | Candidate title | Displayed organization | Displayed date | Destination decision |
| --- | --- | --- | --- | --- |
| C1 | Monetary value of credibility signals: Exploring user experience on online news platforms | ICA2025 · International Communication Association | September 26, 2025 | No URL supplied; no action rendered |
| C2 | Evaluating the News Interface: The Gatekeeping Role and Financial Worth of Online News Platforms | Cybercommunication Academic Society | November 25, 2022 | No URL supplied; no action rendered |
| C3 | Ethereum GenAI PFP user journey mapping: Based on value-based decision theories | Korea Society of IT Services | October 22, 2022 | Preserve the existing Conference URL and local PDF |
| C4 | Empowering the Omni-Channel Consumer: The Impact of User Agency on E-commerce Success | The Human Factors & Ergonomics Society of Korea | October 13, 2022 | No URL supplied; no action rendered; duplicate screenshot row removed |

- C1's screenshot organization is `ICA2025`. The expanded `International Communication Association` wording is retained from the old source's conference metadata. This is a display disambiguation, not independent event-date validation.
- C3's title and organization already exist on the site. Its screenshot supplies the day, while the old site displayed only October 2022. Preserve its existing summary and `Web3.0` / `Cryptocurrency` light tags.
- C3 **Conference**: `https://share.google/diY1WuICUFJxf7NNe`.
- C3 **Read Paper**: `nahyun_imported/document_source/Projects_Research/(EN)Korea%20Society%20of%20IT%20Services.pdf`, resolved by the existing local-asset helper. Do not replace it with a guessed remote link.
- No summaries, topic tags, abstracts or publication-status claims are invented for C1, C2 or C4. The original three journal summaries are not reassigned to conferences.

## Cross-cutting content decisions

1. Preserve existing journal and C3 descriptions/tags as prior site content. Preservation is not a new scientific or bibliographic endorsement; their meaning still belongs in the user's review.
2. Keep the top Research photo Hero, navigation and route unchanged. The section counts are 3 + 2 + 4 = 9 unique entries.
3. Keep SSCI / SSCI / KCI exclusively on journal rows. `In Progress` must not look or read as a journal classification.
4. Do not invent buttons, `#` destinations, disabled “coming soon” paper links or URLs from screenshot link icons. The only retained research actions are the three journal links and the two C3 links.
5. The screenshot includes `Google Scholar / All publications listed`, but shows no destination. Do not add a new Research Scholar link. The existing Qualifications Scholar link is outside this change and remains intact.
6. Keep dates with their supported precision. Do not reinterpret screenshot dates as submission, online-first, acceptance or event dates. Keep uncertainty in the review record rather than invent a factual resolution.
7. No journal–conference precursor relationship, new authorship detail or institutional role is claimed.

## Review decisions still open

- [ ] Approve or reject J2's proposed publisher-title normalization versus the screenshot alias.
- [ ] Confirm the intended dates for J1 and J3 if precision beyond the non-conflicting year is wanted; year-only display is the review candidate's conservative treatment.
- [ ] Review the source-listed conference dates before treating them as verified event dates.
- [ ] Review all nine entries' displayed meaning, including the inherited summaries, exact institution lines and separated journal/conference categories.
- [ ] Complete [runtime/browser QA](../qa/research-sections-review.md). Content review does not replace visual, interaction or link-availability testing.
- [ ] Obtain separate explicit main-merge/deployment approval before publication.
