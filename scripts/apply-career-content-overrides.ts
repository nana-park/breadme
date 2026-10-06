/** Apply the approved Career-only content changes before generating React. */
export function applyCareerContentOverrides(
  document: Document,
  sourceFile: string,
) {
  if (sourceFile !== "career.html") return;

  // WHAT: Remove the duplicate academic section rather than hiding it with CSS.
  // WHY: Education stays on Home; Career goes straight from work to team voices.
  document.querySelector("section#history-2")?.remove();

  const testimonialIntro = Array.from(
    document.querySelectorAll("#testimonials p"),
  ).find((node) =>
    node.textContent?.trim().startsWith("Unfiltered voices from"),
  );
  testimonialIntro?.setAttribute("data-reading-role", "testimonial-intro");
}
