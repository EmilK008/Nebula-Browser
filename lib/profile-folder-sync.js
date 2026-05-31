"use strict";

const path = require("path");

const SYNC_PACK_FILENAME = "nebula-profile-sync.nebula-profile";
const SYNC_META_FILENAME = "nebula-profile-sync.meta.json";

function getSyncFilePaths(folderPath) {
  const base = typeof folderPath === "string" ? folderPath.trim() : "";
  if (!base) return { packPath: "", metaPath: "" };
  return {
    packPath: path.join(base, SYNC_PACK_FILENAME),
    metaPath: path.join(base, SYNC_META_FILENAME),
  };
}

/**
 * @param {string} folderPath
 * @returns {{ ok: true, meta: object } | { ok: false, error: string }}
 */
function readSyncMeta(folderPath) {
  const fs = require("fs");
  const { metaPath } = getSyncFilePaths(folderPath);
  if (!metaPath) return { ok: false, error: "no_folder" };
  try {
    if (!fs.existsSync(metaPath)) return { ok: true, meta: null };
    const o = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    if (!o || typeof o !== "object") return { ok: true, meta: null };
    return { ok: true, meta: o };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * @param {string} folderPath
 * @returns {{ ok: true, text: string } | { ok: false, error: string }}
 */
function readSyncPackFile(folderPath) {
  const fs = require("fs");
  const { packPath } = getSyncFilePaths(folderPath);
  if (!packPath) return { ok: false, error: "no_folder" };
  try {
    if (!fs.existsSync(packPath)) return { ok: false, error: "no_pack" };
    return { ok: true, text: fs.readFileSync(packPath, "utf8") };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/**
 * @param {string} folderPath
 * @param {string} packText
 * @param {object} meta
 */
function writeSyncPackAndMeta(folderPath, packText, meta) {
  const fs = require("fs");
  const { packPath, metaPath } = getSyncFilePaths(folderPath);
  if (!packPath) throw new Error("no_folder");
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(packPath, packText, "utf8");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");
}

const DEFAULT_PROFILE_FOLDER_SYNC = {
  enabled: false,
  profileId: "default",
  folderPath: "",
  lastPushedExportedAt: 0,
  lastImportedExportedAt: 0,
  pendingPush: false,
};

function normalizeProfileFolderSync(raw, activeProfileId) {
  const def = { ...DEFAULT_PROFILE_FOLDER_SYNC, profileId: sanitizeProfileIdForSync(activeProfileId) };
  if (!raw || typeof raw !== "object") return def;
  const folderPath = typeof raw.folderPath === "string" ? raw.folderPath.trim() : "";
  return {
    enabled: raw.enabled === true,
    profileId: sanitizeProfileIdForSync(raw.profileId || activeProfileId),
    folderPath,
    lastPushedExportedAt: Number(raw.lastPushedExportedAt) || 0,
    lastImportedExportedAt: Number(raw.lastImportedExportedAt) || 0,
    pendingPush: raw.pendingPush === true,
  };
}

function sanitizeProfileIdForSync(raw) {
  let s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s || s === "default") return "default";
  s = s.replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  return s || "default";
}

module.exports = {
  SYNC_PACK_FILENAME,
  SYNC_META_FILENAME,
  DEFAULT_PROFILE_FOLDER_SYNC,
  getSyncFilePaths,
  readSyncMeta,
  readSyncPackFile,
  writeSyncPackAndMeta,
  normalizeProfileFolderSync,
};
