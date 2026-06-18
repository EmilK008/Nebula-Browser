"use strict";

const nebulaExtensionsSettings = require("./browser-extensions-settings");

const ADBLOCK_NAME_RE =
  /\b(ad[\s-]?block|ublock|adguard|ghostery|privacy[\s-]?badger|ad[\s-]?guard|pi[\s-]?hole)\b/i;

/**
 * Heuristic: extension likely blocks ads/trackers (not exact science).
 * @param {object} manifest
 */
function extensionManifestLooksLikeAdblock(manifest) {
  if (!manifest || typeof manifest !== "object") return false;
  const label = `${manifest.name || ""} ${manifest.short_name || ""} ${manifest.description || ""}`;
  if (ADBLOCK_NAME_RE.test(label)) return true;
  const perms = [...(manifest.permissions || []), ...(manifest.optional_permissions || [])].map((p) =>
    String(p).toLowerCase()
  );
  if (!perms.includes("declarativenetrequest") && !perms.includes("webrequest")) return false;
  return /\b(block|filter|ads?|track)\b/i.test(label);
}

function listManifestPermissions(manifest) {
  if (!manifest || typeof manifest !== "object") return [];
  const out = new Set();
  for (const p of manifest.permissions || []) {
    if (typeof p === "string" && p.trim()) out.add(p.trim());
  }
  for (const p of manifest.optional_permissions || []) {
    if (typeof p === "string" && p.trim()) out.add(`${p.trim()} (optional)`);
  }
  for (const p of manifest.host_permissions || []) {
    if (typeof p === "string" && p.trim()) out.add(`host: ${p.trim()}`);
  }
  return [...out].slice(0, 24);
}

/**
 * Should Nebula's built-in Ghostery adblock run on the active browsing profile partition?
 * @param {object} settings
 * @param {string} profileId
 */
function resolveBuiltinAdblockEnabled(settings, profileId) {
  if (!settings || settings.adblockEnabled === false) return false;
  const extState = nebulaExtensionsSettings.getProfileExtensionsState(settings, profileId);
  if (extState.enabled && extState.pauseBuiltinAdblock === true) return false;
  return true;
}

/**
 * @param {object} settings
 * @param {string} profileId
 * @param {Array<{ name?: string, extensionId?: string, manifest?: object }>} loadedExtensions
 */
function getExtensionsConflictReport(settings, profileId, loadedExtensions) {
  const extState = nebulaExtensionsSettings.getProfileExtensionsState(settings, profileId);
  const loaded = Array.isArray(loadedExtensions) ? loadedExtensions : [];
  const adblockLikeLoaded = [];
  for (const ext of loaded) {
    if (!ext || !extensionManifestLooksLikeAdblock(ext.manifest)) continue;
    adblockLikeLoaded.push({
      extensionId: ext.extensionId || ext.id || "",
      name: ext.name || "Extension",
    });
  }

  const builtinAdblockOn = settings?.adblockEnabled !== false;
  const effectiveBuiltinAdblock = resolveBuiltinAdblockEnabled(settings, profileId);
  const hints = [];

  if (extState.enabled) {
    hints.push("Extensions run only on normal tabs for this profile (not private tabs).");
    hints.push("Nebula login capture and YouTube helpers still inject scripts alongside extension content scripts.");
  }

  if (
    extState.enabled &&
    builtinAdblockOn &&
    !extState.pauseBuiltinAdblock &&
    adblockLikeLoaded.length > 0
  ) {
    hints.push(
      `Possible double ad blocking: Nebula adblock is on and ${adblockLikeLoaded.length} loaded extension(s) look like ad blockers. Consider pausing Nebula adblock below.`
    );
  }

  if (extState.enabled && extState.pauseBuiltinAdblock && builtinAdblockOn) {
    hints.push("Nebula adblock is paused for this profile while extensions are enabled.");
  }

  return {
    profileId: nebulaExtensionsSettings.sanitizeProfileIdForExtensions(profileId),
    extensionsEnabled: extState.enabled === true,
    pauseBuiltinAdblock: extState.pauseBuiltinAdblock === true,
    builtinAdblockOn,
    effectiveBuiltinAdblock,
    adblockLikeLoaded,
    hints,
  };
}

module.exports = {
  extensionManifestLooksLikeAdblock,
  listManifestPermissions,
  resolveBuiltinAdblockEnabled,
  getExtensionsConflictReport,
};
