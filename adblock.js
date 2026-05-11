/**
 * Nebula ad blocker (main process).
 *
 * Uses @ghostery/adblocker-electron with EasyList + uBlock-style lists.
 * Network rules block ad/tracker requests; cosmetic filters hide DOM elements and
 * run scriptlets (important for video sites where ads are embedded in the page).
 *
 * Electron 34 ships `session.setPreloads` but not `registerPreloadScript`; Ghostery
 * expects the newer API for cosmetics. We polyfill register/unregister using setPreloads
 * so cosmetic + scriptlet rules work in `<webview>` guests on the shared partition.
 *
 * YouTube and similar platforms change often and may show “ad blocker” notices;
 * this is best-effort like other filter-based tools.
 *
 * Debug: `[Nebula:Adblock]` in the main process terminal.
 */

"use strict";

const path = require("path");
const fs = require("fs");
const { session } = require("electron");

const LOG = "[Nebula:Adblock]";

/** Serialized engine cache — bump when default filter set or engine config changes. */
const NETWORK_CACHE_FILE = "nebula-adblock-full-v6.bin";

/** Same base as @ghostery/adblocker built-in lists (raw GitHub assets). */
const LIST_BASE =
  "https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets";

/**
 * Filter lists: ads + malware + uBO buckets.
 * Intentionally omit EasyPrivacy + uBO privacy — they block first‑party‑loaded analytics /
 * RUM (Google Analytics, DataDog, GTM, etc.). Many SPAs treat those scripts as part of
 * bootstrap; blocking → net::ERR_BLOCKED_BY_CLIENT and broken streaming/login flows.
 */
function getNetworkFilterListUrls() {
  const ubo = `${LIST_BASE}/ublock-origin`;
  const el = `${LIST_BASE}/easylist`;
  return [
    `${el}/easylist.txt`,
    `${LIST_BASE}/peter-lowe/serverlist.txt`,
    `${ubo}/badware.txt`,
    `${ubo}/filters-2020.txt`,
    `${ubo}/filters-2021.txt`,
    `${ubo}/filters-2022.txt`,
    `${ubo}/filters-2023.txt`,
    `${ubo}/filters-2024.txt`,
    `${ubo}/filters-2025.txt`,
    `${ubo}/filters.txt`,
    `${ubo}/quick-fixes.txt`,
    `${ubo}/resource-abuse.txt`,
    `${ubo}/unbreak.txt`,
  ];
}

/**
 * @@ exception rules so sites that bundle monitoring with app logic still run.
 * Applied after remote lists (EasyList etc. still block obvious ads).
 */
function getNebulaNetworkAllowRules() {
  return [
    "@@||googletagmanager.com^$third-party",
    "@@||www.googletagmanager.com^$third-party",
    "@@||google-analytics.com^$third-party",
    "@@||www.google-analytics.com^$third-party",
    "@@||ssl.google-analytics.com^$third-party",
    "@@||analytics.google.com^$third-party",
    "@@||region1.google-analytics.com^$third-party",
    "@@||stats.g.doubleclick.net^$third-party",
    "@@||browser-intake-datadoghq.com^$third-party",
    "@@||browser-intake-datadoghq.eu^$third-party",
    "@@||rum.browser-intake-datadoghq.com^$third-party",
    "@@||datadoghq-browser-agent.com^$third-party",
    "@@||js-agent.newrelic.com^$third-party",
    "@@||bam.nr-data.net^$third-party",
    "@@||browser.sentry-cdn.com^$third-party",
    "@@||ingest.sentry.io^$third-party",
    "@@||cdn.segment.com^$third-party",
    "@@||api.segment.io^$third-party",
    "@@||cdn.amplitude.com^$third-party",
    "@@||api.amplitude.com^$third-party",
    "@@||metrics.hotjar.com^$third-party",
    "@@||static.hotjar.com^$third-party",
    "@@||clients2.google.com^$third-party,script,xmlhttprequest",
    "@@||clientservices.googleapis.com^$third-party,script,xmlhttprequest",
  ];
}

/** @type {any} */
let webProfileBlocker = null;

function cachePath(userData) {
  return path.join(userData, NETWORK_CACHE_FILE);
}

function removeLegacyCaches(userData) {
  const legacy = [
    path.join(userData, "nebula-adblock-engine.bin"),
    path.join(userData, "nebula-adblock-network.bin"),
    path.join(userData, "nebula-adblock-network-v2.bin"),
    path.join(userData, "nebula-adblock-network-v3.bin"),
    path.join(userData, "nebula-adblock-full-v4.bin"),
    path.join(userData, "nebula-adblock-full-v5.bin"),
  ];
  for (const p of legacy) {
    try {
      fs.unlinkSync(p);
    } catch {
      /* none */
    }
  }
}

/**
 * Ghostery uses `session.registerPreloadScript` for cosmetic injection. Older Electron
 * exposes `setPreloads` / `getPreloads` instead — bridge so cosmetics work on webviews.
 * @returns {boolean} whether cosmetic filtering can be enabled
 */
function ensureRegisterPreloadScript(sess) {
  if (typeof sess.registerPreloadScript === "function") return true;
  if (typeof sess.setPreloads !== "function" || typeof sess.getPreloads !== "function") {
    console.warn(
      LOG,
      "No registerPreloadScript or setPreloads — cosmetic filters disabled (network-only)."
    );
    return false;
  }
  const idToPath = new Map();
  sess.registerPreloadScript = function (opts) {
    const filePath = opts && opts.filePath;
    if (!filePath) throw new Error("registerPreloadScript: filePath required");
    const id = `nebula_pb_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    idToPath.set(id, filePath);
    const cur = sess.getPreloads();
    if (!cur.includes(filePath)) sess.setPreloads([filePath, ...cur]);
    return id;
  };
  sess.unregisterPreloadScript = function (id) {
    const filePath = idToPath.get(id);
    if (!filePath) return;
    idToPath.delete(id);
    const cur = sess.getPreloads();
    sess.setPreloads(cur.filter((p) => p !== filePath));
  };
  console.log(LOG, "Using setPreloads polyfill for Ghostery cosmetic preload.");
  return true;
}

/**
 * Ghostery builds filter context from `details.referrer` (page URL). Webview guests often
 * omit referrer on subresource requests, so `$domain=` rules — including per-site `@@*$domain=`
 * exceptions — never match. Fill from the guest webContents URL when referrer is missing.
 * @param {import("@ghostery/adblocker-electron").ElectronBlocker} blocker
 */
function patchWebviewReferrerForAdblock(blocker) {
  const { webContents } = require("electron");

  /** @param {Electron.OnBeforeRequestListenerDetails | Electron.OnHeadersReceivedListenerDetails} details */
  function withPageReferrer(details) {
    const ref = details.referrer;
    if (typeof ref === "string" && /^https?:/i.test(ref)) {
      return details;
    }
    const wid = details.webContentsId;
    if (wid == null) return details;
    try {
      const wc = webContents.fromId(wid);
      if (!wc || wc.isDestroyed()) return details;
      const pageUrl = wc.getURL();
      if (!pageUrl || !/^https?:/i.test(pageUrl)) return details;
      return { ...details, referrer: pageUrl };
    } catch {
      return details;
    }
  }

  const origBefore = blocker.onBeforeRequest.bind(blocker);
  blocker.onBeforeRequest = (details, callback) => origBefore(withPageReferrer(details), callback);

  const origHeaders = blocker.onHeadersReceived.bind(blocker);
  blocker.onHeadersReceived = (details, callback) => origHeaders(withPageReferrer(details), callback);
}

/**
 * @param {string} webPartition e.g. persist:nebula
 * @param {() => { adblockEnabled?: boolean }} getSettings merged app settings
 */
async function initAdblockEngine(webPartition, getSettings) {
  try {
    const { ElectronBlocker } = require("@ghostery/adblocker-electron");
    const { app } = require("electron");
    const userData = app.getPath("userData");
    removeLegacyCaches(userData);

    const persist = session.fromPartition(webPartition);
    const useCosmetics = ensureRegisterPreloadScript(persist);

    const lists = getNetworkFilterListUrls();
    console.log(
      LOG,
      "Loading filter lists:",
      lists.length,
      "URLs, cosmetics:",
      useCosmetics,
      "cache:",
      NETWORK_CACHE_FILE
    );

    webProfileBlocker = await ElectronBlocker.fromLists(
      globalThis.fetch,
      lists,
      {
        loadNetworkFilters: true,
        loadCosmeticFilters: useCosmetics,
        /** Extended / procedural cosmetics break complex SPAs (e.g. YouTube UI); network rules still apply. */
        loadExtendedSelectors: false,
        guessRequestTypeFromUrl: true,
      },
      {
        path: cachePath(userData),
        read: fs.promises.readFile,
        write: fs.promises.writeFile,
      }
    );

    patchWebviewReferrerForAdblock(webProfileBlocker);

    const allowRules = getNebulaNetworkAllowRules();
    if (allowRules.length > 0) {
      webProfileBlocker.updateFromDiff({ added: allowRules }, {});
      console.log(LOG, "Nebula allow rules (exceptions):", allowRules.length);
    }

    applyAdblockFromSettings(getSettings(), webPartition);
    console.log(LOG, "Engine ready.");
  } catch (err) {
    console.error(LOG, "failed to start:", err?.message || err);
  }
}

/**
 * @param {{ adblockEnabled?: boolean }} settings
 * @param {string} webPartition
 */
function applyAdblockFromSettings(settings, webPartition) {
  if (!webProfileBlocker) return;
  const persist = session.fromPartition(webPartition);
  const on = settings.adblockEnabled !== false;
  try {
    if (on) {
      if (!webProfileBlocker.isBlockingEnabled(persist)) {
        webProfileBlocker.enableBlockingInSession(persist);
        console.log(LOG, "Blocking enabled for partition:", webPartition);
      }
    } else if (webProfileBlocker.isBlockingEnabled(persist)) {
      webProfileBlocker.disableBlockingInSession(persist);
      console.log(LOG, "Blocking disabled.");
    }
  } catch (err) {
    console.error(LOG, "toggle:", err?.message || err);
  }
}

function getBlocker() {
  return webProfileBlocker;
}

module.exports = {
  initAdblockEngine,
  applyAdblockFromSettings,
  getBlocker,
  getNetworkFilterListUrls,
  NETWORK_CACHE_FILE,
};
