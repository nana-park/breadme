export const pagesPort = Number(process.env.PAGES_PORT || 4180);
export const pagesBaseUrl =
  process.env.PAGES_BASE_URL || `http://127.0.0.1:${pagesPort}/breadme/`;
export const deployment = new URL(pagesBaseUrl);

// WHY: Running at / by accident must not produce a false production-path pass.
if (
  !["http:", "https:"].includes(deployment.protocol) ||
  deployment.pathname !== "/breadme/" ||
  deployment.search ||
  deployment.hash
) {
  throw new Error(
    "PAGES_BASE_URL must be an absolute URL ending in /breadme/.",
  );
}

export function deployedUrl(route = "") {
  return new URL(route, deployment).href;
}
