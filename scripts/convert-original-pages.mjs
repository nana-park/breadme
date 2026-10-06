/**
 * WHAT: Materialize the approved original portfolio DOM as native React TSX.
 * WHY: Keep the source design/content inspectable without running legacy scripts,
 * raw HTML injection, or a full-page iframe. Re-run only against the audited source.
 */
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import postcss from "postcss";
import { format } from "prettier";
import { applyCareerContentOverrides } from "./apply-career-content-overrides.ts";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoot = path.resolve(
  process.argv[2] ?? path.join(projectRoot, "../portfolio-reference"),
);
const pinnedSourceCommit = "834815915647e4b3fbf9285b88b8001e37b94aa0";
const actualSourceCommit = execFileSync(
  "git",
  ["-C", sourceRoot, "rev-parse", "HEAD"],
  { encoding: "utf8" },
).trim();
if (actualSourceCommit !== pinnedSourceCommit)
  throw new Error(
    `Expected original source ${pinnedSourceCommit}, received ${actualSourceCommit}. Review and update the pin before regenerating.`,
  );
const outputRoot = path.join(projectRoot, "src/pages/original/generated");
const pageDefinitions = [
  ["index.html", "OriginalHomeContent"],
  ["about.html", "OriginalAboutContent"],
  ["career.html", "OriginalCareerContent"],
  ["qualified.html", "OriginalQualifiedContent"],
  ["enjoy.html", "OriginalEnjoyContent"],
  ["projects.html", "OriginalProjectsContent"],
  ["research.html", "OriginalResearchContent"],
  ["articles.html", "OriginalArticlesContent"],
  ["lectures.html", "OriginalLecturesContent"],
  ["awards.html", "OriginalAwardsContent"],
  ["contact.html", "OriginalContactContent"],
  ["projects/llm-based-voice-ivr.html", "OriginalVoiceIvrContent"],
  ["projects/hopzie-oneclickbuilder.html", "OriginalHopzieContent"],
  ["projects/ai-mentoring-agent-detail.html", "OriginalMentoringContent"],
  ["mentoring_agent_mockup.html", "OriginalMentoringMockupContent"],
];
execFileSync("git", [
  "-C",
  sourceRoot,
  "diff",
  "--quiet",
  pinnedSourceCommit,
  "--",
  ...pageDefinitions.map(([file]) => file),
]);
const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
const ignoredTags = new Set([
  "script",
  "style",
  "link",
  "meta",
  "title",
  "base",
  "noscript",
]);
const sharedIds = new Set([
  "navbar",
  "email-popup",
  "mobile-warning-overlay",
  "projectModal",
]);
const attributeNames = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  autoplay: "autoPlay",
  playsinline: "playsInline",
  allowfullscreen: "allowFullScreen",
  frameborder: "frameBorder",
  srcset: "srcSet",
  colspan: "colSpan",
  rowspan: "rowSpan",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  maxlength: "maxLength",
  minlength: "minLength",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "stroke-miterlimit": "strokeMiterlimit",
  "fill-rule": "fillRule",
  "fill-opacity": "fillOpacity",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "vector-effect": "vectorEffect",
  "color-interpolation-filters": "colorInterpolationFilters",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "text-anchor": "textAnchor",
  "xlink:href": "xlinkHref",
  "xml:space": "xmlSpace",
  "xmlns:xlink": "xmlnsXlink",
};
const booleanAttributes = new Set([
  "autoplay",
  "loop",
  "muted",
  "playsinline",
  "required",
  "disabled",
  "readonly",
  "multiple",
  "selected",
  "checked",
  "allowfullscreen",
  "controls",
  "open",
  "hidden",
  "autofocus",
  "novalidate",
]);
const numericAttributes = new Set([
  "tabindex",
  "colspan",
  "rowspan",
  "maxlength",
  "minlength",
]);
const isExternal = (value) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
const json = (value) =>
  JSON.stringify(value)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
const cssProperty = (name) =>
  name.startsWith("--")
    ? name
    : name
        .replace(/^-ms-/, "ms-")
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
function sourceRelative(value, sourceFile) {
  if (!value || isExternal(value)) return value;
  const match = value.match(/^([^?#]*)(.*)$/);
  return `${path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), match[1]))}${match[2]}`;
}

function scopedMockupCss(css) {
  const root = postcss.parse(css);
  root.walkRules((rule) => {
    // Animation percentages are not document selectors.
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name))
      return;
    rule.selectors = rule.selectors.map((selector) => {
      if (selector === "body" || selector === ":root" || selector === "html")
        return ".original-mentoring-mockup";
      if (selector === "*")
        return ".original-mentoring-mockup, .original-mentoring-mockup *";
      return `.original-mentoring-mockup ${selector}`;
    });
  });
  // The original iframe supplied its own viewport; scope that height to its frame.
  return `${root.toString()}\n.original-mentoring-mockup { min-height: 690px; }\n.original-mentoring-mockup-frame { overflow: hidden; }\n`;
}

await fs.mkdir(outputRoot, { recursive: true });
const manifest = [];
for (const [sourceFile, componentName] of pageDefinitions) {
  const source = (
    await fs.readFile(path.join(sourceRoot, sourceFile), "utf8")
  ).replace(/^\uFEFF/, "");
  const dom = new JSDOM(source);
  const document = dom.window.document;
  applyCareerContentOverrides(document, sourceFile);
  // WHAT: Preserve the user's Home-only, one-sentence Research Focus copy.
  // WHY: Remove the forced break without changing Education layout or Career copy.
  if (sourceFile === "index.html") {
    const researchFocus = Array.from(
      document.querySelectorAll("#history-2 p"),
    ).find((node) =>
      node.textContent.trim().startsWith("Focused on human cognition,"),
    );
    if (researchFocus)
      researchFocus.textContent =
        "Focused on human cognition, statistical modeling, and AI technical literacy, with research published in SSCI-indexed journals.";
  }
  // WHAT: Stable reading roles for the reviewed mobile refinements.
  // WHY: Keep page-owned responsive CSS out of source utility strings and make
  // regeneration preserve the fixes without altering desktop declarations.
  if (
    sourceFile !== "index.html" &&
    sourceFile !== "mentoring_agent_mockup.html" &&
    // The existing demo source stays untouched while its optional two reading
    // hooks are pending. Do not silently re-add them on a later regeneration.
    sourceFile !== "projects/ai-mentoring-agent-detail.html"
  ) {
    const heading = document.querySelector("h1, h2");
    heading?.setAttribute("data-reading-role", "landing-title");
    heading?.parentElement?.querySelectorAll(":scope > p").forEach((node) => {
      node.setAttribute("data-reading-role", "landing-copy");
    });
    if (sourceFile.startsWith("projects/")) {
      for (const paragraph of document.querySelectorAll("p")) {
        if (paragraph.textContent.trim().startsWith("Director's Log:"))
          paragraph.setAttribute("data-reading-role", "director-copy");
      }
    }
    if (sourceFile === "career.html") {
      document
        .querySelector("#career-role-desc")
        ?.setAttribute("data-reading-role", "career-copy");
      for (const role of [
        "testimonial-card",
        "card-quote",
        "card-signature",
        "card-author-title",
      ]) {
        document.querySelectorAll(`.${role}`).forEach((node) => {
          node.setAttribute("data-reading-role", role);
        });
      }
    }
    if (sourceFile === "qualified.html")
      heading?.nextElementSibling?.setAttribute(
        "data-reading-role",
        "landing-categories",
      );
    if (sourceFile === "lectures.html") {
      document.querySelectorAll("#lectures .truncate").forEach((node) => {
        node.setAttribute("data-reading-role", "lecture-copy");
      });
      document.querySelectorAll("#lectures h3").forEach((node) => {
        node.parentElement?.setAttribute(
          "data-reading-role",
          "lecture-content",
        );
        node.nextElementSibling?.setAttribute(
          "data-reading-role",
          "lecture-meta",
        );
        node.nextElementSibling?.nextElementSibling?.setAttribute(
          "data-reading-role",
          "lecture-facts",
        );
      });
    }
    if (sourceFile === "awards.html") {
      heading?.parentElement?.setAttribute(
        "data-reading-role",
        "artwork-caption",
      );
      heading?.parentElement?.previousElementSibling?.setAttribute(
        "data-reading-role",
        "artwork-media",
      );
    }
    if (sourceFile === "about.html") {
      heading?.parentElement?.parentElement?.setAttribute(
        "data-reading-role",
        "video-hero",
      );
      // Preserve semantic About chapters and the mobile-only intro gutter hook.
      heading?.parentElement?.setAttribute(
        "data-reading-role",
        "about-introduction",
      );
      heading?.parentElement?.parentElement?.setAttribute(
        "data-about-chapter",
        "introduction",
      );
      document
        .querySelector(".id-diagram-container")
        ?.parentElement?.setAttribute("data-about-chapter", "identity");
      document
        .querySelector("#media")
        ?.setAttribute("data-about-chapter", "interview");
      for (const role of [
        "diagram-container",
        "derivation-row",
        "translation-group",
        "phonetic-part",
        "meaning-text",
        "floating-text",
        "decorator-slash",
      ]) {
        document.querySelectorAll(`.id-${role}`).forEach((node) => {
          node.setAttribute("data-reading-role", `identity-${role}`);
        });
      }
    }
    if (sourceFile === "contact.html") {
      heading?.parentElement?.parentElement?.setAttribute(
        "data-reading-role",
        "contact-hero",
      );
      // WHY: Preserve the requested mobile-only Domain hiding on regeneration.
      const domainCard = Array.from(
        document.querySelectorAll(
          "#contact > .container > div:first-child > div",
        ),
      ).find((card) => card.firstElementChild?.textContent.trim() === "Domain");
      domainCard?.setAttribute("data-contact-card", "domain");
    }
    if (sourceFile === "enjoy.html") {
      heading?.parentElement?.setAttribute("data-reading-role", "photo-copy");
      heading?.parentElement?.parentElement?.setAttribute(
        "data-reading-role",
        "photo-hero",
      );
      heading?.parentElement?.nextElementSibling?.setAttribute(
        "data-reading-role",
        "photo-credit",
      );
    }
  }
  // WHY: The source materials form only displays a fake success alert. Keep its
  // approved visual content, but do not collect data or imply a working backend.
  for (const form of document.querySelectorAll("form")) {
    const fakeSuccess = /Request sent|check your inbox/i.test(
      form.getAttribute("onsubmit") ?? "",
    );
    const materialsRequest = /Application Materials/i.test(
      form.closest("section")?.textContent ?? "",
    );
    if (fakeSuccess || materialsRequest) {
      form.setAttribute("data-original-disabled-form", "true");
      for (const control of form.querySelectorAll(
        "input, button, select, textarea",
      )) {
        control.setAttribute("disabled", "");
      }
    }
  }
  const isMockup = componentName === "OriginalMentoringMockupContent";
  const imports = new Set();
  const importantRules = [];
  let importantIndex = 0;
  let elementCount = 0;
  let textCount = 0;
  const inlineStyles = [...document.querySelectorAll("style")].map(
    (style, index) =>
      `/* Original inline style ${index + 1}: ${sourceFile} */\n${style.textContent}`,
  );

  function assetExpression(value) {
    imports.add("assetUrl");
    return `assetUrl(${json(sourceRelative(value, sourceFile))})`;
  }
  function styleValueExpression(value) {
    const pattern = /url\(\s*(["']?)(.*?)\1\s*\)/g;
    let cursor = 0;
    const parts = [];
    let match;
    while ((match = pattern.exec(value))) {
      const url = match[2];
      if (!url || isExternal(url)) continue;
      parts.push(json(value.slice(cursor, match.index) + 'url("'));
      parts.push(assetExpression(url));
      parts.push(json('")'));
      cursor = match.index + match[0].length;
    }
    if (!parts.length) return json(value);
    parts.push(json(value.slice(cursor)));
    return parts.join(" + ");
  }
  function styleAttributes(element, topLevel) {
    if (
      topLevel &&
      element.localName === "section" &&
      element.style.display === "none"
    ) {
      element.style.removeProperty("display");
    }
    const properties = [];
    const important = [];
    const importantAssignments = [];
    for (const name of element.style) {
      const value = element.style.getPropertyValue(name);
      properties.push(
        `${json(cssProperty(name))}: ${styleValueExpression(value)}`,
      );
      if (element.style.getPropertyPriority(name)) {
        important.push(`${name}: ${value} !important;`);
        importantAssignments.push(
          `element.style.setProperty(${json(name)}, ${styleValueExpression(value)}, "important");`,
        );
      }
    }
    if (!properties.length) return [];
    imports.add("CSSProperties");
    const result = [`style={{${properties.join(", ")}} as CSSProperties}`];
    if (important.length) {
      const id = `${componentName}-${++importantIndex}`;
      result.push(`data-original-style-id=${json(id)}`);
      // Inline !important outranks ID selectors; a stylesheet attribute rule cannot preserve that priority.
      result.push(
        `ref={(element) => { if (element) { ${importantAssignments.join(" ")} } }}`,
      );
      importantRules.push(
        `[data-original-style-id="${id}"] { ${important.join(" ")} }`,
      );
    }
    return result;
  }
  function attributes(element, topLevel = false) {
    const attrs = [];
    for (const { name, value } of element.attributes) {
      if (name === "style") {
        attrs.push(...styleAttributes(element, topLevel));
        continue;
      }
      if (/^on/i.test(name)) {
        attrs.push(
          `data-original-${name.slice(2).toLowerCase()}={${json(value)}}`,
        );
        continue;
      }
      let reactName = attributeNames[name] ?? name;
      if (name === "value" && element.localName === "input")
        reactName = "defaultValue";
      if (name === "checked") reactName = "defaultChecked";
      if (name === "autofocus") reactName = "autoFocus";
      if (name === "novalidate") reactName = "noValidate";
      if (booleanAttributes.has(name)) {
        attrs.push(`${reactName}={true}`);
        continue;
      }
      if (numericAttributes.has(name)) {
        attrs.push(`${reactName}={${Number(value)}}`);
        continue;
      }
      if (name === "src" || name === "poster") {
        attrs.push(`${reactName}={${assetExpression(value)}}`);
        continue;
      }
      if (name === "srcset") {
        const candidates = value.split(",").map((candidate) => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return `${assetExpression(url)}${descriptor.length ? ` + ${json(" " + descriptor.join(" "))}` : ""}`;
        });
        attrs.push(`srcSet={[${candidates.join(", ")}].join(', ')}`);
        continue;
      }
      if (name === "href") {
        if (/^javascript:/i.test(value)) {
          attrs.push(`href="#"`, `data-original-href={${json(value)}}`);
          continue;
        }
        if (
          isExternal(value) &&
          !value.startsWith("#") &&
          !value.startsWith("https://nana-park.github.io/Portfolio/")
        ) {
          attrs.push(`href={${json(value)}}`);
          continue;
        }
        const href = sourceRelative(value, sourceFile);
        if (/\.(?:pdf|zip|png|jpe?g|webp|gif)(?:[?#]|$)/i.test(href)) {
          attrs.push(`href={${assetExpression(value)}}`);
          continue;
        }
        imports.add("originalHref");
        attrs.push(`href={originalHref(${json(href)})}`);
        continue;
      }
      // DOM values are escaped expressions, preserving quotes, Unicode, and newlines.
      attrs.push(`${reactName}={${json(value)}}`);
    }
    if (element.localName === "form") {
      attrs.push(
        'data-original-form="true"',
        "onSubmit={(event) => event.preventDefault()}",
      );
    }
    return attrs.length ? ` ${attrs.join(" ")}` : "";
  }
  function render(node, depth = 0) {
    const indent = "  ".repeat(depth);
    if (node.nodeType === 3) {
      if (!node.textContent) return "";
      // Whitespace inside table structure is parser scaffolding, not visible text.
      if (
        /^\s+$/.test(node.textContent) &&
        ["table", "thead", "tbody", "tfoot", "tr", "colgroup"].includes(
          node.parentElement?.localName,
        )
      )
        return "";
      // WHAT: Keep the Home partner caption's word boundary when its break hides.
      // WHY: A hidden <br> renders no separating whitespace below the sm breakpoint.
      const next = node.nextSibling;
      if (
        sourceFile === "index.html" &&
        node.parentElement?.closest("#partners") &&
        next?.nodeType === 1 &&
        next.localName === "br" &&
        next.classList.contains("hidden") &&
        next.classList.contains("sm:block") &&
        next.nextSibling?.nodeType === 3 &&
        /\S$/.test(node.textContent) &&
        /^\S/.test(next.nextSibling.textContent)
      )
        node.textContent += " ";
      textCount++;
      return `${indent}{${json(node.textContent)}}`;
    }
    if (node.nodeType !== 1) return "";
    const tag = node.localName;
    if (ignoredTags.has(tag) || sharedIds.has(node.id) || tag === "footer")
      return "";
    if (sourceFile === "index.html" && node.id === "partners")
      node.style.padding = "var(--home-mobile-section-space, 5rem) 0 5rem";
    const topLevel = node.parentElement === document.body;
    if (topLevel && tag === "svg" && node.getAttribute("width") === "0")
      return "";
    elementCount++;
    // WHAT: Preserve the reviewed Home-only refinement when regenerating source pages.
    if (sourceFile === "index.html" && node.id === "home") {
      imports.add("HomeHero");
      return `${indent}<HomeHero />`;
    }
    // WHAT: Replace Home's career section with the selected Education-style layout.
    // WHY: The user removed career photos/motion; carousel and Education layout remain original.
    if (sourceFile === "index.html" && node.id === "history") {
      imports.add("HomeExperience");
      return `${indent}<HomeExperience />`;
    }
    if (tag === "spline-viewer") {
      imports.add("SplineHero");
      return `${indent}<SplineHero${attributes(node)} />`;
    }
    if (
      tag === "iframe" &&
      node.getAttribute("src") === "../mentoring_agent_mockup.html"
    ) {
      imports.add("OriginalMentoringMockupContent");
      const attrs = styleAttributes(node, false);
      return `${indent}<div className="original-mentoring-mockup-frame" ${attrs.join(" ")} role="region" aria-label={${json(node.getAttribute("title"))}}>\n${indent}  <OriginalMentoringMockupContent />\n${indent}</div>`;
    }
    const attrs = attributes(node, topLevel);
    if (voidTags.has(tag)) return `${indent}<${tag}${attrs} />`;
    const children = [...node.childNodes]
      .map((child) => render(child, depth + 1))
      .filter(Boolean)
      .join("\n");
    return children
      ? `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`
      : `${indent}<${tag}${attrs} />`;
  }
  let contents = [...document.body.childNodes]
    .map((node) => render(node, isMockup ? 3 : 2))
    .filter(Boolean)
    .join("\n");
  if (isMockup)
    contents = `    <div className="original-mentoring-mockup">\n${contents}\n    </div>`;
  const importLines = [];
  if (imports.has("CSSProperties"))
    importLines.push("import type { CSSProperties } from 'react';");
  const helpers = ["assetUrl", "originalHref"].filter((helper) =>
    imports.has(helper),
  );
  if (helpers.length)
    importLines.push(
      `import { ${helpers.join(", ")} } from '@/shared/utils/originalPaths';`,
    );
  if (imports.has("HomeHero"))
    importLines.push("import { HomeHero } from '@/pages/home/HomeHero';");
  if (imports.has("HomeExperience"))
    importLines.push(
      "import { HomeExperience } from '@/pages/home/HomeExperience';",
    );
  if (imports.has("SplineHero"))
    importLines.push(
      "import { SplineHero } from '@/shared/ui/SplineHero/SplineHero';",
    );
  if (imports.has("OriginalMentoringMockupContent"))
    importLines.push(
      "import { OriginalMentoringMockupContent } from './OriginalMentoringMockupContent';",
    );
  const output = `${importLines.join("\n")}\n\n/**\n * WHAT: Native React content from ${sourceFile}.\n * WHY: Preserve the approved source DOM, classes, copy, and media during migration.\n * Generated by scripts/convert-original-pages.mjs; behavior belongs to React hooks.\n */\nexport function ${componentName}() {\n  return (\n    <>\n${contents}\n    </>\n  );\n}\n`;
  let css = `${inlineStyles.join("\n\n")}\n\n/* Preserve explicit source inline !important priorities in React. */\n${importantRules.join("\n")}\n`;
  if (isMockup) css = scopedMockupCss(css);
  await fs.writeFile(
    path.join(outputRoot, `${componentName}.tsx`),
    await format(output, { parser: "typescript", singleQuote: true }),
  );
  css =
    css
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trimEnd() + "\n";
  await fs.writeFile(path.join(outputRoot, `${componentName}.css`), css);
  manifest.push({
    sourceFile,
    componentName,
    sectionIds: [...document.body.querySelectorAll("section[id]")].map(
      (section) => section.id,
    ),
    elementCount,
    textCount,
    inlineStyleBlocks: inlineStyles.length,
    importantRules: importantRules.length,
  });
  console.log(
    `${componentName}: ${elementCount} native elements, ${inlineStyles.length} CSS blocks`,
  );
  dom.window.close();
}
await fs.writeFile(
  path.join(outputRoot, "conversion-manifest.json"),
  `${JSON.stringify({ sourceRepository: "https://github.com/nana-park/Portfolio", sourceCommit: actualSourceCommit, pages: manifest }, null, 2)}\n`,
);
