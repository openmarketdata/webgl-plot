// Assembles an installable, prebuilt copy of the package into release/.
// The result is what gets pushed to the `release` branch so that
// `npm install github:openmarketdata/webgl-plot#release` (and bun, which
// never runs a git dependency's `prepare` script) works without a build step.
//
// Usage: npm run build && node scripts/assemble-release.mjs

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "release");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

if (!existsSync(resolve(root, "dist/react.mjs"))) {
  throw new Error("dist/ is missing or incomplete; run `npm run build` first");
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out);

cpSync(resolve(root, "dist"), resolve(out, "dist"), { recursive: true });
for (const f of ["README.md", "LICENSE"]) {
  cpSync(resolve(root, f), resolve(out, f));
}

// Consumers install prebuilt output only: no lifecycle scripts, no dev deps.
delete pkg.scripts;
delete pkg.devDependencies;
if (process.env.GITHUB_SHA) pkg.gitHead = process.env.GITHUB_SHA;
writeFileSync(resolve(out, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

console.log(`Release tree assembled in ${out}`);
