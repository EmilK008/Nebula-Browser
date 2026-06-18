"use strict";

const path = require("path");
const nebulaExtensionsSettings = require("./browser-extensions-settings");

/** @type {Map<string, { at: number, profileId: string, enabled: boolean, loaded: object[], unloaded: object[], errors: object[] }>} */
const lastSyncByPartition = new Map();

/** Lowercase paths Nebula loaded per partition (for unload when removed from settings). */
/** @type {Map<string, Set<string>>} */
const managedPathsByPartition = new Map();

function getManagedPaths(partition) {
  if (!managedPathsByPartition.has(partition)) managedPathsByPartition.set(partition, new Set());
  return managedPathsByPartition.get(partition);
}

function getExtensionApi(sess) {
  const extApi = sess.extensions;
  return {
    load:
      extApi && typeof extApi.loadExtension === "function"
        ? (p) => extApi.loadExtension(p)
        : typeof sess.loadExtension === "function"
          ? (p) => sess.loadExtension(p)
          : null,
    remove:
      extApi && typeof extApi.removeExtension === "function"
        ? (id) => extApi.removeExtension(id)
        : typeof sess.removeExtension === "function"
          ? (id) => sess.removeExtension(id)
          : null,
    getAll:
      extApi && typeof extApi.getAllExtensions === "function"
        ? () => extApi.getAllExtensions()
        : typeof sess.getAllExtensions === "function"
          ? () => sess.getAllExtensions()
          : null,
  };
}

function normalizeExtPath(p) {
  if (typeof p !== "string" || !p.trim()) return "";
  try {
    return path.resolve(p.trim()).toLowerCase();
  } catch {
    return "";
  }
}

async function listLoadedExtensions(sess) {
  const api = getExtensionApi(sess);
  if (!api.getAll) return [];
  try {
    const all = await api.getAll();
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

/**
 * @param {import("electron").Session} sess
 * @param {string} partition
 * @param {string} extPath
 */
async function loadUnpackedOnSession(sess, partition, extPath) {
  const resolved = path.resolve(extPath);
  const api = getExtensionApi(sess);
  if (!api.load) {
    return { ok: false, path: resolved, error: "loadExtension not available" };
  }
  if (!sess.isPersistent || !sess.isPersistent()) {
    return { ok: false, path: resolved, error: "Extensions require a persistent session (persist:… partition)." };
  }
  const meta = nebulaExtensionsSettings.readUnpackedExtensionMeta(resolved);
  if (!meta.ok) {
    return { ok: false, path: resolved, error: meta.message || meta.error || "invalid_extension" };
  }
  try {
    const ext = await api.load(meta.path);
    const key = normalizeExtPath(meta.path);
    if (key) getManagedPaths(partition).add(key);
    return {
      ok: true,
      path: meta.path,
      extensionId: ext && ext.id ? String(ext.id) : "",
      name: ext && ext.name ? String(ext.name) : meta.name,
      version: ext && ext.version ? String(ext.version) : "",
    };
  } catch (err) {
    return { ok: false, path: resolved, error: String(err?.message || err) };
  }
}

/**
 * Sync saved profile extension list onto a browsing partition.
 * @param {typeof import("electron").session} electronSession
 * @param {string} partition e.g. persist:nebula
 * @param {object} settings full Nebula settings
 * @param {string} profileId
 */
async function syncProfileExtensionsOnSession(electronSession, partition, settings, profileId) {
  const summary = {
    ok: true,
    partition,
    profileId: nebulaExtensionsSettings.sanitizeProfileIdForExtensions(profileId),
    enabled: false,
    loaded: [],
    unloaded: [],
    skipped: [],
    errors: [],
  };

  const sess = electronSession.fromPartition(partition);
  if (!sess.isPersistent || !sess.isPersistent()) {
    summary.ok = false;
    summary.errors.push({ action: "sync", error: "not_persistent" });
    lastSyncByPartition.set(partition, { at: Date.now(), ...summary });
    return summary;
  }

  const api = getExtensionApi(sess);
  if (!api.load) {
    summary.ok = false;
    summary.errors.push({ action: "sync", error: "loadExtension not available" });
    lastSyncByPartition.set(partition, { at: Date.now(), ...summary });
    return summary;
  }

  const state = nebulaExtensionsSettings.getProfileExtensionsState(settings, profileId);
  summary.enabled = state.enabled === true;
  const desiredPaths = state.enabled
    ? state.items.filter((item) => item.enabled !== false).map((item) => path.resolve(item.path))
    : [];
  const desiredKeys = new Set(desiredPaths.map((p) => normalizeExtPath(p)).filter(Boolean));
  const managed = getManagedPaths(partition);

  let loaded = await listLoadedExtensions(sess);
  const loadedByKey = new Map();
  for (const ext of loaded) {
    const key = normalizeExtPath(ext.path);
    if (key) loadedByKey.set(key, ext);
  }

  // Adopt already-loaded extensions that match desired paths (e.g. after restart).
  for (const key of desiredKeys) {
    if (loadedByKey.has(key)) managed.add(key);
  }

  const toUnload = [];
  for (const ext of loaded) {
    const key = normalizeExtPath(ext.path);
    if (!key || !ext.id) continue;
    if (managed.has(key) && !desiredKeys.has(key)) toUnload.push(ext);
  }

  if (api.remove) {
    for (const ext of toUnload) {
      try {
        await api.remove(ext.id);
        const key = normalizeExtPath(ext.path);
        if (key) managed.delete(key);
        summary.unloaded.push({
          extensionId: String(ext.id),
          name: ext.name ? String(ext.name) : "",
          path: ext.path ? String(ext.path) : "",
        });
        console.log(`[Nebula:extensions] Unloaded "${ext.name || ext.id}" from ${partition}`);
      } catch (err) {
        summary.errors.push({
          action: "unload",
          path: ext.path,
          error: String(err?.message || err),
        });
      }
    }
  }

  loaded = await listLoadedExtensions(sess);
  loadedByKey.clear();
  for (const ext of loaded) {
    const key = normalizeExtPath(ext.path);
    if (key) loadedByKey.set(key, ext);
  }

  for (const wantPath of desiredPaths) {
    const key = normalizeExtPath(wantPath);
    if (!key) continue;
    if (loadedByKey.has(key)) {
      managed.add(key);
      const ext = loadedByKey.get(key);
      summary.skipped.push({
        extensionId: ext && ext.id ? String(ext.id) : "",
        name: ext && ext.name ? String(ext.name) : "",
        path: wantPath,
      });
      continue;
    }
    const r = await loadUnpackedOnSession(sess, partition, wantPath);
    if (r.ok) {
      summary.loaded.push({
        extensionId: r.extensionId,
        name: r.name,
        path: r.path,
        version: r.version,
      });
      console.log(`[Nebula:extensions] Loaded "${r.name}" (${r.extensionId}) on ${partition}`);
    } else {
      summary.errors.push({ action: "load", path: wantPath, error: r.error });
      console.warn(`[Nebula:extensions] Failed to load ${wantPath}:`, r.error);
    }
  }

  if (summary.errors.length) summary.ok = false;
  lastSyncByPartition.set(partition, { at: Date.now(), ...summary });
  return summary;
}

function getExtensionsSyncStatus(partition) {
  if (partition && lastSyncByPartition.has(partition)) {
    return lastSyncByPartition.get(partition);
  }
  const all = {};
  for (const [part, row] of lastSyncByPartition.entries()) all[part] = row;
  return partition ? null : all;
}

async function listSessionExtensionsForPartition(electronSession, partition) {
  const sess = electronSession.fromPartition(partition);
  const loaded = await listLoadedExtensions(sess);
  return loaded.map((ext) => ({
    extensionId: ext && ext.id ? String(ext.id) : "",
    name: ext && ext.name ? String(ext.name) : "",
    version: ext && ext.version ? String(ext.version) : "",
    path: ext && ext.path ? String(ext.path) : "",
  }));
}

async function listSessionExtensionDetails(electronSession, partition) {
  const sess = electronSession.fromPartition(partition);
  const loaded = await listLoadedExtensions(sess);
  return loaded.map((ext) => ({
    id: ext && ext.id ? String(ext.id) : "",
    name: ext && ext.name ? String(ext.name) : "",
    version: ext && ext.version ? String(ext.version) : "",
    path: ext && ext.path ? String(ext.path) : "",
    url: ext && ext.url ? String(ext.url) : "",
    manifest: ext && ext.manifest && typeof ext.manifest === "object" ? ext.manifest : {},
  }));
}

module.exports = {
  getExtensionApi,
  loadUnpackedOnSession,
  syncProfileExtensionsOnSession,
  getExtensionsSyncStatus,
  listSessionExtensionsForPartition,
  listSessionExtensionDetails,
};
