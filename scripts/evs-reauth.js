"use strict";

const { spawnSync } = require("child_process");
const path = require("path");
const { evsAuthCliArgs, evsAccountName, evsPasswd, CREDENTIALS_FILE } = require("./evs-auth");

const authArgs = evsAuthCliArgs();
if (!evsAccountName() || !evsPasswd()) {
  console.error(
    "[Nebula:EVS] Set EVS_ACCOUNT_NAME and EVS_PASSWD, or create",
    path.basename(CREDENTIALS_FILE),
    "in the project root (see .evs-credentials.example)."
  );
  console.error(
    "Or run manually:\n  py -3 -m castlabs_evs.account reauth -A YOUR_ACCOUNT -P YOUR_PASSWORD"
  );
  process.exit(1);
}

const bases = [
  ["py", "-3", "-m", "castlabs_evs.account", "reauth", ...authArgs],
  ["python3", "-m", "castlabs_evs.account", "reauth", ...authArgs],
  ["python", "-m", "castlabs_evs.account", "reauth", ...authArgs],
];

for (const args of bases) {
  const cmd = args[0];
  const r = spawnSync(cmd, args.slice(1), {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    shell: false,
    env: { ...process.env },
  });
  if (r.error && r.error.code === "ENOENT") continue;
  process.exit(r.status === 0 ? 0 : r.status || 1);
}

console.error("[Nebula:EVS] No Python launcher found (py -3, python3, python).");
process.exit(1);
