/** WHAT: Render reviewed research data through one React owner.
 * WHY: Pinned legacy HTML cannot supply newly verified ongoing/conference records. */
export function applyResearchSectionsOverride(
  document: Document,
  sourceFile: string,
) {
  if (sourceFile !== "research.html") return;
  const container = document.querySelector("#research > .container");
  if (!container) throw new Error("Missing Research content container");
  if (container.querySelector(":scope > [data-research-sections]")) return;
  const marker = document.createElement("div");
  marker.setAttribute("data-research-sections", "");
  container.replaceChildren(marker);
}
