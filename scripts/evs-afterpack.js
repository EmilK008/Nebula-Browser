"use strict";

/**
 * electron-builder `afterPack` (runs after win-unpacked is assembled, **before** NSIS / Portable
 * pack that tree). Runs Castlabs EVS `sign-pkg` so installers and Portable.exe embed the same
 * VMP-signed `Nebula.exe` as `dist/win-unpacked` — signing only *after* `npm run dist` leaves
 * those artifacts on the unsigned binary.
 *
 * Requires on the build machine: `py -3 -m pip install castlabs-evs` and a logged-in EVS account.
 *
 * - `NEBULA_SKIP_EVS=1` — skip this hook entirely.
 * - `NEBULA_EVS_SIGN=1` — treat sign-pkg failure as a build error (CI / release).
 * - `CI=true` or `NEBULA_EVS_NO_ASK=1` — pass `--no-ask` to EVS (non-interactive).
 * - `EVS_ACCOUNT_NAME` + `EVS_PASSWD` (or `.evs-credentials`) — pass `-A`/`-P`/`--no-ask`
 *   so sign-pkg never prompts (needed when the terminal cannot accept password input).
 *
 * @param {any} context electron-builder PackContext / AfterPackContext
 */
const { evsAuthCliArgs } = require("./evs-auth");

module.exports = async function evsAfterPack(context) {
  if (process.env.NEBULA_SKIP_EVS === "1") {
    console.warn("[Nebula:EVS] NEBULA_SKIP_EVS=1 — skipping sign-pkg in afterPack.");
    return;
  }
  if (context.electronPlatformName !== "win32") return;

  const { spawnSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");

  const appOutDir = context.appOutDir;
  if (!appOutDir) return;
  const exe = path.join(appOutDir, "Nebula.exe");
  if (!fs.existsSync(exe)) {
    console.warn("[Nebula:EVS] afterPack: Nebula.exe not found, skip:", exe);
    return;
  }

  const authArgs = evsAuthCliArgs();
  const noAsk =
    authArgs.length > 0 ||
    process.env.CI === "true" ||
    process.env.CI === "1" ||
    process.env.NEBULA_EVS_NO_ASK === "1"
      ? authArgs.length > 0
        ? authArgs
        : ["--no-ask"]
      : [];

  const bases = [
    ["py", "-3", "-m", "castlabs_evs.vmp", "sign-pkg", ...noAsk, appOutDir],
    ["python3", "-m", "castlabs_evs.vmp", "sign-pkg", ...noAsk, appOutDir],
    ["python", "-m", "castlabs_evs.vmp", "sign-pkg", ...noAsk, appOutDir],
  ];

  const strict = process.env.NEBULA_EVS_SIGN === "1";

  for (const args of bases) {
    const cmd = args[0];
    const r = spawnSync(cmd, args.slice(1), {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
      shell: false,
      env: { ...process.env },
    });
    if (r.error && r.error.code === "ENOENT") continue;
    if (r.status === 0) {
      console.log("[Nebula:EVS] sign-pkg OK for", appOutDir);
      return;
    }
    const msg = `[Nebula:EVS] sign-pkg failed (${cmd}): exit ${r.status}. Portable/NSIS may lack production VMP.`;
    if (strict) throw new Error(msg);
    console.error(msg);
    console.error(
      "Install castlabs-evs, set EVS_ACCOUNT_NAME + EVS_PASSWD (or .evs-credentials), run npm run evs:reauth, or set NEBULA_SKIP_EVS=1."
    );
    return;
  }

  const msg =
    "[Nebula:EVS] No Python launcher found (py -3, python3, python); skipping sign-pkg. Portable/NSIS will not be VMP-signed unless you install Python + castlabs-evs.";
  if (strict) throw new Error(msg);
  console.warn(msg);
};
