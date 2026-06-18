"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CREDENTIALS_FILE = path.join(ROOT, ".evs-credentials");

/**
 * Load KEY=value lines from `.evs-credentials` (gitignored). Does not override
 * variables already set in the environment.
 */
function loadEvsCredentialsFile() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return;
  const text = fs.readFileSync(CREDENTIALS_FILE, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function evsAccountName() {
  return process.env.EVS_ACCOUNT_NAME || process.env.NEBULA_EVS_ACCOUNT_NAME || "";
}

function evsPasswd() {
  return process.env.EVS_PASSWD || process.env.NEBULA_EVS_PASSWD || "";
}

/**
 * CLI args for castlabs_evs when account + password are known (non-interactive).
 * @returns {string[]}
 */
function evsAuthCliArgs() {
  loadEvsCredentialsFile();
  const account = evsAccountName();
  const passwd = evsPasswd();
  if (account && passwd) {
    return ["--no-ask", "-A", account, "-P", passwd];
  }
  return [];
}

module.exports = {
  CREDENTIALS_FILE,
  loadEvsCredentialsFile,
  evsAuthCliArgs,
  evsAccountName,
  evsPasswd,
};
