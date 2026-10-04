# Original external asset cache

## Purpose

The migration serves the original portfolio’s external fonts and images locally, without approximate replacements or visitor-side font/image CDN requests. The exact source Spline scene is also local. This cache complements the original repository asset cache documented in [original-assets.md](./original-assets.md).

- Integrity lock: `src/content/original/external-asset-manifest.json`
- Reproducible preparation: `scripts/prepare-external-assets.mjs`
- Local font declarations: `src/styles/original/fonts.css`
- Generated cache: `public/original-external/` (excluded from Git)
- Captured source: the URLs referenced by the original portfolio at commit `834815915647e4b3fbf9285b88b8001e37b94aa0`

The lock contains only public source URLs and integrity/provenance information. It contains no credentials or machine-specific paths. Download names use stable source-URL hashes, so two different source URLs cannot silently overwrite one another. Original repository filenames are handled separately by the repository asset preparation script.

## Captured assets

Verified on 2026-10-04:

| Kind | Count | Notes |
| --- | ---: | --- |
| Original font stylesheets | 5 | Two main Google Fonts requests, Pretendard 1.3.9 static, and two mentoring mockup stylesheets |
| Font files | 140 | All source `url(...)` references, including WOFF format fallbacks and Korean variable subsets |
| Article images | 47 | Exact `www.artinsight.co.kr/data/tmp/…` URLs from `articles_data.js` |
| Hopzie channel avatars | 5 | Four original `images.weserv.nl` proxy URLs and one direct YouTube avatar URL |
| Original avatar fallbacks | 5 | Original H/L/J/D/G PNG bytes embedded in the lock; their source URLs generate mutable responses |
| Gmail SVG | 1 | Exact Wikimedia source SVG |
| Spline scene | 1 | Original compressed scene |
| Spline badge icon | 1 | Exact original attribution icon; the badge itself remains visible |
| Font license texts | 6 | Actual upstream copyright notices and SIL Open Font License text |
| **Total** | **211** | **26,849,087 bytes; zero unavailable assets and zero substitutions** |

The manifest contains the source URL, source files, local path, length, SHA-256, and detected file type for each available asset. HTTP Content-Type is retained when available; it is deliberately null for image responses recovered after an interrupted capture. Those images were independently checked using their file signatures and hashes. A response header is never treated as sufficient proof that a returned document is an image or font.

### Fonts

The generated CSS retains all 259 original `@font-face` rules, their weight/style declarations, unicode ranges, format fallbacks, display behavior, copyright comments, and stylesheet order. Only `url(...)` targets are changed to local cache URLs. Existing `local(...)` font names are preserved as part of the original source behavior.

The source’s families are Playfair Display, Lora, Inter, JetBrains Mono, Outfit, Pretendard, and Pretendard Variable. Pretendard static is the original v1.3.9 file with weights 100–900. The additional Inter 400–800 request and Pretendard Variable dynamic subsets belong to the mentoring mockup; they are retained rather than replacing its fonts.

Google Fonts responds differently to different clients. The manifest records the exact browser User-Agent used to capture its CSS, stores that original CSS text and SHA-256, and locks every resulting font URL. Routine preparation never asks the mutable Google CSS endpoint for a new stylesheet. It reconstructs the exact captured CSS and downloads only the already-locked font binaries, avoiding silent future font-version changes.

### Reproducible generated avatar fallbacks

The five original `ui-avatars.com` fallback image URLs returned different PNG bytes during a clean CI build. Their originally captured SHA-256 values were preserved; no checksums were changed and no replacement response was accepted. The manifest now embeds the exact five previously verified PNG files as canonical `sourceBase64` strings (2,541 bytes decoded in total). Preparation restores those original bytes before considering a network request, then applies the same length, SHA-256, and PNG signature checks. Embedded binary content is restricted to these original `fallback-image` PNG assets from `ui-avatars.com`; other source categories cannot use this restoration path. The original cache was not removed or modified while testing this fix.

### Spline

- Original URL: <https://prod.spline.design/wLEe3qQhZTm7cvPS/scene.splinecode>
- Local path: `/original-external/spline/scene.splinecode`
- Length: 28,487 bytes
- SHA-256: `c5d44efd1bb487243cd81fd57f029521c13a42d8e39481b399a104f4adb60da8`

The scene is a compressed binary. The preparer checks its complete hash and recorded initial byte signature; this is not a claim to decode or validate its internal schema. Rendering must be checked using the matching original viewer, `@splinetool/viewer@1.9.82`. Do not remove the original “Built with Spline” attribution. The source viewer’s exact original favicon is cached at `/original-external/spline/icon-favicon.png` (5,560 bytes; SHA-256 `5b0b02e77f5af36bfa4938d9a3e8a345d463ec0248391c11a99f36ec7cc601a2`). The integration replaces only that exact remote icon URL; the visible badge and its attribution are preserved. Browser verification must still check that the bundled viewer makes no image hotlink request.

### Font attribution and license evidence

These statements come from the retrieved license files, not an inferred license label. Full text is embedded in the integrity lock and restored to `public/original-external/licenses/` for distribution with the font cache.

| Family | Upstream evidence | Copyright notice |
| --- | --- | --- |
| Playfair Display | [OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/OFL.txt) | Copyright 2017 The Playfair Display Project Authors; reserved name “Playfair Display” |
| Lora | [OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/lora/OFL.txt) | Copyright 2011 The Lora Project Authors; reserved name “Lora” |
| Inter | [OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt) | Copyright 2020 The Inter Project Authors |
| JetBrains Mono | [OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/OFL.txt) | Copyright 2020 The JetBrains Mono Project Authors |
| Outfit | [OFL.txt](https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt) | Copyright 2021 The Outfit Project Authors |
| Pretendard 1.3.9 | [LICENSE](https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE) | Copyright (c) 2021, Kil Hyung-jin; reserved name Pretendard |

All six retrieved texts state SIL Open Font License, Version 1.1. The migration preserves the full notices and license texts. It does not assert new ownership or infer licenses for third-party article imagery, avatars, Gmail branding, or Spline content. Their source attribution remains in the manifest and the portfolio’s original content.

## Prepare and verify

Use Node.js 24 or later:

```sh
node scripts/prepare-external-assets.mjs
node scripts/prepare-external-assets.mjs --verify-only --strict
```

For typography-only preparation:

```sh
node scripts/prepare-external-assets.mjs --fonts-only --strict
```

Normal preparation:

1. Validates public source origins, unique URLs, safe output paths, categories, sizes, and hashes.
2. Checks cached bytes again, including font/image magic signatures. A corrupted cached file fails rather than being overwritten silently.
3. Downloads only missing locked binaries, with a maximum of four concurrent transfers, a 45-second request timeout, at most three attempts, and at most four redirects to allowed public origins.
4. Rejects changed redirects, HTML masquerading as media, altered file types, oversized responses, and checksum mismatches.
5. Recreates captured CSS/license text and the five original generated fallback PNGs from the integrity lock, without relying on mutable upstream responses.
6. Recreates the local font CSS from the captured original declarations.

`--verify-only` does not download missing files or alter font CSS. `--strict` additionally fails if the lock records any unavailable original asset. If a future source URL disappears or changes its bytes, preparation reports the exact failure; it does not switch to a mirror, hotlink, placeholder, or newly generated replacement. Updating the lock is a deliberate review operation, not a normal build side effect.

The runtime application should map original image URLs through the manifest and apply the application’s configured base path to `localPath`. Import `src/styles/original/fonts.css` through Vite so CSS asset URLs are processed for the configured base path. Raw source CSS stored under `source-css/` is provenance only and must not be loaded directly into a page.

YouTube embeds and the YouTube player API remain external service players, as in the source. They are not downloaded or represented as local videos.

## Verification performed

- All 211 cached assets passed length and SHA-256 verification.
- All font and image bytes passed file-signature checks.
- All five captured CSS sources reproduce the checked-in local font CSS exactly.
- Local font CSS contains 259 source `@font-face` rules and zero remote `url(...)` references.
- A second preparation run reused all cached files without downloads.
- A cold-cache sample restored one CSS and one license from the lock and downloaded one exact font again.
- A separate temporary copy, with only the five fallback image files missing and network fetch disabled, restored all five original PNGs and verified all 211 assets.
- Invalid base64, altered embedded bytes, and attempts to embed binary content in another asset category were rejected.
- Negative validation checks rejected traversal, hidden-file and empty-segment paths, plus an altered font checksum.
- `node --check scripts/prepare-external-assets.mjs` and the script’s ESLint check passed.

Browser rendering and Spline badge resource checks are separate integration checks; file integrity alone does not establish visual parity.
