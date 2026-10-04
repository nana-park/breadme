import externalManifest from "@/content/original/external-asset-manifest.json";
const externalAssets = new Map(
  externalManifest.entries
    .filter((entry) => entry.status === "available")
    .map((entry) => [entry.url, entry.localPath]),
);
// WHAT: Keep original filenames while supporting a future approved hosting base path.
export function assetUrl(path: string): string {
  if (/^(https?:)/.test(path)) {
    const localPath = externalAssets.get(path);
    return localPath
      ? `${import.meta.env.BASE_URL}${localPath.replace(/^\/+/, "")}`
      : path;
  }
  if (/^(data:|blob:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}original/${path.replace(/^\/+/, "")}`;
}

export function originalHref(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) {
    const source = "https://nana-park.github.io/Portfolio/";
    return path.startsWith(source)
      ? originalHref(path.slice(source.length))
      : path;
  }
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}
