# Home education navigation — 2026-10-09

## Requested scope
The existing Home education action now opens `qualified.html` at the top, without `#history-2`. Its label, styling, education content and all other links remain unchanged. Explicit Qualifications education deep links still work.

## Implementation
- Canonical override: `scripts/apply-education-ia-override.ts`
- Generated Home output: `src/pages/original/generated/OriginalHomeContent.tsx`
- No scroll override, viewport-specific implementation or content changes.

## Verification
- Unit assertions cover generated output and canonical regeneration.
- Existing IA browser tests check page-top arrival, then separately exercise education deep links.
- Production-path tests check mobile 390px and desktop 1440px, repeated Home → Qualifications clicks after Back, scroll position zero, the visible Qualifications hero, explicit education anchors and refresh.
- CI results and exact tested head are recorded in the draft PR. No new live deployment is authorized by this change request.
