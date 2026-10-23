import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { downloadAsset } from './prepare-original-assets.mjs';

test('downloads only the published copy and enforces the locked asset bytes', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'breadme-assets-'));
  const originalFetch = globalThis.fetch;
  const bytes = Buffer.from('published asset');
  const asset = { path: 'Files/Logo/Test logo.svg', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), url: 'https://raw.githubusercontent.com/private/source' };
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://nana-park.github.io/breadme/original/Files/Logo/Test%20logo.svg');
      assert.equal(options.redirect, 'error');
      return new Response(bytes);
    };
    const target = path.join(directory, 'valid');
    await downloadAsset(asset, target);
    assert.deepEqual(await readFile(target), bytes);
    globalThis.fetch = async () => new Response(Buffer.from('different asset'));
    await assert.rejects(downloadAsset(asset, path.join(directory, 'bad')), /checksum or size mismatch/);
    globalThis.fetch = async () => new Response(null, { status: 404 });
    await assert.rejects(downloadAsset(asset, path.join(directory, 'missing')), /HTTP 404/);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(directory, { recursive: true, force: true });
  }
});
