"use strict";

const NEBULA_ACCOUNT_RECORD_VERSION = 2;
const NEBULA_ACCOUNT_USERNAME_MIN = 3;
const NEBULA_ACCOUNT_USERNAME_MAX = 32;
const NEBULA_ACCOUNT_USERNAME_RE = /^[a-z0-9][a-z0-9._-]*[a-z0-9]$|^[a-z0-9]$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "nebula",
  "root",
  "support",
  "system",
  "help",
]);

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .slice(0, NEBULA_ACCOUNT_USERNAME_MAX);
}

/**
 * @param {string} raw
 * @returns {{ ok: true, username: string } | { ok: false, error: string }}
 */
function validateUsername(raw) {
  const username = normalizeUsername(raw);
  if (username.length < NEBULA_ACCOUNT_USERNAME_MIN) {
    return { ok: false, error: "username_too_short" };
  }
  if (username.length > NEBULA_ACCOUNT_USERNAME_MAX) {
    return { ok: false, error: "username_too_long" };
  }
  if (!NEBULA_ACCOUNT_USERNAME_RE.test(username)) {
    return { ok: false, error: "username_invalid" };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { ok: false, error: "username_reserved" };
  }
  return { ok: true, username };
}

function usernameErrorMessage(code) {
  switch (code) {
    case "username_too_short":
      return `Username must be at least ${NEBULA_ACCOUNT_USERNAME_MIN} characters.`;
    case "username_too_long":
      return `Username must be at most ${NEBULA_ACCOUNT_USERNAME_MAX} characters.`;
    case "username_invalid":
      return "Use letters, numbers, dots, underscores, or hyphens (must start and end with a letter or number).";
    case "username_reserved":
      return "That username is reserved. Pick another.";
    default:
      return "Invalid username.";
  }
}

module.exports = {
  NEBULA_ACCOUNT_RECORD_VERSION,
  NEBULA_ACCOUNT_USERNAME_MIN,
  NEBULA_ACCOUNT_USERNAME_MAX,
  normalizeUsername,
  validateUsername,
  usernameErrorMessage,
};
