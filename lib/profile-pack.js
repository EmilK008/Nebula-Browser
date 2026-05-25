"use strict";

const crypto = require("crypto");

const PACK_FORMAT = "nebula-profile-pack";
const PACK_ENCRYPTED_FORMAT = "nebula-profile-pack-encrypted";
const PACK_VERSION = 1;
const KDF_ITERATIONS = 310000;
const KDF_KEYLEN = 32;

/** Settings safe to move between machines (not machine/network/first-run). */
const EXPORTABLE_SETTINGS_KEYS = [
  "shellTheme",
  "shellAccent",
  "shellDensity",
  "bookmarksBarMode",
  "toolbarButtons",
  "newTabButtonPlacement",
  "aiAssistant",
  "searchSuggestions",
  "defaultSearchEngine",
  "keyboardShortcuts",
  "translateEngine",
  "translateLibreUrl",
  "adblockEnabled",
];

function extractExportableSettings(settings) {
  if (!settings || typeof settings !== "object") return {};
  const out = {};
  for (const key of EXPORTABLE_SETTINGS_KEYS) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      out[key] = settings[key];
    }
  }
  return out;
}

function mergeExportableSettingsInto(current, incoming) {
  const cur = current && typeof current === "object" ? current : {};
  const inc = incoming && typeof incoming === "object" ? incoming : {};
  const next = { ...cur };
  for (const key of EXPORTABLE_SETTINGS_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(inc, key)) continue;
    if (key === "toolbarButtons" || key === "aiAssistant" || key === "searchSuggestions" || key === "keyboardShortcuts") {
      next[key] = { ...(typeof cur[key] === "object" && cur[key] ? cur[key] : {}), ...(inc[key] && typeof inc[key] === "object" ? inc[key] : {}) };
    } else {
      next[key] = inc[key];
    }
  }
  return next;
}

function deriveKey(password, saltBuf, iterations) {
  return crypto.pbkdf2Sync(String(password), saltBuf, iterations, KDF_KEYLEN, "sha256");
}

function encryptPackInner(innerObj, password) {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt, KDF_ITERATIONS);
  const iv = crypto.randomBytes(12);
  const plain = Buffer.from(JSON.stringify(innerObj), "utf8");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: PACK_VERSION,
    format: PACK_ENCRYPTED_FORMAT,
    kdf: {
      algorithm: "pbkdf2-sha256",
      salt: salt.toString("base64"),
      iterations: KDF_ITERATIONS,
    },
    cipher: {
      algorithm: "aes-256-gcm",
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      data: enc.toString("base64"),
    },
  };
}

function decryptPackEnvelope(envelope, password) {
  if (!envelope || typeof envelope !== "object") return { ok: false, error: "invalid_pack" };
  if (envelope.format !== PACK_ENCRYPTED_FORMAT || envelope.v !== PACK_VERSION) {
    return { ok: false, error: "unsupported_pack_version" };
  }
  const kdf = envelope.kdf;
  const cipher = envelope.cipher;
  if (!kdf || !cipher || typeof password !== "string" || password.length < 1) {
    return { ok: false, error: "invalid_pack" };
  }
  try {
    const salt = Buffer.from(kdf.salt, "base64");
    const iterations =
      typeof kdf.iterations === "number" && kdf.iterations >= 100000 ? kdf.iterations : KDF_ITERATIONS;
    const key = deriveKey(password, salt, iterations);
    const iv = Buffer.from(cipher.iv, "base64");
    const tag = Buffer.from(cipher.tag, "base64");
    const data = Buffer.from(cipher.data, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    const inner = JSON.parse(plain.toString("utf8"));
    if (!inner || inner.format !== PACK_FORMAT) return { ok: false, error: "invalid_inner_pack" };
    return { ok: true, pack: inner };
  } catch {
    return { ok: false, error: "wrong_password_or_corrupt" };
  }
}

function buildInnerPack({ profileMeta, options, settingsSlice, vaultEntries, rendererSections }) {
  const sections = {};
  if (options.settings && settingsSlice) sections.settings = settingsSlice;
  if (options.bookmarks && rendererSections?.bookmarks) sections.bookmarks = rendererSections.bookmarks;
  if (options.history && rendererSections?.history) sections.history = rendererSections.history;
  if (options.aiChat) {
    if (rendererSections?.aiConversations) sections.aiConversations = rendererSections.aiConversations;
    if (rendererSections?.aiSearchHistory) sections.aiSearchHistory = rendererSections.aiSearchHistory;
  }
  if (options.vault && vaultEntries) sections.vault = { entries: vaultEntries };
  return {
    v: PACK_VERSION,
    format: PACK_FORMAT,
    exportedAt: Date.now(),
    source: profileMeta,
    sections,
  };
}

function parsePackFileText(text) {
  try {
    const o = JSON.parse(text);
    if (!o || typeof o !== "object") return { ok: false, error: "invalid_json" };
    if (o.format === PACK_ENCRYPTED_FORMAT) return { ok: true, envelope: o };
    if (o.format === PACK_FORMAT) return { ok: true, pack: o };
    return { ok: false, error: "not_nebula_profile_pack" };
  } catch (err) {
    return { ok: false, error: `invalid_json: ${String(err?.message || err)}` };
  }
}

module.exports = {
  PACK_FORMAT,
  PACK_ENCRYPTED_FORMAT,
  PACK_VERSION,
  EXPORTABLE_SETTINGS_KEYS,
  extractExportableSettings,
  mergeExportableSettingsInto,
  encryptPackInner,
  decryptPackEnvelope,
  buildInnerPack,
  parsePackFileText,
};
