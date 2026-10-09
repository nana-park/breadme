/** WHAT: Move existing sections without rewriting their claims or media.
 * WHY: Home stays a short introduction; qualifications owns evidence and About
 * owns working principles. Both breakpoints share the same content structure. */
export function applyEducationIaOverride(
  document: Document,
  sourceFile: string,
  sources: { home: Document; qualified: Document },
) {
  if (!["index.html", "about.html", "qualified.html"].includes(sourceFile)) return;
  const originalEducation = sources.home.querySelector("#history-2");
  const originalPrinciples = sources.qualified.querySelector("#how-work");
  if (!originalEducation || !originalPrinciples)
    throw new Error("Expected original education and work-principles sections");

  if (sourceFile === "index.html") {
    const section = document.querySelector("#history-2")!;
    section.setAttribute("data-education-summary", "");
    const container = section.firstElementChild!;
    const heading = section.querySelector("h2")!;
    // Preserve school/degree/major text from the actual academic cards.
    const cards = Array.from(section.querySelectorAll(".grid > .group"));
    if (cards.length !== 2) throw new Error("Expected both original degree cards");
    const summary = document.createElement("div");
    summary.setAttribute("class", "grid grid-cols-1 md:grid-cols-2 gap-6");
    for (const card of cards) {
      const item = document.createElement("div");
      const degree = card.querySelector("h3")!.cloneNode(true) as Element;
      const school = card.querySelector("h3 + p")!.cloneNode(true) as Element;
      school.querySelector("svg")?.remove();
      school.setAttribute("class", "font-sans text-zinc-500 text-[13px] mt-1");
      item.append(degree, school);
      summary.append(item);
    }
    const header = heading.parentElement!;
    header.querySelectorAll("p, a").forEach((node) => node.remove());
    header.querySelector(".flex")?.remove();
    header.setAttribute("class", "mb-6");
    const link = document.createElement("a");
    link.href = "qualified.html#history-2";
    link.className = "inline-flex items-center justify-center mt-6 px-6 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-sans text-[13px] font-semibold rounded hover:bg-zinc-50 transition-all shadow-sm";
    link.textContent = "Full education & qualifications ↗";
    container.replaceChildren(header, summary, link);
    section.classList.remove("pb-24");
    section.classList.add("pb-16");
  }
  if (sourceFile === "qualified.html") {
    const education = document.importNode(originalEducation, true) as Element;
    education.setAttribute("data-education-detail", "");
    // Carry forward the approved one-sentence research-focus correction.
    const focus = Array.from(education.querySelectorAll("p")).find((node) =>
      node.textContent?.trim().startsWith("Focused on human cognition,"));
    if (focus) focus.textContent = "Focused on human cognition, statistical modeling, and AI technical literacy, with research published in SSCI-indexed journals.";
    document.querySelector("#toolkit-grid")!.before(education);
    document.querySelector("#how-work")!.remove();
  }
  if (sourceFile === "about.html") {
    const principles = document.importNode(originalPrinciples, true) as Element;
    principles.setAttribute("data-about-chapter", "principles");
    principles.querySelector("h2")!.parentElement!.setAttribute("data-reading-role", "principles-section-header");
    document.querySelector("#media")!.before(principles);
  }
}
