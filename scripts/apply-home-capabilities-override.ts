/** Keep the approved CTA content replaceable without regenerating its decoration. */
export function applyHomeCapabilitiesOverride(
  document: Document,
  sourceFile: string,
) {
  if (sourceFile !== "index.html") return;
  const card = document.querySelector("#cta-dark-container");
  if (!card) return;
  const title = card.querySelector(":scope > h2");
  if (!title) return;
  const content = document.createElement("div");
  content.setAttribute("data-home-capabilities", "");
  title.replaceWith(content);
  // WHY: Replace only the original title, description and action. The source card
  // and every decorative element stay unchanged; new copy lives in src/content.
  card
    .querySelectorAll(":scope > p, :scope > a")
    .forEach((node) => node.remove());
}
