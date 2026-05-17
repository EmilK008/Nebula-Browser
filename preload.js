const { contextBridge, ipcRenderer } = require("electron");

/** @type {((_event: import("electron").IpcRendererEvent, msg: unknown) => void) | null} */
let aiTabToolRunListener = null;

contextBridge.exposeInMainWorld("nebula", {
  platform: process.platform,
  isMac: process.platform === "darwin",
  /**
   * @param {(action: string) => void} handler
   * @returns {() => void} unsubscribe
   */
  onAction(handler) {
    const channel = "nebula-action";
    const fn = (_event, action) => {
      if (typeof action === "string") handler(action);
    };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  /**
   * @param {(payload: object) => void} handler
   * @returns {() => void} unsubscribe
   */
  onDownload(handler) {
    const channel = "nebula-download";
    const fn = (_event, payload) => {
      if (payload && typeof payload === "object") handler(payload);
    };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  /** Name + version from package.json (update `version` there before releases). */
  getAppInfo: () => ipcRenderer.invoke("nebula-get-app-info"),
  /** Release notes JSON (renderer/changelog.json); loaded in main so file:// shell can read it. */
  getChangelog: () => ipcRenderer.invoke("nebula-get-changelog"),
  openPath: (fullPath) => ipcRenderer.invoke("nebula-shell-open-path", fullPath),
  showItemInFolder: (fullPath) => ipcRenderer.invoke("nebula-shell-show-item", fullPath),
  getSettings: () => ipcRenderer.invoke("nebula-get-settings"),
  /**
   * @param {Record<string, unknown>} patch partial settings (merged with saved)
   */
  setSettings: (patch) => ipcRenderer.invoke("nebula-set-settings", patch),
  /**
   * Send a real mouse click at (x, y) in the **guest** page (viewport CSS pixels).
   * Used for YouTube skip when DOM .click() is ignored.
   * @param {number} webContentsId from webview.getWebContentsId()
   */
  guestClick: (webContentsId, x, y) => ipcRenderer.invoke("nebula-guest-click", { webContentsId, x, y }),
  /**
   * Move OS keyboard focus to the guest page (needed after native alert/confirm and some shell flows).
   * @param {number} webContentsId from webview.getWebContentsId()
   */
  focusGuestWebContents: (webContentsId) =>
    ipcRenderer.invoke("nebula-focus-guest-webcontents", { webContentsId }),
  /**
   * Blocking alert/confirm owned by the main process so focus can be restored to the guest webview after dismiss (Windows + webview).
   * @param {{ kind: "alert"|"confirm", message: string, guestWebContentsId?: number }} payload
   * @returns {boolean|undefined} confirm → boolean; alert → true
   */
  syncDialog: (payload) => {
    try {
      return ipcRenderer.sendSync("nebula-sync-dialog", payload ?? {});
    } catch {
      return payload && payload.kind === "confirm" ? false : undefined;
    }
  },
  /** Guest page context menu (links, copy, Inspect). */
  showWebviewContextMenu: (payload) => ipcRenderer.invoke("nebula-context-menu", payload),
  /**
   * Actions from context menu (e.g. open link in new tab).
   * @param {(payload: { type: string, url?: string }) => void} handler
   * @returns {() => void} unsubscribe
   */
  onContextAction(handler) {
    const channel = "nebula-context-action";
    const fn = (_event, payload) => {
      if (payload && typeof payload === "object") handler(payload);
    };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  readBookmarkImportFile: () => ipcRenderer.invoke("nebula-read-bookmark-import-file"),
  /** @param {"chrome"} browser */
  readBrowserBookmarks: (browser) => ipcRenderer.invoke("nebula-read-browser-bookmarks", { browser }),
  /**
   * @param {{ text: string, defaultPath?: string, format?: "html" | "json" }} payload
   */
  saveBookmarkExportFile: (payload) => ipcRenderer.invoke("nebula-save-bookmark-export-file", payload),
  getSitePermissions: (pageUrl) => ipcRenderer.invoke("nebula-get-site-permissions", { pageUrl }),
  setSitePermissions: (payload) => ipcRenderer.invoke("nebula-set-site-permissions", payload),
  vaultList: () => ipcRenderer.invoke("nebula-vault-list"),
  vaultStatus: () => ipcRenderer.invoke("nebula-vault-status"),
  vaultAdd: (row) => ipcRenderer.invoke("nebula-vault-add", row),
  vaultUpdate: (payload) => ipcRenderer.invoke("nebula-vault-update", payload),
  vaultRemove: (payload) => ipcRenderer.invoke("nebula-vault-remove", payload),
  vaultCopyPassword: (payload) => ipcRenderer.invoke("nebula-vault-copy-password", payload),
  vaultCopyUsername: (payload) => ipcRenderer.invoke("nebula-vault-copy-username", payload),
  /** Optional local master password for viewing/copying vault secrets (stored as hash only). */
  accountStatus: () => ipcRenderer.invoke("nebula-account-status"),
  accountCreate: (payload) => ipcRenderer.invoke("nebula-account-create", payload),
  accountChange: (payload) => ipcRenderer.invoke("nebula-account-change", payload),
  accountRemove: (payload) => ipcRenderer.invoke("nebula-account-remove", payload),
  accountUnlock: (payload) => ipcRenderer.invoke("nebula-account-unlock", payload),
  accountLock: () => ipcRenderer.invoke("nebula-account-lock"),
  /** Permission prompt from main when a site uses Camera / Mic / Location with “Ask”. */
  onPermissionRequest: (handler) => {
    const ch = "nebula-permission-request";
    const fn = (_e, payload) => {
      if (payload && typeof payload === "object") handler(payload);
    };
    ipcRenderer.on(ch, fn);
    return () => ipcRenderer.removeListener(ch, fn);
  },
  respondToPermissionRequest: (payload) => ipcRenderer.send("nebula-permission-response", payload),
  /** Absolute path to webview preload for `welcome.html` (sync IPC). */
  getHomeWebviewPreloadPath: () => {
    try {
      return ipcRenderer.sendSync("nebula-get-home-preload-path-sync") || "";
    } catch {
      return "";
    }
  },
  /** Webview preload that detects login forms on normal HTTPS pages. */
  getGuestLoginPreloadPath: () => {
    try {
      return ipcRenderer.sendSync("nebula-get-guest-login-preload-path-sync") || "";
    } catch {
      return "";
    }
  },
  /** Merge login capture into vault (update same origin + username if present). */
  vaultUpsertLogin: (row) => ipcRenderer.invoke("nebula-vault-upsert-login", row),
  /** Heuristic: HTTPS page has session-like cookies but no vault entry for origin. */
  vaultSessionOfferCheck: (payload) => ipcRenderer.invoke("nebula-vault-session-offer-check", payload),
  /** Placeholder row (empty password + note); skipCookieCheck for menu-driven add. */
  vaultAddSessionPlaceholder: (payload) => ipcRenderer.invoke("nebula-vault-add-session-placeholder", payload),
  /** Save decrypted vault JSON via file dialog. Pass `{ includePasswords: false }` for a redacted outline. */
  vaultExportJsonFile: (payload) => ipcRenderer.invoke("nebula-vault-export-json-file", payload ?? {}),
  /** Merge or replace from JSON file. Pass `{ mode: "replace" }` to replace the whole vault (destructive). */
  vaultImportJsonMerge: (payload) => ipcRenderer.invoke("nebula-vault-import-json-merge", payload ?? {}),
  registerGuestWindowOpen: (payload) => ipcRenderer.invoke("nebula-register-guest-window-open", payload ?? {}),
  /**
   * Picture-in-picture for the active tab guest page (see main process).
   * Pass guestWebContentsId; optional frame + coords when invoking from context menu.
   */
  requestPictureInPicture: (payload) =>
    ipcRenderer.invoke("nebula-request-picture-in-picture", payload ?? {}),
  /**
   * Main forwards navigable window.open URLs here instead of creating a BrowserWindow.
   * @param {(payload: { url: string }) => void} handler
   * @returns {() => void} unsubscribe
   */
  onOpenUrlInTab(handler) {
    const channel = "nebula-open-url-in-tab";
    const fn = (_event, payload) => {
      if (payload && typeof payload === "object" && typeof payload.url === "string") handler(payload);
    };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  /**
   * Main asks the shell to move keyboard focus back to the active tab webview (e.g. OAuth popup closed).
   * @param {() => void} handler
   * @returns {() => void} unsubscribe
   */
  onRefocusActiveWebview(handler) {
    const channel = "nebula-refocus-active-webview";
    const fn = () => {
      try {
        handler();
      } catch {
        /* */
      }
    };
    ipcRenderer.on(channel, fn);
    return () => ipcRenderer.removeListener(channel, fn);
  },
  registerGuestMedia: (guestWebContentsId) =>
    ipcRenderer.invoke("nebula-register-guest-media", { guestWebContentsId }),
  unregisterGuestMedia: (guestWebContentsId) =>
    ipcRenderer.invoke("nebula-unregister-guest-media", { guestWebContentsId }),
  setGuestAudioMuted: (payload) => ipcRenderer.invoke("nebula-set-guest-audio-muted", payload ?? {}),
  stopGuestMediaTracks: (payload) => ipcRenderer.invoke("nebula-stop-guest-media-tracks", payload ?? {}),
  checkForUpdates: () => ipcRenderer.invoke("nebula-check-for-updates"),
  getUpdateInfo: () => ipcRenderer.invoke("nebula-get-update-info"),
  /** Restart the app (used after toggling options that need a new Chromium process, e.g. force dark mode). */
  relaunchApp: () => ipcRenderer.invoke("nebula-relaunch-app"),
  translationStatus: () => ipcRenderer.invoke("nebula-translation-status"),
  translationSaveKey: (payload) => ipcRenderer.invoke("nebula-translation-save-key", payload ?? {}),
  translationTranslateTexts: (payload) => ipcRenderer.invoke("nebula-translation-translate-texts", payload ?? {}),
  aiStatus: () => ipcRenderer.invoke("nebula-ai-status"),
  aiSaveKey: (payload) => ipcRenderer.invoke("nebula-ai-save-key", payload ?? {}),
  /**
   * Tier C: main sends `nebula-ai-tab-tool-run`; handler runs in the shell and must return `{ ok, ... }`.
   * @param {(msg: Record<string, unknown>) => Promise<Record<string, unknown>>} handler
   * @returns {() => void} unsubscribe
   */
  registerAiTabToolHandler(handler) {
    const ch = "nebula-ai-tab-tool-run";
    if (aiTabToolRunListener) {
      try {
        ipcRenderer.removeListener(ch, aiTabToolRunListener);
      } catch {
        /* */
      }
      aiTabToolRunListener = null;
    }
    const fn = async (_e, msg) => {
      const m = msg && typeof msg === "object" ? msg : {};
      const requestId = typeof m.requestId === "string" ? m.requestId : "";
      const reply = (obj) => {
        if (!requestId) return;
        try {
          ipcRenderer.send("nebula-ai-tab-tool-done", { requestId, ...obj });
        } catch {
          /* */
        }
      };
      if (typeof handler !== "function") {
        reply({ ok: false, error: "Tab tool handler is not registered in the shell." });
        return;
      }
      try {
        const result = await handler(m);
        if (result && typeof result === "object") reply(result);
        else reply({ ok: false, error: "Invalid tab tool result." });
      } catch (e) {
        reply({ ok: false, error: String(e && e.message ? e.message : e) });
      }
    };
    aiTabToolRunListener = fn;
    ipcRenderer.on(ch, fn);
    return () => {
      if (aiTabToolRunListener === fn) {
        try {
          ipcRenderer.removeListener(ch, fn);
        } catch {
          /* */
        }
        aiTabToolRunListener = null;
      }
    };
  },
  aiChatStream: (payload, onChunk, onDone, onError) => {
    const streamId = crypto.randomUUID();
    const ch = (_e, d) => {
      if (d && d.streamId === streamId && typeof d.text === "string" && d.text.length) onChunk(d.text);
    };
    const dn = (_e, d) => {
      if (d && d.streamId === streamId) {
        cleanup();
        onDone();
      }
    };
    const er = (_e, d) => {
      if (d && d.streamId === streamId) {
        cleanup();
        onError(d && d.error ? String(d.error) : "Stream error");
      }
    };
    const cleanup = () => {
      ipcRenderer.removeListener("nebula-ai-chat-chunk", ch);
      ipcRenderer.removeListener("nebula-ai-chat-done", dn);
      ipcRenderer.removeListener("nebula-ai-chat-error", er);
    };
    ipcRenderer.on("nebula-ai-chat-chunk", ch);
    ipcRenderer.on("nebula-ai-chat-done", dn);
    ipcRenderer.on("nebula-ai-chat-error", er);
    ipcRenderer
      .invoke("nebula-ai-chat-stream", { ...(payload || {}), streamId })
      .then((res) => {
        if (!res || res.ok === false) {
          cleanup();
          onError(res && res.error ? String(res.error) : "Request failed");
        }
      })
      .catch((e) => {
        cleanup();
        onError(String(e && e.message ? e.message : e));
      });
  },
  openExternalUrl: (url) => ipcRenderer.invoke("nebula-open-external-url", { url }),
  /** Best-effort launch installed VPN app for allowlisted `providerId` (see VPN helper panel). */
  vpnHelperOpenApp: (providerId) => ipcRenderer.invoke("nebula-vpn-helper-open-app", { providerId }),
  /** Native dialog: installer vs portable vs cancel; returns choice + URLs (renderer opens or runs installer). */
  promptUpdateInstallChoice: (payload) =>
    ipcRenderer.invoke("nebula-prompt-update-install-choice", payload ?? {}),
  /** Windows packaged only: download NSIS installer from URL, run detached with /S, spawn relaunch helper, then quit app. */
  startWindowsInstallerUpdate: (payload) =>
    ipcRenderer.invoke("nebula-start-windows-installer-update", payload ?? {}),
  onTabMediaState: (handler) => {
    const ch = "nebula-tab-media";
    const fn = (_e, payload) => {
      if (payload && typeof payload === "object") handler(payload);
    };
    ipcRenderer.on(ch, fn);
    return () => ipcRenderer.removeListener(ch, fn);
  },
  onTabCaptureState: (handler) => {
    const ch = "nebula-tab-capture";
    const fn = (_e, payload) => {
      if (payload && typeof payload === "object") handler(payload);
    };
    ipcRenderer.on(ch, fn);
    return () => ipcRenderer.removeListener(ch, fn);
  },
});
