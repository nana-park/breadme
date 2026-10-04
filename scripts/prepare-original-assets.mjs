import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, realpath, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

// WHAT: 원본의 고정 커밋 에셋만 검증하여 브라우저용 로컬 캐시를 준비한다.
// WHY: 대용량 바이너리를 Git에 다시 넣거나 방문자의 외부 핫링크에 의존하지 않는다.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MANIFEST_PATH = path.join(ROOT, 'src/content/original/asset-manifest.json');
const OUTPUT_DIR = path.join(ROOT, 'public/original');
const PINNED_COMMIT = '834815915647e4b3fbf9285b88b8001e37b94aa0';
const RAW_BASE = `https://raw.githubusercontent.com/nana-park/Portfolio/${PINNED_COMMIT}/`;
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.mp4', '.webm', '.pdf']);
const MAX_CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 60_000;

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function validateManifest(manifest) {
  if (manifest.schemaVersion !== 1 || manifest.source?.repository !== 'nana-park/Portfolio' || manifest.source?.commit !== PINNED_COMMIT) {
    throw new Error('Unsupported manifest schema, repository, or source commit.');
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) throw new Error('Manifest has no assets.');
  const uniquePaths = new Set();
  for (const asset of manifest.assets) {
    const segments = typeof asset.path === 'string' ? asset.path.split('/') : [];
    const unsafeSegment = segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.startsWith('.') || /(?:^|[_-])(backup|node_modules|temp|tmp)(?:[_-]|$)/i.test(segment));
    if (!segments.length || unsafeSegment || (asset.path.includes('\\') || [...asset.path].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) || !ALLOWED_EXTENSIONS.has(path.posix.extname(asset.path).toLowerCase())) {
      throw new Error(`Unsafe asset path: ${String(asset.path)}`);
    }
    if (uniquePaths.has(asset.path)) throw new Error(`Duplicate asset path: ${asset.path}`);
    uniquePaths.add(asset.path);
    if (!Number.isSafeInteger(asset.bytes) || asset.bytes <= 0 || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      throw new Error(`Invalid integrity metadata: ${asset.path}`);
    }
    const pinnedUrl = RAW_BASE + segments.map((segment) => encodeURIComponent(segment).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
    if (asset.url !== pinnedUrl) throw new Error(`Unpinned or unexpected source URL: ${asset.path}`);
  }
  if (manifest.assetCount !== manifest.assets.length || manifest.totalBytes !== manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0)) {
    throw new Error('Manifest asset count or total bytes does not match its entries.');
  }
  return manifest.assets;
}

// WHY: 캐시와 체크아웃의 symlink가 허용된 에셋 경로 밖의 파일을 가리키지 않게 한다.
async function regularFileWithin(root, filename) {
  try {
    const details = await lstat(filename);
    if (details.isSymbolicLink() || !details.isFile()) throw new Error(`Expected a regular asset file: ${filename}`);
    if (!isWithin(root, await realpath(filename))) throw new Error(`Asset resolves outside its root: ${filename}`);
    return details;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function verifyAsset(filename, asset) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(filename)) {
    bytes += chunk.length;
    if (bytes > asset.bytes) throw new Error(`Asset exceeds expected size: ${asset.path}`);
    hash.update(chunk);
  }
  if (bytes !== asset.bytes || hash.digest('hex') !== asset.sha256) throw new Error(`Asset checksum or size mismatch: ${asset.path}`);
}

async function ensureCacheDirectory(directory) {
  if (!isWithin(ROOT, directory)) throw new Error(`Cache directory is outside the repository: ${directory}`);
  let current = ROOT;
  for (const segment of path.relative(ROOT, directory).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      await mkdir(current);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const details = await lstat(current);
    if (details.isSymbolicLink() || !details.isDirectory()) throw new Error(`Cache directory must be a real directory: ${current}`);
  }
}

async function prepareParentDirectories(destination) {
  await ensureCacheDirectory(path.dirname(destination));
}

async function downloadAsset(asset, temporaryPath) {
  const response = await fetch(asset.url, {
    headers: { Accept: 'application/octet-stream' },
    redirect: 'error',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} downloading ${asset.path}`);
  let bytes = 0;
  const hash = createHash('sha256');
  const verifier = new Transform({
    transform(chunk, encoding, callback) {
      bytes += chunk.length;
      if (bytes > asset.bytes) {
        callback(new Error(`Download exceeds expected size: ${asset.path}`));
        return;
      }
      hash.update(chunk);
      callback(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), verifier, createWriteStream(temporaryPath, { flags: 'wx' }));
  if (bytes !== asset.bytes || hash.digest('hex') !== asset.sha256) throw new Error(`Downloaded checksum or size mismatch: ${asset.path}`);
}

async function prepareAsset(asset, sourceRoot, checkOnly) {
  const destination = path.join(OUTPUT_DIR, ...asset.path.split('/'));
  const cached = await regularFileWithin(OUTPUT_DIR, destination);
  if (cached) {
    try {
      await verifyAsset(destination, asset);
      return 'cached';
    } catch (error) {
      if (checkOnly) throw error;
      // WHY: 손상된 캐시는 검증된 임시 파일이 준비된 후에만 교체한다.
    }
  } else if (checkOnly) {
    throw new Error(`Missing cached asset: ${asset.path}`);
  }

  await prepareParentDirectories(destination);
  const temporaryPath = `${destination}.${randomUUID()}.tmp`;
  try {
    if (sourceRoot) {
      const sourcePath = path.join(sourceRoot, ...asset.path.split('/'));
      const original = await regularFileWithin(sourceRoot, sourcePath);
      if (original) {
        await copyFile(sourcePath, temporaryPath);
        let matches = false;
        try {
          await verifyAsset(temporaryPath, asset);
          matches = true;
        } catch {
          await rm(temporaryPath, { force: true });
          console.warn(`Local source differs from the pinned asset; downloading: ${asset.path}`);
        }
        if (matches) {
          await rename(temporaryPath, destination);
          return 'copied';
        }
      }
    }
    await downloadAsset(asset, temporaryPath);
    await rename(temporaryPath, destination);
    return 'downloaded';
  } finally {
    // Only this invocation's private temporary file can be removed.
    await rm(temporaryPath, { force: true });
  }
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes('--help')) {
    console.log('Usage: node scripts/prepare-original-assets.mjs [--check]\n\nOptional ORIGINAL_ASSET_SOURCE_DIR: use a local source checkout before pinned downloads.\n--check: verify the existing local cache only, without writes or network access.\nOnly manifest-listed assets are read; .env files and credentials are never loaded.');
    return;
  }
  if (args.some((arg) => arg !== '--check')) throw new Error('Unknown argument. Use --help for usage.');
  const checkOnly = args.includes('--check');
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const assets = validateManifest(manifest);
  let sourceRoot = null;
  if (!checkOnly && process.env.ORIGINAL_ASSET_SOURCE_DIR) {
    sourceRoot = await realpath(path.resolve(process.env.ORIGINAL_ASSET_SOURCE_DIR));
  }
  if (!checkOnly) {
    await ensureCacheDirectory(OUTPUT_DIR);
  }
  let nextIndex = 0;
  const counts = { cached: 0, copied: 0, downloaded: 0 };
  const errors = [];
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENCY, assets.length) }, async () => {
    while (nextIndex < assets.length) {
      const asset = assets[nextIndex++];
      try {
        counts[await prepareAsset(asset, sourceRoot, checkOnly)] += 1;
      } catch (error) {
        errors.push({ path: asset.path, message: error.message });
      }
    }
  }));
  console.log(`Original assets: ${counts.cached} cached, ${counts.copied} copied, ${counts.downloaded} downloaded; ${assets.length} files, ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MiB expected.`);
  if (errors.length) {
    for (const error of errors) console.error(`- ${error.path}: ${error.message}`);
    throw new Error(`${errors.length} original asset(s) could not be verified. Build preparation is incomplete.`);
  }
  console.log(checkOnly ? 'All original asset checksums match.' : 'All original assets are ready in public/original.');
  if (manifest.pendingExternalAssets?.length) console.log(`${manifest.pendingExternalAssets.length} external resources are listed separately as pending; this script does not fetch or hotlink them.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
