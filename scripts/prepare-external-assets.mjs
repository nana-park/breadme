import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// WHAT: Download the original site's external fonts, images and Spline scene into a local cache.
// WHY: Preserve the source bytes and typography without visitor-side image/font hotlinks.
// No credentials are used. The checked-in manifest is the integrity lock; this script never refreshes it.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PUBLIC_ROOT = path.join(ROOT, 'public');
const MANIFEST_PATH = path.join(ROOT, 'src/content/original/external-asset-manifest.json');
const FONT_CSS_PATH = path.join(ROOT, 'src/styles/original/fonts.css');
const MAX_CONCURRENCY = 4;
const TIMEOUT_MS = 45_000;
const MAX_ATTEMPTS = 3;
const ORIGINS = new Set([
  'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net',
  'https://www.artinsight.co.kr', 'https://images.weserv.nl', 'https://yt3.googleusercontent.com',
  'https://ui-avatars.com', 'https://upload.wikimedia.org', 'https://prod.spline.design',
  'https://raw.githubusercontent.com', 'https://app.spline.design',
]);
const CATEGORIES = new Set(['font-css', 'font', 'image', 'fallback-image', 'spline-scene', 'license']);
const IMAGE_TYPES = new Set(['jpeg', 'png', 'gif', 'webp', 'svg']);
const FONT_TYPES = new Set(['woff2', 'woff', 'ttf', 'otf']);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function validateUrl(value) {
  const url = new URL(value);
  if (!ORIGINS.has(url.origin) || url.username || url.password || url.hash) {
    throw new Error(`Unapproved public asset URL: ${value}`);
  }
  return url;
}

export function inspectFileType(bytes) {
  const signature = bytes.subarray(0, 16).toString('hex');
  const start = bytes.subarray(0, 500).toString();
  if (signature.startsWith('774f4632')) return 'woff2';
  if (signature.startsWith('774f4646')) return 'woff';
  if (signature.startsWith('00010000')) return 'ttf';
  if (signature.startsWith('4f54544f')) return 'otf';
  if (signature.startsWith('ffd8ff')) return 'jpeg';
  if (signature.startsWith('89504e470d0a1a0a')) return 'png';
  if (/^GIF8[79]a/.test(start)) return 'gif';
  if (start.startsWith('RIFF') && start.slice(8, 12) === 'WEBP') return 'webp';
  if (/<svg[\s>]/i.test(start)) return 'svg';
  if (/<!doctype html|<html[\s>]/i.test(start)) return 'html';
  return null;
}

export function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.entries) || !Array.isArray(manifest.fontStylesheets)) {
    throw new Error('Unsupported external asset manifest.');
  }
  const urls = new Set();
  const paths = new Set();
  for (const asset of manifest.entries) {
    validateUrl(asset.url);
    if (urls.has(asset.url)) throw new Error(`Duplicate source URL: ${asset.url}`);
    urls.add(asset.url);
    if (!CATEGORIES.has(asset.category)) throw new Error(`Unsupported asset category: ${asset.category}`);
    if (asset.status === 'unavailable') {
      if (asset.localPath !== null || asset.sha256 !== null || !asset.error) throw new Error('Invalid unavailable asset record.');
      continue;
    }
    if (asset.status !== 'available') throw new Error(`Unresolved asset: ${asset.url}`);
    if (asset.resolvedUrl) validateUrl(asset.resolvedUrl);
    if (!/^\/original-external\/(?:[a-z0-9-]+\/)+[a-z0-9.-]+$/.test(asset.localPath)
      || asset.localPath.split('/').some((part) => part === '.' || part === '..' || part.startsWith('.'))) {
      throw new Error(`Unsafe local asset path: ${asset.localPath}`);
    }
    if (paths.has(asset.localPath)) throw new Error(`Duplicate local asset path: ${asset.localPath}`);
    paths.add(asset.localPath);
    if (!/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || asset.bytes > 100 * 1024 * 1024) {
      throw new Error(`Invalid asset integrity metadata: ${asset.url}`);
    }
    if (asset.category === 'font' && !FONT_TYPES.has(asset.fileType)) throw new Error(`Invalid font type: ${asset.url}`);
    if (['image', 'fallback-image'].includes(asset.category) && !IMAGE_TYPES.has(asset.fileType)) throw new Error(`Invalid image type: ${asset.url}`);
  }
  return manifest.entries;
}

export function verifyBuffer(bytes, asset) {
  if (bytes.length !== asset.bytes || sha256(bytes) !== asset.sha256) {
    throw new Error(`Asset checksum or size mismatch: ${asset.localPath}`);
  }
  const type = inspectFileType(bytes);
  if (['font', 'image', 'fallback-image'].includes(asset.category) && type !== asset.fileType) {
    throw new Error(`Asset file type mismatch: ${asset.localPath}`);
  }
  if (asset.category === 'font-css' && !bytes.toString().includes('@font-face')) throw new Error('Invalid source font CSS.');
  if (asset.category === 'license' && !/licen[sc]e|copyright/i.test(bytes.toString())) throw new Error('Invalid license text.');
  // WHY: Spline's compressed binary format has no public file signature. The lock pins its full bytes,
  // and the capture records its initial signature for a separate format sanity check, not a decoder claim.
  if (asset.category === 'spline-scene' && (type === 'html' || bytes.length < 100 || bytes.subarray(0, 16).toString('hex') !== asset.signatureHex)) {
    throw new Error('Invalid Spline scene signature.');
  }
}

async function ensureDirectory(directory) {
  const relative = path.relative(ROOT, directory);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Cache directory escapes the repository.');
  let current = ROOT;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { await mkdir(current); } catch (error) { if (error.code !== 'EEXIST') throw error; }
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Cache path is not a real directory: ${current}`);
  }
}

async function readCached(filename) {
  try {
    const stat = await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Cache is not a regular file: ${filename}`);
    return await readFile(filename);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function fetchExact(asset, headers) {
  let url = asset.url;
  for (let redirect = 0; redirect <= 4; redirect += 1) {
    const response = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirect === 4) throw new Error('Invalid or excessive asset redirect.');
      url = validateUrl(new URL(location, url).href).href;
      continue;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error(`HTTP ${response.status}: ${asset.url}`);
    }
    if (url !== (asset.resolvedUrl ?? asset.url)) {
      await response.body.cancel();
      throw new Error(`Source redirect differs from the integrity lock: ${asset.url}`);
    }
    const chunks = [];
    let bytes = 0;
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > asset.bytes) throw new Error(`Response exceeds the locked size: ${asset.url}`);
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Unreachable redirect state.');
}

async function prepareAsset(asset, manifest, verifyOnly) {
  const destination = path.join(PUBLIC_ROOT, asset.localPath);
  await ensureDirectory(path.dirname(destination));
  const existing = await readCached(destination);
  if (existing) {
    verifyBuffer(existing, asset);
    return 'cached';
  }
  if (verifyOnly) throw new Error(`Missing cached asset: ${asset.localPath}`);
  const embeddedText = asset.sourceText ?? null;
  // WHY: The Google Fonts CSS API and license branches are mutable. Preserve captured text in the lock;
  // preparation recreates that exact text instead of silently negotiating a new stylesheet/font version.
  if (embeddedText !== null) {
    const bytes = Buffer.from(embeddedText);
    verifyBuffer(bytes, asset);
    await writeFile(destination, bytes, { flag: 'wx' });
    return 'restored';
  }
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const temporary = `${destination}.${randomUUID()}.part`;
    try {
      const bytes = await fetchExact(asset, manifest.requestHeaders);
      verifyBuffer(bytes, asset);
      await writeFile(temporary, bytes, { flag: 'wx' });
      await rename(temporary, destination);
      return 'downloaded';
    } catch (error) {
      lastError = error;
      await rm(temporary, { force: true });
      if (/HTTP (400|401|403|404|410)\b|checksum|locked size|type mismatch|signature|redirect differs/.test(error.message)) break;
      if (attempt + 1 < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

function generateFontCss(manifest) {
  const byUrl = new Map(manifest.entries.map((entry) => [entry.url, entry]));
  const styles = manifest.fontStylesheets.map((sheet) => {
    const source = byUrl.get(sheet.url);
    if (!source?.sourceText || source.sha256 !== sheet.sourceSha256) throw new Error('Missing locked source font CSS.');
    verifyBuffer(Buffer.from(source.sourceText), source);
    const local = source.sourceText.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g, (_match, _quote, relativeUrl) => {
      const font = byUrl.get(new URL(relativeUrl, sheet.url).href);
      if (font?.status !== 'available' || font.category !== 'font') throw new Error(`Missing locked font: ${relativeUrl}`);
      return `url("${font.localPath}")`;
    });
    return `/* Original stylesheet: ${sheet.url} */\n${local}`;
  });
  return '/* WHAT: Original portfolio fonts, served locally. WHY: Preserve source metrics without runtime font CDN requests. Generated from SHA-256-pinned source CSS; do not replace with approximate fonts. */\n\n' + styles.join('\n\n') + '\n';
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or later is required.');
  const args = new Set(process.argv.slice(2));
  for (const arg of args) if (!['--verify-only', '--strict', '--fonts-only'].includes(arg)) throw new Error(`Unknown option: ${arg}`);
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const entries = validateManifest(manifest);
  const selection = entries.filter((asset) => !args.has('--fonts-only') || ['font-css', 'font', 'license'].includes(asset.category));
  const unavailable = selection.filter((asset) => asset.status === 'unavailable');
  for (const asset of unavailable) console.warn(`Source unavailable (no substitute): ${asset.url} — ${asset.error}`);
  const available = selection.filter((asset) => asset.status === 'available');
  // WHAT: Fonts are processed first; all work stays within four concurrent transfers.
  available.sort((a, b) => Number(b.category.startsWith('font')) - Number(a.category.startsWith('font')));
  let next = 0;
  const result = { cached: 0, downloaded: 0, restored: 0, unavailable: unavailable.length };
  const failures = [];
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, available.length) }, async () => {
    while (next < available.length) {
      const asset = available[next++];
      try { result[await prepareAsset(asset, manifest, args.has('--verify-only'))] += 1; }
      catch (error) { failures.push(error.message); }
    }
  }));
  const expectedCss = generateFontCss(manifest);
  const currentCss = await readFile(FONT_CSS_PATH, 'utf8').catch((error) => { if (error.code === 'ENOENT') return null; throw error; });
  if (currentCss !== expectedCss) {
    if (args.has('--verify-only')) failures.push('Local font CSS does not match the captured source declarations.');
    else { await ensureDirectory(path.dirname(FONT_CSS_PATH)); await writeFile(FONT_CSS_PATH, expectedCss); }
  }
  console.log(`External assets: ${JSON.stringify(result)}.`);
  if (failures.length) throw new Error(failures.join('\n'));
  if (args.has('--strict') && unavailable.length) throw new Error(`${unavailable.length} original external assets remain unavailable.`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
