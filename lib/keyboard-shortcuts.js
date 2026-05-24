/**
 * Shared keyboard shortcut manifest and helpers (main process).
 * Renderer mirror: renderer/keyboard-shortcuts.js
 */
"use strict";

/** @typedef {{ id: string, label: string, category: string, action: string, defaultWin?: string, defaultMac?: string, allowEmpty?: boolean }} ShortcutActionDef */

/** @type {ShortcutActionDef[]} */
const SHORTCUT_ACTIONS = [
  { id: "new-tab", label: "New tab", category: "Tab", action: "new-tab", defaultWin: "CmdOrCtrl+T" },
  {
    id: "new-private-tab",
    label: "New private tab",
    category: "Tab",
    action: "new-private-tab",
    defaultWin: "CmdOrCtrl+Shift+N",
  },
  { id: "close-tab", label: "Close tab", category: "Tab", action: "close-tab", defaultWin: "CmdOrCtrl+W" },
  {
    id: "reopen-tab",
    label: "Reopen closed tab",
    category: "Tab",
    action: "reopen-tab",
    defaultWin: "CmdOrCtrl+Shift+T",
  },
  {
    id: "toggle-pin-tab",
    label: "Pin or unpin tab",
    category: "Tab",
    action: "toggle-pin-tab",
    allowEmpty: true,
  },
  {
    id: "back",
    label: "Back",
    category: "Navigate",
    action: "back",
    defaultWin: "Alt+Left",
    defaultMac: "Cmd+[",
  },
  {
    id: "forward",
    label: "Forward",
    category: "Navigate",
    action: "forward",
    defaultWin: "Alt+Right",
    defaultMac: "Cmd+]",
  },
  { id: "home", label: "Home", category: "Navigate", action: "home", defaultWin: "Alt+Home", defaultMac: "Alt+Home" },
  { id: "reload", label: "Reload page", category: "View", action: "reload", defaultWin: "CmdOrCtrl+R" },
  { id: "print-page", label: "Print", category: "View", action: "print-page", defaultWin: "CmdOrCtrl+P" },
  {
    id: "save-page-pdf",
    label: "Save page as PDF",
    category: "View",
    action: "save-page-pdf",
    allowEmpty: true,
  },
  {
    id: "picture-in-picture",
    label: "Picture in picture",
    category: "View",
    action: "picture-in-picture",
    defaultWin: "CmdOrCtrl+Shift+P",
  },
  {
    id: "read-selection-aloud",
    label: "Read selection aloud",
    category: "View",
    action: "read-selection-aloud",
    defaultWin: "CmdOrCtrl+Shift+U",
  },
  { id: "find-in-page", label: "Find in page", category: "View", action: "find-in-page", defaultWin: "CmdOrCtrl+F" },
  {
    id: "show-history",
    label: "History",
    category: "View",
    action: "show-history",
    defaultWin: "Ctrl+H",
    defaultMac: "Cmd+Shift+H",
  },
  {
    id: "show-password-manager",
    label: "Saved passwords",
    category: "View",
    action: "show-password-manager",
    defaultWin: "CmdOrCtrl+Shift+L",
  },
  { id: "zoom-in", label: "Zoom in", category: "View", action: "zoom-in", defaultWin: "CmdOrCtrl+=" },
  { id: "zoom-out", label: "Zoom out", category: "View", action: "zoom-out", defaultWin: "CmdOrCtrl+-" },
  { id: "zoom-reset", label: "Actual size", category: "View", action: "zoom-reset", defaultWin: "CmdOrCtrl+0" },
  { id: "open-settings", label: "Settings", category: "View", action: "open-settings", defaultWin: "CmdOrCtrl+," },
  { id: "toggle-bookmark", label: "Bookmark this page", category: "Bookmarks", action: "toggle-bookmark", defaultWin: "CmdOrCtrl+D" },
  { id: "focus-omnibox", label: "Focus address bar", category: "Edit", action: "focus-omnibox", defaultWin: "CmdOrCtrl+L" },
];

const ACTION_IDS = new Set(SHORTCUT_ACTIONS.map((a) => a.id));

function isMacPlatform(platform) {
  return platform === "darwin";
}

/**
 * @param {string} actionId
 * @param {string} [platform] process.platform
 */
function getDefaultAccelerator(actionId, platform) {
  const def = SHORTCUT_ACTIONS.find((a) => a.id === actionId);
  if (!def) return "";
  if (def.allowEmpty && !def.defaultWin && !def.defaultMac) return "";
  const mac = isMacPlatform(platform);
  if (mac && def.defaultMac) return def.defaultMac;
  return def.defaultWin || def.defaultMac || "";
}

/**
 * @param {Record<string, string>|undefined|null} overrides
 * @param {string} [platform]
 * @returns {Record<string, string>}
 */
function mergeShortcuts(overrides, platform) {
  const out = {};
  for (const a of SHORTCUT_ACTIONS) {
    out[a.id] = getDefaultAccelerator(a.id, platform);
  }
  if (!overrides || typeof overrides !== "object") return out;
  for (const [k, v] of Object.entries(overrides)) {
    if (!ACTION_IDS.has(k)) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) {
      const def = SHORTCUT_ACTIONS.find((a) => a.id === k);
      if (def && def.allowEmpty) out[k] = "";
      continue;
    }
    if (parseAcceleratorString(trimmed)) out[k] = normalizeAcceleratorString(trimmed);
  }
  return out;
}

/**
 * @param {Record<string, string>|undefined|null} raw
 * @returns {Record<string, string>}
 */
function normalizeShortcutOverrides(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ACTION_IDS.has(k)) continue;
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) {
      const def = SHORTCUT_ACTIONS.find((a) => a.id === k);
      if (def && def.allowEmpty) out[k] = "";
      continue;
    }
    const norm = normalizeAcceleratorString(trimmed);
    if (parseAcceleratorString(norm)) out[k] = norm;
  }
  return out;
}

const KEY_ALIASES = {
  control: "Ctrl",
  ctrl: "Ctrl",
  command: "Cmd",
  cmd: "Cmd",
  commandorcontrol: "CmdOrCtrl",
  cmdorctrl: "CmdOrCtrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  meta: "Super",
  super: "Super",
  escape: "Esc",
  esc: "Esc",
  return: "Enter",
  enter: "Enter",
  space: "Space",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  insert: "Insert",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  left: "Left",
  right: "Right",
  up: "Up",
  down: "Down",
  plus: "Plus",
  minus: "Minus",
  "=": "Plus",
  "+": "Plus",
  "-": "Minus",
  ",": "Comma",
  comma: "Comma",
  ".": "Period",
  period: "Period",
};

function normalizeKeyToken(tok) {
  const t = String(tok || "").trim();
  if (!t) return "";
  const low = t.toLowerCase();
  if (KEY_ALIASES[low]) return KEY_ALIASES[low];
  if (t.length === 1) return t.toUpperCase();
  if (/^f\d{1,2}$/i.test(t)) return t.toUpperCase();
  if (/^arrow(left|right|up|down)$/i.test(t)) {
    const m = /^arrow(left|right|up|down)$/i.exec(t);
    if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  }
  if (/^[a-z0-9]$/i.test(t)) return t.toUpperCase();
  const cap = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  if (KEY_ALIASES[cap.toLowerCase()]) return KEY_ALIASES[cap.toLowerCase()];
  return cap;
}

/**
 * @param {string} raw
 */
function normalizeAcceleratorString(raw) {
  const parts = String(raw || "")
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    const n = normalizeKeyToken(p);
    if (n && !out.includes(n)) out.push(n);
  }
  return out.join("+");
}

/**
 * @param {string} accel
 * @returns {{ ctrl: boolean, meta: boolean, alt: boolean, shift: boolean, key: string } | null}
 */
function parseAcceleratorString(accel) {
  const norm = normalizeAcceleratorString(accel);
  if (!norm) return null;
  const parts = norm.split("+");
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;
  let key = "";
  for (const p of parts) {
    if (p === "Ctrl") {
      ctrl = true;
      continue;
    }
    if (p === "Cmd" || p === "Command") {
      meta = true;
      continue;
    }
    if (p === "CmdOrCtrl") {
      ctrl = true;
      meta = true;
      continue;
    }
    if (p === "Alt") {
      alt = true;
      continue;
    }
    if (p === "Shift") {
      shift = true;
      continue;
    }
    if (p === "Super") {
      meta = true;
      continue;
    }
    key = p;
  }
  if (!key) return null;
  return { ctrl, meta, alt, shift, key };
}

/**
 * Resolve CmdOrCtrl for matching in renderer.
 * @param {KeyboardEvent} e
 * @param {string} accel
 * @param {boolean} isMac
 */
function eventMatchesAccelerator(e, accel, isMac) {
  if (e.repeat) return false;
  const parsed = parseAcceleratorString(accel);
  if (!parsed || !parsed.key) return false;
  const wantCtrl = parsed.ctrl;
  const wantMeta = parsed.meta;
  const wantAlt = parsed.alt;
  const wantShift = parsed.shift;
  const hasCmdOrCtrl = accel.split("+").some((p) => p === "CmdOrCtrl");
  let modOk;
  if (hasCmdOrCtrl) {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    modOk = !!mod && wantAlt === e.altKey && wantShift === e.shiftKey;
    if (isMac && wantCtrl && !e.ctrlKey && !e.metaKey) modOk = false;
  } else {
    modOk =
      e.ctrlKey === (wantCtrl || false) &&
      e.metaKey === (wantMeta || false) &&
      e.altKey === (wantAlt || false) &&
      e.shiftKey === (wantShift || false);
  }
  if (!modOk) return false;
  const key = eventKeyToAcceleratorKey(e);
  if (!key) return false;
  return key === parsed.key;
}

/**
 * @param {KeyboardEvent} e
 */
function eventKeyToAcceleratorKey(e) {
  const k = e.key;
  if (!k || k === "Dead") return "";
  if (k === " ") return "Space";
  if (k === "Escape") return "Esc";
  if (k === "ArrowLeft") return "Left";
  if (k === "ArrowRight") return "Right";
  if (k === "ArrowUp") return "Up";
  if (k === "ArrowDown") return "Down";
  if (k.length === 1) return k.toUpperCase();
  if (/^F\d{1,2}$/i.test(k)) return k.toUpperCase();
  const norm = normalizeKeyToken(k);
  return norm;
}

/**
 * @param {KeyboardEvent} e
 * @param {boolean} isMac
 */
function eventToAcceleratorString(e, isMac) {
  const parts = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.metaKey) parts.push(isMac ? "Cmd" : "Super");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  const key = eventKeyToAcceleratorKey(e);
  if (!key) return "";
  if (["Ctrl", "Cmd", "Alt", "Shift", "Super", "CmdOrCtrl"].includes(key)) return "";
  parts.push(key);
  return normalizeAcceleratorString(parts.join("+"));
}

/**
 * @param {string} accel
 * @param {boolean} [isMac]
 */
function formatAcceleratorForDisplay(accel, isMac) {
  if (!accel) return "—";
  return accel
    .split("+")
    .map((p) => {
      if (p === "CmdOrCtrl") return isMac ? "⌘" : "Ctrl";
      if (p === "Cmd") return "⌘";
      if (p === "Ctrl") return "Ctrl";
      if (p === "Alt") return "Alt";
      if (p === "Shift") return "Shift";
      return p;
    })
    .join("+");
}

/**
 * @param {Record<string, string>} effective
 * @returns {string[]}
 */
function findShortcutConflicts(effective) {
  const byAccel = new Map();
  const conflicts = [];
  for (const [id, accel] of Object.entries(effective)) {
    if (!accel) continue;
    const norm = normalizeAcceleratorString(accel);
    if (!norm) continue;
    const prev = byAccel.get(norm);
    if (prev) conflicts.push(`${prev} and ${id} both use ${norm}`);
    else byAccel.set(norm, id);
  }
  return conflicts;
}

module.exports = {
  SHORTCUT_ACTIONS,
  ACTION_IDS,
  getDefaultAccelerator,
  mergeShortcuts,
  normalizeShortcutOverrides,
  parseAcceleratorString,
  normalizeAcceleratorString,
  eventMatchesAccelerator,
  eventToAcceleratorString,
  formatAcceleratorForDisplay,
  findShortcutConflicts,
};
