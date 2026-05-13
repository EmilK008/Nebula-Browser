(() => {
  const HOME_FILE = "welcome.html";
  const BOOKMARKS_KEY = "nebula-bookmarks-v2";
  const HISTORY_KEY = "nebula-history-v1";
  const SESSION_RESTORE_KEY = "nebula-session-restore-v1";
  const PASSWORD_SAVE_DENY_KEY = "nebula-password-save-deny-origins-v1";
  const SESSION_VAULT_DENY_KEY = "nebula-session-vault-deny-origins-v1";
  const HISTORY_MAX = 3000;
  const CLOSED_MAX = 25;
  /** Must match main.js WEB_PARTITION — persistent cookies & login across tabs and restarts. */
  const WEB_PARTITION = "persist:nebula";

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const ZOOM_STEP = 1.12;

  const tabsStrip = document.getElementById("tabs-strip");
  const tabCtxMenu = document.getElementById("tab-ctx-menu");
  const tabGroupRenamePanel = document.getElementById("tab-group-rename-panel");
  const tabGroupRenameBackdrop = document.getElementById("tab-group-rename-backdrop");
  const tabGroupRenameInput = document.getElementById("tab-group-rename-input");
  const tabGroupRenameColor = document.getElementById("tab-group-rename-color");
  const tabGroupRenameSwatches = document.getElementById("tab-group-rename-swatches");
  const tabGroupRenameSave = document.getElementById("tab-group-rename-save");
  const tabGroupRenameCancel = document.getElementById("tab-group-rename-cancel");
  const stack = document.getElementById("webview-stack");
  const contentMain = stack ? stack.parentElement : null;
  const urlInput = document.getElementById("url-input");
  const form = document.querySelector(".omnibox-wrap");
  const btnBack = document.getElementById("btn-back");
  const btnForward = document.getElementById("btn-forward");
  const btnReload = document.getElementById("btn-reload");
  const btnHome = document.getElementById("btn-home");
  const btnNewTab = document.getElementById("btn-new-tab");
  const btnNewTabStrip = document.getElementById("btn-new-tab-strip");
  const btnZoomReset = document.getElementById("btn-zoom-reset");
  const btnBookmark = document.getElementById("btn-bookmark");
  const bookmarksBar = document.getElementById("bookmarks-bar");
  const findBar = document.getElementById("find-bar");
  const findInput = document.getElementById("find-input");
  const findStatus = document.getElementById("find-status");
  const findPrevBtn = document.getElementById("find-prev");
  const findNextBtn = document.getElementById("find-next");
  const findCloseBtn = document.getElementById("find-close");
  const downloadsDock = document.getElementById("downloads-dock");
  const omniboxEl = document.querySelector(".omnibox");
  const omniboxSuggestions = document.getElementById("omnibox-suggestions");
  const historyPanel = document.getElementById("history-panel");
  const historyPanelBackdrop = document.getElementById("history-panel-backdrop");
  const historyPanelClose = document.getElementById("history-panel-close");
  const historyClearBtn = document.getElementById("history-clear");
  const historyListEl = document.getElementById("history-list");
  const sessionRestorePanel = document.getElementById("session-restore-panel");
  const sessionRestoreBackdrop = document.getElementById("session-restore-backdrop");
  const sessionRestoreYes = document.getElementById("session-restore-yes");
  const sessionRestoreNo = document.getElementById("session-restore-no");
  const sessionRestoreDesc = document.getElementById("session-restore-desc");
  const sitePermPanel = document.getElementById("site-perm-panel");
  const sitePermBackdrop = document.getElementById("site-perm-backdrop");
  const sitePermClose = document.getElementById("site-perm-close");
  const btnSitePerm = document.getElementById("btn-site-perm");
  const settingsPanel = document.getElementById("settings-panel");
  const settingsPanelBackdrop = document.getElementById("settings-panel-backdrop");
  const settingsPanelClose = document.getElementById("settings-panel-close");
  const settingsSaveBtn = document.getElementById("settings-save");
  const btnSettings = document.getElementById("btn-settings");
  const settingsBookmarksImportSource = document.getElementById("settings-bookmarks-import-source");
  const settingsBookmarksImportMerge = document.getElementById("settings-bookmarks-import-merge");
  const settingsBookmarksImportReplace = document.getElementById("settings-bookmarks-import-replace");
  const settingsBookmarksExportHtml = document.getElementById("settings-bookmarks-export-html");
  const settingsBookmarksExportJson = document.getElementById("settings-bookmarks-export-json");
  const settingsOpenChangelog = document.getElementById("settings-open-changelog");
  const settingsCheckUpdates = document.getElementById("settings-check-updates");
  const settingsUpdateHint = document.getElementById("settings-update-hint");
  const settingsOpenEvsDocs = document.getElementById("settings-open-evs-docs");
  const updateBanner = document.getElementById("update-banner");
  const updateBannerText = document.getElementById("update-banner-text");
  const updateBannerDownload = document.getElementById("update-banner-download");
  const updateBannerDismiss = document.getElementById("update-banner-dismiss");
  const changelogPanel = document.getElementById("changelog-panel");
  const changelogPanelBackdrop = document.getElementById("changelog-panel-backdrop");
  const changelogPanelClose = document.getElementById("changelog-panel-close");
  const changelogPanelBody = document.getElementById("changelog-panel-body");
  const permissionPromptPanel = document.getElementById("permission-prompt-panel");
  const permissionPromptBackdrop = document.getElementById("permission-prompt-backdrop");
  const permissionPromptMessage = document.getElementById("permission-prompt-message");
  const permissionPromptRemember = document.getElementById("permission-prompt-remember");
  const permissionPromptAllow = document.getElementById("permission-prompt-allow");
  const permissionPromptBlock = document.getElementById("permission-prompt-block");
  const passwordSaveOfferPanel = document.getElementById("password-save-offer-panel");
  const passwordSaveOfferBackdrop = document.getElementById("password-save-offer-backdrop");
  const passwordSaveOfferMessage = document.getElementById("password-save-offer-message");
  const passwordSaveOfferSave = document.getElementById("password-save-offer-save");
  const passwordSaveOfferDismiss = document.getElementById("password-save-offer-dismiss");
  const passwordSaveOfferNever = document.getElementById("password-save-offer-never");
  const passwordSaveOfferTitle = document.getElementById("password-save-offer-title");
  const vaultPanel = document.getElementById("vault-panel");
  const vaultPanelBackdrop = document.getElementById("vault-panel-backdrop");
  const vaultPanelClose = document.getElementById("vault-panel-close");
  const vaultListEl = document.getElementById("vault-list");
  const vaultSearchInput = document.getElementById("vault-search");
  const vaultAddToggle = document.getElementById("vault-add-toggle");
  const vaultFormWrap = document.getElementById("vault-form-wrap");
  const vaultEditId = document.getElementById("vault-edit-id");
  const vaultFieldUrl = document.getElementById("vault-field-url");
  const vaultFieldTitle = document.getElementById("vault-field-title");
  const vaultFieldUser = document.getElementById("vault-field-user");
  const vaultFieldPass = document.getElementById("vault-field-pass");
  const vaultFieldNotes = document.getElementById("vault-field-notes");
  const vaultFormSave = document.getElementById("vault-form-save");
  const vaultFormCancel = document.getElementById("vault-form-cancel");
  const vaultHintEncryption = document.getElementById("vault-hint-encryption");
  const settingsOpenVault = document.getElementById("settings-open-vault");
  const vaultFilter = document.getElementById("vault-filter");
  const vaultExportBtn = document.getElementById("vault-export-btn");
  const vaultExportIncludePasswords = document.getElementById("vault-export-include-passwords");
  const vaultImportBtn = document.getElementById("vault-import-btn");
  const vaultImportMode = document.getElementById("vault-import-mode");
  const vaultUnlockOverlay = document.getElementById("vault-unlock-overlay");
  const vaultUnlockPass = document.getElementById("vault-unlock-pass");
  const vaultUnlockError = document.getElementById("vault-unlock-error");
  const vaultUnlockSubmit = document.getElementById("vault-unlock-submit");
  const vaultLockBtn = document.getElementById("vault-lock-btn");
  const nebulaAccountCreateBlock = document.getElementById("nebula-account-create-block");
  const nebulaAccountManageBlock = document.getElementById("nebula-account-manage-block");
  const nebulaAccountNewPass = document.getElementById("nebula-account-new-pass");
  const nebulaAccountConfirmPass = document.getElementById("nebula-account-confirm-pass");
  const nebulaAccountCreateBtn = document.getElementById("nebula-account-create-btn");
  const nebulaAccountCurrentPass = document.getElementById("nebula-account-current-pass");
  const nebulaAccountChangeNewPass = document.getElementById("nebula-account-change-new-pass");
  const nebulaAccountChangeBtn = document.getElementById("nebula-account-change-btn");
  const nebulaAccountRemoveBtn = document.getElementById("nebula-account-remove-btn");
  const nebulaAccountLockNowBtn = document.getElementById("nebula-account-lock-now-btn");
  const nebulaAccountSettingsMsg = document.getElementById("nebula-account-settings-msg");

  /** @type {Map<string, HTMLElement>} */
  const downloadElById = new Map();

  /** @type {{ id: string, el: Electron.WebviewTag | null, tabEl: HTMLElement, titleEl: HTMLElement, faviconEl: HTMLImageElement, groupId: string | null, guestWcId: number | null, muteBtn: HTMLButtonElement, camBtn: HTMLButtonElement, micBtn: HTMLButtonElement, mediaStrip: HTMLElement, mediaState: { audible: boolean, audioMuted: boolean, camera: boolean, microphone: boolean } }[]} */
  let tabs = [];
  let activeId = null;
  let idSeq = 0;
  /** @type {{ id: string, label: string, color: string, collapsed: boolean }[]} */
  let tabGroups = [];
  let tabGroupSeq = 0;
  /** @type {HTMLElement | null} */
  let tabReorderIndicator = null;
  let tabStripReorderActive = false;
  /** @type {string | null} */
  let tabCtxTargetId = null;
  /** @type {string | null} */
  let tabGroupRenameGid = null;
  /** @type {{ url: string, title: string }[]} */
  let bookmarks = [];
  /** @type {{ url: string, title: string }[]} */
  const closedTabs = [];

  const TAB_DRAG_MIME = "application/x-nebula-tab";
  /** @type {{ leftId: string, rightId: string } | null} */
  let splitPair = null;
  const btnExitSplit = document.getElementById("btn-exit-split");
  const splitDropZones = document.getElementById("split-drop-zones");
  const splitResizer = document.getElementById("split-resizer");
  /** After HTML5 drag on a tab, suppress the synthetic click that follows */
  let suppressTabClickUntil = 0;

  const SPLIT_RATIO_MIN = 15;
  const SPLIT_RATIO_MAX = 85;
  let splitRatioPct = 50;

  let omniboxSuggestTimer = null;
  /** Non-recursive updates when loading site permission form from main */
  let refreshingSitePerm = false;
  /** Until true, tab URLs are not persisted for crash/session restore (startup modal). */
  let sessionPersistenceReady = false;
  let sessionSaveTimer = null;
  /** @type {{ navigateUrl: string, label: string, sub?: string, badge?: string }[]} */
  let omniboxSuggestionRows = [];
  let omniboxSelectedIndex = -1;
  const DEFAULT_APP_SETTINGS = {
    adblockEnabled: true,
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

  /** @type {typeof DEFAULT_APP_SETTINGS} */
  let appSettings = { ...DEFAULT_APP_SETTINGS, searchSuggestions: { ...DEFAULT_APP_SETTINGS.searchSuggestions } };

  function getSearchSettings() {
    return appSettings.searchSuggestions;
  }

  function normalizeAppSettings(raw) {
    const o = raw && typeof raw === "object" ? raw : {};
    const merged = {
      adblockEnabled: o.adblockEnabled !== false,
      searchSuggestions: {
        ...DEFAULT_APP_SETTINGS.searchSuggestions,
        ...(o.searchSuggestions && typeof o.searchSuggestions === "object" ? o.searchSuggestions : {}),
      },
    };
    const ss = merged.searchSuggestions;
    const layers = ["past", "local", "remote"];
    if (
      !Array.isArray(ss.layerOrder) ||
      ss.layerOrder.length !== 3 ||
      !ss.layerOrder.every((x) => layers.includes(x)) ||
      new Set(ss.layerOrder).size !== 3
    ) {
      ss.layerOrder = [...DEFAULT_APP_SETTINGS.searchSuggestions.layerOrder];
    }
    ss.maxTotal = Math.min(25, Math.max(3, Number(ss.maxTotal) || DEFAULT_APP_SETTINGS.searchSuggestions.maxTotal));
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
    return merged;
  }

  async function loadAppSettings() {
    if (window.nebula?.getSettings) {
      try {
        const s = await window.nebula.getSettings();
        appSettings = normalizeAppSettings(s);
        return;
      } catch {
        /* */
      }
    }
    appSettings = normalizeAppSettings(DEFAULT_APP_SETTINGS);
  }

  function homeUrl() {
    return new URL(HOME_FILE, window.location.href).href;
  }

  function isWelcomePageUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    if (urlStr.includes(HOME_FILE)) return true;
    try {
      const p = new URL(urlStr).pathname;
      return p.endsWith("/" + HOME_FILE) || p.endsWith(HOME_FILE);
    } catch {
      return false;
    }
  }

  function getHomePreloadPathForWebview() {
    try {
      if (typeof window.nebula?.getHomeWebviewPreloadPath !== "function") return "";
      return window.nebula.getHomeWebviewPreloadPath() || "";
    } catch {
      return "";
    }
  }

  function loadSavedSession() {
    try {
      const raw = localStorage.getItem(SESSION_RESTORE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object" || !Array.isArray(p.tabs)) return null;
      if (p.version === 2 && typeof p.version === "number") return p;
      if (p.version === 1 && typeof p.version === "number") return p;
      return null;
    } catch {
      return null;
    }
  }

  function clearSavedSession() {
    try {
      localStorage.removeItem(SESSION_RESTORE_KEY);
    } catch {
      /* */
    }
  }

  const TAB_GROUP_PALETTE = [
    "#f28b82",
    "#fdd663",
    "#7bc89c",
    "#79b8ff",
    "#c58af9",
    "#ffad47",
    "#72d6c8",
    "#afb9cf",
  ];

  function nextTabGroupColor(index) {
    return TAB_GROUP_PALETTE[Math.abs(index) % TAB_GROUP_PALETTE.length];
  }

  function hexColorForColorInput(raw) {
    const s = typeof raw === "string" ? raw.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return "#79b8ff";
  }

  function pruneUnusedTabGroups() {
    tabGroups = tabGroups.filter((g) => tabs.some((t) => t.groupId === g.id));
  }

  function dedupeSplitTabGroupRuns() {
    const seen = new Set();
    let i = 0;
    while (i < tabs.length) {
      const g = tabs[i].groupId;
      if (!g) {
        i++;
        continue;
      }
      let j = i;
      while (j < tabs.length && tabs[j].groupId === g) j++;
      if (seen.has(g)) {
        const newId = "tg" + ++tabGroupSeq;
        const oldMeta = tabGroups.find((x) => x.id === g) || {
          label: "Group",
          color: nextTabGroupColor(tabGroups.length),
        };
        tabGroups.push({
          id: newId,
          label: oldMeta.label,
          color: oldMeta.color,
          collapsed: false,
        });
        for (let k = i; k < j; k++) tabs[k].groupId = newId;
      } else {
        seen.add(g);
      }
      i = j;
    }
    pruneUnusedTabGroups();
  }

  function ensureTabReorderIndicator() {
    if (!tabsStrip) return null;
    if (tabReorderIndicator && tabsStrip.contains(tabReorderIndicator)) return tabReorderIndicator;
    const el = document.createElement("div");
    el.className = "tab-reorder-indicator";
    el.setAttribute("aria-hidden", "true");
    tabsStrip.appendChild(el);
    tabReorderIndicator = el;
    return el;
  }

  /** @type {HTMLElement | null} */
  let tabDragHighlightGroupEl = null;

  function clearTabGroupDragHighlight() {
    if (tabDragHighlightGroupEl) {
      tabDragHighlightGroupEl.classList.remove("nebula-tab-group--drag-target");
      tabDragHighlightGroupEl = null;
    }
  }

  function hideTabReorderIndicator() {
    tabStripReorderActive = false;
    clearTabGroupDragHighlight();
    if (tabReorderIndicator) tabReorderIndicator.classList.remove("is-visible");
  }

  function positionTabReorderIndicator(insertBefore) {
    const ind = ensureTabReorderIndicator();
    if (!ind || !tabsStrip) return;
    const stripRect = tabsStrip.getBoundingClientRect();
    let x = stripRect.left + 6;
    if (insertBefore >= 0 && insertBefore < tabs.length) {
      const r = tabs[insertBefore].tabEl.getBoundingClientRect();
      x = r.left - stripRect.left + tabsStrip.scrollLeft;
    } else if (tabs.length > 0) {
      const r = tabs[tabs.length - 1].tabEl.getBoundingClientRect();
      x = r.right - stripRect.left + tabsStrip.scrollLeft;
    } else if (btnNewTabStrip) {
      const r = btnNewTabStrip.getBoundingClientRect();
      x = r.left - stripRect.left + tabsStrip.scrollLeft;
    }
    ind.style.left = `${Math.max(0, x)}px`;
    ind.classList.add("is-visible");
  }

  function syncTabStripDom() {
    if (!tabsStrip || !btnNewTabStrip) return;
    pruneUnusedTabGroups();
    const keep = new Set([btnNewTabStrip]);
    if (tabReorderIndicator && tabsStrip.contains(tabReorderIndicator)) keep.add(tabReorderIndicator);
    for (const n of Array.from(tabsStrip.children)) {
      if (!keep.has(n)) n.remove();
    }
    dedupeSplitTabGroupRuns();
    let i = 0;
    while (i < tabs.length) {
      const gid = tabs[i].groupId;
      if (!gid || !tabGroups.find((g) => g.id === gid)) {
        if (gid) tabs[i].groupId = null;
        tabsStrip.insertBefore(tabs[i].tabEl, btnNewTabStrip);
        i++;
        continue;
      }
      let j = i;
      while (j < tabs.length && tabs[j].groupId === gid) j++;
      const meta = tabGroups.find((g) => g.id === gid) || {
        id: gid,
        label: "Group",
        color: nextTabGroupColor(0),
        collapsed: false,
      };
      const wrap = document.createElement("div");
      wrap.className = "nebula-tab-group";
      wrap.dataset.groupId = gid;
      wrap.style.setProperty("--tg-color", meta.color || nextTabGroupColor(0));
      const head = document.createElement("button");
      head.type = "button";
      head.className = "tab-group-head";
      head.textContent = meta.label || "Group";
      head.title = "Click to collapse or expand · right-click for menu · drag a tab here to add to this group";
      head.addEventListener("click", (e) => {
        e.preventDefault();
        toggleTabGroupCollapsed(gid);
      });
      head.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideTabContextMenu();
        openGroupContextMenu(e.clientX, e.clientY, gid);
      });
      const row = document.createElement("div");
      row.className = "tab-group-row";
      for (let k = i; k < j; k++) row.appendChild(tabs[k].tabEl);
      if (meta.collapsed) {
        row.hidden = true;
        head.setAttribute("aria-expanded", "false");
      } else {
        head.setAttribute("aria-expanded", "true");
      }
      wrap.appendChild(head);
      wrap.appendChild(row);
      tabsStrip.insertBefore(wrap, btnNewTabStrip);
      i = j;
    }
    if (tabReorderIndicator && !tabsStrip.contains(tabReorderIndicator)) {
      tabsStrip.appendChild(tabReorderIndicator);
    }
  }

  function reorderTabToIndex(draggedId, insertBefore) {
    const from = tabs.findIndex((t) => t.id === draggedId);
    if (from < 0) return;
    const ins = Math.max(0, Math.min(Number(insertBefore) || 0, tabs.length));
    if (ins === from || ins === from + 1) {
      syncTabStripDom();
      return;
    }
    const [row] = tabs.splice(from, 1);
    let to = ins;
    if (from < to) to--;
    tabs.splice(to, 0, row);
    dedupeSplitTabGroupRuns();
    pruneUnusedTabGroups();
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function moveTabToEndOfGroup(tabId, gid) {
    const from = tabs.findIndex((t) => t.id === tabId);
    if (from < 0) return;
    const [row] = tabs.splice(from, 1);
    let insertAt = tabs.length;
    for (let i = tabs.length - 1; i >= 0; i--) {
      if (tabs[i].groupId === gid) {
        insertAt = i + 1;
        break;
      }
    }
    tabs.splice(insertAt, 0, row);
  }

  function stripInsertIndexFromClientX(clientX) {
    if (tabs.length === 0) return 0;
    for (let i = 0; i < tabs.length; i++) {
      const r = tabs[i].tabEl.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      if (clientX < mid) return i;
    }
    if (btnNewTabStrip) {
      const br = btnNewTabStrip.getBoundingClientRect();
      if (clientX < br.left + br.width / 2) return tabs.length;
    }
    return tabs.length;
  }

  function toggleTabGroupCollapsed(gid) {
    const g = tabGroups.find((x) => x.id === gid);
    if (!g) return;
    g.collapsed = !g.collapsed;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function openTabGroupRenameDialog(gid) {
    hideTabContextMenu();
    const g = tabGroups.find((x) => x.id === gid);
    if (!g || !tabGroupRenamePanel || !tabGroupRenameInput) return;
    tabGroupRenameGid = gid;
    tabGroupRenameInput.value = g.label;
    if (tabGroupRenameColor) {
      tabGroupRenameColor.value = hexColorForColorInput(g.color);
    }
    tabGroupRenamePanel.hidden = false;
    tabGroupRenamePanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => {
      try {
        tabGroupRenameInput.focus();
        tabGroupRenameInput.select();
      } catch {
        /* */
      }
    });
  }

  function closeTabGroupRenameDialog() {
    tabGroupRenameGid = null;
    if (tabGroupRenamePanel) {
      tabGroupRenamePanel.hidden = true;
      tabGroupRenamePanel.setAttribute("aria-hidden", "true");
    }
  }

  function confirmTabGroupRename() {
    if (!tabGroupRenameGid || !tabGroupRenameInput) {
      closeTabGroupRenameDialog();
      return;
    }
    const g = tabGroups.find((x) => x.id === tabGroupRenameGid);
    const raw = String(tabGroupRenameInput.value || "").trim();
    const colorVal =
      tabGroupRenameColor && typeof tabGroupRenameColor.value === "string"
        ? hexColorForColorInput(tabGroupRenameColor.value)
        : "#79b8ff";
    closeTabGroupRenameDialog();
    if (!g || !raw) return;
    g.label = raw;
    g.color = colorVal;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function wireTabGroupRenamePanel() {
    if (!tabGroupRenamePanel || !tabGroupRenameInput) return;
    if (tabGroupRenameSwatches && tabGroupRenameColor) {
      tabGroupRenameSwatches.replaceChildren();
      for (const hex of TAB_GROUP_PALETTE) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tab-group-rename-swatch";
        b.title = hex;
        b.style.backgroundColor = hex;
        b.addEventListener("click", () => {
          tabGroupRenameColor.value = hex;
        });
        tabGroupRenameSwatches.appendChild(b);
      }
    }
    tabGroupRenameCancel?.addEventListener("click", () => closeTabGroupRenameDialog());
    tabGroupRenameBackdrop?.addEventListener("click", () => closeTabGroupRenameDialog());
    tabGroupRenameSave?.addEventListener("click", () => confirmTabGroupRename());
    tabGroupRenameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmTabGroupRename();
      }
    });
  }

  function newTabGroupFromTab(tabId) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t) return;
    const gid = "tg" + ++tabGroupSeq;
    tabGroups.push({
      id: gid,
      label: "Tab group",
      color: nextTabGroupColor(tabGroups.length - 1),
      collapsed: false,
    });
    t.groupId = gid;
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function removeTabFromGroup(tabId) {
    const t = tabs.find((x) => x.id === tabId);
    if (!t || !t.groupId) return;
    t.groupId = null;
    pruneUnusedTabGroups();
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function closeAllTabsInGroup(gid) {
    const ids = tabs.filter((t) => t.groupId === gid).map((t) => t.id);
    for (const id of ids) removeTab(id);
  }

  function ungroupAllTabsInGroup(gid) {
    for (const t of tabs) {
      if (t.groupId === gid) t.groupId = null;
    }
    tabGroups = tabGroups.filter((g) => g.id !== gid);
    syncTabStripDom();
    scheduleSaveSessionSnapshot();
  }

  function openGroupContextMenu(clientX, clientY, gid) {
    if (!tabCtxMenu) return;
    tabCtxTargetId = null;
    tabCtxMenu.innerHTML = "";
    const mk = (label, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !!disabled;
      b.addEventListener("click", () => {
        hideTabContextMenu();
        fn();
      });
      tabCtxMenu.appendChild(b);
    };
    const has = tabs.some((t) => t.groupId === gid);
    mk("Edit group…", () => openTabGroupRenameDialog(gid), !has);
    mk("Ungroup tabs", () => ungroupAllTabsInGroup(gid), !has);
    mk("Close tabs in this group", () => closeAllTabsInGroup(gid), !has);
    tabCtxMenu.hidden = false;
    const pad = 8;
    let x = clientX;
    let y = clientY;
    tabCtxMenu.style.left = "0px";
    tabCtxMenu.style.top = "0px";
    const mw = tabCtxMenu.offsetWidth || 200;
    const mh = tabCtxMenu.offsetHeight || 120;
    if (x + mw + pad > window.innerWidth) x = window.innerWidth - mw - pad;
    if (y + mh + pad > window.innerHeight) y = window.innerHeight - mh - pad;
    tabCtxMenu.style.left = `${Math.max(pad, x)}px`;
    tabCtxMenu.style.top = `${Math.max(pad, y)}px`;
  }

  function hideTabContextMenu() {
    tabCtxTargetId = null;
    if (tabCtxMenu) {
      tabCtxMenu.hidden = true;
      tabCtxMenu.innerHTML = "";
    }
  }

  function openTabContextMenu(clientX, clientY, tabId) {
    if (!tabCtxMenu) return;
    tabCtxTargetId = tabId;
    const t = tabs.find((x) => x.id === tabId);
    tabCtxMenu.innerHTML = "";
    const mk = (label, fn, disabled) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.disabled = !!disabled;
      b.addEventListener("click", () => {
        hideTabContextMenu();
        fn();
      });
      tabCtxMenu.appendChild(b);
    };
    mk("New tab group", () => newTabGroupFromTab(tabId), false);
    mk("Remove from group", () => removeTabFromGroup(tabId), !t?.groupId);
    mk("Edit this group…", () => t?.groupId && openTabGroupRenameDialog(t.groupId), !t?.groupId);
    mk("Close tabs in this group", () => t?.groupId && closeAllTabsInGroup(t.groupId), !t?.groupId);
    tabCtxMenu.hidden = false;
    const pad = 8;
    let x = clientX;
    let y = clientY;
    tabCtxMenu.style.left = "0px";
    tabCtxMenu.style.top = "0px";
    const mw = tabCtxMenu.offsetWidth || 200;
    const mh = tabCtxMenu.offsetHeight || 120;
    if (x + mw + pad > window.innerWidth) x = window.innerWidth - mw - pad;
    if (y + mh + pad > window.innerHeight) y = window.innerHeight - mh - pad;
    tabCtxMenu.style.left = `${Math.max(pad, x)}px`;
    tabCtxMenu.style.top = `${Math.max(pad, y)}px`;
  }

  function wireTabStripReorderAndContext() {
    document.addEventListener(
      "mousedown",
      (e) => {
        if (!tabCtxMenu || tabCtxMenu.hidden) return;
        if (e.button !== 0) return;
        if (e.target.closest("#tab-ctx-menu")) return;
        hideTabContextMenu();
      },
      true
    );
    if (!tabsStrip) return;
    tabsStrip.addEventListener("dragover", (e) => {
      if (!Array.from(e.dataTransfer.types || []).includes(TAB_DRAG_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      tabStripReorderActive = true;
      const insertBefore = stripInsertIndexFromClientX(e.clientX);
      positionTabReorderIndicator(insertBefore);
      clearTabGroupDragHighlight();
      const gw = e.target.closest(".nebula-tab-group");
      if (gw) {
        gw.classList.add("nebula-tab-group--drag-target");
        tabDragHighlightGroupEl = gw;
      }
    });
    tabsStrip.addEventListener("dragleave", (e) => {
      if (!tabStripReorderActive) return;
      const rel = e.relatedTarget;
      if (rel && tabsStrip.contains(rel)) return;
      hideTabReorderIndicator();
    });
    tabsStrip.addEventListener("drop", (e) => {
      const draggedId = e.dataTransfer.getData(TAB_DRAG_MIME);
      if (!draggedId) return;
      if (e.target.closest(".tab-close, .tab-media-btn")) return;
      e.preventDefault();
      hideTabReorderIndicator();
      if (btnNewTabStrip && (e.target === btnNewTabStrip || btnNewTabStrip.contains(e.target))) {
        reorderTabToIndex(draggedId, tabs.length);
        return;
      }
      const groupWrap = e.target.closest(".nebula-tab-group");
      const hitTab = e.target.closest(".tab");
      if (groupWrap) {
        const gid = groupWrap.dataset.groupId;
        if (gid && tabGroups.some((g) => g.id === gid)) {
          const tDrag = tabs.find((x) => x.id === draggedId);
          if (tDrag) tDrag.groupId = gid;
          if (hitTab) {
            reorderTabToIndex(draggedId, stripInsertIndexFromClientX(e.clientX));
          } else {
            moveTabToEndOfGroup(draggedId, gid);
            dedupeSplitTabGroupRuns();
            pruneUnusedTabGroups();
            syncTabStripDom();
            scheduleSaveSessionSnapshot();
          }
          return;
        }
      }
      const tDrag = tabs.find((x) => x.id === draggedId);
      if (tDrag) tDrag.groupId = null;
      reorderTabToIndex(draggedId, stripInsertIndexFromClientX(e.clientX));
    });
  }

  function shouldOfferSessionRestore(session) {
    if (!session || !Array.isArray(session.tabs) || session.tabs.length === 0) return false;
    const home = homeUrl();
    try {
      if (
        session.tabs.length === 1 &&
        session.tabs[0] &&
        typeof session.tabs[0].url === "string" &&
        (session.tabs[0].url === home || session.tabs[0].url.includes(HOME_FILE))
      ) {
        return false;
      }
    } catch {
      /* */
    }
    return true;
  }

  function saveSessionSnapshot() {
    if (!sessionPersistenceReady) return;
    try {
      const tabPayload = tabs.map((t) => {
        let u = "";
        try {
          u = t.el.getURL() || "";
        } catch {
          u = "";
        }
        return { url: u, groupId: t.groupId || null };
      });
      let ai = tabs.findIndex((x) => x.id === activeId);
      if (ai < 0) ai = 0;
      const groups = tabGroups.filter((g) => tabs.some((t) => t.groupId === g.id));
      const data = {
        version: 2,
        tabs: tabPayload,
        activeIndex: ai,
        groups,
      };
      localStorage.setItem(SESSION_RESTORE_KEY, JSON.stringify(data));
    } catch {
      /* */
    }
  }

  function scheduleSaveSessionSnapshot() {
    if (!sessionPersistenceReady) return;
    if (sessionSaveTimer) clearTimeout(sessionSaveTimer);
    sessionSaveTimer = setTimeout(() => {
      sessionSaveTimer = null;
      saveSessionSnapshot();
    }, 400);
  }

  function closeSessionRestorePanel() {
    if (!sessionRestorePanel || sessionRestorePanel.hidden) return;
    sessionRestorePanel.hidden = true;
    sessionRestorePanel.setAttribute("aria-hidden", "true");
  }

  function openSessionRestorePanel(saved) {
    if (!sessionRestorePanel) return;
    if (sessionRestoreDesc && saved?.tabs?.length) {
      const n = saved.tabs.length;
      sessionRestoreDesc.textContent =
        n === 1
          ? "You had 1 tab open last time. Restore it or start with a new tab."
          : `You had ${n} tabs open last time. Restore them or start fresh.`;
    }
    sessionRestorePanel.hidden = false;
    sessionRestorePanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => sessionRestoreYes?.focus());
  }

  function finishStartupWithFreshHome() {
    sessionPersistenceReady = true;
    clearSavedSession();
    createTab(homeUrl());
  }

  function finishStartupWithRestoredTabs(saved) {
    sessionPersistenceReady = true;
    if (!saved?.tabs?.length) {
      finishStartupWithFreshHome();
      return;
    }
    tabGroups = [];
    if (saved.version >= 2 && Array.isArray(saved.groups)) {
      for (const g of saved.groups) {
        if (!g || typeof g !== "object") continue;
        if (typeof g.id !== "string" || typeof g.label !== "string") continue;
        tabGroups.push({
          id: g.id,
          label: g.label,
          color: typeof g.color === "string" ? g.color : nextTabGroupColor(tabGroups.length),
          collapsed: !!g.collapsed,
        });
        const m = /^tg(\d+)$/.exec(g.id);
        if (m) tabGroupSeq = Math.max(tabGroupSeq, parseInt(m[1], 10) || 0);
      }
    }
    /** @type {{ id: string }[]} */
    const created = [];
    for (let i = 0; i < saved.tabs.length; i++) {
      const row = saved.tabs[i];
      const u = row && typeof row.url === "string" ? row.url.trim() : "";
      if (!u) continue;
      let gid = null;
      if (saved.version >= 2 && row && typeof row.groupId === "string" && tabGroups.some((x) => x.id === row.groupId)) {
        gid = row.groupId;
      }
      created.push(createTab(u, { groupId: gid }));
    }
    if (created.length === 0) {
      finishStartupWithFreshHome();
      return;
    }
    dedupeSplitTabGroupRuns();
    pruneUnusedTabGroups();
    syncTabStripDom();
    const ai = Math.min(Math.max(0, Number(saved.activeIndex) || 0), created.length - 1);
    const pick = created[ai]?.id || created[0]?.id;
    if (pick) selectTab(pick);
    scheduleSaveSessionSnapshot();
  }

  function tryOfferSessionRestoreOnLaunch() {
    const saved = loadSavedSession();
    if (shouldOfferSessionRestore(saved)) {
      openSessionRestorePanel(saved);
      sessionRestoreYes?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithRestoredTabs(saved);
        },
        { once: true }
      );
      sessionRestoreNo?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithFreshHome();
        },
        { once: true }
      );
      sessionRestoreBackdrop?.addEventListener(
        "click",
        () => {
          closeSessionRestorePanel();
          finishStartupWithFreshHome();
        },
        { once: true }
      );
      return;
    }
    sessionPersistenceReady = true;
    createTab(homeUrl());
  }

  async function refreshAboutSection() {
    const nameEl = document.getElementById("settings-about-name");
    const verEl = document.getElementById("settings-about-version");
    if (!verEl && !nameEl) return;
    try {
      const info = await window.nebula?.getAppInfo?.();
      if (nameEl && info && typeof info.name === "string") nameEl.textContent = info.name;
      if (verEl && info && typeof info.version === "string") verEl.textContent = info.version;
    } catch {
      if (verEl) verEl.textContent = "—";
    }
  }

  async function fetchChangelogDoc() {
    try {
      if (typeof window.nebula?.getChangelog === "function") {
        const doc = await window.nebula.getChangelog();
        if (doc && typeof doc === "object") return doc;
      }
    } catch {
      /* fall through */
    }
    try {
      const url = new URL("changelog.json", window.location.href).href;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("changelog fetch failed");
      return await r.json();
    } catch {
      return { entries: [] };
    }
  }

  /** @param {unknown} arr */
  function normalizeChangelogLines(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  }

  /**
   * @param {HTMLElement} parent
   * @param {string} label
   * @param {string[]} lines
   */
  function appendChangelogCategory(parent, label, lines) {
    if (lines.length === 0) return;
    const block = document.createElement("div");
    block.className = "changelog-category";
    const h = document.createElement("h4");
    h.className = "changelog-category-title";
    h.textContent = label;
    block.appendChild(h);
    const ul = document.createElement("ul");
    ul.className = "changelog-entry-list changelog-category-list";
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    }
    block.appendChild(ul);
    parent.appendChild(block);
  }

  /**
   * @param {HTMLElement} container
   * @param {{ entries?: Record<string, unknown>[] }} doc
   * @param {string} currentVersion
   */
  function renderChangelogEntries(container, doc, currentVersion) {
    container.replaceChildren();
    const entries = Array.isArray(doc?.entries) ? doc.entries : [];
    const cv = String(currentVersion || "").trim();
    if (entries.length === 0) {
      const p = document.createElement("p");
      p.className = "changelog-empty";
      p.textContent = "No release notes found. Add entries to renderer/changelog.json.";
      container.appendChild(p);
      return;
    }
    const CATEGORY_KEYS = [
      { key: "added", label: "Added" },
      { key: "improvements", label: "Improvements" },
      { key: "fixes", label: "Fixes" },
    ];
    for (const ent of entries) {
      const ver = typeof ent.version === "string" ? ent.version.trim() : "";
      const wrap = document.createElement("section");
      wrap.className = "changelog-entry";
      if (cv && ver === cv) wrap.classList.add("changelog-entry--current");

      const head = document.createElement("div");
      head.className = "changelog-entry-head";

      const title = document.createElement("h3");
      title.className = "changelog-entry-version";
      title.textContent = ver || "Release";
      head.appendChild(title);

      if (typeof ent.date === "string" && ent.date.trim()) {
        const d = document.createElement("span");
        d.className = "changelog-entry-date";
        d.textContent = ent.date.trim();
        head.appendChild(d);
      }
      wrap.appendChild(head);

      let categorizedTotal = 0;
      const buckets = CATEGORY_KEYS.map(({ key, label }) => {
        const lines = normalizeChangelogLines(ent[key]);
        categorizedTotal += lines.length;
        return { label, lines };
      });

      const useCategories = categorizedTotal > 0;
      if (useCategories) {
        for (const { label, lines } of buckets) {
          appendChangelogCategory(wrap, label, lines);
        }
      } else {
        const ul = document.createElement("ul");
        ul.className = "changelog-entry-list";
        const lines = normalizeChangelogLines(ent.items);
        if (lines.length === 0) {
          const li = document.createElement("li");
          li.textContent = "(No bullet points for this version.)";
          ul.appendChild(li);
        } else {
          for (const line of lines) {
            const li = document.createElement("li");
            li.textContent = line;
            ul.appendChild(li);
          }
        }
        wrap.appendChild(ul);
      }

      container.appendChild(wrap);
    }
  }

  async function openChangelogPanel() {
    if (!changelogPanel || !changelogPanelBody) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    changelogPanel.hidden = false;
    changelogPanel.setAttribute("aria-hidden", "false");
    changelogPanelBody.innerHTML = "";
    const loading = document.createElement("p");
    loading.className = "changelog-loading";
    loading.textContent = "Loading…";
    changelogPanelBody.appendChild(loading);
    let ver = "";
    try {
      const info = await window.nebula?.getAppInfo?.();
      ver = info && typeof info.version === "string" ? info.version : "";
    } catch {
      ver = "";
    }
    const doc = await fetchChangelogDoc();
    changelogPanelBody.innerHTML = "";
    renderChangelogEntries(changelogPanelBody, doc, ver);
    queueMicrotask(() => changelogPanelClose?.focus());
  }

  function closeChangelogPanel() {
    if (!changelogPanel || changelogPanel.hidden) return;
    changelogPanel.hidden = true;
    changelogPanel.setAttribute("aria-hidden", "true");
  }

  /** @type {object | null} */
  let activePermissionPayload = null;

  function hidePermissionPromptPanelOnly() {
    if (!permissionPromptPanel || permissionPromptPanel.hidden) return;
    permissionPromptPanel.hidden = true;
    permissionPromptPanel.setAttribute("aria-hidden", "true");
    queueMicrotask(() => focusActiveWebviewGuest({ forWindow: true }));
  }

  function rejectActivePermissionIfAny() {
    if (!activePermissionPayload || !window.nebula?.respondToPermissionRequest) {
      activePermissionPayload = null;
      hidePermissionPromptPanelOnly();
      return;
    }
    const p = activePermissionPayload;
    activePermissionPayload = null;
    hidePermissionPromptPanelOnly();
    window.nebula.respondToPermissionRequest({
      id: p.id,
      origin: p.origin,
      allow: false,
      remember: false,
      persist: null,
    });
  }

  function buildPermissionPersist(payload, allow, remember) {
    if (!remember) return null;
    const persist = {};
    if (payload.kind === "simple" && payload.siteKey) {
      persist[payload.siteKey] = allow ? "allow" : "block";
      return persist;
    }
    if (payload.kind === "media") {
      if (payload.needsCamera) persist.camera = allow ? "allow" : "block";
      if (payload.needsMicrophone) persist.microphone = allow ? "allow" : "block";
      return persist;
    }
    return null;
  }

  function finishPermissionPrompt(allow) {
    if (!activePermissionPayload || !window.nebula?.respondToPermissionRequest) return;
    const p = activePermissionPayload;
    const remember = !!(permissionPromptRemember && permissionPromptRemember.checked);
    window.nebula.respondToPermissionRequest({
      id: p.id,
      origin: p.origin,
      allow,
      remember,
      persist: buildPermissionPersist(p, allow, remember),
    });
    activePermissionPayload = null;
    hidePermissionPromptPanelOnly();
  }

  function openPermissionPromptPanel(payload) {
    activePermissionPayload = payload;
    if (!permissionPromptPanel || !permissionPromptMessage) return;
    const origin = typeof payload.origin === "string" ? payload.origin : "";
    let msg = "";
    if (payload.kind === "media") {
      const lab = typeof payload.label === "string" ? payload.label : "camera and microphone";
      msg = `${origin || "This site"} wants to use your ${lab}.`;
    } else {
      const lab = typeof payload.label === "string" ? payload.label : "this permission";
      msg = `${origin || "This site"} wants to access ${lab}.`;
    }
    permissionPromptMessage.textContent = msg;
    if (permissionPromptRemember) permissionPromptRemember.checked = true;
    permissionPromptPanel.hidden = false;
    permissionPromptPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => permissionPromptAllow?.focus());
  }

  /**
   * @type {null | { kind: "password", tabId: string, payload: object, origin: string } | { kind: "session", tabId: string, pageUrl: string, title: string, origin: string, hostname: string }}
   */
  let activeSaveOffer = null;
  let lastPasswordOfferFingerprint = "";
  let lastPasswordOfferAt = 0;
  let lastCredentialOfferAt = 0;
  let lastCredentialOfferOrigin = "";
  /** @type {ReturnType<typeof setTimeout> | null} */
  let sessionVaultOfferTimerId = null;
  const sessionVaultOfferedOrSkippedOrigins = new Set();

  function loadSessionVaultDenyOrigins() {
    try {
      const raw = localStorage.getItem(SESSION_VAULT_DENY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set();
    }
  }

  function persistSessionVaultDenyOrigin(origin) {
    const s = loadSessionVaultDenyOrigins();
    s.add(origin);
    try {
      localStorage.setItem(SESSION_VAULT_DENY_KEY, JSON.stringify([...s]));
    } catch {
      /* */
    }
  }

  function loadPasswordSaveDenyOrigins() {
    try {
      const raw = localStorage.getItem(PASSWORD_SAVE_DENY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
    } catch {
      return new Set();
    }
  }

  function persistPasswordSaveDenyOrigin(origin) {
    const s = loadPasswordSaveDenyOrigins();
    s.add(origin);
    try {
      localStorage.setItem(PASSWORD_SAVE_DENY_KEY, JSON.stringify([...s]));
    } catch {
      /* */
    }
  }

  function closePasswordSaveOfferPanel() {
    activeSaveOffer = null;
    if (passwordSaveOfferTitle) passwordSaveOfferTitle.textContent = "Save password?";
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Save";
    if (!passwordSaveOfferPanel || passwordSaveOfferPanel.hidden) return;
    passwordSaveOfferPanel.hidden = true;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "true");
    queueMicrotask(() => focusActiveWebviewGuest({ forWindow: true }));
  }

  function scheduleSessionVaultOfferCheck(tabId) {
    if (tabId !== activeId) return;
    if (sessionVaultOfferTimerId != null) {
      clearTimeout(sessionVaultOfferTimerId);
      sessionVaultOfferTimerId = null;
    }
    sessionVaultOfferTimerId = window.setTimeout(() => {
      sessionVaultOfferTimerId = null;
      void maybeOfferSessionVaultPlaceholder(tabId);
    }, 5000);
  }

  async function maybeOfferSessionVaultPlaceholder(tabId) {
    if (tabId !== activeId) return;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return;
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.el) return;
    let pageUrl = "";
    try {
      pageUrl = tab.el.getURL() || "";
    } catch {
      return;
    }
    if (!pageUrl || !/^https:\/\//i.test(pageUrl)) return;
    let origin = "";
    let hostname = "";
    try {
      const u = new URL(pageUrl);
      origin = u.origin;
      hostname = u.hostname;
    } catch {
      return;
    }
    if (loadSessionVaultDenyOrigins().has(origin)) return;
    if (sessionVaultOfferedOrSkippedOrigins.has(origin)) return;
    if (Date.now() - lastCredentialOfferAt < 25000 && lastCredentialOfferOrigin === origin) return;

    try {
      const r = await window.nebula?.vaultSessionOfferCheck?.({ pageUrl });
      if (!r?.offer) return;
    } catch {
      return;
    }

    sessionVaultOfferedOrSkippedOrigins.add(origin);
    const title = tab.titleEl?.textContent?.trim() || "";
    activeSaveOffer = { kind: "session", tabId, pageUrl, title, origin, hostname };
    if (!passwordSaveOfferPanel || !passwordSaveOfferMessage || !passwordSaveOfferTitle) return;
    passwordSaveOfferTitle.textContent = "Add site to saved passwords?";
    passwordSaveOfferMessage.textContent = `Nebula sees a saved session (cookies) at ${hostname}, but no vault entry for this site. Add a placeholder with an empty password? You can edit it later.`;
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Add to vault";
    passwordSaveOfferPanel.hidden = false;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => passwordSaveOfferSave?.focus());
  }

  function considerLoginCaptureForVault(tabId, payload) {
    if (!payload || typeof payload !== "object") return;
    let origin = "";
    try {
      origin = new URL(typeof payload.pageUrl === "string" ? payload.pageUrl : "").origin;
    } catch {
      return;
    }
    if (!origin || !/^https?:/i.test(origin)) return;
    if (loadPasswordSaveDenyOrigins().has(origin)) return;

    const username = typeof payload.username === "string" ? payload.username : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!password) return;
    if (payload.vaultOffer === false) return;

    const fingerprint = `${origin}\t${username}\t${password}`;
    const now = Date.now();
    if (fingerprint === lastPasswordOfferFingerprint && now - lastPasswordOfferAt < 10000) return;
    lastPasswordOfferFingerprint = fingerprint;
    lastPasswordOfferAt = now;
    lastCredentialOfferAt = now;
    lastCredentialOfferOrigin = origin;
    if (sessionVaultOfferTimerId != null) {
      clearTimeout(sessionVaultOfferTimerId);
      sessionVaultOfferTimerId = null;
    }

    let host = "";
    try {
      host = new URL(origin).hostname;
    } catch {
      host = origin;
    }

    activeSaveOffer = { kind: "password", tabId, payload, origin };
    if (!passwordSaveOfferPanel || !passwordSaveOfferMessage) return;

    if (passwordSaveOfferTitle) passwordSaveOfferTitle.textContent = "Save password?";
    if (passwordSaveOfferSave) passwordSaveOfferSave.textContent = "Save";
    const userBit = username ? username : "(no username detected)";
    passwordSaveOfferMessage.textContent = `Save this password for ${host}? User: ${userBit}`;
    passwordSaveOfferPanel.hidden = false;
    passwordSaveOfferPanel.setAttribute("aria-hidden", "false");
    queueMicrotask(() => passwordSaveOfferSave?.focus());
  }

  async function confirmPasswordSaveOffer() {
    const cur = activeSaveOffer;
    if (cur?.kind === "session") {
      try {
        const added = await window.nebula?.vaultAddSessionPlaceholder?.({
          pageUrl: cur.pageUrl,
          title: cur.title,
          skipCookieCheck: true,
        });
        if (added && !added.ok && added.error === "exists") {
          alert("This site is already in your saved passwords.");
        }
      } catch {
        /* */
      }
      closePasswordSaveOfferPanel();
      if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
      return;
    }
    if (cur?.kind !== "password" || !cur.payload) {
      closePasswordSaveOfferPanel();
      return;
    }
    const p = cur.payload;
    try {
      await window.nebula?.vaultUpsertLogin?.({
        pageUrl: typeof p.pageUrl === "string" ? p.pageUrl : "",
        title: typeof p.pageTitle === "string" ? p.pageTitle : "",
        username: typeof p.username === "string" ? p.username : "",
        password: typeof p.password === "string" ? p.password : "",
      });
    } catch {
      /* */
    }
    closePasswordSaveOfferPanel();
    if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
  }

  /** @type {"all"|"login"|"session"|"password"} */
  let vaultListFilter = "all";
  /** @type {{ id: string }[]} */
  let vaultEntriesCache = [];
  /** Main hides passwords until Nebula account unlock when a local account exists. */
  let vaultSecretsLocked = false;
  let vaultHasLocalAccount = false;
  /** @type {ReturnType<typeof setInterval> | null} */
  let vaultUnlockPollId = null;

  function closeVaultPanel() {
    closePasswordSaveOfferPanel();
    if (!vaultPanel || vaultPanel.hidden) return;
    stopVaultUnlockPoll();
    vaultPanel.hidden = true;
    vaultPanel.setAttribute("aria-hidden", "true");
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    if (vaultUnlockPass) vaultUnlockPass.value = "";
    if (vaultUnlockError) {
      vaultUnlockError.hidden = true;
      vaultUnlockError.textContent = "";
    }
  }

  function vaultOriginLabel(entry) {
    try {
      if (entry.origin) return entry.origin.replace(/^https?:\/\//, "");
      if (entry.url) return new URL(entry.url).host;
    } catch {
      /* */
    }
    return entry.url || "—";
  }

  async function refreshVaultHint() {
    if (!vaultHintEncryption) return;
    try {
      const st = await window.nebula?.vaultStatus?.();
      let extra = "";
      if (vaultHasLocalAccount) {
        extra = vaultSecretsLocked
          ? " Local Nebula account: secrets are locked until you unlock."
          : " Local Nebula account: unlocked for viewing and copy.";
      }
      const backupTip =
        vaultEntriesCache.length >= 5
          ? " Tip: use Export… to keep a copy off this device (you can export without passwords)."
          : "";
      if (st && st.encryptionAvailable) {
        vaultHintEncryption.textContent =
          "Stored securely: the vault file is encrypted using OS secure storage when available." +
          extra +
          backupTip;
      } else {
        vaultHintEncryption.textContent =
          "OS secure storage is unavailable; passwords are saved as plain JSON in your Nebula profile folder." +
          extra +
          backupTip;
      }
    } catch {
      vaultHintEncryption.textContent = "";
    }
  }

  function stopVaultUnlockPoll() {
    if (vaultUnlockPollId != null) {
      clearInterval(vaultUnlockPollId);
      vaultUnlockPollId = null;
    }
  }

  function startVaultUnlockPoll() {
    stopVaultUnlockPoll();
    vaultUnlockPollId = window.setInterval(() => {
      if (!vaultPanel || vaultPanel.hidden) return;
      void loadVaultEntriesFromMain();
    }, 30000);
  }

  function updateVaultUnlockChrome() {
    const locked = vaultHasLocalAccount && vaultSecretsLocked;
    if (vaultUnlockOverlay) {
      vaultUnlockOverlay.hidden = !locked;
      vaultUnlockOverlay.setAttribute("aria-hidden", locked ? "false" : "true");
    }
    if (vaultLockBtn) {
      vaultLockBtn.hidden = !vaultHasLocalAccount || vaultSecretsLocked;
    }
  }

  async function refreshNebulaAccountSettingsUI() {
    if (!nebulaAccountCreateBlock || !nebulaAccountManageBlock) return;
    try {
      const st = await window.nebula?.accountStatus?.();
      const has = !!(st && st.hasAccount);
      nebulaAccountCreateBlock.hidden = has;
      nebulaAccountManageBlock.hidden = !has;
    } catch {
      nebulaAccountCreateBlock.hidden = false;
      nebulaAccountManageBlock.hidden = true;
    }
  }

  function setNebulaAccountSettingsMessage(text, opts) {
    if (!nebulaAccountSettingsMsg) return;
    if (opts?.sticky) {
      nebulaAccountSettingsMsg.dataset.sticky = "1";
    } else {
      delete nebulaAccountSettingsMsg.dataset.sticky;
    }
    nebulaAccountSettingsMsg.textContent = text || "";
  }

  async function submitVaultUnlock() {
    if (!vaultUnlockError) return;
    const pwd = vaultUnlockPass?.value ?? "";
    vaultUnlockError.hidden = true;
    vaultUnlockError.textContent = "";
    try {
      const r = await window.nebula?.accountUnlock?.({ password: pwd });
      if (r?.ok) {
        if (vaultUnlockPass) vaultUnlockPass.value = "";
        await loadVaultEntriesFromMain();
        queueMicrotask(() => vaultSearchInput?.focus());
        return;
      }
      vaultUnlockError.hidden = false;
      vaultUnlockError.textContent =
        r?.error === "bad_password" ? "Wrong password." : "Could not unlock.";
    } catch {
      vaultUnlockError.hidden = false;
      vaultUnlockError.textContent = "Could not unlock.";
    }
  }

  function vaultEntryIsSessionPlaceholderEntry(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (entry.sessionPlaceholder === true) return true;
    const n = typeof entry.notes === "string" ? entry.notes : "";
    return n.includes("Nebula: Signed in via saved browser session");
  }

  function reloadGuestTabsForOrigin(origin) {
    if (!origin || typeof origin !== "string") return;
    for (const t of tabs) {
      if (!t?.el) continue;
      try {
        const u = new URL(t.el.getURL());
        if (u.origin === origin) t.el.reload();
      } catch {
        /* */
      }
    }
  }

  function vaultEntryHasStoredPassword(entry) {
    if (!entry || typeof entry !== "object") return false;
    if (typeof entry.password === "string" && entry.password.length > 0) return true;
    return entry.passwordPresent === true;
  }

  function renderVaultList() {
    if (!vaultListEl) return;
    const q = (vaultSearchInput?.value || "").trim().toLowerCase();
    vaultListEl.replaceChildren();
    let list = !q
      ? vaultEntriesCache.slice()
      : vaultEntriesCache.filter((e) => {
          const hay = `${e.title || ""} ${e.username || ""} ${e.url || ""} ${e.origin || ""}`.toLowerCase();
          return hay.includes(q);
        });
    if (vaultListFilter === "session") {
      list = list.filter((e) => vaultEntryIsSessionPlaceholderEntry(e));
    } else if (vaultListFilter === "login") {
      list = list.filter((e) => !vaultEntryIsSessionPlaceholderEntry(e));
    } else if (vaultListFilter === "password") {
      list = list.filter((e) => !vaultEntryIsSessionPlaceholderEntry(e) && vaultEntryHasStoredPassword(e));
    }
    const rows = list;
    if (rows.length === 0) {
      const li = document.createElement("li");
      li.className = "vault-list-empty";
      let msg = "No matches.";
      if (vaultEntriesCache.length === 0) msg = "No saved passwords yet.";
      else if (!q && vaultListFilter !== "all") msg = "No entries in this category.";
      li.textContent = msg;
      vaultListEl.appendChild(li);
      return;
    }
    for (const e of rows) {
      const li = document.createElement("li");
      li.className = "vault-row";
      const main = document.createElement("div");
      main.className = "vault-row-main";
      const titleRow = document.createElement("div");
      titleRow.className = "vault-row-title-row";
      const title = document.createElement("div");
      title.className = "vault-row-title";
      title.textContent = e.title || vaultOriginLabel(e);
      titleRow.appendChild(title);
      if (vaultEntryIsSessionPlaceholderEntry(e)) {
        const badge = document.createElement("span");
        badge.className = "vault-row-badge";
        badge.textContent = "Session";
        titleRow.appendChild(badge);
      }
      const sub = document.createElement("div");
      sub.className = "vault-row-sub";
      sub.textContent = e.username || "—";
      main.appendChild(titleRow);
      main.appendChild(sub);
      const actions = document.createElement("div");
      actions.className = "vault-row-actions";
      const mkBtn = (label, cls, fn, disabled) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = cls;
        b.textContent = label;
        if (disabled) {
          b.disabled = true;
          b.title = "Unlock the vault first";
        }
        b.addEventListener("click", () => void fn());
        return b;
      };
      const lockedOut = vaultSecretsLocked;
      actions.append(
        mkBtn("Copy user", "vault-row-btn", async () => {
          await window.nebula?.vaultCopyUsername?.({ id: e.id });
        }),
        mkBtn(
          "Copy pass",
          "vault-row-btn vault-row-btn--primary",
          async () => {
            const r = await window.nebula?.vaultCopyPassword?.({ id: e.id });
            if (r && r.locked) {
              void loadVaultEntriesFromMain();
              if (vaultHintEncryption) {
                vaultHintEncryption.textContent = "Unlock the vault to copy passwords.";
              }
            }
          },
          lockedOut
        ),
        mkBtn(
          "Edit",
          "vault-row-btn",
          () => startEditVaultEntry(e),
          lockedOut
        ),
        mkBtn("Remove", "vault-row-btn vault-row-btn--danger", async () => {
          const sessionRow = vaultEntryIsSessionPlaceholderEntry(e);
          const msg = sessionRow
            ? "Remove this entry and sign out on this device? Cookies and other site data for this site will be cleared."
            : "Remove this saved password?";
          if (!confirm(msg)) return;
          const r = await window.nebula?.vaultRemove?.({ id: e.id });
          if (r?.clearedSiteSession && r?.clearedOrigin) {
            reloadGuestTabsForOrigin(r.clearedOrigin);
          }
          await loadVaultEntriesFromMain();
        })
      );
      li.appendChild(main);
      li.appendChild(actions);
      vaultListEl.appendChild(li);
    }
  }

  async function loadVaultEntriesFromMain() {
    try {
      const raw = await window.nebula?.vaultList?.();
      if (raw && typeof raw === "object" && Array.isArray(raw.entries)) {
        vaultEntriesCache = raw.entries;
        vaultSecretsLocked = !!raw.secretsLocked;
        vaultHasLocalAccount = !!raw.hasLocalAccount;
      } else if (Array.isArray(raw)) {
        vaultEntriesCache = raw;
        vaultSecretsLocked = false;
        vaultHasLocalAccount = false;
      } else {
        vaultEntriesCache = [];
        vaultSecretsLocked = false;
        vaultHasLocalAccount = false;
      }
    } catch {
      vaultEntriesCache = [];
      vaultSecretsLocked = false;
      vaultHasLocalAccount = false;
    }
    updateVaultUnlockChrome();
    await refreshVaultHint();
    renderVaultList();
  }

  function resetVaultForm() {
    if (vaultEditId) vaultEditId.value = "";
    if (vaultFieldUrl) vaultFieldUrl.value = "";
    if (vaultFieldTitle) vaultFieldTitle.value = "";
    if (vaultFieldUser) vaultFieldUser.value = "";
    if (vaultFieldPass) vaultFieldPass.value = "";
    if (vaultFieldNotes) vaultFieldNotes.value = "";
  }

  function startEditVaultEntry(entry) {
    if (!vaultFormWrap) return;
    vaultFormWrap.hidden = false;
    if (vaultEditId) vaultEditId.value = entry.id || "";
    if (vaultFieldUrl) vaultFieldUrl.value = entry.url || "";
    if (vaultFieldTitle) vaultFieldTitle.value = entry.title || "";
    if (vaultFieldUser) vaultFieldUser.value = entry.username || "";
    if (vaultFieldPass) vaultFieldPass.value = entry.password || "";
    if (vaultFieldNotes) vaultFieldNotes.value = entry.notes || "";
    queueMicrotask(() => vaultFieldUrl?.focus());
  }

  async function openVaultPanel() {
    if (!vaultPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeChangelogPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    vaultPanel.hidden = false;
    vaultPanel.setAttribute("aria-hidden", "false");
    resetVaultForm();
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    if (vaultFilter) vaultFilter.value = vaultListFilter;
    if (vaultUnlockPass) vaultUnlockPass.value = "";
    if (vaultUnlockError) {
      vaultUnlockError.hidden = true;
      vaultUnlockError.textContent = "";
    }
    startVaultUnlockPoll();
    await loadVaultEntriesFromMain();
    queueMicrotask(() => {
      const locked = vaultHasLocalAccount && vaultSecretsLocked;
      if (locked && vaultUnlockPass) vaultUnlockPass.focus();
      else vaultPanelClose?.focus();
    });
  }

  function toggleVaultPanel() {
    if (!vaultPanel) return;
    if (vaultPanel.hidden) void openVaultPanel();
    else closeVaultPanel();
  }

  function shouldSkipHistoryUrl(url) {
    if (!url || typeof url !== "string") return true;
    if (url.includes(HOME_FILE)) return true;
    try {
      const u = new URL(url);
      if (u.protocol === "about:" || u.protocol === "chrome:" || u.protocol === "chrome-devtools:") {
        return true;
      }
    } catch {
      return true;
    }
    return false;
  }

  function loadHistoryFromStorage() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((x) => x && typeof x.url === "string" && typeof x.visitedAt === "number")
        .map((x) => ({
          url: x.url,
          title: typeof x.title === "string" ? x.title : "",
          visitedAt: x.visitedAt,
        }));
    } catch {
      return [];
    }
  }

  function saveHistoryToStorage(entries) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
  }

  function removeHistoryEntry(url, visitedAt) {
    const arr = loadHistoryFromStorage();
    const next = arr.filter((x) => !(x.url === url && x.visitedAt === visitedAt));
    saveHistoryToStorage(next);
    if (historyPanel && !historyPanel.hidden) renderHistoryList();
  }

  function recordHistoryVisit(url, title) {
    if (shouldSkipHistoryUrl(url)) return;
    const t = typeof title === "string" ? title.trim().slice(0, 500) : "";
    const now = Date.now();
    const arr = loadHistoryFromStorage();
    if (arr.length > 0 && arr[0].url === url) {
      arr[0] = { url, title: t || arr[0].title, visitedAt: now };
    } else {
      arr.unshift({ url, title: t, visitedAt: now });
    }
    saveHistoryToStorage(arr);
    if (historyPanel && !historyPanel.hidden) renderHistoryList();
  }

  function tryRecordHistoryForTab(tabId) {
    const tab = tabs.find((x) => x.id === tabId);
    if (!tab) return;
    let url = "";
    try {
      url = tab.el.getURL() || "";
    } catch {
      return;
    }
    const title = tab.titleEl ? tab.titleEl.textContent || "" : "";
    recordHistoryVisit(url, title);
  }

  function formatHistoryTime(ts) {
    try {
      const thenMs = new Date(ts).getTime();
      if (!Number.isFinite(thenMs)) return "";
      const diff = Math.max(0, Date.now() - thenMs);
      const minuteMs = 60 * 1000;
      const hourMs = 60 * minuteMs;
      const dayMs = 24 * hourMs;
      const weekMs = 7 * dayMs;

      if (diff < minuteMs) return "Just now";

      const minutes = Math.floor(diff / minuteMs);
      if (diff < hourMs) {
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
      }

      const hours = Math.floor(diff / hourMs);
      if (diff < dayMs) {
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
      }

      const days = Math.floor(diff / dayMs);
      if (diff < weekMs) {
        return days === 1 ? "1 day ago" : `${days} days ago`;
      }

      const d = new Date(ts);
      const now = new Date();
      const sameYear = d.getFullYear() === now.getFullYear();
      return d.toLocaleDateString(
        undefined,
        sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }
      );
    } catch {
      return "";
    }
  }

  function renderHistoryList() {
    if (!historyListEl) return;
    historyListEl.replaceChildren();
    const entries = loadHistoryFromStorage();
    if (entries.length === 0) {
      const empty = document.createElement("li");
      empty.className = "history-list-empty";
      empty.textContent = "No pages in history yet.";
      historyListEl.appendChild(empty);
      return;
    }
    for (const item of entries) {
      const li = document.createElement("li");
      li.className = "history-list-item";

      const row = document.createElement("div");
      row.className = "history-item-row";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-item";
      btn.dataset.historyUrl = item.url;
      btn.dataset.historyVisitedAt = String(item.visitedAt);
      const titleSpan = document.createElement("span");
      titleSpan.className = "history-item-title";
      titleSpan.textContent = item.title || item.url;
      const urlSpan = document.createElement("span");
      urlSpan.className = "history-item-url";
      urlSpan.textContent = item.url;
      const meta = document.createElement("span");
      meta.className = "history-item-meta";
      meta.textContent = formatHistoryTime(item.visitedAt);
      btn.appendChild(titleSpan);
      btn.appendChild(urlSpan);
      btn.appendChild(meta);
      btn.addEventListener("click", () => {
        openHistoryUrl(item.url);
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "history-item-remove";
      removeBtn.title = "Remove from history";
      removeBtn.setAttribute("aria-label", "Remove from history");
      removeBtn.innerHTML = "\u00D7";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeHistoryEntry(item.url, item.visitedAt);
      });

      row.appendChild(btn);
      row.appendChild(removeBtn);
      li.appendChild(row);
      historyListEl.appendChild(li);
    }
  }

  function openHistoryUrl(url) {
    closeHistoryPanel();
    const w = getActiveWebview();
    if (w) w.loadURL(url);
    else createTab(url);
  }

  function openHistoryPanel() {
    if (!historyPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    historyPanel.hidden = false;
    historyPanel.setAttribute("aria-hidden", "false");
    renderHistoryList();
    queueMicrotask(() => historyPanelClose?.focus());
  }

  function closeHistoryPanel() {
    if (!historyPanel || historyPanel.hidden) return;
    historyPanel.hidden = true;
    historyPanel.setAttribute("aria-hidden", "true");
  }

  function toggleHistoryPanel() {
    if (!historyPanel) return;
    if (historyPanel.hidden) openHistoryPanel();
    else closeHistoryPanel();
  }

  function closeSitePermissionsPanel() {
    if (!sitePermPanel || sitePermPanel.hidden) return;
    sitePermPanel.hidden = true;
    sitePermPanel.setAttribute("aria-hidden", "true");
  }

  async function refreshSitePermPanel() {
    const originEl = document.getElementById("site-perm-origin");
    const noPageEl = document.getElementById("site-perm-no-page");
    const siteWrap = document.getElementById("site-perm-site-wrap");
    const global3p = document.getElementById("site-perm-global-3p");
    const w = getActiveWebview();
    let pageUrl = "";
    try {
      pageUrl = w ? w.getURL() : "";
    } catch {
      pageUrl = "";
    }
    refreshingSitePerm = true;
    try {
      let data = {
        currentOrigin: "",
        global: { blockThirdPartyCookies: false },
        defaults: {},
        site: {},
      };
      if (window.nebula?.getSitePermissions) {
        try {
          data = await window.nebula.getSitePermissions(pageUrl);
        } catch {
          /* ignore */
        }
      }
      if (global3p) global3p.checked = !!data.global?.blockThirdPartyCookies;

      const defs = data.defaults || {};
      const mapDef = (key) => {
        const v = defs[key];
        return v === "allow" || v === "block" || v === "ask" ? v : "ask";
      };
      const setDef = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.value = mapDef(key);
      };
      setDef("site-perm-def-camera", "camera");
      setDef("site-perm-def-microphone", "microphone");
      setDef("site-perm-def-geolocation", "geolocation");
      setDef("site-perm-def-notifications", "notifications");
      setDef("site-perm-def-screenCapture", "screenCapture");

      if (!pageUrl || !/^https?:/i.test(pageUrl)) {
        if (originEl) originEl.textContent = pageUrl || "—";
        if (noPageEl) noPageEl.hidden = false;
        if (siteWrap) siteWrap.hidden = true;
        return;
      }
      if (noPageEl) noPageEl.hidden = true;
      if (siteWrap) siteWrap.hidden = false;
      if (originEl) originEl.textContent = data.currentOrigin || new URL(pageUrl).origin;
      const mapSiteVal = (v) => (v === "allow" || v === "block" || v === "ask" ? v : "default");
      const map3p = (v) => (v === "allow" || v === "block" ? v : "default");
      const setSel = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.value = mapSiteVal(data.site[key]);
      };
      setSel("site-perm-camera", "camera");
      setSel("site-perm-microphone", "microphone");
      setSel("site-perm-geolocation", "geolocation");
      setSel("site-perm-notifications", "notifications");
      setSel("site-perm-screen", "screenCapture");
      const el3p = document.getElementById("site-perm-3p");
      if (el3p) el3p.value = map3p(data.site.thirdPartyCookies);
    } finally {
      refreshingSitePerm = false;
    }
  }

  function openSitePermissionsPanel() {
    if (!sitePermPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    if (!findBar.hidden) closeFindBar();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    hideOmniboxSuggestions();
    sitePermPanel.hidden = false;
    sitePermPanel.setAttribute("aria-hidden", "false");
    void refreshSitePermPanel();
    queueMicrotask(() => sitePermClose?.focus());
  }

  function toggleSitePermissionsPanel() {
    if (!sitePermPanel) return;
    if (sitePermPanel.hidden) openSitePermissionsPanel();
    else closeSitePermissionsPanel();
  }

  async function onSitePermGlobalChange() {
    if (refreshingSitePerm) return;
    const el = document.getElementById("site-perm-global-3p");
    if (!el || !window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({ blockThirdPartyCookiesGlobally: el.checked });
    } catch {
      /* ignore */
    }
  }

  async function onSitePermDefaultChange(ev) {
    if (refreshingSitePerm) return;
    const sel = ev.target;
    if (!sel.classList?.contains("site-perm-default-select")) return;
    const key = sel.dataset.defaultKey;
    if (!key) return;
    const value = sel.value;
    if (!window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({
        defaultsPatch: { [key]: value },
      });
    } catch {
      /* ignore */
    }
  }

  async function onSitePermSelectChange(ev) {
    if (refreshingSitePerm) return;
    const sel = ev.target;
    if (!sel.classList?.contains("site-perm-select")) return;
    const key = sel.dataset.permKey;
    if (!key) return;
    const w = getActiveWebview();
    let pageUrl = "";
    try {
      pageUrl = w ? w.getURL() : "";
    } catch {
      return;
    }
    if (!/^https?:/i.test(pageUrl)) return;
    const origin = new URL(pageUrl).origin;
    const value = sel.value;
    if (!window.nebula?.setSitePermissions) return;
    try {
      await window.nebula.setSitePermissions({
        origin,
        patch: { [key]: value },
      });
    } catch {
      /* ignore */
    }
  }

  function settingsShortcutMatch(e) {
    if (e.repeat) return false;
    if (e.key !== ",") return false;
    return e.ctrlKey || e.metaKey;
  }

  function populateSettingsForm() {
    const s = appSettings;
    const ss = s.searchSuggestions;
    const adEl = document.getElementById("settings-adblock-enabled");
    if (adEl) adEl.checked = s.adblockEnabled !== false;
    const el = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.value = String(v);
    };
    const chk = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.checked = !!v;
    };
    chk("settings-ss-past", ss.enablePastSearch);
    chk("settings-ss-bookmarks", ss.enableBookmarks);
    chk("settings-ss-history", ss.enableHistory);
    chk("settings-ss-ddg", ss.enableDuckDuckGo);
    el("settings-ss-max-total", ss.maxTotal);
    el("settings-ss-max-past", ss.maxPastSearch);
    el("settings-ss-max-bookmarks", ss.maxBookmarks);
    el("settings-ss-max-history", ss.maxHistory);
    el("settings-ss-max-ddg", ss.maxDuckDuckGo);
    el("settings-ss-remote-min", ss.remoteMinChars);
    el("settings-ss-debounce", ss.debounceMs);
    const sel = document.getElementById("settings-ss-layer-order");
    if (sel) {
      const want = JSON.stringify(ss.layerOrder);
      let found = false;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === want) {
          sel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) sel.selectedIndex = 0;
    }
  }

  function gatherSettingsPatchFromForm() {
    const num = (id, fallback) => {
      const n = document.getElementById(id);
      const v = n ? Number(n.value) : fallback;
      return Number.isFinite(v) ? v : fallback;
    };
    const chk = (id) => {
      const n = document.getElementById(id);
      return !!(n && n.checked);
    };
    let layerOrder = DEFAULT_APP_SETTINGS.searchSuggestions.layerOrder;
    const sel = document.getElementById("settings-ss-layer-order");
    if (sel && sel.value) {
      try {
        const p = JSON.parse(sel.value);
        if (Array.isArray(p) && p.length === 3) layerOrder = p;
      } catch {
        /* */
      }
    }
    return {
      adblockEnabled: !!(document.getElementById("settings-adblock-enabled")?.checked),
      searchSuggestions: {
        enablePastSearch: chk("settings-ss-past"),
        enableBookmarks: chk("settings-ss-bookmarks"),
        enableHistory: chk("settings-ss-history"),
        enableDuckDuckGo: chk("settings-ss-ddg"),
        layerOrder,
        maxTotal: num("settings-ss-max-total", 10),
        maxPastSearch: num("settings-ss-max-past", 6),
        maxBookmarks: num("settings-ss-max-bookmarks", 4),
        maxHistory: num("settings-ss-max-history", 4),
        maxDuckDuckGo: num("settings-ss-max-ddg", 8),
        remoteMinChars: num("settings-ss-remote-min", 2),
        debounceMs: num("settings-ss-debounce", 220),
      },
    };
  }

  function closeSettingsPanel() {
    if (!settingsPanel || settingsPanel.hidden) return;
    closeChangelogPanel();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    settingsPanel.hidden = true;
    settingsPanel.setAttribute("aria-hidden", "true");
  }

  function openSettingsPanel() {
    if (!settingsPanel) return;
    rejectActivePermissionIfAny();
    closePasswordSaveOfferPanel();
    closeVaultPanel();
    if (!findBar.hidden) closeFindBar();
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    populateSettingsForm();
    settingsPanel.hidden = false;
    settingsPanel.setAttribute("aria-hidden", "false");
    void refreshNebulaAccountSettingsUI();
    void refreshAboutSection();
    queueMicrotask(() => document.getElementById("settings-adblock-enabled")?.focus());
  }

  function toggleSettingsPanel() {
    if (!settingsPanel) return;
    if (settingsPanel.hidden) openSettingsPanel();
    else closeSettingsPanel();
  }

  async function saveSettingsFromForm() {
    const patch = gatherSettingsPatchFromForm();
    if (window.nebula?.setSettings) {
      try {
        const next = await window.nebula.setSettings(patch);
        appSettings = normalizeAppSettings(next);
      } catch {
        appSettings = normalizeAppSettings({ ...appSettings, ...patch });
      }
    } else {
      appSettings = normalizeAppSettings({ ...appSettings, ...patch });
    }
    closeSettingsPanel();
    refreshOmniboxSuggestions();
  }

  function historyShortcutMatch(e) {
    if (e.repeat) return false;
    if (e.key !== "h" && e.key !== "H") return false;
    if (e.altKey) return false;
    if (window.nebula?.isMac) {
      if (e.metaKey && e.shiftKey && !e.ctrlKey) return true;
      if (e.ctrlKey && !e.metaKey) return true;
      return false;
    }
    return e.ctrlKey && !e.shiftKey;
  }

  function loadBookmarksFromStorage() {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr)
        ? arr.filter((x) => x && typeof x.url === "string").map((x) => ({ url: x.url, title: x.title || "" }))
        : [];
    } catch {
      return [];
    }
  }

  function saveBookmarksToStorage() {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }

  function normalizeBookmarkUrl(url) {
    try {
      const u = new URL(url);
      u.hash = "";
      return u.href;
    } catch {
      return url;
    }
  }

  function renderBookmarksBar() {
    bookmarksBar.replaceChildren();
    if (bookmarks.length === 0) {
      bookmarksBar.hidden = true;
      return;
    }
    bookmarksBar.hidden = false;
    for (const b of bookmarks) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "bookmark-chip";
      chip.title = b.url;
      const faviconEl = document.createElement("img");
      faviconEl.className = "bookmark-chip-favicon";
      faviconEl.alt = "";
      faviconEl.width = 16;
      faviconEl.height = 16;
      faviconEl.decoding = "async";
      faviconEl.hidden = true;
      faviconEl.addEventListener("load", () => {
        faviconEl.hidden = false;
      });
      faviconEl.addEventListener("error", () => {
        faviconEl.hidden = true;
        faviconEl.removeAttribute("src");
      });
      const favSrc = bookmarkChipFaviconUrl(b.url);
      if (favSrc) faviconEl.src = favSrc;
      const label = document.createElement("span");
      label.className = "bookmark-chip-title";
      label.textContent = b.title || shortHost(b.url);
      const rm = document.createElement("span");
      rm.className = "bookmark-chip-remove";
      rm.textContent = "\u00D7";
      rm.title = "Remove bookmark";
      rm.addEventListener("click", (ev) => {
        ev.stopPropagation();
        removeBookmarkByUrl(b.url);
      });
      chip.appendChild(faviconEl);
      chip.appendChild(label);
      chip.appendChild(rm);
      chip.addEventListener("click", () => {
        const w = getActiveWebview();
        if (w) w.loadURL(b.url);
        else createTab(b.url);
      });
      bookmarksBar.appendChild(chip);
    }
  }

  function shortHost(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url.slice(0, 24);
    }
  }

  /** https://icons.duckduckgo.com/ip3/ — same idea as omnibox DDG integration; http(s) only. */
  function bookmarkChipFaviconUrl(pageUrl) {
    try {
      const u = new URL(pageUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "";
      const host = u.hostname;
      if (!host) return "";
      return `https://icons.duckduckgo.com/ip3/${host}.ico`;
    } catch {
      return "";
    }
  }

  function removeBookmarkByUrl(url) {
    const key = normalizeBookmarkUrl(url);
    bookmarks = bookmarks.filter((b) => normalizeBookmarkUrl(b.url) !== key);
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
  }

  function isUrlBookmarked(url) {
    if (!url || url.includes(HOME_FILE)) return false;
    const key = normalizeBookmarkUrl(url);
    return bookmarks.some((b) => normalizeBookmarkUrl(b.url) === key);
  }

  function updateBookmarkStar() {
    const w = getActiveWebview();
    let on = false;
    if (w) {
      try {
        on = isUrlBookmarked(w.getURL());
      } catch {
        on = false;
      }
    }
    btnBookmark.classList.toggle("is-bookmarked", on);
    btnBookmark.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function toggleBookmarkCurrent() {
    const w = getActiveWebview();
    if (!w) return;
    let url = "";
    let title = "";
    try {
      url = w.getURL();
      title = w.getTitle() || "";
    } catch {
      return;
    }
    if (!url || url.includes(HOME_FILE)) return;
    const key = normalizeBookmarkUrl(url);
    const idx = bookmarks.findIndex((b) => normalizeBookmarkUrl(b.url) === key);
    if (idx >= 0) bookmarks.splice(idx, 1);
    else bookmarks.push({ url, title: title || shortHost(url) });
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
  }

  function mergeImportedBookmarks(imported) {
    const safe = (imported || []).filter((b) => {
      if (!b || typeof b.url !== "string") return false;
      try {
        const u = new URL(b.url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    });
    const seen = new Set(bookmarks.map((b) => normalizeBookmarkUrl(b.url)));
    let added = 0;
    let skipped = 0;
    for (const b of safe) {
      const key = normalizeBookmarkUrl(b.url);
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      bookmarks.push({ url: b.url, title: b.title || shortHost(b.url) });
      added++;
    }
    saveBookmarksToStorage();
    renderBookmarksBar();
    updateBookmarkStar();
    return { added, skipped, total: safe.length };
  }

  async function runBookmarkImport(replace) {
    const nebula = window.nebula;
    const io = window.NebulaBookmarksIO;
    if (!io) {
      alert("Bookmark import helper not loaded.");
      return;
    }
    const source = settingsBookmarksImportSource?.value || "chrome";

    /** @type {{ ok?: boolean, canceled?: boolean, content?: string, error?: string }} */
    let r;
    if (source === "chrome") {
      if (!nebula?.readBrowserBookmarks) {
        alert("Browser import is only available in the Nebula app.");
        return;
      }
      r = await nebula.readBrowserBookmarks("chrome");
      if (!r || !r.ok) {
        const extra = r?.path ? `\n\n${r.path}` : "";
        alert((r?.error || "Could not read Chrome bookmarks.") + extra);
        return;
      }
    } else {
      if (!nebula?.readBookmarkImportFile) {
        alert("Bookmark import is only available in the Nebula app.");
        return;
      }
      r = await nebula.readBookmarkImportFile();
      if (!r || r.canceled) return;
      if (!r.ok) {
        alert(r.error ? `Could not read file: ${r.error}` : "Could not read file.");
        return;
      }
    }

    let list;
    try {
      list = io.parseBookmarkFile(r.content);
    } catch {
      alert("Could not parse bookmarks. For Chrome, use the profile Bookmarks file or export HTML from Chrome.");
      return;
    }
    if (list.length === 0) {
      alert("No bookmarks found.");
      return;
    }
    const sourceLabel = source === "chrome" ? "Chrome" : "the selected file";
    if (replace) {
      const nExisting = bookmarks.length;
      if (
        !confirm(
          `Replace all ${nExisting} Nebula bookmark(s) with up to ${list.length} from ${sourceLabel}?`
        )
      ) {
        return;
      }
      bookmarks = list
        .filter((b) => {
          try {
            const u = new URL(b.url);
            return u.protocol === "http:" || u.protocol === "https:";
          } catch {
            return false;
          }
        })
        .map((b) => ({ url: b.url, title: b.title || shortHost(b.url) }));
      saveBookmarksToStorage();
      renderBookmarksBar();
      updateBookmarkStar();
      alert(`Replaced with ${bookmarks.length} bookmark(s).`);
      return;
    }
    const { added, skipped } = mergeImportedBookmarks(list);
    alert(`Imported ${added} bookmark(s). Skipped ${skipped} duplicate(s).`);
  }

  async function runBookmarkExport(format) {
    const nebula = window.nebula;
    if (!nebula?.saveBookmarkExportFile) {
      alert("Bookmark export is only available in the Nebula app.");
      return;
    }
    const io = window.NebulaBookmarksIO;
    if (!io) {
      alert("Bookmark export helper not loaded.");
      return;
    }
    const defaultPath = format === "json" ? "nebula-bookmarks.json" : "nebula-bookmarks.html";
    const text =
      format === "json" ? io.exportNebulaJson(bookmarks) : io.exportNetscapeHtml(bookmarks);
    const r = await nebula.saveBookmarkExportFile({ format, text, defaultPath });
    if (!r || r.canceled) return;
    if (!r.ok) {
      alert(r.error ? `Could not save: ${r.error}` : "Could not save.");
      return;
    }
    alert(`Saved to ${r.path || "file"}.`);
  }

  function normalizeInput(raw) {
    const t = raw.trim();
    if (!t) return homeUrl();
    if (/^https?:\/\//i.test(t)) return t;
    if (/^file:\/\//i.test(t)) return t;
    if (t.includes(".") && !t.includes(" ") && !t.startsWith("/")) {
      return "https://" + t;
    }
    return "https://duckduckgo.com/?q=" + encodeURIComponent(t);
  }

  function hideOmniboxSuggestions() {
    omniboxSelectedIndex = -1;
    omniboxSuggestionRows = [];
    if (omniboxSuggestTimer) {
      clearTimeout(omniboxSuggestTimer);
      omniboxSuggestTimer = null;
    }
    if (omniboxSuggestions) {
      omniboxSuggestions.hidden = true;
      omniboxSuggestions.replaceChildren();
    }
    urlInput.removeAttribute("aria-activedescendant");
    urlInput.setAttribute("aria-expanded", "false");
  }

  /** True when keyboard focus is still inside the address bar form (input, Go, or suggestion buttons). */
  function isFocusInsideOmniboxWrap() {
    if (!form) return false;
    const ae = document.activeElement;
    if (!ae || !(ae instanceof Node)) return false;
    return form.contains(ae);
  }

  function collectLocalOmniboxSuggestions(rawQuery, skipNavigateUrls, skipDdgQueriesLower) {
    const q = rawQuery.trim().toLowerCase();
    if (q.length === 0) return [];
    const ss = getSearchSettings();
    const skipNav = skipNavigateUrls instanceof Set ? skipNavigateUrls : null;
    const skipQ = skipDdgQueriesLower instanceof Set ? skipDdgQueriesLower : null;

    function navSkipped(url) {
      if (!skipNav || skipNav.size === 0) return false;
      try {
        return skipNav.has(url) || skipNav.has(normalizeBookmarkUrl(url));
      } catch {
        return skipNav.has(url);
      }
    }

    const out = [];
    const seenNav = new Set();
    let nBook = 0;
    let nHist = 0;

    for (const b of bookmarks) {
      if (!ss.enableBookmarks) break;
      if (nBook >= ss.maxBookmarks) break;
      if (navSkipped(b.url)) continue;
      const hay = `${b.title || ""} ${b.url}`.toLowerCase();
      if (!hay.includes(q)) continue;
      let key;
      try {
        key = normalizeBookmarkUrl(b.url);
      } catch {
        key = b.url;
      }
      if (seenNav.has(key)) continue;
      seenNav.add(key);
      nBook += 1;
      out.push({
        navigateUrl: b.url,
        label: b.title || shortHost(b.url),
        sub: b.url,
        badge: "Bookmark",
      });
    }
    const hist = loadHistoryFromStorage();
    for (const h of hist) {
      if (!ss.enableHistory) break;
      if (nHist >= ss.maxHistory) break;
      const dq = extractDuckDuckGoQueryFromUrl(h.url);
      if (dq && skipQ && skipQ.has(dq.toLowerCase())) continue;
      if (navSkipped(h.url)) continue;
      const hay = `${h.title || ""} ${h.url}`.toLowerCase();
      if (!hay.includes(q)) continue;
      let key;
      try {
        key = normalizeBookmarkUrl(h.url);
      } catch {
        key = h.url;
      }
      if (seenNav.has(key)) continue;
      seenNav.add(key);
      nHist += 1;
      out.push({
        navigateUrl: h.url,
        label: h.title || h.url,
        sub: h.url,
        badge: "History",
      });
    }
    return out;
  }

  /** @returns {string | null} decoded search query for DuckDuckGo search URLs */
  function extractDuckDuckGoQueryFromUrl(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.endsWith("duckduckgo.com")) return null;
      const qq = u.searchParams.get("q");
      if (qq == null || !String(qq).trim()) return null;
      return String(qq).trim();
    } catch {
      return null;
    }
  }

  /** Prior searches (DuckDuckGo) from history that match the current omnibox text */
  function collectPastSearchSuggestions(rawQuery) {
    const ss = getSearchSettings();
    if (!ss.enablePastSearch) return [];
    const needle = rawQuery.trim().toLowerCase();
    if (needle.length === 0) return [];
    const hist = loadHistoryFromStorage();
    /** @type {Map<string, { query: string, visitedAt: number }>} */
    const best = new Map();
    for (const h of hist) {
      const queryText = extractDuckDuckGoQueryFromUrl(h.url);
      if (!queryText) continue;
      const low = queryText.toLowerCase();
      if (!low.includes(needle)) continue;
      const prev = best.get(low);
      if (!prev || h.visitedAt > prev.visitedAt) {
        best.set(low, { query: queryText, visitedAt: h.visitedAt });
      }
    }
    const sorted = [...best.values()].sort((a, b) => b.visitedAt - a.visitedAt);
    const out = [];
    for (const { query } of sorted.slice(0, ss.maxPastSearch)) {
      out.push({
        navigateUrl: normalizeInput(query),
        label: query,
        sub: "Past search",
        badge: "Past search",
      });
    }
    return out;
  }

  function mergeOmniboxLayers(pastRows, localRows, remotePhrases) {
    const ss = getSearchSettings();
    const maxTotal = ss.maxTotal;
    const rows = [];
    const seenNav = new Set();
    const seenPhrase = new Set();

    function markUrls(url) {
      seenNav.add(url);
      try {
        seenNav.add(normalizeBookmarkUrl(url));
      } catch {
        /* */
      }
    }

    function tryAddRow(r) {
      if (rows.length >= maxTotal) return false;
      if (seenNav.has(r.navigateUrl)) return false;
      try {
        if (seenNav.has(normalizeBookmarkUrl(r.navigateUrl))) return false;
      } catch {
        /* */
      }
      const pl = r.label.toLowerCase();
      if (seenPhrase.has(pl)) return false;
      rows.push(r);
      markUrls(r.navigateUrl);
      seenPhrase.add(pl);
      return true;
    }

    function addRemote(phrases) {
      if (!phrases || !Array.isArray(phrases) || !ss.enableDuckDuckGo) return;
      const slice = phrases.slice(0, ss.maxDuckDuckGo);
      for (const phrase of slice) {
        if (rows.length >= maxTotal) break;
        const pl = phrase.toLowerCase();
        if (seenPhrase.has(pl)) continue;
        const nav = normalizeInput(phrase);
        if (seenNav.has(nav)) continue;
        try {
          if (seenNav.has(normalizeBookmarkUrl(nav))) continue;
        } catch {
          /* */
        }
        seenPhrase.add(pl);
        markUrls(nav);
        rows.push({
          navigateUrl: nav,
          label: phrase,
          sub: "DuckDuckGo search",
          badge: "Search",
        });
      }
    }

    const pastUse = ss.enablePastSearch ? pastRows : [];
    const localUse = localRows.filter((r) => {
      if (r.badge === "Bookmark" && !ss.enableBookmarks) return false;
      if (r.badge === "History" && !ss.enableHistory) return false;
      return true;
    });

    const byKey = {
      past: pastUse,
      local: localUse,
      remote: remotePhrases,
    };

    for (const key of ss.layerOrder) {
      if (rows.length >= maxTotal) break;
      if (key === "remote") {
        addRemote(byKey.remote);
      } else {
        for (const r of byKey[key]) {
          if (rows.length >= maxTotal) break;
          tryAddRow(r);
        }
      }
    }
    return rows;
  }

  async function fetchDuckDuckGoSuggestions(query) {
    const ss = getSearchSettings();
    const url = `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].filter((x) => typeof x === "string").slice(0, ss.maxDuckDuckGo);
    }
    return [];
  }

  function renderOmniboxSuggestionsList() {
    if (!omniboxSuggestions) return;
    omniboxSuggestions.replaceChildren();
    if (omniboxSuggestionRows.length === 0) {
      hideOmniboxSuggestions();
      return;
    }
    omniboxSuggestions.hidden = false;
    urlInput.setAttribute("aria-expanded", "true");
    if (omniboxSelectedIndex >= omniboxSuggestionRows.length) {
      omniboxSelectedIndex = omniboxSuggestionRows.length - 1;
    }
    omniboxSuggestionRows.forEach((row, i) => {
      const li = document.createElement("li");
      li.setAttribute("role", "presentation");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "omnibox-suggestion" + (i === omniboxSelectedIndex ? " is-active" : "");
      btn.setAttribute("role", "option");
      btn.id = `omnibox-suggest-${i}`;
      btn.setAttribute("aria-selected", i === omniboxSelectedIndex ? "true" : "false");
      const title = document.createElement("span");
      title.className = "omnibox-suggestion-title";
      title.textContent = row.label;
      if (row.badge) {
        const head = document.createElement("div");
        head.className = "omnibox-suggestion-head";
        const badge = document.createElement("span");
        badge.className = "omnibox-suggestion-badge";
        badge.textContent = row.badge;
        head.appendChild(badge);
        head.appendChild(title);
        btn.appendChild(head);
      } else {
        btn.appendChild(title);
      }
      if (row.sub) {
        const sub = document.createElement("span");
        sub.className = "omnibox-suggestion-sub";
        sub.textContent = row.sub;
        btn.appendChild(sub);
      }
      btn.addEventListener("click", () => {
        applyOmniboxSuggestion(i);
      });
      li.appendChild(btn);
      omniboxSuggestions.appendChild(li);
    });
    if (omniboxSelectedIndex >= 0) {
      urlInput.setAttribute("aria-activedescendant", `omnibox-suggest-${omniboxSelectedIndex}`);
    } else {
      urlInput.removeAttribute("aria-activedescendant");
    }
  }

  function applyOmniboxSuggestion(index) {
    const row = omniboxSuggestionRows[index];
    if (!row) return;
    hideOmniboxSuggestions();
    const w = getActiveWebview();
    if (w) w.loadURL(row.navigateUrl);
    else createTab(row.navigateUrl);
  }

  function moveOmniboxSelection(delta) {
    if (omniboxSuggestionRows.length === 0) return;
    const n = omniboxSuggestionRows.length;
    if (omniboxSelectedIndex < 0 && delta > 0) {
      omniboxSelectedIndex = 0;
    } else {
      omniboxSelectedIndex = Math.min(n - 1, Math.max(-1, omniboxSelectedIndex + delta));
    }
    renderOmniboxSuggestionsList();
  }

  function refreshOmniboxSuggestions() {
    if (!omniboxSuggestions) return;
    if (!isFocusInsideOmniboxWrap()) {
      hideOmniboxSuggestions();
      return;
    }
    const raw = urlInput.value;
    const q = raw.trim();
    if (!q) {
      hideOmniboxSuggestions();
      return;
    }

    const past = collectPastSearchSuggestions(raw);
    const skipNav = new Set(past.map((p) => p.navigateUrl));
    const skipQ = new Set(past.map((p) => p.label.toLowerCase()));
    const local = collectLocalOmniboxSuggestions(raw, skipNav, skipQ);
    omniboxSuggestionRows = mergeOmniboxLayers(past, local, null);
    renderOmniboxSuggestionsList();

    if (omniboxSuggestTimer) clearTimeout(omniboxSuggestTimer);

    const ss = getSearchSettings();
    if (!ss.enableDuckDuckGo || q.length < ss.remoteMinChars) {
      return;
    }

    const debouncedQuery = q;
    omniboxSuggestTimer = setTimeout(async () => {
      omniboxSuggestTimer = null;
      const still = urlInput.value.trim();
      if (still !== debouncedQuery || still.length < getSearchSettings().remoteMinChars) return;
      try {
        const remote = await fetchDuckDuckGoSuggestions(still);
        if (!isFocusInsideOmniboxWrap()) return;
        if (urlInput.value.trim() !== still) return;
        const pastFresh = collectPastSearchSuggestions(urlInput.value);
        const skipNavF = new Set(pastFresh.map((p) => p.navigateUrl));
        const skipQF = new Set(pastFresh.map((p) => p.label.toLowerCase()));
        const localFresh = collectLocalOmniboxSuggestions(urlInput.value, skipNavF, skipQF);
        omniboxSuggestionRows = mergeOmniboxLayers(pastFresh, localFresh, remote);
        omniboxSelectedIndex = Math.min(omniboxSelectedIndex, omniboxSuggestionRows.length - 1);
        renderOmniboxSuggestionsList();
      } catch {
        /* offline or blocked */
      }
    }, getSearchSettings().debounceMs);
  }

  async function buildOmniboxRowsForQuery(raw) {
    const q = String(raw ?? "").trim();
    if (!q) return [];
    const ss = getSearchSettings();
    const past = collectPastSearchSuggestions(q);
    const skipNav = new Set(past.map((p) => p.navigateUrl));
    const skipQ = new Set(past.map((p) => p.label.toLowerCase()));
    const local = collectLocalOmniboxSuggestions(q, skipNav, skipQ);
    let rows = mergeOmniboxLayers(past, local, null);
    if (!ss.enableDuckDuckGo || q.length < ss.remoteMinChars) return rows;
    try {
      const remote = await fetchDuckDuckGoSuggestions(q);
      const pastFresh = collectPastSearchSuggestions(q);
      const skipNavF = new Set(pastFresh.map((p) => p.navigateUrl));
      const skipQF = new Set(pastFresh.map((p) => p.label.toLowerCase()));
      const localFresh = collectLocalOmniboxSuggestions(q, skipNavF, skipQF);
      rows = mergeOmniboxLayers(pastFresh, localFresh, remote);
    } catch {
      /* offline */
    }
    return rows;
  }

  window.__nebulaHomeSuggestionsBuild = buildOmniboxRowsForQuery;

  function getActiveWebview() {
    const tab = tabs.find((x) => x.id === activeId);
    return tab ? tab.el : null;
  }

  function shouldDeferWebviewFocusFromWindow() {
    const ae = document.activeElement;
    if (sessionRestorePanel && !sessionRestorePanel.hidden) return true;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return true;
    if (permissionPromptPanel && !permissionPromptPanel.hidden) return true;
    if (changelogPanel && !changelogPanel.hidden) return true;
    if (vaultPanel && !vaultPanel.hidden) return true;
    if (ae === urlInput || ae?.closest?.(".omnibox-wrap")) return true;
    if (settingsPanel && !settingsPanel.hidden) return true;
    if (historyPanel && !historyPanel.hidden) return true;
    if (sitePermPanel && !sitePermPanel.hidden) return true;
    if (!findBar.hidden && (ae === findInput || ae?.closest?.("#find-bar"))) return true;
    if (tabGroupRenamePanel && !tabGroupRenamePanel.hidden) return true;
    if (tabCtxMenu && !tabCtxMenu.hidden) return true;
    return false;
  }

  function shouldDeferWebviewFocusFromTabAction() {
    const ae = document.activeElement;
    if (sessionRestorePanel && !sessionRestorePanel.hidden) return true;
    if (passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) return true;
    if (permissionPromptPanel && !permissionPromptPanel.hidden) return true;
    if (changelogPanel && !changelogPanel.hidden) return true;
    if (vaultPanel && !vaultPanel.hidden) return true;
    if (settingsPanel && !settingsPanel.hidden) return true;
    if (historyPanel && !historyPanel.hidden) return true;
    if (sitePermPanel && !sitePermPanel.hidden) return true;
    if (ae === urlInput || ae?.closest?.(".omnibox-wrap")) return true;
    if (!findBar.hidden) {
      if (ae === findInput || ae?.closest?.("#find-bar")) return true;
    }
    if (downloadsDock && !downloadsDock.hidden && ae?.closest?.("#downloads-dock")) return true;
    if (updateBanner && !updateBanner.hidden && ae?.closest?.("#update-banner")) return true;
    if (tabGroupRenamePanel && !tabGroupRenamePanel.hidden) return true;
    if (tabCtxMenu && !tabCtxMenu.hidden) return true;
    return false;
  }

  function focusActiveWebviewGuest(options) {
    const forWindow = options && options.forWindow;
    if (forWindow) {
      if (shouldDeferWebviewFocusFromWindow()) return;
    } else if (shouldDeferWebviewFocusFromTabAction()) {
      return;
    }
    const w = getActiveWebview();
    if (!w) return;
    try {
      w.focus();
    } catch {
      /* guest not ready */
    }
  }

  function applySplitRatioStyles() {
    if (!contentMain) return;
    if (!splitPair) {
      contentMain.style.removeProperty("--split-ratio");
      return;
    }
    splitRatioPct = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, splitRatioPct));
    contentMain.style.setProperty("--split-ratio", `${splitRatioPct}%`);
  }

  function applyWebviewVisibility() {
    if (btnExitSplit) btnExitSplit.hidden = !splitPair;
    if (splitResizer) {
      splitResizer.hidden = !splitPair;
      splitResizer.setAttribute("aria-hidden", splitPair ? "false" : "true");
    }

    if (!splitPair) {
      stack.classList.remove("split-active");
      applySplitRatioStyles();
      for (const t of tabs) {
        const on = t.id === activeId;
        t.tabEl.classList.toggle("active", on);
        t.el.classList.toggle("visible", on);
        t.el.classList.remove("split-pane-left", "split-pane-right");
      }
      return;
    }

    stack.classList.add("split-active");
    applySplitRatioStyles();
    for (const t of tabs) {
      const left = t.id === splitPair.leftId;
      const right = t.id === splitPair.rightId;
      const inSplit = left || right;
      t.el.classList.toggle("visible", inSplit);
      t.el.classList.toggle("split-pane-left", left);
      t.el.classList.toggle("split-pane-right", right);
      t.tabEl.classList.toggle("active", t.id === activeId);
    }
  }

  function exitSplitView() {
    splitPair = null;
    splitRatioPct = 50;
    applyWebviewVisibility();
    syncOmniboxFromWebview();
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function enterSplitView(draggedId, dropSide) {
    if (tabs.length < 2) return;
    let partnerId = activeId;
    if (draggedId === activeId) {
      partnerId = tabs.find((t) => t.id !== draggedId)?.id;
    }
    if (!partnerId || partnerId === draggedId) return;

    const leftId = dropSide === "left" ? draggedId : partnerId;
    const rightId = dropSide === "left" ? partnerId : draggedId;
    splitPair = { leftId, rightId };
    splitRatioPct = 50;
    activeId = draggedId;
    applyWebviewVisibility();
    syncOmniboxFromWebview();
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function showSplitDropZones() {
    if (!splitDropZones || tabs.length < 2) return;
    splitDropZones.hidden = false;
    splitDropZones.setAttribute("aria-hidden", "false");
  }

  function hideSplitDropZones() {
    if (!splitDropZones) return;
    splitDropZones.hidden = true;
    splitDropZones.setAttribute("aria-hidden", "true");
    for (const z of splitDropZones.querySelectorAll(".split-drop--dragover")) {
      z.classList.remove("split-drop--dragover");
    }
  }

  function wireSplitResizer() {
    if (!splitResizer || !stack) return;
    splitResizer.addEventListener("pointerdown", (e) => {
      if (!splitPair || e.button !== 0) return;
      e.preventDefault();
      const pid = e.pointerId;
      try {
        splitResizer.setPointerCapture(pid);
      } catch {
        /* ignore */
      }
      splitResizer.classList.add("is-dragging");

      const onMove = (ev) => {
        if (ev.pointerId !== pid) return;
        const r = stack.getBoundingClientRect();
        if (r.width <= 0) return;
        const x = ev.clientX - r.left;
        let pct = (x / r.width) * 100;
        pct = Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, pct));
        splitRatioPct = pct;
        applySplitRatioStyles();
      };

      const cleanup = () => {
        splitResizer.classList.remove("is-dragging");
        try {
          splitResizer.releasePointerCapture(pid);
        } catch {
          /* ignore */
        }
        splitResizer.removeEventListener("pointermove", onMove);
        splitResizer.removeEventListener("pointerup", cleanup);
        splitResizer.removeEventListener("pointercancel", cleanup);
      };

      splitResizer.addEventListener("pointermove", onMove);
      splitResizer.addEventListener("pointerup", cleanup);
      splitResizer.addEventListener("pointercancel", cleanup);
    });
  }

  function wireSplitDropZones() {
    if (!splitDropZones) return;
    for (const zone of splitDropZones.querySelectorAll("[data-split-drop]")) {
      const side = zone.dataset.splitDrop;
      if (!side) continue;
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        zone.classList.add("split-drop--dragover");
      });
      zone.addEventListener("dragleave", () => {
        zone.classList.remove("split-drop--dragover");
      });
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("split-drop--dragover");
        const draggedId = e.dataTransfer.getData(TAB_DRAG_MIME);
        if (!draggedId) return;
        hideTabReorderIndicator();
        enterSplitView(draggedId, side === "left" ? "left" : "right");
      });
    }
  }

  function setNavButtons() {
    const w = getActiveWebview();
    if (!w) {
      btnBack.disabled = true;
      btnForward.disabled = true;
      return;
    }
    try {
      btnBack.disabled = !w.canGoBack();
      btnForward.disabled = !w.canGoForward();
    } catch {
      btnBack.disabled = true;
      btnForward.disabled = true;
    }
  }

  function syncOmniboxFromWebview() {
    const w = getActiveWebview();
    if (!w) return;
    try {
      const u = w.getURL();
      if (u && u.includes(HOME_FILE)) urlInput.value = "";
      else if (u) urlInput.value = u;
    } catch {
      /* navigating */
    }
    hideOmniboxSuggestions();
  }

  function selectTab(id) {
    if (splitPair && id !== splitPair.leftId && id !== splitPair.rightId) {
      splitPair = null;
      splitRatioPct = 50;
    }
    if (id !== activeId && !findBar.hidden) {
      const prevW = activeId ? tabs.find((t) => t.id === activeId)?.el : null;
      stopFindOnWebview(prevW);
      findBar.hidden = true;
      findInput.value = "";
      findStatus.textContent = "";
    }
    activeId = id;
    applyWebviewVisibility();
    const w = getActiveWebview();
    if (w) {
      try {
        const u = w.getURL();
        urlInput.value = u && u.includes(HOME_FILE) ? "" : u || "";
      } catch {
        urlInput.value = "";
      }
    }
    setNavButtons();
    updateBookmarkStar();
    syncZoomResetButton();
    updateLoadingUI();
    scheduleSaveSessionSnapshot();
    queueMicrotask(() => focusActiveWebviewGuest());
  }

  function removeTab(id) {
    if (splitPair && (splitPair.leftId === id || splitPair.rightId === id)) {
      splitPair = null;
      splitRatioPct = 50;
    }
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const tab = tabs[idx];
    let closedUrl = homeUrl();
    try {
      closedUrl = tab.el.getURL() || homeUrl();
    } catch {
      /* ignore */
    }
    const closedTitle = tab.titleEl.textContent || "Tab";
    if (!closedUrl.includes(HOME_FILE)) {
      closedTabs.push({ url: closedUrl, title: closedTitle });
      if (closedTabs.length > CLOSED_MAX) closedTabs.shift();
    }

    const gid = tab.guestWcId;
    if (gid && window.nebula?.unregisterGuestMedia) {
      try {
        void window.nebula.unregisterGuestMedia(gid);
      } catch {
        /* ignore */
      }
    }

    tabs.splice(idx, 1);
    if (window.NebulaYoutubeAdSkip && typeof window.NebulaYoutubeAdSkip.stop === "function") {
      try {
        window.NebulaYoutubeAdSkip.stop(tab.el);
      } catch {
        /* ignore */
      }
    }
    tab.el.remove();
    pruneUnusedTabGroups();
    syncTabStripDom();

    if (activeId === id) {
      activeId = null;
      const next = tabs[Math.min(idx, tabs.length - 1)];
      if (next) selectTab(next.id);
      else {
        urlInput.value = "";
        createTab(homeUrl());
      }
    } else {
      applyWebviewVisibility();
      setNavButtons();
      updateBookmarkStar();
      syncZoomResetButton();
      updateLoadingUI();
    }
    scheduleSaveSessionSnapshot();
  }

  function reopenClosedTab() {
    const entry = closedTabs.pop();
    if (!entry) return;
    createTab(entry.url);
  }

  function stopFindOnWebview(wv) {
    if (!wv) return;
    try {
      wv.stopFindInPage("clearSelection");
    } catch {
      /* webview not ready */
    }
  }

  function runFind(text) {
    const w = getActiveWebview();
    if (!w) return;
    const q = String(text).trim();
    if (!q) {
      stopFindOnWebview(w);
      findStatus.textContent = "";
      return;
    }
    try {
      w.findInPage(q, { forward: true });
    } catch {
      /* */
    }
  }

  function findNextMatch() {
    const w = getActiveWebview();
    const q = findInput.value.trim();
    if (!w || !q) return;
    try {
      w.findInPage(q, { forward: true, findNext: true });
    } catch {
      /* */
    }
  }

  function findPrevMatch() {
    const w = getActiveWebview();
    const q = findInput.value.trim();
    if (!w || !q) return;
    try {
      w.findInPage(q, { forward: false, findNext: true });
    } catch {
      /* */
    }
  }

  function openFindBar() {
    if (historyPanel && !historyPanel.hidden) closeHistoryPanel();
    if (settingsPanel && !settingsPanel.hidden) closeSettingsPanel();
    if (sitePermPanel && !sitePermPanel.hidden) closeSitePermissionsPanel();
    hideOmniboxSuggestions();
    findBar.hidden = false;
    findInput.focus();
    findInput.select();
    if (findInput.value.trim()) runFind(findInput.value);
  }

  function closeFindBar() {
    findBar.hidden = true;
    stopFindOnWebview(getActiveWebview());
    findStatus.textContent = "";
  }

  let findDebounceTimer = null;

  function zoomInActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      const z = Math.min(ZOOM_MAX, w.getZoomFactor() * ZOOM_STEP);
      w.setZoomFactor(z);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function zoomOutActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      const z = Math.max(ZOOM_MIN, w.getZoomFactor() / ZOOM_STEP);
      w.setZoomFactor(z);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function zoomResetActive() {
    const w = getActiveWebview();
    if (!w) {
      syncZoomResetButton();
      return;
    }
    try {
      w.setZoomFactor(1);
    } catch {
      /* */
    }
    syncZoomResetButton();
  }

  function syncZoomResetButton() {
    const w = getActiveWebview();
    if (!w) {
      btnZoomReset.hidden = true;
      return;
    }
    try {
      const z = w.getZoomFactor();
      const atDefault = Math.abs(z - 1) < 0.001;
      btnZoomReset.hidden = atDefault;
    } catch {
      btnZoomReset.hidden = true;
    }
  }

  function updateLoadingUI() {
    const w = getActiveWebview();
    let loading = false;
    try {
      loading = !!(w && w.isLoading());
    } catch {
      loading = false;
    }
    if (omniboxEl) omniboxEl.classList.toggle("is-loading", loading);
    btnReload.classList.toggle("is-loading", loading);
    btnReload.title = loading ? "Stop loading" : "Reload";
    btnReload.setAttribute("aria-label", loading ? "Stop loading" : "Reload");
  }

  function reloadOrStopActive() {
    const w = getActiveWebview();
    if (!w) return;
    try {
      if (w.isLoading()) w.stop();
      else w.reload();
    } catch {
      /* */
    }
    queueMicrotask(() => updateLoadingUI());
  }

  function pruneDownloadsDockIfEmpty() {
    if (downloadsDock && downloadElById.size === 0) downloadsDock.hidden = true;
  }

  function removeDownloadRow(id) {
    const row = downloadElById.get(id);
    if (row) {
      row.remove();
      downloadElById.delete(id);
    }
    pruneDownloadsDockIfEmpty();
  }

  function handleDownloadPayload(p) {
    if (!downloadsDock) return;
    if (p.type === "start") {
      downloadsDock.hidden = false;
      const row = document.createElement("div");
      row.className = "download-row";
      row.dataset.downloadId = p.id;

      const nameEl = document.createElement("div");
      nameEl.className = "download-name";
      nameEl.textContent = p.filename;
      nameEl.title = p.filename;

      const bar = document.createElement("div");
      bar.className = "download-bar";
      const fill = document.createElement("div");
      fill.className = "download-bar-fill";
      bar.appendChild(fill);

      const actions = document.createElement("div");
      actions.className = "download-actions";

      row.appendChild(nameEl);
      row.appendChild(bar);
      row.appendChild(actions);

      /** @type {{ fill: HTMLElement, actions: HTMLElement, indeterminate?: boolean }} */
      row._downloadUi = { fill, actions };
      const startPath = p.fullPath || p.path;
      if (startPath) row._nebulaSavedPath = startPath;
      downloadsDock.appendChild(row);
      downloadElById.set(p.id, row);
      return;
    }

    const row = downloadElById.get(p.id);
    if (!row || !row._downloadUi) return;
    const ui = row._downloadUi;

    if (p.type === "progress") {
      const total = p.totalBytes || 0;
      const rec = p.receivedBytes || 0;
      row.classList.remove("download-row--indeterminate");
      if (total > 0) {
        ui.indeterminate = false;
        const pct = Math.min(100, (rec / total) * 100);
        ui.fill.style.width = `${pct}%`;
      } else {
        ui.indeterminate = true;
        row.classList.add("download-row--indeterminate");
        ui.fill.style.width = "100%";
      }
      return;
    }

    if (p.type === "done") {
      const savedPath = p.fullPath || p.path;
      if (savedPath) row._nebulaSavedPath = savedPath;

      row.classList.remove("download-row--indeterminate");
      ui.fill.style.width = p.state === "completed" ? "100%" : ui.fill.style.width;
      row.classList.add("download-row--done");
      row.classList.add(`download-row--${p.state}`);
      ui.actions.replaceChildren();

      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "download-dismiss";
      dismiss.title = "Dismiss";
      dismiss.textContent = "\u00D7";
      dismiss.addEventListener("click", () => removeDownloadRow(p.id));

      if (p.state === "completed" && savedPath && window.nebula?.openPath) {
        const openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "download-action-btn";
        openBtn.textContent = "Open";
        openBtn.addEventListener("click", () => {
          const fp = row._nebulaSavedPath;
          if (fp) void window.nebula.openPath(fp);
        });

        const folderBtn = document.createElement("button");
        folderBtn.type = "button";
        folderBtn.className = "download-action-btn";
        folderBtn.textContent = "Folder";
        folderBtn.addEventListener("click", () => {
          const fp = row._nebulaSavedPath;
          if (fp) void window.nebula.showItemInFolder(fp);
        });

        ui.actions.append(openBtn, folderBtn, dismiss);
      } else {
        const fail = document.createElement("span");
        fail.className = "download-state-msg";
        fail.textContent = p.state === "cancelled" ? "Cancelled" : "Failed";
        ui.actions.append(fail, dismiss);
      }
    }
  }

  const UPDATE_DISMISS_KEY = "nebula-dismissed-update-version";
  let pendingUpdateVersion = "";

  function tabForGuestWc(wid) {
    const n = Number(wid);
    if (!Number.isFinite(n) || n <= 0) return null;
    return tabs.find((t) => t.guestWcId === n) ?? null;
  }

  function renderTabMediaIndicators(entry) {
    if (!entry.muteBtn) return;
    const st = entry.mediaState || {};
    const audible = !!st.audible;
    const muted = !!st.audioMuted;
    const cam = !!st.camera;
    const mic = !!st.microphone;
    const spkOn =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';
    const spkOff =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    entry.muteBtn.innerHTML = muted ? spkOff : spkOn;
    entry.muteBtn.hidden = !(audible || muted);
    entry.muteBtn.title = muted ? "Unmute tab" : "Mute tab";
    entry.muteBtn.classList.toggle("is-muted", muted);
    entry.muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
    if (entry.camBtn) {
      entry.camBtn.hidden = !cam;
    }
    if (entry.micBtn) {
      entry.micBtn.hidden = !mic;
    }
    if (entry.mediaStrip) {
      const any = !entry.muteBtn.hidden || !entry.camBtn.hidden || !entry.micBtn.hidden;
      entry.mediaStrip.hidden = !any;
      entry.mediaStrip.setAttribute("aria-hidden", any ? "false" : "true");
    }
  }

  async function offerUpdateInstall(r) {
    if (!r || !r.updateAvailable) return;
    try {
      if (window.nebula?.promptUpdateInstallChoice) {
        const res = await window.nebula.promptUpdateInstallChoice({
          currentVersion: typeof r.currentVersion === "string" ? r.currentVersion : "",
          latestVersion: typeof r.latestVersion === "string" ? r.latestVersion : "",
          installerUrl: typeof r.installerUrl === "string" ? r.installerUrl : "",
          portableUrl: typeof r.portableUrl === "string" ? r.portableUrl : "",
          releaseUrl: typeof r.releaseUrl === "string" ? r.releaseUrl : "",
        });
        if (res?.choice === "cancel") {
          showUpdateBanner(r);
          return;
        }
        const releaseUrl = typeof res.releaseUrl === "string" ? res.releaseUrl.trim() : "";
        if (res.choice === "portable") {
          const u = (typeof res.portableUrl === "string" ? res.portableUrl.trim() : "") || releaseUrl;
          if (u && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
          return;
        }
        if (res.choice === "installer") {
          const inst = typeof res.installerUrl === "string" ? res.installerUrl.trim() : "";
          if (inst && window.nebula?.startWindowsInstallerUpdate) {
            const r2 = await window.nebula.startWindowsInstallerUpdate({ url: inst });
            if (r2?.ok) return;
            if (r2?.cancelled) {
              if (releaseUrl && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(releaseUrl);
              return;
            }
            const fallback = inst || releaseUrl;
            if (fallback && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(fallback);
            return;
          }
          const open = inst || releaseUrl;
          if (open && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(open);
        }
        return;
      }
    } catch {
      /* */
    }
    const u = typeof r.releaseUrl === "string" ? r.releaseUrl.trim() : "";
    if (u && window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
    else showUpdateBanner(r);
  }

  async function runUpdateCheck(verbose) {
    try {
      const r = await window.nebula?.checkForUpdates?.();
      if (!r?.ok) {
        if (verbose) alert(String(r?.reason || "Could not check for updates."));
        return;
      }
      if (r.skipped) {
        if (settingsUpdateHint) {
          settingsUpdateHint.hidden = false;
          settingsUpdateHint.textContent =
            'Add "nebula.updateRepo": "owner/repo" or a GitHub "repository" URL in package.json to enable release checks.';
        }
        if (verbose) {
          alert(
            'Configure updates: set nebula.updateRepo to your GitHub owner/repo (or add a repository URL), rebuild, and try again.'
          );
        }
        return;
      }
      if (settingsUpdateHint) {
        settingsUpdateHint.hidden = true;
        settingsUpdateHint.textContent = "";
      }
      if (r.updateAvailable && typeof r.latestVersion === "string") {
        const dismissed = sessionStorage.getItem(UPDATE_DISMISS_KEY) || "";
        if (dismissed === r.latestVersion) return;
        if (verbose) {
          await offerUpdateInstall(r);
        } else {
          const sk = `nebula-update-offered-${r.latestVersion}`;
          if (sessionStorage.getItem(sk)) {
            showUpdateBanner(r);
          } else {
            await offerUpdateInstall(r);
            sessionStorage.setItem(sk, "1");
          }
        }
      } else if (verbose) {
        alert(`You're up to date (${r.currentVersion || ""}).`);
      }
    } catch {
      if (verbose) alert("Could not check for updates.");
    }
  }

  function showUpdateBanner(r) {
    if (!updateBanner || !updateBannerText) return;
    const cur = typeof r.currentVersion === "string" ? r.currentVersion : "";
    const lat = typeof r.latestVersion === "string" ? r.latestVersion : "";
    pendingUpdateVersion = lat;
    updateBannerText.textContent =
      lat && cur ? `Update available: v${lat} (you have v${cur}).` : "An update is available.";
    updateBanner.hidden = false;
    updateBanner.setAttribute("aria-hidden", "false");
    if (updateBannerDownload) {
      updateBannerDownload.onclick = () => {
        void offerUpdateInstall(r);
      };
    }
  }

  function hideUpdateBanner() {
    if (!updateBanner) return;
    updateBanner.hidden = true;
    updateBanner.setAttribute("aria-hidden", "true");
  }

  function createTab(initialUrl, opts) {
    const id = "t" + ++idSeq;
    const url = initialUrl || homeUrl();
    const optGid =
      opts && opts.groupId && typeof opts.groupId === "string" && tabGroups.some((g) => g.id === opts.groupId)
        ? opts.groupId
        : null;

    const tabEl = document.createElement("div");
    tabEl.className = "tab";
    tabEl.dataset.tabId = id;
    tabEl.title = "Drag to reorder · drop on a group header to join it · drop outside groups to leave · right-click for menu";
    const faviconEl = document.createElement("img");
    faviconEl.className = "tab-favicon";
    faviconEl.alt = "";
    faviconEl.width = 16;
    faviconEl.height = 16;
    faviconEl.decoding = "async";
    faviconEl.hidden = true;
    faviconEl.addEventListener("error", () => {
      faviconEl.hidden = true;
      faviconEl.removeAttribute("src");
    });
    const titleEl = document.createElement("span");
    titleEl.className = "tab-title";
    titleEl.textContent = "New tab";

    const mediaStrip = document.createElement("div");
    mediaStrip.className = "tab-media-strip";
    mediaStrip.setAttribute("aria-hidden", "true");

    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.className = "tab-media-btn tab-media-mute";
    muteBtn.hidden = true;
    muteBtn.setAttribute("aria-label", "Mute tab");

    const camBtn = document.createElement("button");
    camBtn.type = "button";
    camBtn.className = "tab-media-btn tab-media-cam";
    camBtn.hidden = true;
    camBtn.title = "Turn off camera";
    camBtn.setAttribute("aria-label", "Turn off camera");
    camBtn.innerHTML =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';

    const micBtn = document.createElement("button");
    micBtn.type = "button";
    micBtn.className = "tab-media-btn tab-media-mic";
    micBtn.hidden = true;
    micBtn.title = "Turn off microphone";
    micBtn.setAttribute("aria-label", "Turn off microphone");
    micBtn.innerHTML =
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/><path d="M19 11a7 7 0 01-14 0"/><path d="M12 18v3"/></svg>';

    mediaStrip.appendChild(muteBtn);
    mediaStrip.appendChild(camBtn);
    mediaStrip.appendChild(micBtn);

    const entry = {
      id,
      el: null,
      tabEl,
      titleEl,
      faviconEl,
      groupId: optGid,
      guestWcId: null,
      muteBtn,
      camBtn,
      micBtn,
      mediaStrip,
      mediaState: { audible: false, audioMuted: false, camera: false, microphone: false },
    };

    muteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      if (!window.nebula?.setGuestAudioMuted) return;
      const next = !entry.mediaState.audioMuted;
      try {
        const r = await window.nebula.setGuestAudioMuted({ guestWebContentsId: entry.guestWcId, muted: next });
        if (r?.ok && typeof r.audioMuted === "boolean") {
          entry.mediaState.audioMuted = r.audioMuted;
          renderTabMediaIndicators(entry);
        }
      } catch {
        /* */
      }
    });
    camBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      try {
        await window.nebula.stopGuestMediaTracks?.({ guestWebContentsId: entry.guestWcId, kind: "video" });
      } catch {
        /* */
      }
    });
    micBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!entry.guestWcId) return;
      try {
        await window.nebula.stopGuestMediaTracks?.({ guestWebContentsId: entry.guestWcId, kind: "audio" });
      } catch {
        /* */
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "tab-close";
    closeBtn.innerHTML = "\u00D7";
    closeBtn.title = "Close tab";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeTab(id);
    });
    tabEl.appendChild(faviconEl);
    tabEl.appendChild(titleEl);
    tabEl.appendChild(mediaStrip);
    tabEl.appendChild(closeBtn);
    tabEl.draggable = true;
    tabEl.addEventListener("dragstart", (e) => {
      if (e.target.closest(".tab-close, .tab-media-btn")) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(TAB_DRAG_MIME, id);
      tabStripReorderActive = true;
      showSplitDropZones();
    });
    tabEl.addEventListener("dragend", () => {
      suppressTabClickUntil = Date.now() + 280;
      hideSplitDropZones();
      hideTabReorderIndicator();
    });
    tabEl.addEventListener("click", (e) => {
      if (Date.now() < suppressTabClickUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      selectTab(id);
    });
    tabEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTabContextMenu();
      openTabContextMenu(e.clientX, e.clientY, id);
    });

    const el = document.createElement("webview");
    entry.el = el;
    if (isWelcomePageUrl(url)) {
      const pp = getHomePreloadPathForWebview();
      if (pp) el.setAttribute("preload", pp);
    }
    el.setAttribute("src", url);
    el.setAttribute("partition", WEB_PARTITION);
    el.setAttribute("allowpopups", "true");
    el.setAttribute("allowfullscreen", "true");
    el.setAttribute(
      "webpreferences",
      "contextIsolation=yes,nodeIntegration=no,sandbox=no,nativeWindowOpen=yes,autoplayPolicy=no-user-gesture-required"
    );
    stack.appendChild(el);

    el.addEventListener("ipc-message", (event) => {
      const ch = event.channel;
      if (ch !== "nebula-login-capture") return;
      const payload = event.args && event.args[0];
      if (!payload || typeof payload !== "object") return;
      considerLoginCaptureForVault(id, payload);
    });

    el.addEventListener("dom-ready", () => {
      try {
        const wid = typeof el.getWebContentsId === "function" ? el.getWebContentsId() : 0;
        if (wid) {
          entry.guestWcId = wid;
          if (window.nebula?.registerGuestWindowOpen) void window.nebula.registerGuestWindowOpen(wid);
          if (window.nebula?.registerGuestMedia) void window.nebula.registerGuestMedia(wid);
        }
      } catch {
        /* ignore */
      }
    });

    if (window.NebulaYoutubeAdSkip && typeof window.NebulaYoutubeAdSkip.install === "function") {
      window.NebulaYoutubeAdSkip.install(el);
    }

    el.addEventListener("context-menu", (ev) => {
      ev.preventDefault();
      if (!window.nebula?.showWebviewContextMenu) return;
      try {
        const p = ev.params;
        if (!p) return;
        const wid = typeof el.getWebContentsId === "function" ? el.getWebContentsId() : 0;
        const frame = p.frame;
        void window.nebula.showWebviewContextMenu({
          guestWebContentsId: wid,
          linkURL: p.linkURL || "",
          linkText: p.linkText || "",
          pageURL: p.pageURL || "",
          frameURL: p.frameURL || "",
          srcURL: p.srcURL || "",
          mediaType: p.mediaType || "none",
          selectionText: p.selectionText || "",
          isEditable: !!p.isEditable,
          clientX: typeof p.x === "number" ? p.x : undefined,
          clientY: typeof p.y === "number" ? p.y : undefined,
          frameProcessId: frame && typeof frame.processId === "number" ? frame.processId : undefined,
          frameRoutingId: frame && typeof frame.routingId === "number" ? frame.routingId : undefined,
        });
      } catch {
        /* ignore */
      }
    });

    tabs.push(entry);
    syncTabStripDom();

    el.addEventListener("page-favicon-updated", (e) => {
      const favs = e.favicons || (e.detail && e.detail.favicons);
      if (favs && favs.length > 0) {
        faviconEl.src = favs[0];
        faviconEl.hidden = false;
      }
    });
    el.addEventListener("did-start-loading", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("did-stop-loading", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("is-loading-changed", () => {
      if (activeId === id) updateLoadingUI();
    });
    el.addEventListener("page-title-updated", (e) => {
      titleEl.textContent = e.title || "Untitled";
    });
    el.addEventListener("did-navigate", () => {
      faviconEl.hidden = true;
      faviconEl.removeAttribute("src");
      if (sessionVaultOfferTimerId != null) {
        clearTimeout(sessionVaultOfferTimerId);
        sessionVaultOfferTimerId = null;
      }
      if (activeId === id && !findBar.hidden) {
        stopFindOnWebview(el);
        findStatus.textContent = "";
      }
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        if (sitePermPanel && !sitePermPanel.hidden) void refreshSitePermPanel();
      }
      scheduleSaveSessionSnapshot();
    });
    el.addEventListener("did-navigate-in-page", (e) => {
      const u = e.url || "";
      if (u && !shouldSkipHistoryUrl(u)) {
        recordHistoryVisit(u, titleEl.textContent || "");
      }
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        if (sitePermPanel && !sitePermPanel.hidden) void refreshSitePermPanel();
      }
      scheduleSaveSessionSnapshot();
    });
    el.addEventListener("found-in-page", (e) => {
      if (activeId !== id || findBar.hidden) return;
      const r = e.result;
      const total = typeof r.matches === "number" ? r.matches : 0;
      const cur = typeof r.activeMatchOrdinal === "number" ? r.activeMatchOrdinal : 0;
      const q = findInput.value.trim();
      if (!q) {
        findStatus.textContent = "";
        return;
      }
      if (total === 0) findStatus.textContent = "No results";
      else findStatus.textContent = `${cur} of ${total}`;
    });
    el.addEventListener("did-finish-load", () => {
      if (activeId === id) {
        syncOmniboxFromWebview();
        setNavButtons();
        updateBookmarkStar();
        syncZoomResetButton();
        updateLoadingUI();
      }
      if (activeId === id && !findBar.hidden && findInput.value.trim()) {
        runFind(findInput.value);
      }
      tryRecordHistoryForTab(id);
      scheduleSessionVaultOfferCheck(id);
    });

    selectTab(id);
    return entry;
  }

  async function addSessionVaultPlaceholderFromMenu() {
    const w = getActiveWebview();
    if (!w) return;
    let pageUrl = "";
    let title = "";
    try {
      pageUrl = w.getURL() || "";
      title = w.getTitle() || "";
    } catch {
      return;
    }
    if (!/^https:\/\//i.test(pageUrl)) {
      alert("Open an HTTPS page first.");
      return;
    }
    try {
      const r = await window.nebula?.vaultAddSessionPlaceholder?.({
        pageUrl,
        title,
        skipCookieCheck: true,
      });
      if (r?.ok) {
        if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
        return;
      }
      if (r?.error === "exists") {
        alert("This site is already in your saved passwords.");
        return;
      }
      if (r?.error === "login_page") {
        alert("This URL looks like a sign-in page. Open the site after you are logged in, then try again.");
        return;
      }
      alert("Could not add this site.");
    } catch {
      alert("Could not add this site.");
    }
  }

  function handleAction(action) {
    const w = getActiveWebview();
    switch (action) {
      case "new-tab":
        createTab(homeUrl());
        break;
      case "close-tab":
        if (activeId) removeTab(activeId);
        break;
      case "reopen-tab":
        reopenClosedTab();
        break;
      case "back":
        if (w && w.canGoBack()) w.goBack();
        break;
      case "forward":
        if (w && w.canGoForward()) w.goForward();
        break;
      case "home":
        if (w) w.loadURL(homeUrl());
        break;
      case "reload":
        reloadOrStopActive();
        break;
      case "picture-in-picture":
        void (async () => {
          const guest = getActiveWebview();
          if (!guest) return;
          let wid = 0;
          try {
            wid = typeof guest.getWebContentsId === "function" ? guest.getWebContentsId() : 0;
          } catch {
            wid = 0;
          }
          if (!wid || !window.nebula?.requestPictureInPicture) return;
          try {
            const r = await window.nebula.requestPictureInPicture({ guestWebContentsId: wid });
            if (r && r.ok) return;
            const reason = r && typeof r.reason === "string" ? r.reason : "";
            if (reason === "no-video") return;
            if (reason) alert(`Picture in picture: ${reason}`);
          } catch {
            /* */
          }
        })();
        break;
      case "focus-omnibox":
        urlInput.focus();
        urlInput.select();
        break;
      case "toggle-bookmark":
        toggleBookmarkCurrent();
        break;
      case "find-in-page":
        openFindBar();
        break;
      case "show-history":
        toggleHistoryPanel();
        break;
      case "show-site-permissions":
        toggleSitePermissionsPanel();
        break;
      case "show-password-manager":
        toggleVaultPanel();
        break;
      case "add-session-vault-placeholder":
        void addSessionVaultPlaceholderFromMenu();
        break;
      case "open-settings":
        openSettingsPanel();
        break;
      case "check-for-updates":
        void runUpdateCheck(true);
        break;
      case "zoom-in":
        zoomInActive();
        break;
      case "zoom-out":
        zoomOutActive();
        break;
      case "zoom-reset":
        zoomResetActive();
        break;
      default:
        break;
    }
  }

  btnBack.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w && w.canGoBack()) w.goBack();
  });
  btnForward.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w && w.canGoForward()) w.goForward();
  });
  btnReload.addEventListener("click", () => reloadOrStopActive());
  btnHome.addEventListener("click", () => {
    const w = getActiveWebview();
    if (w) w.loadURL(homeUrl());
  });
  function openNewTabFromChrome() {
    createTab(homeUrl());
  }
  btnNewTab.addEventListener("click", openNewTabFromChrome);
  btnNewTabStrip?.addEventListener("click", openNewTabFromChrome);
  btnZoomReset.addEventListener("click", () => zoomResetActive());
  btnBookmark.addEventListener("click", () => toggleBookmarkCurrent());
  if (btnExitSplit) {
    btnExitSplit.addEventListener("click", () => exitSplitView());
  }

  stack.addEventListener(
    "mousedown",
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== "WEBVIEW") return;
      const tab = tabs.find((t) => t.el === el);
      if (!tab) return;
      if (
        splitPair &&
        (tab.id === splitPair.leftId || tab.id === splitPair.rightId) &&
        activeId !== tab.id
      ) {
        selectTab(tab.id);
      }
      try {
        el.focus();
      } catch {
        /* */
      }
    },
    true
  );

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (omniboxSelectedIndex >= 0 && omniboxSuggestionRows[omniboxSelectedIndex]) {
      applyOmniboxSuggestion(omniboxSelectedIndex);
      return;
    }
    const w = getActiveWebview();
    const target = normalizeInput(urlInput.value);
    if (w) w.loadURL(target);
    else createTab(target);
  });

  form.addEventListener("mousedown", (e) => {
    if (e.target.closest?.(".omnibox-suggestion")) e.preventDefault();
  });

  form.addEventListener("focusout", (e) => {
    const next = e.relatedTarget;
    if (next && form.contains(next)) return;
    hideOmniboxSuggestions();
  });

  if (btnSettings) {
    btnSettings.addEventListener("click", () => openSettingsPanel());
  }
  settingsPanelClose?.addEventListener("click", () => closeSettingsPanel());
  settingsPanelBackdrop?.addEventListener("click", () => closeSettingsPanel());
  settingsSaveBtn?.addEventListener("click", () => void saveSettingsFromForm());

  settingsBookmarksImportMerge?.addEventListener("click", () => void runBookmarkImport(false));
  settingsBookmarksImportReplace?.addEventListener("click", () => void runBookmarkImport(true));
  settingsBookmarksExportHtml?.addEventListener("click", () => void runBookmarkExport("html"));
  settingsBookmarksExportJson?.addEventListener("click", () => void runBookmarkExport("json"));
  settingsOpenChangelog?.addEventListener("click", () => void openChangelogPanel());
  changelogPanelClose?.addEventListener("click", () => closeChangelogPanel());
  changelogPanelBackdrop?.addEventListener("click", () => closeChangelogPanel());

  permissionPromptAllow?.addEventListener("click", () => finishPermissionPrompt(true));
  permissionPromptBlock?.addEventListener("click", () => finishPermissionPrompt(false));
  permissionPromptBackdrop?.addEventListener("click", () => rejectActivePermissionIfAny());

  passwordSaveOfferSave?.addEventListener("click", () => void confirmPasswordSaveOffer());
  passwordSaveOfferDismiss?.addEventListener("click", () => closePasswordSaveOfferPanel());
  passwordSaveOfferNever?.addEventListener("click", () => {
    const cur = activeSaveOffer;
    const o = cur?.origin;
    if (typeof o === "string" && o) {
      if (cur?.kind === "session") persistSessionVaultDenyOrigin(o);
      else persistPasswordSaveDenyOrigin(o);
    }
    closePasswordSaveOfferPanel();
  });
  passwordSaveOfferBackdrop?.addEventListener("click", () => closePasswordSaveOfferPanel());

  vaultPanelClose?.addEventListener("click", () => closeVaultPanel());
  vaultPanelBackdrop?.addEventListener("click", () => closeVaultPanel());
  vaultSearchInput?.addEventListener("input", () => renderVaultList());
  vaultFilter?.addEventListener("change", () => {
    vaultListFilter = /** @type {typeof vaultListFilter} */ (vaultFilter.value || "all");
    renderVaultList();
  });
  vaultExportBtn?.addEventListener("click", async () => {
    try {
      const includePw = vaultExportIncludePasswords?.checked !== false;
      const r = await window.nebula?.vaultExportJsonFile?.({ includePasswords: includePw });
      if (r?.locked) {
        void loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          vaultHintEncryption.textContent =
            "Unlock the vault before exporting (full export includes passwords; you can still export an outline without them after unlock).";
        }
        return;
      }
      if (r?.ok && typeof r.count === "number" && vaultHintEncryption) {
        const p = typeof r.path === "string" ? r.path : "";
        const red = r.redacted === true ? " (passwords omitted)" : "";
        vaultHintEncryption.textContent = `Exported ${r.count} ${r.count === 1 ? "entry" : "entries"}${red}${p ? ` to ${p}` : ""}.`;
        window.setTimeout(() => void refreshVaultHint(), 4000);
      } else if (r && !r.canceled && r.error) {
        alert(String(r.error));
      }
    } catch {
      /* */
    }
  });
  vaultImportBtn?.addEventListener("click", async () => {
    try {
      const mode = vaultImportMode?.value === "replace" ? "replace" : "merge";
      if (mode === "replace") {
        const ok = window.confirm(
          "Replace every saved password in Nebula with this file? Entries not in the file are removed. This cannot be undone."
        );
        if (!ok) return;
      }
      const r = await window.nebula?.vaultImportJsonMerge?.({ mode });
      if (r?.locked) {
        void loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          vaultHintEncryption.textContent = "Unlock the vault before importing (imports can add or replace passwords).";
        }
        return;
      }
      if (r?.ok) {
        await loadVaultEntriesFromMain();
        if (vaultHintEncryption) {
          const a = typeof r.added === "number" ? r.added : 0;
          const s = typeof r.skipped === "number" ? r.skipped : 0;
          if (r.mode === "replace") {
            vaultHintEncryption.textContent = `Import complete: vault replaced with ${a} ${a === 1 ? "entry" : "entries"} (${s} invalid rows skipped).`;
          } else {
            vaultHintEncryption.textContent = `Import complete: added ${a}, skipped ${s} (duplicate origin+username or invalid rows).`;
          }
          window.setTimeout(() => void refreshVaultHint(), 4500);
        }
      } else if (r && !r.canceled && r.error) {
        alert(String(r.error));
      }
    } catch {
      /* */
    }
  });
  vaultAddToggle?.addEventListener("click", () => {
    if (!vaultFormWrap) return;
    const show = vaultFormWrap.hidden;
    vaultFormWrap.hidden = !show;
    if (!vaultFormWrap.hidden) {
      resetVaultForm();
      queueMicrotask(() => vaultFieldUrl?.focus());
    }
  });
  vaultFormCancel?.addEventListener("click", () => {
    if (vaultFormWrap) vaultFormWrap.hidden = true;
    resetVaultForm();
  });
  vaultFormSave?.addEventListener("click", async () => {
    const url = vaultFieldUrl?.value?.trim() || "";
    const username = vaultFieldUser?.value ?? "";
    const password = vaultFieldPass?.value ?? "";
    if (!url || !username) {
      alert("Enter at least a website URL and username.");
      return;
    }
    const editId = vaultEditId?.value?.trim() || "";
    try {
      if (editId) {
        const r = await window.nebula?.vaultUpdate?.({
          id: editId,
          patch: {
            url,
            title: vaultFieldTitle?.value ?? "",
            username,
            password,
            notes: vaultFieldNotes?.value ?? "",
          },
        });
        if (r?.locked) {
          await loadVaultEntriesFromMain();
          if (vaultHintEncryption) {
            vaultHintEncryption.textContent = "Unlock the vault to edit saved passwords.";
          }
          return;
        }
        if (r && !r.ok) return;
      } else {
        await window.nebula?.vaultAdd?.({
          url,
          title: vaultFieldTitle?.value ?? "",
          username,
          password,
          notes: vaultFieldNotes?.value ?? "",
        });
      }
      if (vaultFormWrap) vaultFormWrap.hidden = true;
      resetVaultForm();
      await loadVaultEntriesFromMain();
    } catch {
      /* ignore */
    }
  });
  settingsOpenVault?.addEventListener("click", () => void openVaultPanel());

  vaultUnlockSubmit?.addEventListener("click", () => void submitVaultUnlock());
  vaultUnlockPass?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submitVaultUnlock();
    }
  });
  vaultLockBtn?.addEventListener("click", async () => {
    await window.nebula?.accountLock?.();
    await loadVaultEntriesFromMain();
  });

  nebulaAccountCreateBtn?.addEventListener("click", async () => {
    const a = nebulaAccountNewPass?.value ?? "";
    const b = nebulaAccountConfirmPass?.value ?? "";
    setNebulaAccountSettingsMessage("");
    if (a !== b) {
      setNebulaAccountSettingsMessage("Passwords do not match.");
      return;
    }
    try {
      const r = await window.nebula?.accountCreate?.({ password: a });
      if (r?.ok) {
        if (nebulaAccountNewPass) nebulaAccountNewPass.value = "";
        if (nebulaAccountConfirmPass) nebulaAccountConfirmPass.value = "";
        setNebulaAccountSettingsMessage(
          "Local Nebula account created. Saved passwords stay locked until you unlock (about 15 minutes per unlock)."
        );
        await refreshNebulaAccountSettingsUI();
        return;
      }
      if (r?.error === "weak") {
        const st = await window.nebula?.accountStatus?.();
        const n = st?.minPasswordLength ?? 8;
        setNebulaAccountSettingsMessage(`Use at least ${n} characters.`);
        return;
      }
      setNebulaAccountSettingsMessage("Could not create account.");
    } catch {
      setNebulaAccountSettingsMessage("Could not create account.");
    }
  });

  nebulaAccountChangeBtn?.addEventListener("click", async () => {
    const cur = nebulaAccountCurrentPass?.value ?? "";
    const next = nebulaAccountChangeNewPass?.value ?? "";
    setNebulaAccountSettingsMessage("");
    try {
      const r = await window.nebula?.accountChange?.({ currentPassword: cur, newPassword: next });
      if (r?.ok) {
        if (nebulaAccountCurrentPass) nebulaAccountCurrentPass.value = "";
        if (nebulaAccountChangeNewPass) nebulaAccountChangeNewPass.value = "";
        setNebulaAccountSettingsMessage("Password updated.");
        return;
      }
      if (r?.error === "bad_password") {
        setNebulaAccountSettingsMessage("Current password is wrong.");
        return;
      }
      if (r?.error === "weak") {
        const st = await window.nebula?.accountStatus?.();
        const n = st?.minPasswordLength ?? 8;
        setNebulaAccountSettingsMessage(`New password must be at least ${n} characters.`);
        return;
      }
      setNebulaAccountSettingsMessage("Could not change password.");
    } catch {
      setNebulaAccountSettingsMessage("Could not change password.");
    }
  });

  nebulaAccountRemoveBtn?.addEventListener("click", async () => {
    setNebulaAccountSettingsMessage("");
    const pwd = nebulaAccountCurrentPass?.value ?? "";
    if (!pwd) {
      setNebulaAccountSettingsMessage("Enter your current password to remove the account.");
      return;
    }
    if (
      !confirm(
        "Remove your local Nebula account? You will no longer need this password to view saved passwords (the vault file is unchanged)."
      )
    ) {
      return;
    }
    try {
      const r = await window.nebula?.accountRemove?.({ password: pwd });
      if (r?.ok) {
        if (nebulaAccountCurrentPass) nebulaAccountCurrentPass.value = "";
        if (nebulaAccountChangeNewPass) nebulaAccountChangeNewPass.value = "";
        setNebulaAccountSettingsMessage("Local Nebula account removed.");
        await refreshNebulaAccountSettingsUI();
        if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
        return;
      }
      if (r?.error === "bad_password") {
        setNebulaAccountSettingsMessage("Wrong password.");
        return;
      }
      setNebulaAccountSettingsMessage("Could not remove account.");
    } catch {
      setNebulaAccountSettingsMessage("Could not remove account.");
    }
  });

  nebulaAccountLockNowBtn?.addEventListener("click", async () => {
    setNebulaAccountSettingsMessage("");
    try {
      await window.nebula?.accountLock?.();
      setNebulaAccountSettingsMessage("Vault locked.");
      if (vaultPanel && !vaultPanel.hidden) await loadVaultEntriesFromMain();
    } catch {
      setNebulaAccountSettingsMessage("Could not lock.");
    }
  });

  if (window.nebula?.onPermissionRequest) {
    window.nebula.onPermissionRequest((payload) => openPermissionPromptPanel(payload));
  }

  historyPanelClose?.addEventListener("click", () => closeHistoryPanel());
  historyPanelBackdrop?.addEventListener("click", () => closeHistoryPanel());
  sitePermClose?.addEventListener("click", () => closeSitePermissionsPanel());
  sitePermBackdrop?.addEventListener("click", () => closeSitePermissionsPanel());
  btnSitePerm?.addEventListener("click", () => toggleSitePermissionsPanel());
  document.getElementById("site-perm-global-3p")?.addEventListener("change", () => void onSitePermGlobalChange());
  sitePermPanel?.addEventListener("change", (e) => {
    void onSitePermDefaultChange(e);
    void onSitePermSelectChange(e);
  });

  historyClearBtn?.addEventListener("click", () => {
    if (!confirm("Clear all history in Nebula?")) return;
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryList();
  });

  urlInput.addEventListener("focus", () => {
    urlInput.select();
    queueMicrotask(() => {
      if (urlInput.value.trim().length > 0) refreshOmniboxSuggestions();
    });
  });

  urlInput.addEventListener("input", () => {
    refreshOmniboxSuggestions();
  });

  urlInput.addEventListener("keydown", (e) => {
    if (!omniboxSuggestions || omniboxSuggestions.hidden || omniboxSuggestionRows.length === 0) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveOmniboxSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveOmniboxSelection(-1);
    } else if (e.key === "Enter" && omniboxSelectedIndex >= 0) {
      e.preventDefault();
      applyOmniboxSuggestion(omniboxSelectedIndex);
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (settingsShortcutMatch(e)) {
        e.preventDefault();
        toggleSettingsPanel();
        return;
      }
      if (e.key === "Escape" && tabGroupRenamePanel && !tabGroupRenamePanel.hidden) {
        e.preventDefault();
        closeTabGroupRenameDialog();
        return;
      }
      if (e.key === "Escape" && tabCtxMenu && !tabCtxMenu.hidden) {
        e.preventDefault();
        hideTabContextMenu();
        return;
      }
      if (e.key === "Escape" && sessionRestorePanel && !sessionRestorePanel.hidden) {
        e.preventDefault();
        closeSessionRestorePanel();
        finishStartupWithFreshHome();
        return;
      }
      if (e.key === "Escape" && passwordSaveOfferPanel && !passwordSaveOfferPanel.hidden) {
        e.preventDefault();
        closePasswordSaveOfferPanel();
        return;
      }
      if (e.key === "Escape" && permissionPromptPanel && !permissionPromptPanel.hidden) {
        e.preventDefault();
        rejectActivePermissionIfAny();
        return;
      }
      if (e.key === "Escape" && vaultPanel && !vaultPanel.hidden) {
        e.preventDefault();
        if (vaultFormWrap && !vaultFormWrap.hidden) {
          vaultFormWrap.hidden = true;
          resetVaultForm();
          return;
        }
        closeVaultPanel();
        return;
      }
      if (e.key === "Escape" && changelogPanel && !changelogPanel.hidden) {
        e.preventDefault();
        closeChangelogPanel();
        return;
      }
      if (e.key === "Escape" && settingsPanel && !settingsPanel.hidden) {
        e.preventDefault();
        closeSettingsPanel();
        return;
      }
      if (e.key === "Escape" && sitePermPanel && !sitePermPanel.hidden) {
        e.preventDefault();
        closeSitePermissionsPanel();
        return;
      }
      if (e.key === "Escape" && omniboxSuggestions && !omniboxSuggestions.hidden) {
        e.preventDefault();
        hideOmniboxSuggestions();
        return;
      }
      if (historyShortcutMatch(e)) {
        e.preventDefault();
        toggleHistoryPanel();
        return;
      }
      if (e.key === "Escape" && historyPanel && !historyPanel.hidden) {
        e.preventDefault();
        closeHistoryPanel();
        return;
      }
      if (e.key === "Escape" && !findBar.hidden) {
        e.preventDefault();
        closeFindBar();
      }
    },
    true
  );

  findInput.addEventListener("input", () => {
    if (findDebounceTimer) clearTimeout(findDebounceTimer);
    findDebounceTimer = setTimeout(() => {
      findDebounceTimer = null;
      runFind(findInput.value);
    }, 100);
  });

  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) findPrevMatch();
      else findNextMatch();
    }
  });

  findPrevBtn.addEventListener("click", () => findPrevMatch());
  findNextBtn.addEventListener("click", () => findNextMatch());
  findCloseBtn.addEventListener("click", () => closeFindBar());

  if (window.nebula?.onDownload) {
    window.nebula.onDownload(handleDownloadPayload);
  }

  if (updateBannerDismiss) {
    updateBannerDismiss.addEventListener("click", () => {
      if (pendingUpdateVersion) sessionStorage.setItem(UPDATE_DISMISS_KEY, pendingUpdateVersion);
      hideUpdateBanner();
    });
  }
  if (settingsCheckUpdates) {
    settingsCheckUpdates.addEventListener("click", () => void runUpdateCheck(true));
  }
  if (settingsOpenEvsDocs) {
    settingsOpenEvsDocs.addEventListener("click", (e) => {
      e.preventDefault();
      const u = "https://github.com/castlabs/electron-releases/wiki/EVS";
      if (window.nebula?.openExternalUrl) void window.nebula.openExternalUrl(u);
    });
  }

  if (window.nebula?.onTabMediaState) {
    window.nebula.onTabMediaState((payload) => {
      if (!payload || typeof payload !== "object") return;
      const wid = payload.guestWebContentsId;
      const tab = tabForGuestWc(wid);
      if (!tab) return;
      if (typeof payload.audible === "boolean") tab.mediaState.audible = payload.audible;
      if (typeof payload.audioMuted === "boolean") tab.mediaState.audioMuted = payload.audioMuted;
      renderTabMediaIndicators(tab);
    });
  }
  if (window.nebula?.onTabCaptureState) {
    window.nebula.onTabCaptureState((payload) => {
      if (!payload || typeof payload !== "object") return;
      const wid = payload.guestWebContentsId;
      const tab = tabForGuestWc(wid);
      if (!tab) return;
      if (typeof payload.camera === "boolean") tab.mediaState.camera = payload.camera;
      if (typeof payload.microphone === "boolean") tab.mediaState.microphone = payload.microphone;
      renderTabMediaIndicators(tab);
    });
  }

  if (window.nebula?.onAction) {
    window.nebula.onAction(handleAction);
  }

  if (window.nebula?.onContextAction) {
    window.nebula.onContextAction((payload) => {
      if (!payload || typeof payload !== "object") return;
      if (payload.type === "new-tab" && typeof payload.url === "string") {
        const u = payload.url.trim();
        if (!u) return;
        try {
          const parsed = new URL(u);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            createTab(u);
          }
        } catch {
          /* ignore */
        }
      }
    });
  }

  if (window.nebula?.onOpenUrlInTab) {
    window.nebula.onOpenUrlInTab((payload) => {
      const u = typeof payload?.url === "string" ? payload.url.trim() : "";
      if (!u) return;
      createTab(u);
    });
  }

  if (window.nebula?.onRefocusActiveWebview) {
    window.nebula.onRefocusActiveWebview(() => {
      queueMicrotask(() => focusActiveWebviewGuest({ forWindow: true }));
    });
  }

  window.addEventListener("focus", () => {
    queueMicrotask(() => focusActiveWebviewGuest({ forWindow: true }));
  });

  bookmarks = loadBookmarksFromStorage();
  renderBookmarksBar();
  wireSplitDropZones();
  wireSplitResizer();
  wireTabStripReorderAndContext();
  wireTabGroupRenamePanel();
  window.addEventListener("beforeunload", () => {
    saveSessionSnapshot();
  });

  void loadAppSettings().then(() => {
    tryOfferSessionRestoreOnLaunch();
    setNavButtons();
    updateLoadingUI();
  });

  setTimeout(() => void runUpdateCheck(false), 2800);
})();
