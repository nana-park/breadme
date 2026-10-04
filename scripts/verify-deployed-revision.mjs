import assert from "node:assert/strict";

// WHAT: Verify the actual public site, not just a successful upload job.
const base = new URL(
  process.env.PAGES_BASE_URL || "https://nana-park.github.io/breadme/",
);
assert.equal(base.href, "https://nana-park.github.io/breadme/");
const expected = process.env.GITHUB_SHA;
assert.match(expected || "", /^[0-9a-f]{40}$/);
const receipt = new URL("deployment.json", base);
receipt.searchParams.set("v", expected);
for (let attempt = 0; attempt < 24; attempt++) {
  const response = await fetch(receipt, { cache: "no-store" });
  if (response.ok) {
    const actual = await response.json();
    if (
      actual.commit === expected &&
      actual.repository === "nana-park/breadme" &&
      actual.base === "/breadme/"
    ) {
      console.log(`Verified ${expected} at ${base.href}`);
      process.exit(0);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
throw new Error(
  `Published revision did not reach ${expected}; inspect the Pages deployment and CDN before retrying verification.`,
);
