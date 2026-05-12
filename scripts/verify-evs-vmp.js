"use strict";

/**
 * Run Castlabs EVS verify-pkg on dist/win-unpacked (or a path you pass).
 * Use after `npm run dist` / `dist:dir` to confirm production VMP is present on the exe you ship.
 *
 *   node scripts/verify-evs-vmp.js
 *   node scripts/verify-evs-vmp.js "C:\path\to\win-unpacked"
 *
 * Requires: py -3 -m pip install castlabs-evs (or python3 with castlabs-evs on PATH).
 */

const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const arg = process.argv[2];
const pkgDir = arg ? path.resolve(arg) : path.join(root, "dist", "win-unpacked");

if (!fs.existsSync(pkgDir)) {
  console.error(`[verify-evs-vmp] Package directory not found:\n  ${pkgDir}`);
  console.error("Build first (npm run dist:dir), or pass the path to win-unpacked.");
  process.exit(2);
}

const exe = path.join(pkgDir, "Nebula.exe");
if (!fs.existsSync(exe)) {
  console.error(`[verify-evs-vmp] Expected main executable missing:\n  ${exe}`);
  process.exit(2);
}

const candidates = [
  ["py", "-3", "-m", "castlabs_evs.vmp", "verify-pkg", pkgDir],
  ["python3", "-m", "castlabs_evs.vmp", "verify-pkg", pkgDir],
  ["python", "-m", "castlabs_evs.vmp", "verify-pkg", pkgDir],
];

let last = null;
for (const args of candidates) {
  const cmd = args[0];
  const r = spawnSync(cmd, args.slice(1), { stdio: "inherit", cwd: root, shell: false });
  last = r;
  if (r.error && r.error.code === "ENOENT") continue;
  process.exit(r.status === 0 ? 0 : 1);
}

console.error("[verify-evs-vmp] No Python launcher found (tried py -3, python3, python).");
if (last && last.error) console.error(last.error.message || last.error);
process.exit(1);
