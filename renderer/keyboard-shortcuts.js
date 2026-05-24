/**
 * Keyboard shortcut helpers for the renderer (parse/match/display).
 * Manifest + defaults come from main via nebula.getShortcutManifest().
 */
(function nebulaKeyboardShortcutsInit() {
  "use strict";

  /** @type {{ id: string, label: string, category: string, action: string, allowEmpty?: boolean }[]} */
  let actions = [];
  /** @type {Record<string, string>} */
  let defaultAccelerators = {};
  const actionIds = new Set();

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
    return normalizeKeyToken(k);
  }

  function eventMatchesAccelerator(e, accel, isMac) {
    if (e.repeat) return false;
    const parsed = parseAcceleratorString(accel);
    if (!parsed || !parsed.key) return false;
    const hasCmdOrCtrl = String(accel).split("+").some((p) => p === "CmdOrCtrl");
    let modOk;
    if (hasCmdOrCtrl) {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      modOk = !!mod && parsed.alt === e.altKey && parsed.shift === e.shiftKey;
    } else {
      modOk =
        e.ctrlKey === !!parsed.ctrl &&
        e.metaKey === !!parsed.meta &&
        e.altKey === !!parsed.alt &&
        e.shiftKey === !!parsed.shift;
    }
    if (!modOk) return false;
    const key = eventKeyToAcceleratorKey(e);
    return key === parsed.key;
  }

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
   * @param {{ actions: unknown[], defaults: Record<string, string> }} manifest
   */
  function init(manifest) {
    actions = Array.isArray(manifest?.actions) ? manifest.actions : [];
    defaultAccelerators =
      manifest?.defaults && typeof manifest.defaults === "object" ? { ...manifest.defaults } : {};
    actionIds.clear();
    for (const a of actions) {
      if (a && typeof a.id === "string") actionIds.add(a.id);
    }
  }

  /**
   * @param {Record<string, string>|undefined|null} overrides
   */
  function mergeShortcuts(overrides) {
    const out = { ...defaultAccelerators };
    if (!overrides || typeof overrides !== "object") return out;
    for (const [k, v] of Object.entries(overrides)) {
      if (!actionIds.has(k)) continue;
      if (typeof v !== "string") continue;
      const trimmed = v.trim();
      if (!trimmed) {
        const def = actions.find((a) => a.id === k);
        if (def && def.allowEmpty) out[k] = "";
        continue;
      }
      const norm = normalizeAcceleratorString(trimmed);
      if (parseAcceleratorString(norm)) out[k] = norm;
    }
    return out;
  }

  function getActions() {
    return actions.slice();
  }

  function findConflicts(effective) {
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

  function actionForId(id) {
    return actions.find((a) => a.id === id) || null;
  }

  window.NebulaKeyboardShortcuts = {
    init,
    mergeShortcuts,
    parseAcceleratorString,
    normalizeAcceleratorString,
    eventMatchesAccelerator,
    eventToAcceleratorString,
    formatAcceleratorForDisplay,
    findConflicts,
    getActions,
    actionForId,
  };
})();
