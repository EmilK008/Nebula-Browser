"use strict";

const fs = require("fs");
const path = require("path");
const nebulaExtensionsSettings = require("./browser-extensions-settings");
const nebulaExtensionsLoader = require("./browser-extensions-loader");

function getActionBlock(manifest) {
  if (!manifest || typeof manifest !== "object") return null;
  return manifest.action || manifest.browser_action || null;
}

function resolveManifestPath(extPath, rel) {
  if (typeof rel !== "string" || !rel.trim()) return "";
  return path.join(extPath, rel.replace(/^\//, ""));
}

function pickIconRelative(manifest) {
  const action = getActionBlock(manifest);
  const icons = (action && action.default_icon) || manifest.icons || null;
  if (!icons) return "";
  if (typeof icons === "string") return icons;
  const order = ["32", "16", "48", "128", "64", "24"];
  for (const k of order) {
    if (typeof icons[k] === "string") return icons[k];
  }
  const keys = Object.keys(icons).sort((a, b) => Number(b) - Number(a));
  return keys.length && typeof icons[keys[0]] === "string" ? icons[keys[0]] : "";
}

function readIconDataUrl(extPath, manifest) {
  const rel = pickIconRelative(manifest);
  if (!rel) return "";
  const abs = resolveManifestPath(extPath, rel);
  try {
    if (!fs.existsSync(abs)) return "";
    const buf = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    let mime = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    else if (ext === ".svg") mime = "image/svg+xml";
    else if (ext === ".gif") mime = "image/gif";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function extensionUrl(extBaseUrl, rel) {
  const base = typeof extBaseUrl === "string" ? extBaseUrl : "";
  if (!base || typeof rel !== "string" || !rel.trim()) return "";
  return `${base}${rel.replace(/^\//, "")}`;
}

function getOptionsPageUrl(ext) {
  const m = ext.manifest;
  if (!m || typeof m !== "object") return "";
  if (m.options_ui && typeof m.options_ui.page === "string") {
    return extensionUrl(ext.url, m.options_ui.page);
  }
  if (typeof m.options_page === "string") {
    return extensionUrl(ext.url, m.options_page);
  }
  return "";
}

function getPopupUrl(ext) {
  const action = getActionBlock(ext.manifest);
  if (!action || typeof action.default_popup !== "string" || !action.default_popup.trim()) return "";
  return extensionUrl(ext.url, action.default_popup);
}

function getActionTitle(ext) {
  const action = getActionBlock(ext.manifest);
  if (action && typeof action.default_title === "string" && action.default_title.trim()) {
    return action.default_title.trim().slice(0, 120);
  }
  return typeof ext.name === "string" ? ext.name.slice(0, 120) : "";
}

function hasToolbarAction(manifest) {
  const action = getActionBlock(manifest);
  if (!action) return !!pickIconRelative(manifest);
  return !!(action.default_popup || action.default_icon || action.default_title || pickIconRelative(manifest));
}

function buildToolbarActionFromExtension(ext) {
  const manifest = ext.manifest || {};
  const popupUrl = getPopupUrl(ext);
  const optionsUrl = getOptionsPageUrl(ext);
  if (!hasToolbarAction(manifest) && !optionsUrl) return null;
  return {
    extensionId: ext.id ? String(ext.id) : "",
    name: ext.name ? String(ext.name) : "",
    version: ext.version ? String(ext.version) : "",
    title: getActionTitle(ext),
    popupUrl,
    optionsUrl,
    hasPopup: !!popupUrl,
    hasOptions: !!optionsUrl,
    iconDataUrl: readIconDataUrl(ext.path, manifest),
  };
}

function normalizePathKey(p) {
  if (typeof p !== "string" || !p.trim()) return "";
  try {
    return path.resolve(p.trim()).toLowerCase();
  } catch {
    return "";
  }
}

/**
 * @param {typeof import("electron").session} electronSession
 * @param {string} partition
 * @param {object} settings
 * @param {string} profileId
 */
async function listToolbarActionsForPartition(electronSession, partition, settings, profileId) {
  const state = nebulaExtensionsSettings.getProfileExtensionsState(settings, profileId);
  if (!state.enabled) return [];
  const enabledPathKeys = new Set(
    state.items
      .filter((item) => item.enabled !== false)
      .map((item) => normalizePathKey(item.path))
      .filter(Boolean)
  );
  if (!enabledPathKeys.size) return [];

  const sessionExts = await nebulaExtensionsLoader.listSessionExtensionDetails(electronSession, partition);
  const out = [];
  for (const ext of sessionExts) {
    const key = normalizePathKey(ext.path);
    if (!key || !enabledPathKeys.has(key)) continue;
    const row = buildToolbarActionFromExtension(ext);
    if (!row) continue;
    row.path = ext.path ? String(ext.path) : "";
    out.push(row);
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

module.exports = {
  buildToolbarActionFromExtension,
  listToolbarActionsForPartition,
  getOptionsPageUrl,
  getPopupUrl,
};
