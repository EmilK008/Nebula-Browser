"use strict";

/**
 * electron-builder must replace dist/win-unpacked. On Windows, a running Nebula.exe
 * launched from that folder locks DLLs → "Access is denied" on remove.
 */
const { spawnSync } = require("child_process");
const path = require("path");

if (process.platform !== "win32") {
  process.exit(0);
}

const root = path.resolve(__dirname, "..");
const prefix = path.join(root, "dist", "win-unpacked").toLowerCase() + path.sep;
const escaped = prefix.replace(/'/g, "''");

const script = [
  `$p = '${escaped}';`,
  `$x = @(Get-Process Nebula -ErrorAction SilentlyContinue | Where-Object {`,
  `  $_.Path -and $_.Path.ToLower().StartsWith($p)`,
  `});`,
  `if ($x.Count -gt 0) {`,
  `  Write-Host ('dist: Close Nebula.exe running from dist\\win-unpacked (PID ' + ($x.Id -join ', ') + '), then run npm run dist again.') -ForegroundColor Red;`,
  `  exit 1`,
  `}`,
  `exit 0`,
].join(" ");

const r = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
  stdio: "inherit",
  cwd: root,
});

process.exit(r.status === null ? 1 : r.status);
