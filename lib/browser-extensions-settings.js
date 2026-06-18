"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MAX_EXTENSIONS_PER_PROFILE = 12;

const DEFAULT_PROFILE_EXTENSIONS_STATE = {
  enabled: false,
  /** When true with extensions enabled, Nebula built-in adblock is off on this profile's browsing partition. */
  pauseBuiltinAdblock: false,
  items: [],
};

const DEFAULT_PROFILE_EXTENSIONS = {
  byProfile: {},
};

function sanitizeProfileIdForExtensions(raw) {
  let s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s || s === "default") return "default";
  s = s.replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  return s || "default";
}

function normalizeExtensionItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  const extPath = typeof raw.path === "string" ? raw.path.trim() : "";
  if (!extPath) return null;
  let id = typeof raw.id === "string" ? raw.id.trim().slice(0, 64) : "";
  if (!id) id = crypto.createHash("sha256").update(extPath).digest("hex").slice(0, 16);
  const name =
    typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : path.basename(extPath);
  const manifestVersion =
    typeof raw.manifestVersion === "number" && Number.isFinite(raw.manifestVersion) ? raw.manifestVersion : 0;
  const version = typeof raw.version === "string" ? raw.version.trim().slice(0, 32) : "";
  return {
    id,
    path: extPath,
    name,
    version,
    manifestVersion,
    enabled: raw.enabled !== false,
  };
}

function normalizeProfileExtensionsState(raw) {
  if (!raw || typeof raw !== "object") {
    return { enabled: false, items: [] };
  }
  const itemsIn = Array.isArray(raw.items) ? raw.items : [];
  const items = [];
  const seenPath = new Set();
  for (const row of itemsIn) {
    const neu = normalizeExtensionItem(row);
    if (!neu) continue;
    const key = neu.path.toLowerCase();
    if (seenPath.has(key)) continue;
    seenPath.add(key);
    items.push(neu);
    if (items.length >= MAX_EXTENSIONS_PER_PROFILE) break;
  }
  return {
    enabled: raw.enabled === true,
    pauseBuiltinAdblock: raw.pauseBuiltinAdblock === true,
    items,
  };
}

function normalizeProfileExtensions(raw) {
  if (!raw || typeof raw !== "object") {
    return { byProfile: {} };
  }
  const byProfileIn = raw.byProfile && typeof raw.byProfile === "object" ? raw.byProfile : {};
  const byProfile = {};
  for (const [k, v] of Object.entries(byProfileIn)) {
    const pid = sanitizeProfileIdForExtensions(k);
    byProfile[pid] = normalizeProfileExtensionsState(v);
  }
  return { byProfile };
}

function getProfileExtensionsState(settings, profileId) {
  const all = normalizeProfileExtensions(settings?.profileExtensions);
  const pid = sanitizeProfileIdForExtensions(profileId);
  return all.byProfile[pid] || { ...DEFAULT_PROFILE_EXTENSIONS_STATE, items: [] };
}

function readUnpackedExtensionMeta(extPath) {
  const dir = typeof extPath === "string" ? extPath.trim() : "";
  if (!dir) return { ok: false, error: "no_path" };
  const manifestPath = path.join(dir, "manifest.json");
  try {
    if (!fs.existsSync(manifestPath)) {
      return { ok: false, error: "manifest_missing", message: "That folder is not an unpacked extension (no manifest.json)." };
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!manifest || typeof manifest !== "object") {
      return { ok: false, error: "manifest_invalid", message: "manifest.json is not valid JSON." };
    }
    const conflicts = require("./browser-extensions-conflicts");
    const permissions = conflicts.listManifestPermissions(manifest);
    const looksLikeAdblock = conflicts.extensionManifestLooksLikeAdblock(manifest);
    const name =
      typeof manifest.name === "string" && manifest.name.trim()
        ? manifest.name.trim().slice(0, 120)
        : path.basename(dir);
    const manifestVersion =
      typeof manifest.manifest_version === "number" ? manifest.manifest_version : Number(manifest.manifest_version) || 0;
    const version =
      typeof manifest.version === "string"
        ? manifest.version.trim().slice(0, 32)
        : manifest.version != null
          ? String(manifest.version).slice(0, 32)
          : "";
    return {
      ok: true,
      path: path.resolve(dir),
      name,
      version,
      manifestVersion,
      permissions,
      looksLikeAdblock,
    };
  } catch (err) {
    return { ok: false, error: "read_failed", message: String(err?.message || err) };
  }
}

module.exports = {
  MAX_EXTENSIONS_PER_PROFILE,
  DEFAULT_PROFILE_EXTENSIONS,
  DEFAULT_PROFILE_EXTENSIONS_STATE,
  sanitizeProfileIdForExtensions,
  normalizeProfileExtensions,
  normalizeProfileExtensionsState,
  normalizeExtensionItem,
  getProfileExtensionsState,
  readUnpackedExtensionMeta,
};
