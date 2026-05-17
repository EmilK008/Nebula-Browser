const {
  app,
  BrowserWindow,
  session,
  webContents,
  Menu,
  shell,
  ipcMain,
  dialog,
  clipboard,
  safeStorage,
  WebFrameMain,
  components,
} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { Readable } = require("stream");
const nebulaAdblock = require("./adblock");

/** guest `webContents.id` → `<webview partition=…>` string (OAuth popups + window.open must match). */
const guestPartitionByWcId = new Map();

/** When true, last window closed for `app.relaunch()` — skip `app.quit()` in `window-all-closed` or the new process may not start (Windows). */
let appRelaunchPending = false;

function sanitizeProfileId(raw) {
  let s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!s || s === "default") return "default";
  s = s.replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  return s || "default";
}

function browsingPersistPartitionForProfileId(profileId) {
  const id = sanitizeProfileId(profileId);
  if (id === "default") return "persist:nebula";
  return `persist:nebula-${id}`;
}

function incognitoMemoryPartitionForProfileId(profileId) {
  const id = sanitizeProfileId(profileId);
  const slug = id === "default" ? "nebula" : id;
  return `nebula-pvt-${slug}`;
}

function guestCookiePartition() {
  return browsingPersistPartitionForProfileId(loadSettings().activeProfileId);
}

function normalizeProfilesList(arr) {
  const def = { id: "default", name: "Default" };
  const out = [];
  const seen = new Set();
  if (!Array.isArray(arr)) return [def];
  for (const row of arr) {
    if (!row || typeof row !== "object") continue;
    const id = sanitizeProfileId(row.id || row.name || "");
    const name = typeof row.name === "string" && row.name.trim() ? row.name.trim().slice(0, 64) : id;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name });
  }
  if (!out.some((p) => p.id === "default")) out.unshift(def);
  return out;
}

function augmentSettingsForRenderer(s) {
  const bid = sanitizeProfileId(s.activeProfileId);
  return {
    ...s,
    activeProfileId: bid,
    profiles: normalizeProfilesList(s.profiles),
    browsingPartition: browsingPersistPartitionForProfileId(bid),
    incognitoPartition: incognitoMemoryPartitionForProfileId(bid),
  };
}

function readNebulaPackageJson() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  } catch {
    return {};
  }
}
const NEBULA_PKG = readNebulaPackageJson();

/** `did-create-window` focus restore is attached once per guest webContents. */
const guestChildWindowFocusHooks = new WeakSet();

/** Helps streaming sites that call video.play() without a fresh user gesture after navigation. */
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

/**
 * Windows: Chromium’s sandbox requires ACLs on the app folder so sandboxed children (GPU,
 * network, Widevine CDM helpers) can read the executable. Portable/zipped installs and some
 * AV setups leave that out → `sandbox_win.cc(789) Sandbox cannot access executable` and DRM
 * playback fails. Disabling the Chromium sandbox matches common Electron + Widevine setups;
 * tab webviews already run with relaxed renderer sandbox for EME.
 */
if (process.platform === "win32") {
  app.commandLine.appendSwitch("no-sandbox");
}

/** Corrupted meta can yield `Invalid cache (current) size` (disk_cache backend_impl). */
app.commandLine.appendSwitch("disk-cache-size", String(128 * 1024 * 1024));

/** Some networks reset QUIC mid-handshake (net_error -101 during TLS). */
app.commandLine.appendSwitch("disable-quic");

/**
 * Auto dark theme for web contents (Chromium). Must be set before the app is ready; toggling in
 * Settings saves the flag and offers a restart so this switch applies on the next launch.
 */
function readForceDarkModeFromSettingsFile() {
  try {
    const p = path.join(app.getPath("userData"), "nebula-settings.json");
    const raw = fs.readFileSync(p, "utf8");
    const j = JSON.parse(raw);
    return j && j.forceDarkMode === true;
  } catch {
    return false;
  }
}
if (readForceDarkModeFromSettingsFile()) {
  app.commandLine.appendSwitch("enable-features", "WebContentsForceDark");
}

/**
 * Picture-in-picture: Chromium opens a floating, resizable window (OS / compositor keeps it on top).
 * @param {boolean} useClickPoint
 * @param {number} cx
 * @param {number} cy
 */
function buildPictureInPictureScript(useClickPoint, cx, cy) {
  const x = Number(cx) || 0;
  const y = Number(cy) || 0;
  const uc = useClickPoint ? "true" : "false";
  return `(async function(){
    function collectVideos(root) {
      const out = [];
      function walk(node) {
        if (!node) return;
        if (node.nodeName === "VIDEO") out.push(node);
        if (node.shadowRoot) walk(node.shadowRoot);
        const ch = node.children;
        if (ch) for (let i = 0; i < ch.length; i++) walk(ch[i]);
      }
      walk(root);
      return out;
    }
    function allVideos() {
      const seen = new Set();
      const list = [];
      for (const v of collectVideos(document.documentElement)) {
        if (!seen.has(v)) { seen.add(v); list.push(v); }
      }
      return list;
    }
    function pickFromPoint(px, py) {
      const stack = document.elementsFromPoint(px, py);
      for (const el of stack) {
        let n = el;
        while (n) {
          if (n.nodeName === "VIDEO") return n;
          n = n.parentElement;
        }
      }
      return null;
    }
    function largestVideo() {
      let best = null, area = 0;
      for (const v of allVideos()) {
        const r = v.getBoundingClientRect();
        const a = Math.max(0, r.width) * Math.max(0, r.height);
        if (a > area) { area = a; best = v; }
      }
      return best;
    }
    let video = null;
    if (${uc}) {
      video = pickFromPoint(${x}, ${y});
    }
    if (!video) video = largestVideo();
    if (!video) return { ok: false, reason: "no-video" };
    if (!video.requestPictureInPicture) return { ok: false, reason: "not-supported" };
    try {
      if (document.pictureInPictureElement === video) return { ok: true, already: true };
      await video.requestPictureInPicture();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: String(e && e.message ? e.message : e) };
    }
  })()`;
}

/**
 * @param {{ guestWebContentsId?: number, frameProcessId?: number, frameRoutingId?: number, clientX?: number, clientY?: number, useClickPoint?: boolean }} payload
 */
async function requestPictureInPictureGuest(payload) {
  const gid = Number(payload.guestWebContentsId);
  if (!Number.isFinite(gid) || gid <= 0) return { ok: false, reason: "bad-id" };
  const wc = webContents.fromId(gid);
  if (!wc || wc.isDestroyed()) return { ok: false, reason: "no-contents" };

  const useClick =
    payload.useClickPoint === true &&
    typeof payload.clientX === "number" &&
    typeof payload.clientY === "number";
  const pid = payload.frameProcessId;
  const rid = payload.frameRoutingId;
  const script = buildPictureInPictureScript(useClick, useClick ? payload.clientX : 0, useClick ? payload.clientY : 0);

  if (
    useClick &&
    typeof pid === "number" &&
    typeof rid === "number" &&
    WebFrameMain &&
    typeof WebFrameMain.fromId === "function"
  ) {
    const frame = WebFrameMain.fromId(pid, rid);
    if (frame && !frame.isDestroyed()) {
      try {
        return await frame.executeJavaScript(script, true);
      } catch (e) {
        return { ok: false, reason: String(e?.message || e) };
      }
    }
  }

  const frames = [];
  const seen = new Set();
  function addFrame(f) {
    if (!f || f.isDestroyed()) return;
    const k = `${f.processId}:${f.routingId}`;
    if (seen.has(k)) return;
    seen.add(k);
    frames.push(f);
  }
  try {
    addFrame(wc.mainFrame);
    for (const f of wc.mainFrame.framesInSubtree) addFrame(f);
  } catch {
    addFrame(wc.mainFrame);
  }

  let last = { ok: false, reason: "no-video" };
  for (const frame of frames) {
    try {
      const r = await frame.executeJavaScript(script, true);
      if (r && r.ok) return r;
      if (r && typeof r === "object") last = r;
    } catch (e) {
      last = { ok: false, reason: String(e?.message || e) };
    }
  }
  return last;
}

ipcMain.handle("nebula-request-picture-in-picture", async (_e, payload) => {
  return requestPictureInPictureGuest(payload && typeof payload === "object" ? payload : {});
});

const CAPTURE_PROBE_SCRIPT = `(() => {
  try {
    let camera = false;
    let microphone = false;
    function scan(root) {
      if (!root || !root.querySelectorAll) return;
      root.querySelectorAll("video, audio").forEach((el) => {
        const s = el.srcObject;
        if (!s || !s.getTracks) return;
        s.getTracks().forEach((t) => {
          if (t.readyState !== "live") return;
          if (t.kind === "video") camera = true;
          if (t.kind === "audio") microphone = true;
        });
      });
    }
    scan(document);
    document.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) scan(el.shadowRoot);
    });
    return { camera, microphone };
  } catch {
    return { camera: false, microphone: false };
  }
})()`;

/** @type {Map<number, { wc: Electron.WebContents, onAudio: (e: unknown, details?: { audible?: boolean }) => void }>} */
const guestMediaSubscriptions = new Map();
let guestCapturePollTimer = null;

function resolveUpdateRepo() {
  const n =
    NEBULA_PKG.nebula && typeof NEBULA_PKG.nebula.updateRepo === "string"
      ? NEBULA_PKG.nebula.updateRepo.trim()
      : "";
  if (n && /^[\w.-]+\/[\w.-]+$/.test(n)) return n;
  const repo = NEBULA_PKG.repository;
  if (repo && typeof repo === "object" && typeof repo.url === "string") {
    const m = repo.url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/i);
    if (m) return `${m[1]}/${m[2]}`;
  }
  return "";
}

function semverGreater(remote, local) {
  const pa = String(remote)
    .replace(/^v/i, "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = String(local)
    .replace(/^v/i, "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}

async function fetchLatestGithubRelease(repoKey) {
  const url = `https://api.github.com/repos/${repoKey}/releases/latest`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "NebulaBrowser",
    },
  });
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);
  const j = await res.json();
  const tag = typeof j.tag_name === "string" ? j.tag_name : "";
  const ver = tag.replace(/^v/i, "");
  const htmlUrl = typeof j.html_url === "string" ? j.html_url : "";
  const body = typeof j.body === "string" ? j.body.slice(0, 400) : "";
  let installerUrl = "";
  let portableUrl = "";
  const assets = Array.isArray(j.assets) ? j.assets : [];
  for (const a of assets) {
    if (!a || typeof a.browser_download_url !== "string" || typeof a.name !== "string") continue;
    const name = a.name;
    if (/blockmap$/i.test(name)) continue;
    if (!/\.exe$/i.test(name)) continue;
    if (/portable/i.test(name)) {
      if (!portableUrl) portableUrl = a.browser_download_url;
    } else if (!installerUrl) {
      installerUrl = a.browser_download_url;
    }
  }
  return { version: ver, htmlUrl, body, installerUrl, portableUrl };
}

/**
 * Only allow direct GitHub release asset EXE URLs (not portable) so the renderer cannot
 * trigger arbitrary downloads.
 * @param {string} url
 */
function isTrustedGithubInstallerAssetUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname.toLowerCase() !== "github.com") return false;
    if (!/\/releases\/download\//i.test(u.pathname)) return false;
    const seg = decodeURIComponent(u.pathname.split("/").pop() || "");
    if (!seg.toLowerCase().endsWith(".exe")) return false;
    if (/portable/i.test(seg)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @param {string} destPath
 */
async function streamDownloadToFile(url, destPath) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "application/octet-stream",
      "User-Agent": "NebulaBrowser/Update",
    },
  });
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  const body = res.body;
  if (!body) throw new Error("Empty download body");
  const ws = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(body), ws);
}

/**
 * @param {string} exePath
 */
function runDetachedWindowsInstaller(exePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(exePath, ["/S"], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
      shell: false,
    });
    child.on("error", reject);
    child.on("spawn", () => {
      child.unref();
      resolve(undefined);
    });
  });
}

function ensureGuestCapturePoll() {
  if (guestCapturePollTimer != null) return;
  guestCapturePollTimer = setInterval(() => {
    void pollAllGuestCaptures();
  }, 3500);
}

function stopGuestCapturePollIfIdle() {
  if (guestMediaSubscriptions.size > 0) return;
  if (guestCapturePollTimer != null) {
    clearInterval(guestCapturePollTimer);
    guestCapturePollTimer = null;
  }
}

async function pollAllGuestCaptures() {
  for (const [id, sub] of guestMediaSubscriptions) {
    const wc = sub.wc;
    if (!wc || wc.isDestroyed()) {
      guestMediaSubscriptions.delete(id);
      continue;
    }
    try {
      const r = await wc.mainFrame.executeJavaScript(CAPTURE_PROBE_SCRIPT, false);
      const host = wc.hostWebContents;
      if (!host || host.isDestroyed()) continue;
      host.send("nebula-tab-capture", {
        guestWebContentsId: wc.id,
        camera: !!(r && r.camera),
        microphone: !!(r && r.microphone),
      });
    } catch {
      /* guest navigating */
    }
  }
}

function forwardGuestAudible(wc, audible) {
  const host = wc.hostWebContents;
  if (!host || host.isDestroyed()) return;
  try {
    host.send("nebula-tab-media", {
      guestWebContentsId: wc.id,
      audible: !!audible,
      audioMuted: wc.audioMuted,
    });
  } catch {
    /* */
  }
}

function subscribeGuestMedia(guestWcId) {
  const wc = webContents.fromId(Number(guestWcId));
  if (!wc || wc.isDestroyed()) return { ok: false };
  unsubscribeGuestMedia(guestWcId);

  const onAudio = (evt, details) => {
    let audible = false;
    if (details && typeof details.audible === "boolean") audible = details.audible;
    else if (evt && typeof evt === "object" && evt !== null && "audible" in evt) {
      const a = /** @type {{ audible?: boolean }} */ (evt).audible;
      if (typeof a === "boolean") audible = a;
    }
    forwardGuestAudible(wc, audible);
  };

  wc.on("audio-state-changed", onAudio);
  wc.once("destroyed", () => unsubscribeGuestMedia(guestWcId));
  guestMediaSubscriptions.set(Number(guestWcId), { wc, onAudio });

  ensureGuestCapturePoll();
  try {
    forwardGuestAudible(wc, wc.isCurrentlyAudible());
  } catch {
    forwardGuestAudible(wc, false);
  }
  void pollAllGuestCaptures();

  return { ok: true, audioMuted: wc.audioMuted };
}

function unsubscribeGuestMedia(guestWcId) {
  const id = Number(guestWcId);
  const sub = guestMediaSubscriptions.get(id);
  if (!sub) return;
  try {
    if (!sub.wc.isDestroyed()) sub.wc.removeListener("audio-state-changed", sub.onAudio);
  } catch {
    /* */
  }
  guestMediaSubscriptions.delete(id);
  stopGuestCapturePollIfIdle();
}

ipcMain.handle("nebula-register-guest-media", (_e, payload) => {
  const gid = Number(payload?.guestWebContentsId);
  if (!Number.isFinite(gid) || gid <= 0) return { ok: false };
  return subscribeGuestMedia(gid);
});

ipcMain.handle("nebula-unregister-guest-media", (_e, payload) => {
  const gid = Number(payload?.guestWebContentsId);
  if (!Number.isFinite(gid) || gid <= 0) return { ok: false };
  unsubscribeGuestMedia(gid);
  return { ok: true };
});

ipcMain.handle("nebula-set-guest-audio-muted", (_e, payload) => {
  const gid = Number(payload?.guestWebContentsId);
  const wc = webContents.fromId(gid);
  if (!wc || wc.isDestroyed()) return { ok: false };
  wc.setAudioMuted(!!payload?.muted);
  const host = wc.hostWebContents;
  if (host && !host.isDestroyed()) {
    try {
      host.send("nebula-tab-media", {
        guestWebContentsId: wc.id,
        audible: wc.isCurrentlyAudible(),
        audioMuted: wc.audioMuted,
      });
    } catch {
      /* */
    }
  }
  return { ok: true, audioMuted: wc.audioMuted };
});

ipcMain.handle("nebula-stop-guest-media-tracks", async (_e, payload) => {
  const kindRaw = payload?.kind;
  const kind = kindRaw === "video" || kindRaw === "audio" || kindRaw === "all" ? kindRaw : "all";
  const gid = Number(payload?.guestWebContentsId);
  const wc = webContents.fromId(gid);
  if (!wc || wc.isDestroyed()) return { ok: false };
  let inner = "";
  if (kind === "all") {
    inner =
      "s.getTracks().forEach(function(t){ try { if (t.readyState !== 'ended') { t.stop(); n++; } } catch(e){} });";
  } else if (kind === "video") {
    inner =
      "s.getTracks().forEach(function(t){ try { if (t.kind === 'video' && t.readyState !== 'ended') { t.stop(); n++; } } catch(e){} });";
  } else {
    inner =
      "s.getTracks().forEach(function(t){ try { if (t.kind === 'audio' && t.readyState !== 'ended') { t.stop(); n++; } } catch(e){} });";
  }
  const script = `(function(){ var n = 0; try { document.querySelectorAll('video, audio').forEach(function(el){ var s = el.srcObject; if (!s || !s.getTracks) return; ${inner} }); } catch(e) {} return n; })()`;
  try {
    const n = await wc.mainFrame.executeJavaScript(script, true);
    void pollAllGuestCaptures();
    return { ok: true, stopped: typeof n === "number" ? n : 0 };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("nebula-check-for-updates", async () => {
  const repo = resolveUpdateRepo();
  if (!repo) {
    return { ok: true, skipped: true, reason: "no-repo", currentVersion: app.getVersion() };
  }
  try {
    const cur = app.getVersion();
    const rel = await fetchLatestGithubRelease(repo);
    if (!rel.version) return { ok: false, reason: "bad-release", currentVersion: cur };
    const updateAvailable = semverGreater(rel.version, cur);
    return {
      ok: true,
      updateAvailable,
      currentVersion: cur,
      latestVersion: rel.version,
      releaseUrl: rel.htmlUrl,
      releaseNotes: rel.body,
      installerUrl: rel.installerUrl || "",
      portableUrl: rel.portableUrl || "",
      repo,
    };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err), currentVersion: app.getVersion() };
  }
});

ipcMain.handle("nebula-prompt-update-install-choice", async (event, payload) => {
  const p = payload && typeof payload === "object" ? payload : {};
  const cur = typeof p.currentVersion === "string" ? p.currentVersion : "";
  const lat = typeof p.latestVersion === "string" ? p.latestVersion : "";
  const installerUrl = typeof p.installerUrl === "string" ? p.installerUrl.trim() : "";
  const portableUrl = typeof p.portableUrl === "string" ? p.portableUrl.trim() : "";
  const releaseUrl = typeof p.releaseUrl === "string" ? p.releaseUrl.trim() : "";

  const win = BrowserWindow.fromWebContents(event.sender);
  const parent = win && !win.isDestroyed() ? win : BrowserWindow.getFocusedWindow();

  const instTarget = installerUrl || releaseUrl;
  const portTarget = portableUrl || releaseUrl;

  const { response } = await dialog.showMessageBox(parent || undefined, {
    type: "question",
    title: "Update Nebula",
    message: `Version ${lat} is available (you have ${cur}).`,
    detail:
      "Installer: on a normal Windows install, you can download and run the updater automatically after this dialog.\n\nPortable: open a standalone .exe so you can run the new build without replacing your current install.\n\nIf a download type is missing on the release, open the release page and pick the file under Assets.",
    buttons: ["Installer (replace / upgrade)", "Portable (keep old install)", "Not now"],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
  });

  if (response === 0) {
    return {
      ok: true,
      choice: "installer",
      installerUrl: instTarget,
      portableUrl: portTarget,
      releaseUrl,
    };
  }
  if (response === 1) {
    return {
      ok: true,
      choice: "portable",
      installerUrl: instTarget,
      portableUrl: portTarget,
      releaseUrl,
    };
  }
  return { ok: true, choice: "cancel" };
});

ipcMain.handle("nebula-start-windows-installer-update", async (event, payload) => {
  const p = payload && typeof payload === "object" ? payload : {};
  const url = typeof p.url === "string" ? p.url.trim() : "";
  if (!url || !isTrustedGithubInstallerAssetUrl(url)) {
    return { ok: false, reason: "bad-url" };
  }
  if (process.platform !== "win32" || !app.isPackaged) {
    return { ok: false, reason: "unsupported" };
  }

  const win = BrowserWindow.fromWebContents(event.sender);
  const parent = win && !win.isDestroyed() ? win : BrowserWindow.getFocusedWindow();

  const { response } = await dialog.showMessageBox(parent || undefined, {
    type: "warning",
    title: "Install update",
    message: "Nebula will download the update, quit, and run the Windows installer.",
    detail:
      "The installer usually runs silently (/S). If nothing seems to happen, check the release page and run the installer manually. You may be prompted by Windows (UAC).",
    buttons: ["Continue", "Cancel"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });
  if (response !== 0) return { ok: false, cancelled: true };

  const dest = path.join(app.getPath("temp"), `NebulaUpdate-${Date.now()}.exe`);
  try {
    await streamDownloadToFile(url, dest);
  } catch (err) {
    dialog.showErrorBox("Update download failed", String(err?.message || err));
    try {
      fs.unlinkSync(dest);
    } catch {
      /* */
    }
    return { ok: false, reason: String(err?.message || err) };
  }

  try {
    await runDetachedWindowsInstaller(dest);
  } catch (err) {
    dialog.showErrorBox("Could not start installer", String(err?.message || err));
    try {
      fs.unlinkSync(dest);
    } catch {
      /* */
    }
    return { ok: false, reason: String(err?.message || err) };
  }

  setTimeout(() => {
    try {
      app.quit();
    } catch {
      /* */
    }
  }, 450);
  return { ok: true };
});

ipcMain.handle("nebula-get-update-info", () => ({
  repo: resolveUpdateRepo(),
  currentVersion: app.getVersion(),
}));

ipcMain.handle("nebula-open-external-url", async (_e, payload) => {
  const u = typeof payload?.url === "string" ? payload.url.trim() : "";
  if (!u || !/^https?:\/\//i.test(u)) return { ok: false };
  try {
    await shell.openExternal(u);
    return { ok: true };
  } catch {
    return { ok: false };
  }
});

ipcMain.handle("nebula-context-menu", (event, payload) => {
  if (!payload || typeof payload !== "object") return;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || win.isDestroyed()) return;

  const guestId = payload.guestWebContentsId;
  const linkURL = typeof payload.linkURL === "string" ? payload.linkURL : "";
  const pageURL = typeof payload.pageURL === "string" ? payload.pageURL : "";
  const selectionText = typeof payload.selectionText === "string" ? payload.selectionText : "";
  const srcURL = typeof payload.srcURL === "string" ? payload.srcURL : "";
  const mediaType = typeof payload.mediaType === "string" ? payload.mediaType : "none";
  const frameProcessId = typeof payload.frameProcessId === "number" ? payload.frameProcessId : undefined;
  const frameRoutingId = typeof payload.frameRoutingId === "number" ? payload.frameRoutingId : undefined;
  const clientX = typeof payload.clientX === "number" ? payload.clientX : undefined;
  const clientY = typeof payload.clientY === "number" ? payload.clientY : undefined;

  function safeHttpUrl(u) {
    if (!u || typeof u !== "string") return false;
    try {
      const x = new URL(u);
      return x.protocol === "http:" || x.protocol === "https:";
    } catch {
      return false;
    }
  }

  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [];

  if (safeHttpUrl(linkURL)) {
    template.push({
      label: "Open Link in New Tab",
      click: () => {
        win.webContents.send("nebula-context-action", { type: "new-tab", url: linkURL });
      },
    });
    template.push({
      label: "Open Link in Default Browser",
      click: () => {
        shell.openExternal(linkURL).catch(() => {});
      },
    });
    template.push({
      label: "Copy Link Address",
      click: () => {
        clipboard.writeText(linkURL);
      },
    });
    template.push({ type: "separator" });
  }

  if (mediaType === "image" && safeHttpUrl(srcURL)) {
    template.push({
      label: "Open Image in New Tab",
      click: () => {
        win.webContents.send("nebula-context-action", { type: "new-tab", url: srcURL });
      },
    });
    template.push({
      label: "Copy Image Address",
      click: () => {
        clipboard.writeText(srcURL);
      },
    });
    template.push({ type: "separator" });
  }

  if (selectionText && selectionText.trim().length > 0) {
    template.push({
      label: "Read aloud",
      click: () => {
        win.webContents.send("nebula-context-action", { type: "read-aloud", text: selectionText });
      },
    });
    template.push({
      label: "Copy",
      click: () => {
        clipboard.writeText(selectionText);
      },
    });
    template.push({ type: "separator" });
  }

  if (safeHttpUrl(pageURL)) {
    template.push({
      label: "Copy Page URL",
      click: () => {
        clipboard.writeText(pageURL);
      },
    });
    template.push({ type: "separator" });
  }

  if (mediaType === "video" && typeof guestId === "number" && guestId > 0 && safeHttpUrl(pageURL)) {
    template.push({
      label: "Picture in picture",
      click: () => {
        void requestPictureInPictureGuest({
          guestWebContentsId: guestId,
          frameProcessId,
          frameRoutingId,
          clientX,
          clientY,
          useClickPoint: true,
        });
      },
    });
    template.push({ type: "separator" });
  }

  template.push({
    label: "Inspect",
    click: () => {
      if (typeof guestId !== "number") return;
      const wc = webContents.fromId(guestId);
      if (!wc || wc.isDestroyed()) return;
      try {
        wc.openDevTools({ mode: "detach" });
      } catch (err) {
        console.error("[Nebula] openDevTools:", err?.message || err);
      }
    },
  });

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: win });
});

function chromeUserDataRoot() {
  const home = os.homedir();
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    return path.join(local, "Google", "Chrome", "User Data");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Google", "Chrome");
  }
  return path.join(home, ".config", "google-chrome");
}

/**
 * Prefer Chrome's last-used profile (Local State), then Default, then any profile with Bookmarks.
 */
function resolveChromeBookmarksPath() {
  const root = chromeUserDataRoot();
  const tried = [];
  const localStatePath = path.join(root, "Local State");
  if (fs.existsSync(localStatePath)) {
    try {
      const raw = fs.readFileSync(localStatePath, "utf8");
      const ls = JSON.parse(raw);
      const last = ls?.profile?.last_used;
      if (typeof last === "string" && last.length > 0) {
        const p = path.join(root, last, "Bookmarks");
        tried.push(p);
        if (fs.existsSync(p)) return { filePath: p, tried, root };
      }
    } catch {
      /* fall through */
    }
  }
  const def = path.join(root, "Default", "Bookmarks");
  tried.push(def);
  if (fs.existsSync(def)) return { filePath: def, tried, root };
  try {
    const names = fs.readdirSync(root, { withFileTypes: true });
    for (const d of names) {
      if (!d.isDirectory()) continue;
      if (d.name === "System Profile" || d.name === "Guest Profile") continue;
      const p = path.join(root, d.name, "Bookmarks");
      if (fs.existsSync(p)) {
        tried.push(p);
        return { filePath: p, tried, root };
      }
    }
  } catch {
    /* fall through */
  }
  return { filePath: def, tried, root };
}

ipcMain.handle("nebula-read-browser-bookmarks", async (_e, payload) => {
  const browser = payload && typeof payload === "object" ? payload.browser : "";
  if (browser !== "chrome") {
    return { ok: false, error: "This browser is not supported yet." };
  }
  const { filePath, tried, root } = resolveChromeBookmarksPath();
  if (!fs.existsSync(filePath)) {
    return {
      ok: false,
      error:
        "Could not find Chrome bookmarks. Install Google Chrome and open it once, or pick “Bookmark file” and choose an export.",
      path: filePath,
      profileRoot: root,
      tried,
    };
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return { ok: true, content, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err?.message || err), path: filePath };
  }
});

ipcMain.handle("nebula-read-bookmark-import-file", async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win || undefined, {
    title: "Import bookmarks",
    properties: ["openFile"],
    filters: [
      { name: "Bookmarks", extensions: ["html", "htm", "json"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths?.length) {
    return { ok: false, canceled: true };
  }
  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return { ok: true, content };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("nebula-save-bookmark-export-file", async (event, payload) => {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Invalid payload" };
  const text = typeof payload.text === "string" ? payload.text : "";
  const defaultPath = typeof payload.defaultPath === "string" ? payload.defaultPath : "nebula-bookmarks.html";
  const fmt = payload.format === "json" ? "json" : "html";
  const filters =
    fmt === "json"
      ? [
          { name: "JSON", extensions: ["json"] },
          { name: "All files", extensions: ["*"] },
        ]
      : [
          { name: "HTML", extensions: ["html", "htm"] },
          { name: "All files", extensions: ["*"] },
        ];
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win || undefined, {
    title: "Export bookmarks",
    defaultPath,
    filters,
  });
  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true };
  }
  try {
    fs.writeFileSync(result.filePath, text, "utf8");
    return { ok: true, path: result.filePath };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("nebula-shell-open-path", async (_e, fullPath) => {
  if (typeof fullPath !== "string" || fullPath.length === 0) {
    return "Invalid path";
  }
  return shell.openPath(path.normalize(fullPath));
});
ipcMain.handle("nebula-guest-click", (_e, payload) => {
  if (!payload || typeof payload !== "object") return;
  const id = payload.webContentsId;
  const x = payload.x;
  const y = payload.y;
  if (typeof id !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const wc = webContents.fromId(id);
  if (!wc || wc.isDestroyed()) return;
  let url = "";
  try {
    url = wc.getURL() || "";
  } catch {
    return;
  }
  if (!/youtube\.com|youtu\.be/i.test(url)) return;
  try {
    wc.focus();
    const rx = Math.round(x);
    const ry = Math.round(y);
    wc.sendInputEvent({ type: "mouseDown", x: rx, y: ry, button: "left", clickCount: 1 });
    wc.sendInputEvent({ type: "mouseUp", x: rx, y: ry, button: "left", clickCount: 1 });
  } catch (err) {
    console.error("[Nebula] guest-click failed:", err?.message || err);
  }
});

ipcMain.handle("nebula-focus-guest-webcontents", (event, payload) => {
  const raw = payload && typeof payload === "object" ? payload.webContentsId : payload;
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return { ok: false };
  const guest = webContents.fromId(id);
  if (!guest || guest.isDestroyed()) return { ok: false };
  try {
    const shellWc = event.sender;
    const win = BrowserWindow.fromWebContents(shellWc);
    if (win && !win.isDestroyed()) win.focus();
    guest.focus();
    return { ok: true };
  } catch (err) {
    console.error("[Nebula] focus-guest-webcontents failed:", err?.message || err);
    return { ok: false };
  }
});

/**
 * Renderer `window.alert` / `confirm` do not return focus to `<webview>` guests on Windows.
 * Sync IPC + `dialog.showMessageBoxSync` runs in main so we can refocus before returning to the shell.
 */
ipcMain.on("nebula-sync-dialog", (event, payload) => {
  const replyFalse = () => {
    event.returnValue = false;
  };
  if (!payload || typeof payload !== "object") {
    replyFalse();
    return;
  }
  const kind = payload.kind === "confirm" ? "confirm" : "alert";
  const message = String(payload.message ?? "");
  const guestId = Number(payload.guestWebContentsId);
  const parent = BrowserWindow.fromWebContents(event.sender);
  const title = typeof app.getName === "function" ? app.getName() : "Nebula";

  const afterDismiss = () => {
    try {
      if (parent && !parent.isDestroyed()) parent.focus();
      if (Number.isFinite(guestId) && guestId > 0) {
        const guest = webContents.fromId(guestId);
        if (guest && !guest.isDestroyed()) guest.focus();
      }
      if (!event.sender.isDestroyed()) event.sender.send("nebula-refocus-active-webview");
    } catch (err) {
      console.error("[Nebula] sync-dialog refocus failed:", err?.message || err);
    }
  };

  try {
    if (kind === "alert") {
      dialog.showMessageBoxSync(parent || undefined, {
        type: "info",
        title,
        message,
        buttons: ["OK"],
        defaultId: 0,
        noLink: true,
      });
      afterDismiss();
      event.returnValue = true;
      return;
    }
    const response = dialog.showMessageBoxSync(parent || undefined, {
      type: "question",
      title,
      message,
      buttons: ["OK", "Cancel"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });
    afterDismiss();
    event.returnValue = response === 0;
  } catch (err) {
    console.error("[Nebula] sync-dialog failed:", err?.message || err);
    replyFalse();
  }
});

/** Default optional toolbar buttons (back/forward/reload/omnibox/settings stay always visible). */
const DEFAULT_TOOLBAR_BUTTONS = {
  home: true,
  bookmark: true,
  sitePerm: true,
  translate: true,
  zoomReset: true,
};

const DEFAULT_SETTINGS = {
  adblockEnabled: true,
  /** Chromium WebContentsForceDark — applied at process start when true (see commandLine above). */
  forceDarkMode: false,
  /** `google-wrap` = navigate to Google’s translate URL; `libre` = in-page via LibreTranslate / optional DeepL key in vault. */
  translateEngine: "google-wrap",
  /** Base URL for LibreTranslate (no trailing slash). */
  translateLibreUrl: "https://libretranslate.com",
  /** Browsing profile id (cookies / session). `default` uses the legacy `persist:nebula` partition. */
  activeProfileId: "default",
  profiles: [{ id: "default", name: "Default" }],
  /** Shell UI: `dark` | `light` | `system` (follow OS). */
  shellTheme: "dark",
  /** Accent color `#rrggbb` for chrome highlights. */
  shellAccent: "#6eb5ff",
  /** `comfortable` | `compact` tab bar and toolbar density. */
  shellDensity: "comfortable",
  /** `auto` = hide bookmarks bar when empty; `always` | `never`. */
  bookmarksBarMode: "auto",
  toolbarButtons: { ...DEFAULT_TOOLBAR_BUTTONS },
  /** `header` | `strip` | `both` — new tab button placement. */
  newTabButtonPlacement: "both",
  searchSuggestions: {
    layerOrder: ["past", "local", "remote"],
    enablePastSearch: true,
    enableBookmarks: true,
    enableHistory: true,
    enableDuckDuckGo: true,
    maxTotal: 10,
    maxPastSearch: 6,
    maxBookmarks: 4,
    maxHistory: 4,
    maxDuckDuckGo: 8,
    remoteMinChars: 2,
    debounceMs: 220,
  },
};

function settingsPath() {
  return path.join(app.getPath("userData"), "nebula-settings.json");
}

function statePath() {
  return path.join(app.getPath("userData"), "nebula-window-state.json");
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function mergeDeep(base, patch) {
  if (!patch || typeof patch !== "object") return clone(base);
  const out = clone(base);
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv !== undefined && typeof pv === "object" && pv !== null && !Array.isArray(pv)) {
      out[key] = mergeDeep(base[key] !== undefined ? base[key] : {}, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out;
}

function normalizeShellChromeSettings(o) {
  const themes = new Set(["dark", "light", "system"]);
  o.shellTheme = themes.has(o.shellTheme) ? o.shellTheme : DEFAULT_SETTINGS.shellTheme;
  const ac = typeof o.shellAccent === "string" ? o.shellAccent.trim() : "";
  o.shellAccent = /^#[0-9a-fA-F]{6}$/.test(ac) ? ac.toLowerCase() : DEFAULT_SETTINGS.shellAccent;
  o.shellDensity = o.shellDensity === "compact" ? "compact" : "comfortable";
  const barModes = new Set(["auto", "always", "never"]);
  o.bookmarksBarMode = barModes.has(o.bookmarksBarMode) ? o.bookmarksBarMode : DEFAULT_SETTINGS.bookmarksBarMode;
  const tb0 = DEFAULT_TOOLBAR_BUTTONS;
  const rawTb = o.toolbarButtons && typeof o.toolbarButtons === "object" ? o.toolbarButtons : {};
  o.toolbarButtons = {
    home: typeof rawTb.home === "boolean" ? rawTb.home : tb0.home,
    bookmark: typeof rawTb.bookmark === "boolean" ? rawTb.bookmark : tb0.bookmark,
    sitePerm: typeof rawTb.sitePerm === "boolean" ? rawTb.sitePerm : tb0.sitePerm,
    translate: typeof rawTb.translate === "boolean" ? rawTb.translate : tb0.translate,
    zoomReset: typeof rawTb.zoomReset === "boolean" ? rawTb.zoomReset : tb0.zoomReset,
  };
  const ntp = new Set(["header", "strip", "both"]);
  o.newTabButtonPlacement = ntp.has(o.newTabButtonPlacement) ? o.newTabButtonPlacement : DEFAULT_SETTINGS.newTabButtonPlacement;
}

function normalizeSettings(s) {
  const o = clone(s);
  o.profiles = normalizeProfilesList(o.profiles);
  o.activeProfileId = sanitizeProfileId(o.activeProfileId);
  if (!o.profiles.some((p) => p.id === o.activeProfileId)) o.activeProfileId = "default";
  const ss = o.searchSuggestions;
  if (!ss || typeof ss !== "object") {
    o.searchSuggestions = clone(DEFAULT_SETTINGS.searchSuggestions);
    normalizeShellChromeSettings(o);
    return o;
  }
  const layers = ["past", "local", "remote"];
  if (
    !Array.isArray(ss.layerOrder) ||
    ss.layerOrder.length !== 3 ||
    !ss.layerOrder.every((x) => layers.includes(x)) ||
    new Set(ss.layerOrder).size !== 3
  ) {
    ss.layerOrder = [...DEFAULT_SETTINGS.searchSuggestions.layerOrder];
  }
  ss.maxTotal = Math.min(25, Math.max(3, Number(ss.maxTotal) || DEFAULT_SETTINGS.searchSuggestions.maxTotal));
  ss.maxPastSearch = Math.min(15, Math.max(0, Number(ss.maxPastSearch) || 0));
  ss.maxBookmarks = Math.min(15, Math.max(0, Number(ss.maxBookmarks) || 0));
  ss.maxHistory = Math.min(15, Math.max(0, Number(ss.maxHistory) || 0));
  ss.maxDuckDuckGo = Math.min(15, Math.max(0, Number(ss.maxDuckDuckGo) || 0));
  ss.remoteMinChars = Math.min(6, Math.max(1, Number(ss.remoteMinChars) || 2));
  ss.debounceMs = Math.min(800, Math.max(80, Number(ss.debounceMs) || 220));
  if (typeof ss.enablePastSearch !== "boolean") ss.enablePastSearch = true;
  if (typeof ss.enableBookmarks !== "boolean") ss.enableBookmarks = true;
  if (typeof ss.enableHistory !== "boolean") ss.enableHistory = true;
  if (typeof ss.enableDuckDuckGo !== "boolean") ss.enableDuckDuckGo = true;
  if (typeof o.adblockEnabled !== "boolean") o.adblockEnabled = true;
  if (typeof o.forceDarkMode !== "boolean") o.forceDarkMode = false;
  if (o.translateEngine !== "libre" && o.translateEngine !== "google-wrap") {
    o.translateEngine = DEFAULT_SETTINGS.translateEngine;
  }
  let tlu = typeof o.translateLibreUrl === "string" ? o.translateLibreUrl.trim() : "";
  if (!tlu) tlu = DEFAULT_SETTINGS.translateLibreUrl;
  o.translateLibreUrl = tlu.slice(0, 512);
  normalizeShellChromeSettings(o);
  return o;
}

function loadSettings() {
  try {
    const raw = fs.readFileSync(settingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return normalizeSettings(mergeDeep(DEFAULT_SETTINGS, parsed));
  } catch {
    return normalizeSettings(clone(DEFAULT_SETTINGS));
  }
}

function saveSettings(settings) {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

ipcMain.handle("nebula-get-settings", () => augmentSettingsForRenderer(loadSettings()));

ipcMain.handle("nebula-set-settings", (_e, patch) => {
  if (!patch || typeof patch !== "object") return augmentSettingsForRenderer(loadSettings());
  const cur = loadSettings();
  const next = normalizeSettings(mergeDeep(cur, patch));
  saveSettings(next);
  const bp = browsingPersistPartitionForProfileId(next.activeProfileId);
  const ip = incognitoMemoryPartitionForProfileId(next.activeProfileId);
  nebulaAdblock.applyAdblockFromSettings(next, bp);
  nebulaAdblock.applyAdblockFromSettings(next, ip);
  return augmentSettingsForRenderer(next);
});

/**
 * electron-builder Windows portable sets `PORTABLE_EXECUTABLE_FILE` to the real .exe the user
 * launched. `process.execPath` may point elsewhere, so `app.relaunch()` without `execPath` exits
 * without bringing the portable back (NSIS / dev `electron .` are unaffected).
 * @returns {Electron.RelaunchOptions | undefined}
 */
function relaunchOptionsForPortableWindows() {
  if (process.platform !== "win32") return undefined;
  const file =
    typeof process.env.PORTABLE_EXECUTABLE_FILE === "string" ? process.env.PORTABLE_EXECUTABLE_FILE.trim() : "";
  if (!file) return undefined;
  try {
    if (!fs.existsSync(file)) return undefined;
  } catch {
    return undefined;
  }
  const args = process.argv.slice(1);
  return args.length > 0 ? { execPath: file, args } : { execPath: file };
}

ipcMain.handle("nebula-relaunch-app", () => {
  appRelaunchPending = true;
  setImmediate(() => {
    try {
      const opts = relaunchOptionsForPortableWindows();
      if (opts) app.relaunch(opts);
      else app.relaunch();
    } catch (e) {
      console.warn("[Nebula] relaunch:", e?.message || e);
      try {
        app.relaunch();
      } catch {
        /* */
      }
    }
    app.exit(0);
  });
  return true;
});

const NEBULA_TRANSLATION_VAULT_URL = "https://nebula.settings/translation";

function isNebulaTranslationVaultEntry(e) {
  if (!e || typeof e !== "object") return false;
  const u = typeof e.url === "string" ? e.url : "";
  return u === NEBULA_TRANSLATION_VAULT_URL || u.startsWith("https://nebula.settings/translation");
}

function normalizeLibreTranslateBaseUrl(raw) {
  const fallback = "https://libretranslate.com";
  const s = typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    let out = u.origin;
    if (u.pathname && u.pathname !== "/") {
      out += u.pathname.replace(/\/$/, "");
    }
    return out.slice(0, 512) || fallback;
  } catch {
    return fallback;
  }
}

function getTranslationVaultEntryRow() {
  const entries = loadVaultEntries();
  return entries.find((e) => isNebulaTranslationVaultEntry(e)) || null;
}

function getTranslationSecretsForApi() {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) {
    return { locked: true, apiKey: "", provider: "libre" };
  }
  const row = getTranslationVaultEntryRow();
  if (!row) return { locked: false, apiKey: "", provider: "libre" };
  const prov = (row.username || "libre").toLowerCase() === "deepl" ? "deepl" : "libre";
  const apiKey = typeof row.password === "string" ? row.password : "";
  return { locked: false, apiKey, provider: prov };
}

function toDeepLTargetLang(code) {
  const c = String(code || "en")
    .toLowerCase()
    .replace(/_/g, "-");
  const map = {
    en: "EN",
    de: "DE",
    fr: "FR",
    es: "ES",
    it: "IT",
    pt: "PT-PT",
    ru: "RU",
    ja: "JA",
    ko: "KO",
    "zh-cn": "ZH",
    "zh-tw": "ZH",
    ar: "AR",
    hi: "HI",
    nl: "NL",
    pl: "PL",
    sv: "SV",
    tr: "TR",
    vi: "VI",
    th: "TH",
    id: "ID",
    uk: "UK",
    cs: "CS",
    da: "DA",
    fi: "FI",
    no: "NB",
    he: "HE",
    ro: "RO",
    hu: "HU",
    el: "EL",
    ms: "MS",
    fil: "FIL",
    bn: "BN",
    ta: "TA",
    sw: "SW",
  };
  if (map[c]) return map[c];
  const base = c.split("-")[0];
  return map[base] || "EN";
}

async function translateTextsWithLibre(baseUrl, texts, target, apiKey) {
  const base = normalizeLibreTranslateBaseUrl(baseUrl);
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    const q = texts[i];
    const body = { q, source: "auto", target, format: "text" };
    if (apiKey) body.api_key = apiKey;
    const r = await fetch(`${base}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      throw new Error(`LibreTranslate ${r.status}: ${errText.slice(0, 200)}`);
    }
    const j = await r.json();
    out.push(typeof j.translatedText === "string" ? j.translatedText : q);
    if (i < texts.length - 1) {
      await new Promise((res) => setTimeout(res, 110));
    }
  }
  return out;
}

async function translateTextsWithDeepLFree(texts, target, authKey) {
  const tl = toDeepLTargetLang(target);
  const key = String(authKey || "").trim();
  if (!key) throw new Error("DeepL: missing API key");
  /** Try Free host first, then Pro — keys are tied to one product. */
  const candidates = ["https://api-free.deepl.com", "https://api.deepl.com"];
  const authHeader = `DeepL-Auth-Key ${key}`;
  const batchSize = 50;
  let lastErr = null;
  for (const base of candidates) {
    try {
      const out = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        const chunk = texts.slice(i, i + batchSize);
        const r = await fetch(`${base}/v2/translate`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ text: chunk, target_lang: tl }),
        });
        if (!r.ok) {
          const errText = await r.text().catch(() => "");
          throw new Error(`DeepL ${r.status}: ${errText.slice(0, 280)}`);
        }
        const j = await r.json();
        const arr = Array.isArray(j.translations) ? j.translations : [];
        for (const x of arr) {
          out.push(typeof x.text === "string" ? x.text : "");
        }
        if (arr.length !== chunk.length) {
          throw new Error(`DeepL: expected ${chunk.length} translations, got ${arr.length}`);
        }
      }
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("DeepL translation failed.");
}

ipcMain.handle("nebula-translation-status", () => {
  const row = getTranslationVaultEntryRow();
  const sec = getTranslationSecretsForApi();
  if (sec.locked) {
    return { locked: true, hasKey: !!row, provider: row ? (row.username || "libre").toLowerCase() : "libre" };
  }
  return {
    locked: false,
    hasKey: !!(row && typeof row.password === "string" && row.password.length > 0),
    provider: (row && row.username ? String(row.username) : "libre").toLowerCase() === "deepl" ? "deepl" : "libre",
  };
});

ipcMain.handle("nebula-translation-save-key", (_e, payload) => {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) {
    return { ok: false, locked: true };
  }
  const apiKey = typeof payload?.apiKey === "string" ? payload.apiKey.trim() : "";
  const providerRaw = typeof payload?.provider === "string" ? payload.provider.toLowerCase() : "libre";
  const provider = providerRaw === "deepl" ? "deepl" : "libre";
  const entries = loadVaultEntries();
  const idx = entries.findIndex((e) => isNebulaTranslationVaultEntry(e));
  if (!apiKey) {
    if (idx >= 0) {
      entries.splice(idx, 1);
      saveVaultEntries(entries);
    }
    return { ok: true, cleared: true };
  }
  const now = Date.now();
  const row = {
    id: idx >= 0 ? entries[idx].id : crypto.randomUUID(),
    url: NEBULA_TRANSLATION_VAULT_URL,
    origin: "https://nebula.settings",
    title: "Translation API key (Nebula)",
    username: provider,
    password: apiKey,
    notes: "Used for in-page translation only. Hidden from the password list.",
    createdAt: idx >= 0 ? entries[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) entries[idx] = row;
  else entries.unshift(row);
  saveVaultEntries(entries);
  return { ok: true };
});

ipcMain.handle("nebula-translation-translate-texts", async (_e, payload) => {
  const texts = payload && Array.isArray(payload.texts) ? payload.texts.filter((t) => typeof t === "string") : [];
  const target = typeof payload?.target === "string" ? payload.target.trim().toLowerCase() : "en";
  if (!texts.length) return { ok: false, error: "empty" };
  if (texts.length > 400) return { ok: false, error: "too_many" };
  const settings = loadSettings();
  const sec = getTranslationSecretsForApi();
  if (sec.locked) return { ok: false, error: "vault_locked" };
  try {
    let translated;
    if (sec.provider === "deepl" && sec.apiKey) {
      translated = await translateTextsWithDeepLFree(texts, target, sec.apiKey);
    } else {
      translated = await translateTextsWithLibre(settings.translateLibreUrl, texts, target, sec.apiKey);
    }
    return { ok: true, translated };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
});

const SITE_PERM_KEYS = new Set([
  "camera",
  "microphone",
  "geolocation",
  "notifications",
  "screenCapture",
  "midi",
  "thirdPartyCookies",
]);

/** Per-origin permission overrides + global third-party cookie policy + app defaults. */
let sitePermissionsState = {
  blockThirdPartyCookiesGlobally: false,
  origins: {},
  defaults: {},
};

const SITE_DEFAULT_KEYS = ["camera", "microphone", "geolocation", "notifications", "screenCapture"];

function normalizeSiteDefaults(raw) {
  const base = raw && typeof raw === "object" ? raw : {};
  const out = {};
  for (const k of SITE_DEFAULT_KEYS) {
    const v = typeof base[k] === "string" ? base[k] : "";
    if (v === "allow" || v === "block" || v === "ask") out[k] = v;
    else out[k] = "ask";
  }
  return out;
}

function sitePermissionsStorePath() {
  return path.join(app.getPath("userData"), "nebula-site-permissions.json");
}

function loadSitePermissionsState() {
  try {
    const raw = fs.readFileSync(sitePermissionsStorePath(), "utf8");
    const p = JSON.parse(raw);
    const origins =
      p.origins && typeof p.origins === "object" && !Array.isArray(p.origins) ? p.origins : {};
    return {
      blockThirdPartyCookiesGlobally: !!p.blockThirdPartyCookiesGlobally,
      origins,
      defaults: normalizeSiteDefaults(p.defaults),
    };
  } catch {
    return {
      blockThirdPartyCookiesGlobally: false,
      origins: {},
      defaults: normalizeSiteDefaults({}),
    };
  }
}

function saveSitePermissionsState() {
  try {
    fs.writeFileSync(sitePermissionsStorePath(), JSON.stringify(sitePermissionsState, null, 2));
  } catch (err) {
    console.error("[Nebula] site permissions save:", err?.message || err);
  }
}

function getEffectiveSiteValue(origin, key) {
  if (!origin || !SITE_PERM_KEYS.has(key)) return "ask";
  const site = sitePermissionsState.origins[origin];
  const ovr = site && typeof site[key] === "string" ? site[key] : "";
  if (ovr === "allow" || ovr === "block" || ovr === "ask") return ovr;
  const defs = normalizeSiteDefaults(sitePermissionsState.defaults);
  const d = defs[key];
  return d === "allow" || d === "block" || d === "ask" ? d : "ask";
}

ipcMain.handle("nebula-get-site-permissions", (_e, payload) => {
  const pageUrl = typeof payload?.pageUrl === "string" ? payload.pageUrl : "";
  let currentOrigin = "";
  try {
    if (pageUrl && /^https?:/i.test(pageUrl)) currentOrigin = new URL(pageUrl).origin;
  } catch {
    currentOrigin = "";
  }
  const site = currentOrigin ? sitePermissionsState.origins[currentOrigin] || {} : {};
  return {
    currentOrigin,
    global: { blockThirdPartyCookies: sitePermissionsState.blockThirdPartyCookiesGlobally },
    defaults: normalizeSiteDefaults(sitePermissionsState.defaults),
    site: { ...site },
  };
});

ipcMain.handle("nebula-set-site-permissions", (_e, payload) => {
  if (!payload || typeof payload !== "object") return { ok: false };
  if (typeof payload.blockThirdPartyCookiesGlobally === "boolean") {
    sitePermissionsState.blockThirdPartyCookiesGlobally = payload.blockThirdPartyCookiesGlobally;
  }
  if (payload.defaultsPatch && typeof payload.defaultsPatch === "object") {
    sitePermissionsState.defaults = normalizeSiteDefaults(sitePermissionsState.defaults);
    for (const [k, v] of Object.entries(payload.defaultsPatch)) {
      if (!SITE_DEFAULT_KEYS.includes(k)) continue;
      if (v === "allow" || v === "block" || v === "ask") {
        sitePermissionsState.defaults[k] = v;
      }
    }
  }
  if (
    payload.origin &&
    typeof payload.origin === "string" &&
    payload.patch &&
    typeof payload.patch === "object"
  ) {
    const o = payload.origin;
    if (!sitePermissionsState.origins[o]) sitePermissionsState.origins[o] = {};
    for (const [k, v] of Object.entries(payload.patch)) {
      if (!SITE_PERM_KEYS.has(k)) continue;
      if (v === "default" || v === "" || v == null) {
        delete sitePermissionsState.origins[o][k];
      } else if (v === "allow" || v === "block" || v === "ask") {
        sitePermissionsState.origins[o][k] = v;
      }
    }
    if (Object.keys(sitePermissionsState.origins[o]).length === 0) {
      delete sitePermissionsState.origins[o];
    }
  }
  saveSitePermissionsState();
  return { ok: true };
});

/** —— Local Nebula account (master password to view / copy vault secrets) */

const NEBULA_ACCOUNT_MIN_LENGTH = 8;
const NEBULA_ACCOUNT_PBKDF2_ITER = 310000;
const NEBULA_ACCOUNT_KEYLEN = 32;
const NEBULA_ACCOUNT_UNLOCK_MS = 15 * 60 * 1000;

function nebulaAccountStorePath() {
  return path.join(app.getPath("userData"), "nebula-account.json");
}

/** @type {number} */
let nebulaAccountUnlockUntil = 0;

function loadNebulaAccountRecord() {
  try {
    const raw = fs.readFileSync(nebulaAccountStorePath(), "utf8");
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    if (typeof o.salt !== "string" || typeof o.hash !== "string") return null;
    const iterations =
      typeof o.iterations === "number" && o.iterations >= 100000 ? o.iterations : NEBULA_ACCOUNT_PBKDF2_ITER;
    return {
      salt: Buffer.from(o.salt, "base64"),
      hashHex: o.hash,
      iterations,
    };
  } catch {
    return null;
  }
}

function hasNebulaLocalAccount() {
  return !!loadNebulaAccountRecord();
}

function verifyNebulaAccountPassword(password) {
  const rec = loadNebulaAccountRecord();
  if (!rec || typeof password !== "string") return false;
  const derived = crypto.pbkdf2Sync(password, rec.salt, rec.iterations, NEBULA_ACCOUNT_KEYLEN, "sha256");
  const storedBuf = Buffer.from(rec.hashHex, "hex");
  if (storedBuf.length !== derived.length) return false;
  try {
    return crypto.timingSafeEqual(storedBuf, derived);
  } catch {
    return false;
  }
}

function setNebulaAccountUnlockSession() {
  nebulaAccountUnlockUntil = Date.now() + NEBULA_ACCOUNT_UNLOCK_MS;
}

function clearNebulaAccountUnlockSession() {
  nebulaAccountUnlockUntil = 0;
}

function isNebulaVaultSecretsUnlocked() {
  if (!hasNebulaLocalAccount()) return true;
  return Date.now() < nebulaAccountUnlockUntil;
}

function saveNebulaAccountPasswordHash(password) {
  const salt = crypto.randomBytes(16);
  const iterations = NEBULA_ACCOUNT_PBKDF2_ITER;
  const hashBuf = crypto.pbkdf2Sync(password, salt, iterations, NEBULA_ACCOUNT_KEYLEN, "sha256");
  fs.writeFileSync(
    nebulaAccountStorePath(),
    JSON.stringify({
      v: 1,
      salt: salt.toString("base64"),
      hash: hashBuf.toString("hex"),
      iterations,
    })
  );
}

function deleteNebulaAccountFile() {
  try {
    fs.unlinkSync(nebulaAccountStorePath());
  } catch {
    /* */
  }
  clearNebulaAccountUnlockSession();
}

ipcMain.handle("nebula-account-status", () => {
  const hasAccount = hasNebulaLocalAccount();
  const unlocked = isNebulaVaultSecretsUnlocked();
  return {
    hasAccount,
    unlocked,
    unlockExpiresAt: hasAccount && unlocked ? nebulaAccountUnlockUntil : null,
    unlockDurationMs: NEBULA_ACCOUNT_UNLOCK_MS,
    minPasswordLength: NEBULA_ACCOUNT_MIN_LENGTH,
  };
});

ipcMain.handle("nebula-account-create", (_e, payload) => {
  const pwd = typeof payload?.password === "string" ? payload.password : "";
  if (hasNebulaLocalAccount()) return { ok: false, error: "exists" };
  if (pwd.length < NEBULA_ACCOUNT_MIN_LENGTH) return { ok: false, error: "weak" };
  saveNebulaAccountPasswordHash(pwd);
  setNebulaAccountUnlockSession();
  return { ok: true };
});

ipcMain.handle("nebula-account-change", (_e, payload) => {
  const cur = typeof payload?.currentPassword === "string" ? payload.currentPassword : "";
  const next = typeof payload?.newPassword === "string" ? payload.newPassword : "";
  if (!hasNebulaLocalAccount()) return { ok: false, error: "none" };
  if (!verifyNebulaAccountPassword(cur)) return { ok: false, error: "bad_password" };
  if (next.length < NEBULA_ACCOUNT_MIN_LENGTH) return { ok: false, error: "weak" };
  saveNebulaAccountPasswordHash(next);
  setNebulaAccountUnlockSession();
  return { ok: true };
});

ipcMain.handle("nebula-account-remove", (_e, payload) => {
  const pwd = typeof payload?.password === "string" ? payload.password : "";
  if (!hasNebulaLocalAccount()) return { ok: false, error: "none" };
  if (!verifyNebulaAccountPassword(pwd)) return { ok: false, error: "bad_password" };
  deleteNebulaAccountFile();
  return { ok: true };
});

ipcMain.handle("nebula-account-unlock", (_e, payload) => {
  const pwd = typeof payload?.password === "string" ? payload.password : "";
  if (!hasNebulaLocalAccount()) return { ok: false, error: "none" };
  if (!verifyNebulaAccountPassword(pwd)) return { ok: false, error: "bad_password" };
  setNebulaAccountUnlockSession();
  return { ok: true };
});

ipcMain.handle("nebula-account-lock", () => {
  clearNebulaAccountUnlockSession();
  return { ok: true };
});

/** —— Password vault (encrypted with OS keychain when available) */

function vaultStorePath() {
  return path.join(app.getPath("userData"), "nebula-vault.json");
}

function readVaultFileParsed() {
  try {
    const raw = fs.readFileSync(vaultStorePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadVaultEntries() {
  const parsed = readVaultFileParsed();
  if (!parsed || typeof parsed !== "object") return [];
  try {
    if (parsed.encrypted === true && typeof parsed.payload === "string") {
      if (!safeStorage.isEncryptionAvailable()) return [];
      const buf = Buffer.from(parsed.payload, "base64");
      const plain = safeStorage.decryptString(buf);
      const inner = JSON.parse(plain);
      return Array.isArray(inner.entries) ? inner.entries : [];
    }
    if (Array.isArray(parsed.entries)) return parsed.entries;
  } catch (err) {
    console.error("[Nebula] vault load:", err?.message || err);
  }
  return [];
}

function saveVaultEntries(entries) {
  const wrap = { v: 1, entries };
  const json = JSON.stringify(wrap);
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const enc = safeStorage.encryptString(json);
      fs.writeFileSync(
        vaultStorePath(),
        JSON.stringify({ v: 1, encrypted: true, payload: Buffer.from(enc).toString("base64") })
      );
    } else {
      fs.writeFileSync(vaultStorePath(), JSON.stringify({ v: 1, encrypted: false, entries }));
    }
  } catch (err) {
    console.error("[Nebula] vault save:", err?.message || err);
  }
}

/** Guest webviews use a per-profile persist partition — cookies for vault session checks use the same. */

const VAULT_SESSION_PLACEHOLDER_NOTES =
  "Nebula: Signed in via saved browser session (cookies). Password was not captured—edit this entry to add your login password if you want it stored here.";

/** Session-placeholder rows: removing them clears site data so you are signed out on this device. */
function vaultEntryClearsSiteSessionOnRemove(entry) {
  if (!entry || typeof entry !== "object") return false;
  if (entry.sessionPlaceholder === true) return true;
  const n = typeof entry.notes === "string" ? entry.notes : "";
  return n.includes("Nebula: Signed in via saved browser session");
}

function normalizeVaultClearOrigin(originStr) {
  try {
    return new URL(originStr).origin;
  } catch {
    return "";
  }
}

function hostnameMatchesCookieDomain(hostname, cookieDomain) {
  if (!hostname || cookieDomain == null || cookieDomain === "") return false;
  const cd = String(cookieDomain).replace(/^\./, "").toLowerCase();
  const h = String(hostname).toLowerCase();
  if (!cd) return false;
  return h === cd || h.endsWith("." + cd);
}

async function removePartitionCookiesForHostname(persist, originStr) {
  let hostname = "";
  try {
    hostname = new URL(originStr).hostname;
  } catch {
    return;
  }
  let all = [];
  try {
    all = await persist.cookies.get({});
  } catch {
    return;
  }
  for (const c of all) {
    if (!c || typeof c.name !== "string") continue;
    if (!hostnameMatchesCookieDomain(hostname, c.domain || "")) continue;
    const dom = String(c.domain || "").replace(/^\./, "") || hostname;
    const path = typeof c.path === "string" && c.path ? c.path : "/";
    const preferHttps = c.secure !== false;
    const scheme = preferHttps ? "https:" : "http:";
    const originNorm = normalizeVaultClearOrigin(originStr);
    const candidates = [
      `${scheme}//${dom}${path}`,
      `${scheme}//${hostname}${path}`,
      originNorm ? `${originNorm}${path === "/" ? "/" : path}` : "",
    ].filter(Boolean);
    for (const u of candidates) {
      try {
        await persist.cookies.remove(u, c.name);
        break;
      } catch {
        /* try next URL */
      }
    }
  }
  try {
    await persist.cookies.flushStore();
  } catch {
    /* */
  }
}

/** Log out on this device: clearData is more reliable than clearStorageData(origin) alone. */
async function clearSiteSessionDataForOrigin(originStr) {
  const origin = normalizeVaultClearOrigin(originStr);
  if (!origin || !/^https?:\/\//i.test(origin)) return;
  const persist = session.fromPartition(guestCookiePartition());
  const dataTypes = ["cookies", "cache", "localStorage", "indexedDB", "serviceWorkers", "fileSystems", "webSQL", "backgroundFetch"];

  try {
    await persist.clearData({
      origins: [origin],
      dataTypes,
      originMatchingMode: "origin-in-all-contexts",
    });
  } catch (err) {
    console.error("[Nebula] clearData:", err?.message || err);
  }

  try {
    await persist.clearStorageData({
      origin,
      storages: ["cookies", "localstorage", "indexdb", "cachestorage", "serviceworkers", "filesystem", "shadercache"],
    });
  } catch (err2) {
    console.error("[Nebula] clearStorageData:", err2?.message || err2);
  }

  await removePartitionCookiesForHostname(persist, origin);

  try {
    persist.flushStorageData();
  } catch {
    /* */
  }
}

function cookieNameLooksSessionRelated(name) {
  return /session|sess|sid|auth|oauth|token|jwt|refresh|login|rack\.session|connect\.sid|ASP\.NET_SessionId|^(__Host-|__Secure-)/i.test(
    String(name || "")
  );
}

async function vaultPageHasSessionLikeCookies(pageUrl) {
  const persist = session.fromPartition(guestCookiePartition());
  let cookies;
  try {
    cookies = await persist.cookies.get({ url: pageUrl });
  } catch {
    return false;
  }
  if (!Array.isArray(cookies) || cookies.length < 2) return false;
  return cookies.some((c) => c && cookieNameLooksSessionRelated(c.name));
}

function vaultUrlLooksLikeLoginPage(pageUrl) {
  try {
    const u = new URL(pageUrl);
    const path = u.pathname.toLowerCase();
    if (/(^|\/)(login|signin|sign-in|sign_up|signup|register|auth)(\/|$)/i.test(path)) return true;
  } catch {
    /* */
  }
  return false;
}

ipcMain.handle("nebula-vault-session-offer-check", async (_e, payload) => {
  const pageUrl = typeof payload?.pageUrl === "string" ? payload.pageUrl.trim() : "";
  if (!pageUrl || !/^https:\/\//i.test(pageUrl)) return { offer: false };
  if (vaultUrlLooksLikeLoginPage(pageUrl)) return { offer: false };
  let origin = "";
  let hostname = "";
  try {
    const u = new URL(pageUrl);
    origin = u.origin;
    hostname = u.hostname;
  } catch {
    return { offer: false };
  }
  const entries = loadVaultEntries();
  if (entries.some((e) => e && e.origin === origin)) return { offer: false };
  const has = await vaultPageHasSessionLikeCookies(pageUrl);
  if (!has) return { offer: false };
  return { offer: true, origin, hostname };
});

ipcMain.handle("nebula-vault-add-session-placeholder", async (_e, payload) => {
  const pageUrl = typeof payload?.pageUrl === "string" ? payload.pageUrl.trim() : "";
  const titleIn = typeof payload?.title === "string" ? payload.title.trim() : "";
  const skipCookieCheck = !!payload?.skipCookieCheck;
  if (!pageUrl || !/^https:\/\//i.test(pageUrl)) return { ok: false, error: "url" };
  if (vaultUrlLooksLikeLoginPage(pageUrl)) return { ok: false, error: "login_page" };
  let origin = "";
  let url = pageUrl;
  try {
    const u = new URL(pageUrl);
    origin = u.origin;
    url = u.href;
  } catch {
    return { ok: false, error: "url" };
  }
  const entries = loadVaultEntries();
  if (entries.some((e) => e && e.origin === origin)) return { ok: false, error: "exists" };
  if (!skipCookieCheck) {
    const has = await vaultPageHasSessionLikeCookies(pageUrl);
    if (!has) return { ok: false, error: "no_session" };
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  const entry = {
    id,
    url,
    origin,
    title: titleIn,
    username: "",
    password: "",
    notes: VAULT_SESSION_PLACEHOLDER_NOTES,
    sessionPlaceholder: true,
    createdAt: now,
    updatedAt: now,
  };
  entries.unshift(entry);
  saveVaultEntries(entries);
  return { ok: true, entry };
});

ipcMain.handle("nebula-vault-list", () => {
  const entries = loadVaultEntries();
  const locked = hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked();
  const masked = entries.map((e) => {
    if (!e || typeof e !== "object") return e;
    const passwordPresent = typeof e.password === "string" && e.password.length > 0;
    if (locked) {
      return { ...e, password: "", passwordPresent };
    }
    return { ...e, passwordPresent };
  });
  return {
    entries: masked,
    secretsLocked: locked,
    hasLocalAccount: hasNebulaLocalAccount(),
  };
});

ipcMain.handle("nebula-vault-status", () => ({
  encryptionAvailable: safeStorage.isEncryptionAvailable(),
}));

ipcMain.handle("nebula-vault-add", (_e, row) => {
  if (!row || typeof row !== "object") return { ok: false };
  const username = typeof row.username === "string" ? row.username : "";
  const password = typeof row.password === "string" ? row.password : "";
  let urlRaw = typeof row.url === "string" ? row.url.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  const notes = typeof row.notes === "string" ? row.notes : "";
  let origin = "";
  let url = urlRaw;
  try {
    const u = new URL(urlRaw.includes("://") ? urlRaw : `https://${urlRaw}`);
    origin = u.origin;
    url = u.href;
  } catch {
    origin = "";
  }
  const entries = loadVaultEntries();
  const id = crypto.randomUUID();
  const now = Date.now();
  const entry = { id, url, origin, title, username, password, notes, createdAt: now, updatedAt: now };
  entries.unshift(entry);
  saveVaultEntries(entries);
  return { ok: true, entry };
});

/** Insert or update by (origin + username) — used after login form capture. */
ipcMain.handle("nebula-vault-upsert-login", (_e, row) => {
  if (!row || typeof row !== "object") return { ok: false };
  const username = typeof row.username === "string" ? row.username : "";
  const password = typeof row.password === "string" ? row.password : "";
  const pageUrl = typeof row.pageUrl === "string" ? row.pageUrl.trim() : "";
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!username || !password || !pageUrl) return { ok: false };
  let origin = "";
  let url = pageUrl;
  try {
    const u = new URL(pageUrl);
    origin = u.origin;
    url = u.href;
  } catch {
    return { ok: false };
  }
  const entries = loadVaultEntries();
  const idx = entries.findIndex((e) => e && e.origin === origin && e.username === username);
  const now = Date.now();
  if (idx >= 0) {
    entries[idx] = {
      ...entries[idx],
      password,
      url,
      title: title || entries[idx].title || "",
      updatedAt: now,
    };
    saveVaultEntries(entries);
    return { ok: true, updated: true, entry: entries[idx] };
  }
  const id = crypto.randomUUID();
  const entry = {
    id,
    url,
    origin,
    title,
    username,
    password,
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
  entries.unshift(entry);
  saveVaultEntries(entries);
  return { ok: true, updated: false, entry };
});

ipcMain.handle("nebula-vault-update", (_e, payload) => {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) return { ok: false, locked: true };
  if (!payload || typeof payload !== "object") return { ok: false };
  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id) return { ok: false };
  const entries = loadVaultEntries();
  const idx = entries.findIndex((x) => x && x.id === id);
  if (idx < 0) return { ok: false };
  const cur = entries[idx];
  const patch = payload.patch && typeof payload.patch === "object" ? payload.patch : {};
  let url = typeof patch.url === "string" ? patch.url.trim() : cur.url || "";
  let origin = cur.origin || "";
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    origin = u.origin;
    url = u.href;
  } catch {
    /* keep */
  }
  const next = {
    ...cur,
    url,
    origin,
    title: typeof patch.title === "string" ? patch.title.trim() : cur.title || "",
    username: typeof patch.username === "string" ? patch.username : cur.username || "",
    password: typeof patch.password === "string" ? patch.password : cur.password || "",
    notes: typeof patch.notes === "string" ? patch.notes : cur.notes || "",
    updatedAt: Date.now(),
  };
  if (vaultEntryClearsSiteSessionOnRemove(cur)) {
    next.sessionPlaceholder = true;
  }
  entries[idx] = next;
  saveVaultEntries(entries);
  return { ok: true, entry: next };
});

ipcMain.handle("nebula-vault-remove", async (_e, payload) => {
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) return { ok: false };
  const before = loadVaultEntries();
  const victim = before.find((x) => x && x.id === id);
  if (!victim) return { ok: false };
  const clearSession = vaultEntryClearsSiteSessionOnRemove(victim);
  const originToClear = typeof victim.origin === "string" ? victim.origin : "";
  const entries = before.filter((x) => x && x.id !== id);
  saveVaultEntries(entries);
  if (clearSession && originToClear) {
    await clearSiteSessionDataForOrigin(originToClear);
    return { ok: true, clearedSiteSession: true, clearedOrigin: originToClear };
  }
  return { ok: true, clearedSiteSession: false };
});

function safeImportedVaultEntry(raw, now) {
  if (!raw || typeof raw !== "object") return null;
  const urlRaw = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!urlRaw) return null;
  if (urlRaw.includes("nebula.settings/translation")) return null;
  let url = urlRaw;
  let origin = "";
  try {
    const u = new URL(urlRaw.includes("://") ? urlRaw : `https://${urlRaw}`);
    origin = u.origin;
    url = u.href;
  } catch {
    return null;
  }
  return {
    id: crypto.randomUUID(),
    url,
    origin,
    title: typeof raw.title === "string" ? raw.title.trim().slice(0, 500) : "",
    username: typeof raw.username === "string" ? raw.username : "",
    password: typeof raw.password === "string" ? raw.password : "",
    notes: typeof raw.notes === "string" ? String(raw.notes).slice(0, 8000) : "",
    sessionPlaceholder: raw.sessionPlaceholder === true,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: now,
  };
}

ipcMain.handle("nebula-vault-export-json-file", async (event, payload) => {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) {
    return { ok: false, locked: true };
  }
  const win = BrowserWindow.fromWebContents(event.sender);
  const entries = loadVaultEntries();
  const includePw = !(payload && payload.includePasswords === false);
  const entriesFiltered = entries.filter((e) => !isNebulaTranslationVaultEntry(e));
  const entriesOut = includePw
    ? entriesFiltered
    : entriesFiltered.map((e) => {
        const hasPass = typeof e.password === "string" && e.password.length > 0;
        return { ...e, password: "", passwordPresent: hasPass };
      });
  const wrap = {
    v: 1,
    app: "nebula-vault-export",
    exportedAt: Date.now(),
    exportRedacted: includePw ? undefined : true,
    entries: entriesOut,
  };
  const text = JSON.stringify(wrap, null, 2);
  const result = await dialog.showSaveDialog(win || undefined, {
    title: includePw ? "Export saved passwords" : "Export vault outline (no passwords)",
    defaultPath: includePw ? "nebula-password-vault.json" : "nebula-vault-outline.json",
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  try {
    fs.writeFileSync(result.filePath, text, "utf8");
    return { ok: true, path: result.filePath, count: entriesOut.length, redacted: !includePw };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
});

ipcMain.handle("nebula-vault-import-json-merge", async (event, payload) => {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) {
    return { ok: false, locked: true };
  }
  const mode = payload && payload.mode === "replace" ? "replace" : "merge";
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win || undefined, {
    title: mode === "replace" ? "Import saved passwords (replace entire vault)" : "Import saved passwords (merge)",
    properties: ["openFile"],
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (result.canceled || !result.filePaths?.length) return { ok: false, canceled: true };
  const filePath = result.filePaths[0];
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${String(err?.message || err)}` };
  }
  let incoming = [];
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.entries)) incoming = parsed.entries;
  else if (Array.isArray(parsed)) incoming = parsed;
  else return { ok: false, error: "File must contain { entries: [...] } or a JSON array" };
  if (incoming.length > 5000) return { ok: false, error: "Too many entries (max 5000)" };

  const now = Date.now();
  if (mode === "replace") {
    const fresh = [];
    let skipped = 0;
    for (const raw of incoming) {
      const neu = safeImportedVaultEntry(raw, now);
      if (!neu) {
        skipped += 1;
        continue;
      }
      fresh.push(neu);
    }
    saveVaultEntries(fresh);
    return {
      ok: true,
      mode: "replace",
      added: fresh.length,
      skipped,
      total: fresh.length,
    };
  }

  const existing = loadVaultEntries();
  let added = 0;
  let skipped = 0;
  for (const raw of incoming) {
    const neu = safeImportedVaultEntry(raw, now);
    if (!neu) {
      skipped += 1;
      continue;
    }
    const dup = existing.some(
      (e) => e && e.origin === neu.origin && (e.username || "") === (neu.username || "")
    );
    if (dup) {
      skipped += 1;
      continue;
    }
    existing.unshift(neu);
    added += 1;
  }
  saveVaultEntries(existing);
  return { ok: true, mode: "merge", added, skipped, total: existing.length };
});

ipcMain.handle("nebula-vault-copy-password", (_e, payload) => {
  if (hasNebulaLocalAccount() && !isNebulaVaultSecretsUnlocked()) return { ok: false, locked: true };
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) return { ok: false };
  const ent = loadVaultEntries().find((x) => x && x.id === id);
  if (!ent || typeof ent.password !== "string") return { ok: false };
  clipboard.writeText(ent.password);
  return { ok: true };
});

ipcMain.handle("nebula-vault-copy-username", (_e, payload) => {
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) return { ok: false };
  const ent = loadVaultEntries().find((x) => x && x.id === id);
  if (!ent || typeof ent.username !== "string") return { ok: false };
  clipboard.writeText(ent.username);
  return { ok: true };
});

/** —— Permission prompts (camera / mic / location ask) */

let permissionPromptSeq = 0;
/** @type {Map<number, (granted: boolean) => void>} */
const permissionPromptCallbacks = new Map();

ipcMain.on("nebula-permission-response", (_event, payload) => {
  const id = typeof payload?.id === "number" ? payload.id : Number(payload?.id);
  const cb = permissionPromptCallbacks.get(id);
  if (!cb) return;
  permissionPromptCallbacks.delete(id);
  const allow = !!payload?.allow;
  const remember = !!payload?.remember;
  const origin = typeof payload?.origin === "string" ? payload.origin : "";
  const persist = payload?.persist && typeof payload.persist === "object" ? payload.persist : null;

  if (remember && origin && persist) {
    sitePermissionsState.origins[origin] = sitePermissionsState.origins[origin] || {};
    for (const [k, val] of Object.entries(persist)) {
      if (!SITE_PERM_KEYS.has(k)) continue;
      if (val === "allow" || val === "block") {
        sitePermissionsState.origins[origin][k] = val;
      }
    }
    const o = sitePermissionsState.origins[origin];
    if (o && Object.keys(o).length === 0) delete sitePermissionsState.origins[origin];
    saveSitePermissionsState();
  }
  cb(allow);
});

function shellWindowFromGuestWebContents(wc) {
  if (!wc || wc.isDestroyed()) return null;
  let host = wc;
  try {
    const h = wc.hostWebContents;
    if (h && !h.isDestroyed()) host = h;
  } catch {
    /* */
  }
  try {
    return BrowserWindow.fromWebContents(host);
  } catch {
    return null;
  }
}

function promptUserPermission(win, payload) {
  return new Promise((resolve) => {
    const id = ++permissionPromptSeq;
    const timeout = setTimeout(() => {
      if (permissionPromptCallbacks.has(id)) {
        permissionPromptCallbacks.delete(id);
        resolve(false);
      }
    }, 120000);
    permissionPromptCallbacks.set(id, (granted) => {
      clearTimeout(timeout);
      resolve(granted);
    });
    try {
      if (win && !win.isDestroyed()) {
        win.webContents.send("nebula-permission-request", { ...payload, id });
      } else {
        permissionPromptCallbacks.delete(id);
        clearTimeout(timeout);
        resolve(false);
      }
    } catch {
      permissionPromptCallbacks.delete(id);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

/** Serialize permission prompts so multiple requests don't overlap in the UI. */
let permissionPromptChain = Promise.resolve();

function enqueuePermissionTask(fn) {
  permissionPromptChain = permissionPromptChain.then(fn).catch(() => {});
}

/** window.open / target=_blank from a guest webview → open in this window as a tab (no extra BrowserWindow). */
function urlAllowedForNewTabFromGuest(url) {
  if (typeof url !== "string" || !url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "file:";
  } catch {
    return false;
  }
}

/**
 * OAuth / SSO often uses window.open + window.opener.postMessage. Opening the URL in a new tab
 * (deny popup) breaks that chain. Allow a real BrowserWindow when the URL looks like an IdP
 * or OAuth authorize endpoint, or when the opener uses a sized about:blank stub before redirect.
 * @param {string} urlStr
 * @param {Electron.HandlerDetails} details
 */
function guestOAuthPopupNeedsNativeWindow(urlStr, details) {
  const disp = details && details.disposition;
  if (disp === "foreground-tab" || disp === "background-tab") return false;

  const features = typeof details?.features === "string" ? details.features : "";
  const sizedPopup = /\bwidth=\d+/i.test(features) && /\bheight=\d+/i.test(features);

  if (typeof urlStr === "string" && /^about:blank$/i.test(urlStr.trim())) {
    return sizedPopup && (disp === "new-window" || disp === "default" || disp === "other");
  }

  try {
    const u = new URL(urlStr);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    const path = (u.pathname || "").toLowerCase();

    const oauthHosts = [
      "accounts.google.com",
      "oauth2.googleapis.com",
      "accounts.youtube.com",
      "myaccount.google.com",
      "login.microsoftonline.com",
      "login.live.com",
      "login.microsoft.com",
      "appleid.apple.com",
      "www.facebook.com",
      "m.facebook.com",
      "github.com",
      "gitlab.com",
      "accounts.spotify.com",
      "slack.com",
      "discord.com",
      "twitter.com",
      "x.com",
      "www.linkedin.com",
      "linkedin.com",
      "login.yahoo.com",
      "signin.aws.amazon.com",
      "auth0.com",
      "okta.com",
    ];
    for (const h of oauthHosts) {
      if (host === h || host.endsWith(`.${h}`)) return true;
    }
    if (host === "www.google.com" && (path.includes("/accounts") || path.includes("/signin"))) return true;
    if (host.endsWith(".google.com") && (path.includes("/oauth") || path.includes("/signin/oauth"))) return true;

    if (/\/(oauth|oauth2|authorize|openid)(\/|$|\?)/.test(path)) return true;
    if (path.includes("/signin/oauth")) return true;
    if (path.includes("/dialog/oauth")) return true;

    return false;
  } catch {
    return false;
  }
}

/** webPreferences for OAuth popups: same partition as the opener webview. */
function guestOAuthPopupBrowserWindowPrefs(partition) {
  const p =
    typeof partition === "string" && partition
      ? partition
      : browsingPersistPartitionForProfileId(loadSettings().activeProfileId);
  return {
    partition: p,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    nativeWindowOpen: true,
  };
}

ipcMain.handle("nebula-get-app-info", () => ({
  name: app.getName(),
  version: app.getVersion(),
}));

/** Same folder as index.html — avoids fetch() failing on file:// in the shell UI. */
ipcMain.handle("nebula-get-changelog", () => {
  try {
    const p = path.join(__dirname, "renderer", "changelog.json");
    const raw = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { entries: [] };
  } catch {
    return { entries: [] };
  }
});

ipcMain.on("nebula-get-home-preload-path-sync", (event) => {
  event.returnValue = path.join(__dirname, "renderer", "home-preload.js");
});

ipcMain.on("nebula-get-guest-login-preload-path-sync", (event) => {
  event.returnValue = path.join(__dirname, "renderer", "guest-login-preload.js");
});

ipcMain.handle("nebula-home-suggestions", async (event, query) => {
  const guest = event.sender;
  try {
    const cur = guest.getURL();
    if (cur && !cur.includes("welcome.html")) return [];
  } catch {
    return [];
  }
  const host = guest.hostWebContents;
  if (!host || host.isDestroyed()) return [];
  const win = BrowserWindow.fromWebContents(host);
  if (!win || win.isDestroyed()) return [];
  const qJson = JSON.stringify(String(query ?? ""));
  try {
    const rows = await win.webContents.executeJavaScript(
      `(typeof window.__nebulaHomeSuggestionsBuild === "function" ? window.__nebulaHomeSuggestionsBuild(${qJson}) : Promise.resolve([]))`,
      true
    );
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
});

ipcMain.handle("nebula-register-guest-window-open", (_e, payload) => {
  const p = payload && typeof payload === "object" ? payload : {};
  const id = Number(p.guestWebContentsId);
  if (!Number.isFinite(id) || id <= 0) return { ok: false };
  const guest = webContents.fromId(id);
  if (!guest || guest.isDestroyed()) return { ok: false };
  const part =
    typeof p.partition === "string" && p.partition.trim()
      ? p.partition.trim()
      : browsingPersistPartitionForProfileId(loadSettings().activeProfileId);
  guestPartitionByWcId.set(guest.id, part);
  if (!guestChildWindowFocusHooks.has(guest)) {
    guestChildWindowFocusHooks.add(guest);
    guest.on("did-create-window", (childWindow) => {
      if (!childWindow || childWindow.isDestroyed()) return;
      childWindow.once("closed", () => {
        try {
          if (!guest.isDestroyed()) guest.focus();
          const host = guest.hostWebContents;
          if (host && !host.isDestroyed()) {
            const bw = BrowserWindow.fromWebContents(host);
            if (bw && !bw.isDestroyed()) bw.focus();
            host.send("nebula-refocus-active-webview");
          }
        } catch {
          /* */
        }
      });
    });
  }
  guest.setWindowOpenHandler((details) => {
    if (details.postBody != null) {
      return { action: "allow" };
    }
    const url = typeof details.url === "string" ? details.url : "";
    const tabPartition = guestPartitionByWcId.get(guest.id) || part;
    if (guestOAuthPopupNeedsNativeWindow(url, details)) {
      const hostWin = BrowserWindow.fromWebContents(guest.hostWebContents);
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          parent: hostWin && !hostWin.isDestroyed() ? hostWin : undefined,
          width: 520,
          height: 720,
          minWidth: 380,
          minHeight: 480,
          show: true,
          autoHideMenuBar: true,
          backgroundColor: "#ffffff",
          webPreferences: guestOAuthPopupBrowserWindowPrefs(tabPartition),
        },
      };
    }
    if (!urlAllowedForNewTabFromGuest(url)) {
      return { action: "deny" };
    }
    try {
      const host = guest.hostWebContents;
      if (host && !host.isDestroyed()) {
        host.send("nebula-open-url-in-tab", { url, partition: tabPartition });
      }
    } catch (err) {
      console.error("[Nebula] window-open → tab:", err?.message || err);
    }
    return { action: "deny" };
  });
  return { ok: true };
});

const isMac = process.platform === "darwin";

/** Legacy default Chromium profile folder name under `Partitions/` (HTTP cache reset). */
const LEGACY_DEFAULT_PARTITION_SUB = "nebula";

/**
 * One-time delete of Chromium HTTP disk cache folders. Fixes broken cache index / size
 * that surfaces as `Invalid cache (current) size` and can cascade into TLS handshake failures.
 */
function maybeResetHttpDiskCacheOnce() {
  const marker = path.join(app.getPath("userData"), ".nebula-http-disk-cache-reset-v1");
  if (fs.existsSync(marker)) return;
  const rm = (p) => {
    try {
      fs.rmSync(p, { recursive: true, force: true });
    } catch {
      /* */
    }
  };
  try {
    const ud = app.getPath("userData");
    const sub = LEGACY_DEFAULT_PARTITION_SUB;
    rm(path.join(ud, "Cache"));
    rm(path.join(ud, "Code Cache"));
    rm(path.join(ud, "Partitions", sub, "Cache"));
    rm(path.join(ud, "Partitions", sub, "Code Cache"));
    fs.writeFileSync(marker, "");
    console.log("[Nebula:Net] Reset HTTP disk cache directories once.");
  } catch (e) {
    console.warn("[Nebula:Net] HTTP cache reset:", e?.message || e);
  }
}

/** Chromium permission strings we allow sites to request at all (others are denied). */
const PERMISSION_REQUEST_ALLOWLIST = new Set([
  "media",
  "mediaKeySystem",
  "geolocation",
  "notifications",
  "fullscreen",
  "clipboard-read",
  "clipboard-sanitized-write",
  "display-capture",
  "midi",
  "midiSysex",
  /** Embedded players / SSO — required by many streaming stacks */
  "storage-access",
  "top-level-storage-access",
  "speaker-selection",
]);

const PERM_REQUEST_TO_SITE_KEY = {
  geolocation: "geolocation",
  notifications: "notifications",
  "display-capture": "screenCapture",
  midi: "midi",
  midiSysex: "midi",
};

function permissionOriginFromDetails(wc, details) {
  if (details && typeof details === "object" && typeof details.requestingUrl === "string") {
    try {
      return new URL(details.requestingUrl).origin;
    } catch {
      /* fall through */
    }
  }
  if (wc && !wc.isDestroyed()) {
    try {
      const u = wc.getURL();
      if (u && /^https?:/i.test(u)) return new URL(u).origin;
    } catch {
      /* ignore */
    }
  }
  return "";
}

function checkMediaPermissionSync(origin, details) {
  const mt = details?.mediaType;
  /** MSE / EME / autoplay checks often omit mediaType or use "unknown" — do not tie those to camera/mic. */
  if (!mt || mt === "unknown") return true;
  if (mt === "video") {
    if (getEffectiveSiteValue(origin, "camera") !== "allow") return false;
  }
  if (mt === "audio") {
    if (getEffectiveSiteValue(origin, "microphone") !== "allow") return false;
  }
  return true;
}

function checkSimplePermissionSync(origin, siteKey) {
  const v = getEffectiveSiteValue(origin, siteKey);
  if (v === "allow") return true;
  if (v === "block") return false;
  return false;
}

/** Origins where empty getUserMedia-style requests are usually EME / player bootstrap, not webcam. */
function isLikelyStreamingPlaybackOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const h = new URL(origin).hostname.toLowerCase().replace(/^www\./, "");
    const roots = [
      "netflix.com",
      "spotify.com",
      "crunchyroll.com",
      "disneyplus.com",
      "hulu.com",
      "max.com",
      "hbomax.com",
      "primevideo.com",
      "peacocktv.com",
      "paramountplus.com",
      "youtube.com",
      "music.youtube.com",
      "twitch.tv",
      "soundcloud.com",
    ];
    return roots.some((r) => h === r || h.endsWith("." + r));
  } catch {
    return false;
  }
}

async function handleMediaPermissionRequest(wc, callback, details) {
  const origin = permissionOriginFromDetails(wc, details);
  const mtArr =
    details && typeof details === "object" && Array.isArray(details.mediaTypes) ? details.mediaTypes : [];
  const defaultBoth = mtArr.length === 0;
  if (defaultBoth && isLikelyStreamingPlaybackOrigin(origin)) {
    callback(true);
    return;
  }
  const wantVideo = defaultBoth || mtArr.includes("video");
  const wantAudio = defaultBoth || mtArr.includes("audio");

  const cam = getEffectiveSiteValue(origin, "camera");
  const mic = getEffectiveSiteValue(origin, "microphone");

  if (wantVideo && cam === "block") {
    callback(false);
    return;
  }
  if (wantAudio && mic === "block") {
    callback(false);
    return;
  }

  const videoOk = !wantVideo || cam === "allow";
  const audioOk = !wantAudio || mic === "allow";
  if (videoOk && audioOk) {
    callback(true);
    return;
  }

  const needsCamPrompt = wantVideo && cam === "ask";
  const needsMicPrompt = wantAudio && mic === "ask";
  if (!needsCamPrompt && !needsMicPrompt) {
    callback(false);
    return;
  }

  let label = "camera and microphone";
  if (needsCamPrompt && !needsMicPrompt) label = "camera";
  if (!needsCamPrompt && needsMicPrompt) label = "microphone";

  const win = shellWindowFromGuestWebContents(wc);
  const granted = await promptUserPermission(win, {
    origin,
    kind: "media",
    label,
    needsCamera: needsCamPrompt,
    needsMicrophone: needsMicPrompt,
  });
  callback(granted);
}

async function handleSimplePermissionRequest(wc, permission, callback, details, siteKey) {
  const origin = permissionOriginFromDetails(wc, details);
  const eff = getEffectiveSiteValue(origin, siteKey);
  if (eff === "block") {
    callback(false);
    return;
  }
  if (eff === "allow") {
    callback(true);
    return;
  }
  const label =
    siteKey === "geolocation"
      ? "your location"
      : siteKey === "notifications"
        ? "notifications"
        : siteKey === "screenCapture"
          ? "your screen"
          : siteKey === "midi"
            ? "MIDI devices"
            : "this feature";

  const win = shellWindowFromGuestWebContents(wc);
  const granted = await promptUserPermission(win, {
    origin,
    kind: "simple",
    siteKey,
    permission,
    label,
  });
  callback(granted);
}

/**
 * Third-party cookie stripping breaks DRM license calls and some streaming CDNs that pass auth via Cookie.
 */
function shouldPreserveCookiesForStreamingUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return false;
  const lower = urlStr.toLowerCase();
  if (
    /widevine|playready|fairplay|clearkey|getlicense|get_license|getwidevine|certificate(?:provisioning)?|\/drm\b|\/license\b|wv-|\.drm\.|\.mp\.microsoft\.com/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /\.nflxvideo\.net|\.nflxso\.net|\.amazonvideo\.com|\.aiv-delivery\.net|disney-plus\.net|\.disney\.api\.edge|\.huluim\.com|\.hulu\.com\/.*drm|\.hbomaxcdn\.com|\.max-streaming\.net|\.skycdn\.co\.uk|\.btcdn\.net|\.sky\.com\/.*drm|\.spotifycdn\.com|audio-ak-spotify-com|\.scdn\.co|crunchyroll|crunchyrollsvc|ipify\.org|\.vrv\.co|\.licensedelivery\.|\.licensedash\.|\.license\.|\.widevine\.com/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

function chromeAlignedUserAgent() {
  const chromeVer = process.versions.chrome || "130.0.0.0";
  if (process.platform === "win32") {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;
  }
  if (process.platform === "darwin") {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;
  }
  return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`;
}

/**
 * Some streaming stacks gate APIs on Sec-CH-UA (expecting Google Chrome, not only Chromium).
 * Electron’s default hints can yield 403 on config/CDN calls; license 400 is usually separate (VMP).
 * @param {Record<string, string | string[]>} headers
 * @param {string} requestUrlStr
 * @param {string} pageUrlStr
 */
function applyChromeLikeClientHintsForStreaming(headers, requestUrlStr, pageUrlStr) {
  let reqHost = "";
  try {
    reqHost = new URL(requestUrlStr).hostname.toLowerCase();
  } catch {
    return;
  }
  let pageHost = "";
  try {
    if (pageUrlStr && /^https?:/i.test(pageUrlStr)) pageHost = new URL(pageUrlStr).hostname.toLowerCase();
  } catch {
    /* */
  }
  const hay = `${reqHost} ${pageHost}`;
  if (
    !/crunchyroll|crunchyrollsvc|netflix|nflx|spotify|scdn\.co|spotifycdn|disney|hulu|hbomax|max\.com|primevideo|paramount|peacock|ipify|widevine|gvt1|googlevideo/i.test(
      hay
    )
  ) {
    return;
  }
  const major = String((process.versions.chrome || "130").split(".")[0]);
  headers["Sec-CH-UA"] = `"Google Chrome";v="${major}", "Chromium";v="${major}", "Not_A Brand";v="24"`;
  headers["Sec-CH-UA-Mobile"] = "?0";
  if (process.platform === "darwin") {
    headers["Sec-CH-UA-Platform"] = '"macOS"';
  } else if (process.platform === "win32") {
    headers["Sec-CH-UA-Platform"] = '"Windows"';
  } else {
    headers["Sec-CH-UA-Platform"] = '"Linux"';
  }
}

function attachThirdPartyCookieBlocking(sess) {
  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...(details.requestHeaders || {}) };
    const wc = details.webContents;
    let pageUrl = "";
    try {
      if (wc && !wc.isDestroyed()) pageUrl = wc.getURL() || "";
    } catch {
      pageUrl = "";
    }
    applyChromeLikeClientHintsForStreaming(headers, details.url, pageUrl);
    if (shouldPreserveCookiesForStreamingUrl(details.url)) {
      callback({ requestHeaders: headers });
      return;
    }
    if (!pageUrl || !/^https?:/i.test(pageUrl)) {
      callback({ requestHeaders: headers });
      return;
    }
    let pageOrigin = "";
    try {
      pageOrigin = new URL(pageUrl).origin;
    } catch {
      callback({ requestHeaders: headers });
      return;
    }
    if (details.resourceType === "mainFrame") {
      callback({ requestHeaders: headers });
      return;
    }
    let requestOrigin = "";
    try {
      requestOrigin = new URL(details.url).origin;
    } catch {
      callback({ requestHeaders: headers });
      return;
    }
    const originRule = sitePermissionsState.origins[pageOrigin]?.thirdPartyCookies;
    const globalBlock = sitePermissionsState.blockThirdPartyCookiesGlobally;
    let strip = false;
    if (originRule === "block") strip = true;
    else if (originRule === "allow") strip = false;
    else if (globalBlock) strip = true;
    if (!strip || pageOrigin === requestOrigin) {
      callback({ requestHeaders: headers });
      return;
    }
    delete headers.Cookie;
    delete headers.cookie;
    callback({ requestHeaders: headers });
  });
}

function installSessionPermissionHandlers(sess) {
  sess.setPermissionRequestHandler((wc, permission, callback, details) => {
    if (!PERMISSION_REQUEST_ALLOWLIST.has(permission)) {
      callback(false);
      return;
    }
    if (permission === "media") {
      enqueuePermissionTask(async () => {
        await handleMediaPermissionRequest(wc, callback, details);
      });
      return;
    }
    const siteKey = PERM_REQUEST_TO_SITE_KEY[permission];
    if (siteKey) {
      enqueuePermissionTask(async () => {
        await handleSimplePermissionRequest(wc, permission, callback, details, siteKey);
      });
      return;
    }
    callback(true);
  });

  sess.setPermissionCheckHandler((wc, permission, requestingOrigin, details) => {
    if (!PERMISSION_REQUEST_ALLOWLIST.has(permission)) return false;
    const origin =
      typeof requestingOrigin === "string" && requestingOrigin
        ? requestingOrigin
        : details?.securityOrigin || permissionOriginFromDetails(wc, details);
    if (permission === "media") {
      return checkMediaPermissionSync(origin, details);
    }
    const siteKey = PERM_REQUEST_TO_SITE_KEY[permission];
    if (siteKey) return checkSimplePermissionSync(origin, siteKey);
    return true;
  });

  attachThirdPartyCookieBlocking(sess);
}


function loadWindowState() {
  try {
    const raw = fs.readFileSync(statePath(), "utf8");
    const s = JSON.parse(raw);
    if (typeof s.width !== "number" || typeof s.height !== "number") return null;
    if (s.width < 640 || s.height < 480) return null;
    return s;
  } catch {
    return null;
  }
}

function saveWindowState(win) {
  try {
    if (win.isDestroyed()) return;
    const b = win.getBounds();
    fs.writeFileSync(
      statePath(),
      JSON.stringify({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        isMaximized: win.isMaximized(),
      })
    );
  } catch {
    /* ignore */
  }
}

function dispatchAction(browserWindow, action) {
  const win = browserWindow || BrowserWindow.getFocusedWindow();
  if (win && !win.isDestroyed()) win.webContents.send("nebula-action", action);
}

function broadcastToAllWindows(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function sanitizeDownloadFilename(name) {
  return String(name || "download")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .trim()
    .slice(0, 200);
}

/**
 * Ask where to save each download (native Save dialog), then stream progress to the UI.
 */
function attachDownloadHandlers(webSession) {
  webSession.on("will-download", async (_event, item) => {
    const downloadId = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    let baseName = item.getFilename();
    if (!baseName) {
      try {
        const u = new URL(item.getURL());
        baseName = path.basename(u.pathname) || "download";
      } catch {
        baseName = "download";
      }
    }
    baseName = sanitizeDownloadFilename(baseName);

    const parentWin =
      BrowserWindow.getFocusedWindow() ||
      BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());

    const suggestedPath = path.join(app.getPath("downloads"), baseName);

    const { canceled, filePath } = await dialog.showSaveDialog(parentWin ?? undefined, {
      title: "Save download",
      defaultPath: suggestedPath,
      buttonLabel: "Save",
    });

    if (canceled || !filePath) {
      item.cancel();
      return;
    }

    const chosenPath = path.normalize(filePath);

    item.setSavePath(chosenPath);

    broadcastToAllWindows("nebula-download", {
      type: "start",
      id: downloadId,
      filename: path.basename(chosenPath),
      fullPath: chosenPath,
    });

    item.on("updated", () => {
      broadcastToAllWindows("nebula-download", {
        type: "progress",
        id: downloadId,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
      });
    });

    item.on("done", (_e, state) => {
      const finalPath = path.normalize(item.getSavePath() || chosenPath);
      broadcastToAllWindows("nebula-download", {
        type: "done",
        id: downloadId,
        state,
        fullPath: finalPath,
        filename: path.basename(finalPath),
      });
    });
  });
}

function registerAppMenu() {
  const tabItems = [
    {
      label: "New Tab",
      accelerator: "CmdOrCtrl+T",
      click: (_e, bw) => dispatchAction(bw, "new-tab"),
    },
    {
      label: "New Private Tab",
      accelerator: "CmdOrCtrl+Shift+N",
      click: (_e, bw) => dispatchAction(bw, "new-private-tab"),
    },
    {
      label: "Close Tab",
      accelerator: "CmdOrCtrl+W",
      click: (_e, bw) => dispatchAction(bw, "close-tab"),
    },
    { type: "separator" },
    {
      label: "Reopen Closed Tab",
      accelerator: "CmdOrCtrl+Shift+T",
      click: (_e, bw) => dispatchAction(bw, "reopen-tab"),
    },
  ];

  const navigateItems = [
    {
      label: "Back",
      accelerator: isMac ? "Cmd+[" : "Alt+Left",
      click: (_e, bw) => dispatchAction(bw, "back"),
    },
    {
      label: "Forward",
      accelerator: isMac ? "Cmd+]" : "Alt+Right",
      click: (_e, bw) => dispatchAction(bw, "forward"),
    },
    {
      label: "Home",
      accelerator: "Alt+Home",
      click: (_e, bw) => dispatchAction(bw, "home"),
    },
  ];

  const viewItems = [
    {
      label: "Reload Page",
      accelerator: "CmdOrCtrl+R",
      click: (_e, bw) => dispatchAction(bw, "reload"),
    },
    { type: "separator" },
    {
      label: "Picture in picture",
      accelerator: "CmdOrCtrl+Shift+P",
      click: (_e, bw) => dispatchAction(bw, "picture-in-picture"),
    },
    {
      label: "Read selection aloud",
      accelerator: "CmdOrCtrl+Shift+U",
      click: (_e, bw) => dispatchAction(bw, "read-selection-aloud"),
    },
    {
      label: "Check for updates…",
      click: (_e, bw) => dispatchAction(bw, "check-for-updates"),
    },
    { type: "separator" },
    {
      label: "Find in Page…",
      accelerator: "CmdOrCtrl+F",
      click: (_e, bw) => dispatchAction(bw, "find-in-page"),
    },
    {
      label: "History",
      accelerator: isMac ? "Cmd+Shift+H" : "Ctrl+H",
      click: (_e, bw) => dispatchAction(bw, "show-history"),
    },
    {
      label: "Site permissions",
      click: (_e, bw) => dispatchAction(bw, "show-site-permissions"),
    },
    {
      label: "Saved passwords…",
      accelerator: "CmdOrCtrl+Shift+L",
      click: (_e, bw) => dispatchAction(bw, "show-password-manager"),
    },
    {
      label: "Add this site to vault (session login)…",
      click: (_e, bw) => dispatchAction(bw, "add-session-vault-placeholder"),
    },
    { type: "separator" },
    {
      label: "Zoom In",
      accelerator: "CmdOrCtrl+=",
      click: (_e, bw) => dispatchAction(bw, "zoom-in"),
    },
    {
      label: "Zoom Out",
      accelerator: "CmdOrCtrl+-",
      click: (_e, bw) => dispatchAction(bw, "zoom-out"),
    },
    {
      label: "Actual Size",
      accelerator: "CmdOrCtrl+0",
      click: (_e, bw) => dispatchAction(bw, "zoom-reset"),
    },
    { type: "separator" },
    {
      label: "Settings…",
      accelerator: "CmdOrCtrl+,",
      click: (_e, bw) => dispatchAction(bw, "open-settings"),
    },
  ];

  const bookmarkItems = [
    {
      label: "Bookmark This Page",
      accelerator: "CmdOrCtrl+D",
      click: (_e, bw) => dispatchAction(bw, "toggle-bookmark"),
    },
  ];

  const editItems = [
    {
      label: "Focus Address Bar",
      accelerator: "CmdOrCtrl+L",
      click: (_e, bw) => dispatchAction(bw, "focus-omnibox"),
    },
    { type: "separator" },
    { role: "cut" },
    { role: "copy" },
    { role: "paste" },
  ];

  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
        { label: "Tab", submenu: tabItems },
        { label: "Navigate", submenu: navigateItems },
        { label: "View", submenu: viewItems },
        { label: "Bookmarks", submenu: bookmarkItems },
        { label: "Edit", submenu: editItems },
      ]
    : [
        { label: "Tab", submenu: tabItems },
        { label: "Navigate", submenu: navigateItems },
        { label: "View", submenu: viewItems },
        { label: "Bookmarks", submenu: bookmarkItems },
        { label: "Edit", submenu: editItems },
      ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/**
 * Widevine CDM (DRM) is not shipped with stock Electron. Nebula expects
 * castlabs/electron-releases (`…+wvcus`) as the `electron` devDependency; this waits for the CDM
 * before any window loads streaming sites.
 */
async function ensureWidevineComponentsReady() {
  try {
    if (!components || typeof components.whenReady !== "function") {
      console.warn(
        "[Nebula:DRM] Widevine components API missing — use castlabs electron-releases (e.g. #v34.5.8+wvcus) for Netflix/Spotify/Crunchyroll playback."
      );
      return;
    }
    await components.whenReady();
    if (typeof components.status === "function") {
      console.log("[Nebula:DRM] components ready:", components.status());
    }
  } catch (e) {
    console.warn("[Nebula:DRM] components.whenReady failed:", e?.message || e);
  }
}

function createWindow() {
  const saved = loadWindowState();
  const win = new BrowserWindow({
    width: saved?.width ?? 1200,
    height: saved?.height ?? 800,
    x: saved && Number.isFinite(saved.x) ? saved.x : undefined,
    y: saved && Number.isFinite(saved.y) ? saved.y : undefined,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#0c0d10",
    autoHideMenuBar: !isMac,
    ...(isMac
      ? { titleBarStyle: "hiddenInset", trafficLightPosition: { x: 16, y: 14 } }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: true,
    },
  });

  if (saved?.isMaximized) win.maximize();

  win.loadFile(path.join(__dirname, "renderer", "index.html"));

  let saveTimer = null;
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveWindowState(win);
    }, 450);
  };

  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);
  win.on("close", () => saveWindowState(win));
}

function configureWebProfileSession(browsingPart, incognitoPart) {
  sitePermissionsState = loadSitePermissionsState();
  const ua = chromeAlignedUserAgent();
  installSessionPermissionHandlers(session.defaultSession);
  for (const part of [browsingPart, incognitoPart]) {
    const s = session.fromPartition(part);
    s.setUserAgent(ua);
    installSessionPermissionHandlers(s);
  }
}

/** Session preloads run in every guest frame (including iframes) before the webview preload. */
function installGuestLoginSessionPreloadForPartition(part) {
  const guestLoginPath = path.join(__dirname, "renderer", "guest-login-preload.js");
  try {
    const persist = session.fromPartition(part);
    if (typeof persist.getPreloads !== "function" || typeof persist.setPreloads !== "function") {
      console.warn("[Nebula] session preloads unavailable; iframe login capture may be limited.");
      return;
    }
    const cur = persist.getPreloads();
    if (cur.includes(guestLoginPath)) return;
    persist.setPreloads([...cur, guestLoginPath]);
  } catch (e) {
    console.warn("[Nebula] guest-login session preload:", e?.message || e);
  }
}

app.whenReady().then(async () => {
  maybeResetHttpDiskCacheOnce();
  await ensureWidevineComponentsReady();
  registerAppMenu();
  const startupSettings = loadSettings();
  const browsingPart = browsingPersistPartitionForProfileId(startupSettings.activeProfileId);
  const incognitoPart = incognitoMemoryPartitionForProfileId(startupSettings.activeProfileId);
  configureWebProfileSession(browsingPart, incognitoPart);
  attachDownloadHandlers(session.fromPartition(browsingPart));
  attachDownloadHandlers(session.fromPartition(incognitoPart));
  await nebulaAdblock.initAdblockEngine(browsingPart, loadSettings);
  nebulaAdblock.ensureCosmeticPreloadForGuestPartition(incognitoPart);
  nebulaAdblock.applyAdblockFromSettings(startupSettings, incognitoPart);
  installGuestLoginSessionPreloadForPartition(browsingPart);
  installGuestLoginSessionPreloadForPartition(incognitoPart);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  if (appRelaunchPending) return;
  app.quit();
});
