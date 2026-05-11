/**
 * Sets renderer/changelog.json entry date to today's local calendar date (YYYY-MM-DD).
 * Picks the entry whose "version" matches package.json "version"; if none match, updates the first entry.
 *
 * Usage (from repo root): npm run changelog:date
 * Run after you bump package.json and add/update the matching changelog block.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pkgPath = path.join(root, "package.json");
const changelogPath = path.join(root, "renderer", "changelog.json");

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const data = JSON.parse(fs.readFileSync(changelogPath, "utf8"));
const entries = data.entries;
if (!Array.isArray(entries) || entries.length === 0) {
  console.error("changelog-date: missing or invalid entries[]");
  process.exit(1);
}

const now = new Date();
const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const ver = typeof pkg.version === "string" ? pkg.version : "";
let idx = entries.findIndex((e) => e && e.version === ver);
if (idx < 0) {
  console.warn(`changelog-date: no entry with version "${ver}" — updating first entry (${entries[0]?.version ?? "?"})`);
  idx = 0;
}

const entry = entries[idx];
entry.date = iso;
fs.writeFileSync(changelogPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`changelog-date: ${entry.version} → date ${iso}`);
