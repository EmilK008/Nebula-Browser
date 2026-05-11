const { contextBridge, ipcRenderer } = require("electron");

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
  registerGuestWindowOpen: (guestWebContentsId) =>
    ipcRenderer.invoke("nebula-register-guest-window-open", guestWebContentsId),
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
  openExternalUrl: (url) => ipcRenderer.invoke("nebula-open-external-url", { url }),
  /** Native dialog: installer vs portable vs cancel; opens the chosen URL in the browser. */
  promptUpdateInstallChoice: (payload) =>
    ipcRenderer.invoke("nebula-prompt-update-install-choice", payload ?? {}),
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
