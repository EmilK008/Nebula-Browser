"use strict";

const path = require("path");
const fs = require("fs");

const BUNDLED_SPIKE_DIR = path.join(__dirname, "..", "extensions", "nebula-step0-spike");

/** @type {{ loaded: boolean, partition: string, extensionId: string, name: string, version: string, path: string, error: string } | null} */
let lastSpikeResult = null;

function isExtensionSpikeEnabled() {
  const flag = process.env.NEBULA_EXTENSION_SPIKE;
  const customPath = process.env.NEBULA_EXTENSION_SPIKE_PATH;
  if (customPath && String(customPath).trim()) return true;
  return flag === "1" || flag === "true" || flag === "yes";
}

function resolveSpikeExtensionPath() {
  const custom = typeof process.env.NEBULA_EXTENSION_SPIKE_PATH === "string" ? process.env.NEBULA_EXTENSION_SPIKE_PATH.trim() : "";
  if (custom) return path.resolve(custom);
  return BUNDLED_SPIKE_DIR;
}

function validateUnpackedExtensionDir(extPath) {
  const manifestPath = path.join(extPath, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, error: `manifest.json not found in ${extPath}` };
  }
  return { ok: true };
}

/**
 * Load a single unpacked extension onto a persistent guest partition (Step 0 spike).
 * @param {import("electron").Session} sess
 * @param {string} partition
 * @param {string} extPath
 */
async function loadExtensionSpikeOnSession(sess, partition, extPath) {
  const base = { loaded: false, partition, extensionId: "", name: "", version: "", path: extPath, error: "" };
  if (!sess || !sess.isPersistent || !sess.isPersistent()) {
    base.error = "Extensions require a persistent session (persist:… partition).";
    lastSpikeResult = base;
    return base;
  }
  const extApi = sess.extensions;
  const loadFn =
    extApi && typeof extApi.loadExtension === "function"
      ? (p, opts) => extApi.loadExtension(p, opts)
      : typeof sess.loadExtension === "function"
        ? (p, opts) => sess.loadExtension(p, opts)
        : null;
  if (!loadFn) {
    base.error = "Neither session.extensions.loadExtension nor session.loadExtension is available in this Electron build.";
    lastSpikeResult = base;
    return base;
  }
  const valid = validateUnpackedExtensionDir(extPath);
  if (!valid.ok) {
    base.error = valid.error;
    lastSpikeResult = base;
    return base;
  }
  try {
    const ext = await loadFn(extPath);
    const apiUsed =
      extApi && typeof extApi.loadExtension === "function" ? "session.extensions.loadExtension" : "session.loadExtension";
    const out = {
      loaded: true,
      partition,
      extensionId: ext && ext.id ? String(ext.id) : "",
      name: ext && ext.name ? String(ext.name) : "",
      version: ext && ext.version ? String(ext.version) : "",
      path: extPath,
      apiUsed,
      error: "",
    };
    lastSpikeResult = out;
    console.log(
      `[Nebula:ext-spike] Loaded "${out.name}" (${out.extensionId}) on partition ${partition}`
    );
    return out;
  } catch (err) {
    base.error = String(err?.message || err);
    lastSpikeResult = base;
    console.error("[Nebula:ext-spike] loadExtension failed:", base.error);
    return base;
  }
}

/**
 * @param {typeof import("electron").session} electronSession
 * @param {string} browsingPartition e.g. persist:nebula
 */
async function maybeLoadExtensionSpike(electronSession, browsingPartition) {
  if (!isExtensionSpikeEnabled()) {
    lastSpikeResult = null;
    return null;
  }
  const extPath = resolveSpikeExtensionPath();
  const sess = electronSession.fromPartition(browsingPartition);
  return loadExtensionSpikeOnSession(sess, browsingPartition, extPath);
}

function getExtensionSpikeStatus() {
  if (!isExtensionSpikeEnabled()) {
    return { enabled: false, spikeEnv: false, result: null };
  }
  return { enabled: true, spikeEnv: true, result: lastSpikeResult };
}

module.exports = {
  isExtensionSpikeEnabled,
  maybeLoadExtensionSpike,
  getExtensionSpikeStatus,
  BUNDLED_SPIKE_DIR,
};
