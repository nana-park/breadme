import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// WHAT: Rebuild an archived, immutable main commit, without checking out the branch.
// WHY: A moving main branch or a candidate-built reference would weaken this guard.
const BASELINE_COMMIT = "4f026a3dd816c11bb1a4718379e2ba9d6f7527af";
const root = fileURLToPath(new URL("../", import.meta.url));
// Keep the archived source outside ESLint's inputs, and outside the guard's own
// output folder (which Playwright clears when the comparison run starts).
const baseline = path.join(root, "test-results/desktop-unchanged-baseline");
const run = (command, args, cwd = root) =>
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, VITE_BASE_PATH: "/" },
  });

// Fail before touching the cache if the checkout lacks the immutable reference.
run("git", ["cat-file", "-e", `${BASELINE_COMMIT}^{commit}`]);
const archive = execFileSync("git", ["archive", BASELINE_COMMIT], {
  cwd: root,
  maxBuffer: 64 * 1024 * 1024,
});
await rm(baseline, { recursive: true, force: true });
await mkdir(baseline, { recursive: true });
execFileSync("tar", ["-x", "-C", baseline], { input: archive });

const lockfile = await readFile(path.join(root, "package-lock.json"));
const baselineLockfile = await readFile(
  path.join(baseline, "package-lock.json"),
);
if (!lockfile.equals(baselineLockfile)) {
  throw new Error(
    "Baseline and candidate dependency locks differ; do not share node_modules or silently install another dependency graph.",
  );
}
await symlink(
  path.join(root, "node_modules"),
  path.join(baseline, "node_modules"),
  "dir",
);

// The archived prebuild scripts verify every reused asset against their pinned
// manifests. Copy regular files, because those verifiers intentionally reject symlinks.
for (const folder of ["original", "original-external"]) {
  await cp(
    path.join(root, "public", folder),
    path.join(baseline, "public", folder),
    {
      recursive: true,
    },
  );
}
run("npm", ["run", "build"], baseline);

await writeFile(
  path.join(baseline, "dist", "desktop-unchanged-provenance.json"),
  JSON.stringify(
    {
      schemaVersion: 1,
      commit: BASELINE_COMMIT,
      source:
        "git archive of immutable main; archived prebuild asset verification passed",
      dependencyLockSha256: createHash("sha256")
        .update(baselineLockfile)
        .digest("hex"),
      buildBase: "/",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Desktop reference built from ${BASELINE_COMMIT} in ${path.relative(root, baseline)}`,
);
