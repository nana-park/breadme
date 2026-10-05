# Original Articles content

## Source and scope

- Source: audited `articles_data.js`, `article_renderer.js`, and `articles.html` from the original Portfolio site.
- `index.ts`: all 18 article IDs, original URLs, dates, English titles, and excerpts in source order.
- `Article<ID>Body.tsx`: the complete source English body as native React JSX, with original inline styles and `assetUrl` image resolution.
- `pageContent.ts`: exact English hero and reading-control copy from the source page.
- `source-expectations.json`: source-derived metadata, normalized-text SHA-256 fingerprints, image URLs/alt text, and body links used for migration tests.

Korean article bodies were not migrated into the active interface. The source's `View Original (KR)` links remain unchanged. No copy was translated or summarized.

## Rendering and behavior

`src/pages/original/OriginalArticlesPage.tsx` owns the archive and detail layouts, six pages of three articles, five-number pagination window, `#article-detail?id=...` links, and both Back to List controls. The archive stays mounted while reading, preserving page selection; returning also restores its saved scroll and link focus. Hash changes support direct detail links and browser Back/Forward. Unknown IDs show the archive rather than an empty reading page. Storage failure falls back to in-memory scroll restoration.

The parent `OriginalPage` retains the original `OriginalArticlesContent.css` styles. Tailwind class names and inline values intentionally match the audited source, including the mobile layout. This is an original-design preservation exception; generic foundation components must not replace these layouts without a separate design decision.

Mobile readability correction (PR #3): all 47 inline image heights now use `var(--article-image-height, original-px-height)`. The parent page sets that variable to `auto` only at 767px and below, preventing proportional width shrinkage from vertically stretching the original photos. Desktop retains each exact original height fallback. Image URLs, alt text, article copy and source metadata are unchanged. The minimized materials shortcut is hidden during mobile article reading; the shared menu retains materials access.

Four malformed source HTML tag names (`brave`, `sherlock`, `mbc`, `talk`) were converted to inline spans with `data-original-inline-tag`. Their browser-visible text, nesting, and inline rendering remain intact; missing source text was not invented. External new-tab links add `rel="noopener noreferrer"`. Images use downloaded local assets through the shared manifest helper.

## Verification

- Unit tests verify all 18 body-text fingerprints, exact metadata, all body images/alt text, all source links, local image resolution, and no embedded scripts or iframes.
- Interaction tests cover all six list pages, disabled boundaries, keyboard entry, both reading controls, scroll/focus restoration, direct links, repeated hash navigation, unknown IDs, reduced motion, and unavailable browser storage.
- `tests/e2e/articles.spec.ts` covers desktop/mobile archive and detail screenshots, image loading, overflow, console errors, browser Back/Forward, and return-state preservation. Browser verification is run by the integrating task.
