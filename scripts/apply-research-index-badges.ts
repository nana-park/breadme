/** WHAT: Promote only the existing journal-index suffixes into readable labels.
 * WHY: Preserve the approved paper content and never infer conference indexing. */
export function applyResearchIndexBadges(document: Document, sourceFile: string) {
  if (sourceFile !== "research.html") return;
  const headings = Array.from(document.querySelectorAll("#research h3"));
  headings.forEach((heading, index) => {
    const titleColumn = heading.parentElement!;
    const row = titleColumn.parentElement!;
    row.setAttribute("data-research-paper", String(index + 1));
    if (titleColumn.querySelector("[data-research-meta]")) return;
    const journal = heading.nextElementSibling;
    const classification = journal?.querySelector("span")?.nextSibling;
    const match = classification?.textContent?.match(/^\s*\((SSCI|KCI)\)\s*$/);
    if (!match) return;
    const dateColumn = row.firstElementChild!;
    const originalDate = dateColumn.querySelector("span");
    if (!originalDate) throw new Error("Indexed paper is missing its existing publication date");
    dateColumn.setAttribute("data-research-date-column", "");
    const meta = document.createElement("div");
    meta.setAttribute("data-research-meta", "");
    const badge = document.createElement("span");
    badge.setAttribute("data-research-index", match[1]);
    badge.setAttribute("title", `Journal index: ${match[1]}`);
    badge.textContent = match[1];
    // One source date, two breakpoint-exclusive presentations: preserve the
    // original desktop column without JS layout changes or fixed positioning.
    const mobileDate = originalDate.cloneNode(true) as Element;
    mobileDate.setAttribute("data-research-mobile-date", "");
    meta.append(badge, mobileDate);
    heading.before(meta);
    classification!.textContent = classification!.textContent!.replace(/\((SSCI|KCI)\)/, "");
  });
}
