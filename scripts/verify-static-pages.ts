import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { originalRoutePaths } from "../src/config/originalRoutes.ts";

// WHAT: Verify the actual static artifact, without a development-server fallback.
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const base = process.env.VITE_BASE_PATH || "/";
assert.match(
  base,
  /^\/(?:[^?#]*\/)?$/,
  "Use an absolute base with a trailing slash.",
);
const origin = "https://static-pages.invalid";
const checkedUrls = new Set<string>();

async function verifyLocalUrl(value: string, sourceUrl: string) {
  if (!value || /^(?:#|data:|blob:|mailto:|tel:)/i.test(value)) return;
  const url = new URL(value, sourceUrl);
  if (url.origin !== origin) return;
  assert.ok(url.pathname.startsWith(base), `Asset escapes ${base}: ${value}`);
  const relative = decodeURIComponent(url.pathname.slice(base.length));
  const filename = path.resolve(output, relative || "index.html");
  assert.ok(
    filename.startsWith(`${output}${path.sep}`),
    `Unsafe asset: ${value}`,
  );
  assert.ok((await stat(filename)).isFile(), `Missing static file: ${value}`);
  checkedUrls.add(url.pathname);
}

for (const route of Object.values(originalRoutePaths)) {
  const html = await readFile(path.join(output, route), "utf8");
  assert.ok(html.includes('id="root"'), `Missing React root: ${route}`);
  const references = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)];
  assert.ok(
    references.some((match) => match[1].endsWith(".js")),
    `Missing entry: ${route}`,
  );
  for (const [, value] of references) {
    await verifyLocalUrl(
      value.replaceAll("&amp;", "&"),
      `${origin}${base}${route}`,
    );
  }
}

let fontReferences = 0;
const compiledAssets = await readdir(path.join(output, "assets"));
for (const file of compiledAssets) {
  if (!/\.(?:css|js)$/.test(file)) continue;
  const text = await readFile(path.join(output, "assets", file), "utf8");
  // Includes local CSS URLs contained in compiled JavaScript.
  for (const match of text.matchAll(
    /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g,
  )) {
    const value = match[1] ?? match[2] ?? match[3];
    if (file.endsWith(".js") && !value.startsWith("/")) continue;
    await verifyLocalUrl(value, `${origin}${base}assets/${file}`);
    if (/\.woff2?(?:[?#]|$)/.test(value)) fontReferences++;
  }
}
assert.ok(fontReferences > 0, "No local font URLs were verified.");
// The approved text-led Home does not import or render Spline. The original
// cached assets remain hash-verified below; unused files are not a runtime.
assert.ok(
  !compiledAssets.some((file) => file.startsWith("spline-viewer-")),
  "Text-led Home must not emit an unused Spline runtime chunk.",
);

type Asset = { path: string; sha256: string; bytes: number };
type ExternalAsset = {
  localPath: string;
  sha256: string;
  bytes: number;
  status: string;
};
const original = JSON.parse(
  await readFile(
    path.join(root, "src/content/original/asset-manifest.json"),
    "utf8",
  ),
) as { assets: Asset[] };
const external = JSON.parse(
  await readFile(
    path.join(root, "src/content/original/external-asset-manifest.json"),
    "utf8",
  ),
) as { entries: ExternalAsset[] };
const assets = [
  ...original.assets.map((asset) => ({
    ...asset,
    path: `original/${asset.path}`,
  })),
  ...external.entries
    .filter((asset) => asset.status === "available")
    .map((asset) => ({
      ...asset,
      path: asset.localPath.replace(/^\/+/, ""),
    })),
];
for (const asset of assets) {
  const bytes = await readFile(path.join(output, asset.path));
  assert.equal(bytes.length, asset.bytes, `Asset size mismatch: ${asset.path}`);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    asset.sha256,
    `Asset integrity mismatch: ${asset.path}`,
  );
}
assert.ok((await stat(path.join(output, ".nojekyll"))).isFile());
console.log(
  `Static build verified at ${base}: ${Object.keys(originalRoutePaths).length} HTML entries, ${checkedUrls.size} unique local HTML/CSS URLs, ${fontReferences} font references, ${assets.length} byte-verified assets.`,
);
