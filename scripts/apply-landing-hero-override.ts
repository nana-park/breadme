/** WHAT: Keep approved photo heroes when regenerating the legacy pages. */
export function applyLandingHeroOverride(
  document: Document,
  sourceFile: string,
) {
  const pages = {
    "qualified.html": "qualified",
    "projects.html": "projects",
    "research.html": "research",
    "articles.html": "articles",
  } as const;
  const page = pages[sourceFile as keyof typeof pages];
  if (!page) return;
  const section = document.querySelector(
    page === "qualified" ? "section#about" : `section#${page}`,
  );
  if (!section) throw new Error(`Missing landing section: ${sourceFile}`);
  (section as HTMLElement).style.paddingTop = "70px";
  const marker = document.createElement("div");
  marker.setAttribute("data-landing-photo-hero", page);
  if (page === "qualified") section.firstElementChild?.replaceWith(marker);
  else {
    const container = section.firstElementChild;
    if (!container?.firstElementChild)
      throw new Error(`Missing landing content: ${sourceFile}`);
    container.firstElementChild.remove();
    section.insertBefore(marker, container);
  }
}
