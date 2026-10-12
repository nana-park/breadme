import { homeEventCarouselOverrides } from "../src/content/site/homeEventCarousel.ts";

/**
 * WHAT: Preserve approved event headings, Japan launch role, Seoul date and hooks.
 * WHY: Scope copy and styling hooks to the Home carousel while retaining original
 * image descriptions, other subtitles and the existing card structure.
 */
export function applyHomeEventCarouselOverrides(
  document: Document,
  sourceFile: string,
) {
  if (sourceFile !== "index.html") return;
  for (const heading of document.querySelectorAll(
    "#footprint .footprint-gallery-container > div > h3",
  )) {
    heading.setAttribute("data-home-event-title", "");
    const sourceTitle = heading.textContent?.trim() ?? "";
    const override = homeEventCarouselOverrides[sourceTitle];
    if (!override) continue;
    replaceDirectText(heading, sourceTitle, override.title);
    const subtitle = heading.parentElement?.querySelector(":scope > p");
    const role = subtitle?.querySelector(":scope > span");
    if (role && override.role) {
      replaceDirectText(role, override.role.source, override.role.display);
    }
    if (subtitle && override.date) {
      replaceDirectText(subtitle, override.date.source, override.date.display);
    }
  }
}

function replaceDirectText(element: Element, source: string, display: string) {
  for (const node of element.childNodes) {
    if (node.nodeType === 3 && node.textContent) {
      node.textContent = node.textContent.replace(source, display);
    }
  }
}
