/**
 * Runs in guest HTTP(S) pages (top frame and iframes via session preload): detects logins via
 * forms, buttons, Enter/blur/input, mutation, pagehide, and a narrow fetch() body heuristic.
 * Sends captured credentials to the shell with sendToHost — user confirms saving in Nebula.
 */
const { ipcRenderer } = require("electron");

const SEND_DEBOUNCE_MS = 2800;
let lastFingerprint = "";
let lastSentAt = 0;

/** Extra delayed reads for slow SPAs / hydration after submit or click. */
const CAPTURE_DELAY_MS = [0, 120, 280, 480, 750, 1200, 2000];

/** @type {ReturnType<typeof setTimeout> | null} */
let pwdInputDebounceTimer = null;
/** @type {ReturnType<typeof setTimeout> | null} */
let mutationDebounceTimer = null;

/** @param {Document | ShadowRoot | Element | null} root */
function queryDeepSelector(root, selector) {
  if (!root || typeof root.querySelector !== "function") return null;
  try {
    const direct = root.querySelector(selector);
    if (direct) return direct;
  } catch {
    return null;
  }
  let nodes;
  try {
    nodes = root.querySelectorAll("*");
  } catch {
    return null;
  }
  for (const node of nodes) {
    if (node.shadowRoot) {
      const inner = queryDeepSelector(node.shadowRoot, selector);
      if (inner) return inner;
    }
  }
  return null;
}

/** @param {Document | ShadowRoot | Element | null} root */
function queryAllPasswordInputsDeep(root) {
  /** @type {HTMLInputElement[]} */
  const out = [];
  function collect(r) {
    if (!r) return;
    try {
      r.querySelectorAll('input[type="password"]').forEach((n) => {
        if (n instanceof HTMLInputElement) out.push(n);
      });
    } catch {
      /* */
    }
    try {
      r.querySelectorAll("*").forEach((node) => {
        if (node.shadowRoot) collect(node.shadowRoot);
      });
    } catch {
      /* */
    }
  }
  collect(root);
  return out;
}

/** @param {HTMLElement} el */
function isProbablyVisible(el) {
  if (!(el instanceof HTMLElement)) return false;
  const s = getComputedStyle(el);
  if (s.display === "none" || s.visibility === "hidden") return false;
  if (Number(s.opacity) === 0) return false;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

/**
 * @param {Element} scope
 * @param {HTMLInputElement} passwordInput
 */
function findUsernameInputInScope(scope, passwordInput) {
  const userExact = queryDeepSelector(scope, 'input[autocomplete="username"]');
  if (
    userExact &&
    userExact instanceof HTMLInputElement &&
    userExact !== passwordInput &&
    isProbablyVisible(userExact)
  ) {
    return userExact;
  }

  if (scope instanceof HTMLFormElement) {
    const inputs = Array.from(scope.querySelectorAll("input"));
    const pwdIdx = inputs.indexOf(passwordInput);
    for (let i = 0; i < pwdIdx; i++) {
      const inp = inputs[i];
      const t = (inp.type || "").toLowerCase();
      if (t === "hidden" || t === "submit" || t === "button" || t === "reset" || t === "image") continue;
      if (t === "checkbox" || t === "radio") continue;
      return inp;
    }
    const email = scope.querySelector('input[type="email"]');
    if (email) return email;
    const text = scope.querySelector('input[type="text"]');
    if (text) return text;
    return scope.querySelector("input:not([type])");
  }

  const ordered = [];
  function gatherInputs(r) {
    if (!r) return;
    try {
      r.querySelectorAll("input").forEach((n) => ordered.push(n));
    } catch {
      /* */
    }
    try {
      r.querySelectorAll("*").forEach((node) => {
        if (node.shadowRoot) gatherInputs(node.shadowRoot);
      });
    } catch {
      /* */
    }
  }
  gatherInputs(scope);

  const idx = ordered.indexOf(passwordInput);
  if (idx >= 0) {
    for (let i = 0; i < idx; i++) {
      const inp = ordered[i];
      const t = (inp.type || "").toLowerCase();
      if (t === "password" || t === "hidden" || t === "submit" || t === "button" || t === "reset") continue;
      if (t === "checkbox" || t === "radio") continue;
      if (!isProbablyVisible(inp)) continue;
      return inp;
    }
  }

  const autoHints = ["username", "email", "tel"];
  for (const hint of autoHints) {
    const el = queryDeepSelector(scope, `input[autocomplete*="${hint}"]`);
    if (el && el !== passwordInput && isProbablyVisible(el)) return el;
  }
  const email = queryDeepSelector(scope, 'input[type="email"]');
  if (email && email !== passwordInput) return email;
  const text = queryDeepSelector(scope, 'input[type="text"]');
  if (text && text !== passwordInput) return text;
  return null;
}

/**
 * @param {Element} start
 * @returns {Element}
 */
function findAuthScopeForPassword(start) {
  const form = start.closest("form");
  if (form) return form;
  const dialog = start.closest('[role="dialog"], [role="alertdialog"], [data-testid], .modal, [class*="Modal"]');
  if (dialog) return dialog;
  const section = start.closest("section, article, main");
  if (section) return section;
  let el = start.parentElement;
  for (let i = 0; i < 8 && el; i++) {
    if (queryAllPasswordInputsDeep(el).length) return el;
    el = el.parentElement;
  }
  return document.body;
}

/**
 * Choose the password field most likely tied to the current login (not “confirm password” when empty duplicate).
 * @param {Element} scope
 */
function pickPrimaryPasswordInput(scope) {
  const list = queryAllPasswordInputsDeep(scope).filter(isProbablyVisible);
  const filled = list.filter((p) => p.value && p.value.length > 0);
  const pool = filled.length ? filled : list;
  if (!pool.length) return null;

  const ae = document.activeElement;
  if (ae instanceof HTMLInputElement && ae.type === "password" && pool.includes(ae)) return ae;

  const byAuto = pool.find((p) => {
    const a = (p.getAttribute("autocomplete") || "").toLowerCase();
    return a.includes("current-password") || a === "password";
  });
  if (byAuto) return byAuto;

  const curOnly = pool.find((p) => {
    const a = (p.getAttribute("autocomplete") || "").toLowerCase();
    return a.includes("current-password") && p.value && p.value.length > 0;
  });
  if (curOnly) return curOnly;

  const names = /^(password|passwd|pwd|user_password|login_password)$/i;
  const byName = pool.find((p) => names.test(p.name || "") || names.test(p.id || ""));
  if (byName) return byName;

  return pool[0];
}

/**
 * @param {Element} scope
 */
function snapshotFromScope(scope) {
  const pwdInput = pickPrimaryPasswordInput(scope);
  if (!pwdInput || !pwdInput.value) return null;

  const innerScope = findAuthScopeForPassword(pwdInput);
  const userEl = findUsernameInputInScope(innerScope, pwdInput);
  const username = userEl && typeof userEl.value === "string" ? userEl.value.trim() : "";

  let formAction = location.href;
  const form = pwdInput.closest("form");
  if (form && form.action) {
    try {
      formAction = new URL(form.action, location.href).href;
    } catch {
      formAction = location.href;
    }
  }

  return {
    username,
    password: pwdInput.value,
    formAction,
    pageUrl: location.href,
    pageTitle: typeof document.title === "string" ? document.title : "",
  };
}

function sendSnapshot(snap, reason) {
  if (!snap || !snap.password) return;
  const noisyOfferReasons = new Set(["input-password", "mutation-password"]);
  const payload = { ...snap, vaultOffer: !noisyOfferReasons.has(reason) };
  const fp = `${snap.username}\t${snap.password}\t${snap.pageUrl}`;
  const now = Date.now();
  if (fp === lastFingerprint && now - lastSentAt < SEND_DEBOUNCE_MS) return;
  lastFingerprint = fp;
  lastSentAt = now;
  try {
    ipcRenderer.sendToHost("nebula-login-capture", payload);
  } catch {
    /* */
  }
}

/** Run delayed captures so frameworks can flush controlled inputs; sendSnapshot dedupes duplicates. */
function scheduleCaptures(scope, reason) {
  const run = () => {
    const snap = snapshotFromScope(scope);
    if (snap) sendSnapshot(snap, reason);
  };
  for (const ms of CAPTURE_DELAY_MS) {
    setTimeout(run, ms);
  }
}

function scopeFromClickTarget(target) {
  if (!(target instanceof Element)) return document.body;
  const btn = target.closest(
    'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]'
  );
  if (btn) {
    const inForm = btn.closest("form");
    if (inForm && queryDeepSelector(inForm, 'input[type="password"]')) return inForm;
    let n = btn.parentElement;
    for (let i = 0; i < 14 && n; i++) {
      if (queryAllPasswordInputsDeep(n).length > 0) return n;
      n = n.parentElement;
    }
  }
  return document.body;
}

function loginLikeLabel(el) {
  const aria = (el.getAttribute && el.getAttribute("aria-label")) || "";
  const title = (el.getAttribute && el.getAttribute("title")) || "";
  const txt = (el.innerText || el.textContent || "").trim().slice(0, 96);
  const combined = `${aria} ${title} ${txt}`.toLowerCase();
  if (!combined.trim()) return false;
  return (
    /\blog\s*in\b|\bsign\s*-?\s*in\b|\bsignin\b|\blog\s*on\b|\bcontinue\b|\bnext\b|\bsubmit\b|\bverify\b|\bauthenticate\b|\bweiter\b|\beanmelden\b|\bconnexion\b|\bbestätigen\b/i.test(
      combined
    ) || /^ok$/i.test(txt.trim())
  );
}

document.addEventListener(
  "submit",
  (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLFormElement)) return;
    const snap = snapshotFromScope(target);
    if (snap) sendSnapshot(snap, "submit");
    else scheduleCaptures(target, "submit-fallback");
  },
  true
);

document.addEventListener(
  "click",
  (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;

    const form = t.closest("form");
    if (form && queryDeepSelector(form, 'input[type="password"]')) {
      const interactive = t.closest(
        'button, input[type="submit"], input[type="button"], input[type="image"], [role="button"]'
      );
      if (!interactive || !form.contains(interactive)) return;

      const tag = interactive.tagName.toLowerCase();
      const ty = (interactive.getAttribute("type") || "").toLowerCase();
      const submitLike =
        ty === "submit" ||
        ty === "image" ||
        (tag === "button" && (!ty || ty === "submit"));

      if (submitLike || loginLikeLabel(interactive)) {
        scheduleCaptures(form, "click-form");
      }
      return;
    }

    const btn = t.closest('button, [role="button"]');
    if (btn && loginLikeLabel(btn)) {
      const scope = scopeFromClickTarget(t);
      if (queryAllPasswordInputsDeep(scope).length > 0) scheduleCaptures(scope, "click-spa");
    }
  },
  true
);

document.addEventListener(
  "keydown",
  (ev) => {
    if (ev.key !== "Enter") return;
    const t = ev.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.type !== "password") return;
    const scope = findAuthScopeForPassword(t);
    scheduleCaptures(scope, "enter-password");
  },
  true
);

document.addEventListener(
  "focusout",
  (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "password") return;
    if (!t.value) return;
    const scope = findAuthScopeForPassword(t);
    scheduleCaptures(scope, "blur-password");
  },
  true
);

document.addEventListener(
  "input",
  (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.type !== "password") return;
    if (!t.value) return;
    const scope = findAuthScopeForPassword(t);
    if (pwdInputDebounceTimer != null) clearTimeout(pwdInputDebounceTimer);
    pwdInputDebounceTimer = setTimeout(() => {
      pwdInputDebounceTimer = null;
      scheduleCaptures(scope, "input-password");
    }, 580);
  },
  true
);

window.addEventListener(
  "pagehide",
  () => {
    const snap = snapshotFromScope(document.body);
    if (snap) sendSnapshot(snap, "pagehide");
  },
  true
);

try {
  const mo = new MutationObserver(() => {
    if (mutationDebounceTimer != null) clearTimeout(mutationDebounceTimer);
    mutationDebounceTimer = setTimeout(() => {
      mutationDebounceTimer = null;
      if (queryAllPasswordInputsDeep(document.body).some((p) => p.value && p.value.length > 0)) {
        scheduleCaptures(document.body, "mutation-password");
      }
    }, 450);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
} catch {
  /* */
}

/** Best-effort: successful POST/PUT/PATCH with JSON or urlencoded body on auth-like URLs. */
(() => {
  if (typeof window.fetch !== "function") return;
  const origFetch = window.fetch.bind(window);
  window.fetch = function fetchWrapped(input, init) {
    const p = origFetch(input, init);
    try {
      const methodRaw =
        (init && init.method) ||
        (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET") ||
        "GET";
      const method = String(methodRaw).toUpperCase();
      if (method !== "POST" && method !== "PUT" && method !== "PATCH") return p;

      let urlStr = "";
      if (typeof input === "string") urlStr = input;
      else if (typeof URL !== "undefined" && input instanceof URL) urlStr = input.href;
      else if (typeof Request !== "undefined" && input instanceof Request) urlStr = input.url;
      try {
        if (urlStr && !/^https?:/i.test(urlStr)) {
          urlStr = new URL(urlStr, location.href).href;
        }
      } catch {
        return p;
      }
      const u = String(urlStr || location.href);
      if (!/^https?:/i.test(u)) return p;
      if (!/(login|sign[-_]?in|auth|oauth|session|token|register|password|credential|signon)/i.test(u)) {
        return p;
      }

      const tryBody = (bodyStr) => {
        if (!bodyStr || bodyStr.length > 200000) return;
        let pwd = "";
        let user = "";
        try {
          const o = JSON.parse(bodyStr);
          if (o && typeof o === "object" && !Array.isArray(o)) {
            pwd =
              typeof o.password === "string"
                ? o.password
                : typeof o.passwd === "string"
                  ? o.passwd
                  : typeof o.passcode === "string"
                    ? o.passcode
                    : "";
            user =
              typeof o.username === "string"
                ? o.username
                : typeof o.email === "string"
                  ? o.email
                  : typeof o.user === "string"
                    ? o.user
                    : "";
          }
        } catch {
          try {
            const params = new URLSearchParams(bodyStr);
            pwd = params.get("password") || params.get("passwd") || "";
            user = params.get("username") || params.get("email") || params.get("user") || "";
          } catch {
            /* */
          }
        }
        if (!pwd) return;
        sendSnapshot(
          {
            username: user ? String(user).trim() : "",
            password: pwd,
            formAction: u,
            pageUrl: location.href,
            pageTitle: typeof document.title === "string" ? document.title : "",
          },
          "fetch-json"
        );
      };

      p.then((res) => {
        if (!res || !res.ok) return;
        const body = init && init.body;
        if (typeof body === "string") tryBody(body);
        else if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) tryBody(body.toString());
      }).catch(() => {});
    } catch {
      /* */
    }
    return p;
  };
})();
