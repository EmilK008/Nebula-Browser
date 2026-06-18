# Nebula extensions (development)

## Step 0 spike — prove webview + partition loading

This folder holds a **dev-only** test extension. It is **not** loaded unless you set an environment variable before starting Nebula.

### Enable

**PowerShell (bundled spike extension):**

```powershell
$env:NEBULA_EXTENSION_SPIKE = "1"
npm start
```

**Custom unpacked extension folder:**

```powershell
$env:NEBULA_EXTENSION_SPIKE_PATH = "C:\path\to\unpacked-extension"
npm start
```

### What to expect

1. Nebula starts normally (no UI change).
2. In the **terminal**, look for:  
   `[Nebula:ext-spike] Loaded "Nebula Extension Spike" (…) on partition persist:nebula`
3. Open any **https** site in a normal tab (default profile).
4. A small **“Nebula ext ✓”** badge appears at the bottom-left of the page.

### Verify from DevTools console (optional)

In the shell window DevTools console:

```js
await window.nebula.extensionSpikeStatus()
```

### Notes

- Loads only on the **active browsing profile** partition at startup (e.g. `persist:nebula` for Default).
- **Private tabs** use a memory partition — extensions are not loaded there in Step 0.
- Built-in adblock and guest preloads still run; this spike only adds a visible badge.
- User-facing extension list is in Settings (Step 1+); the env spike remains separate until Step 2.

## Step 1 — Settings UI + per-profile storage

Extensions can be configured in **Settings → Profiles & private tabs → Browser extensions (Beta)**.

- **Enable** extensions for the active profile (saved immediately; not loaded yet).
- **Load unpacked…** — pick a folder with `manifest.json`; Nebula validates and saves name, path, and manifest version.
- Toggle or **Remove** entries in the list; up to 12 per profile.

Settings are stored in `nebula-settings.json` under `profileExtensions.byProfile`.

## Step 2 — Load from saved list

When extensions are **enabled** for the active profile, Nebula loads each **enabled** entry in your list onto that profile’s `persist:…` partition:

- On **startup** (after choosing the active profile)
- When you **add, remove, or toggle** extensions in Settings (saved via `setSettings`)

Open a normal (non-private) tab and visit an **https** page to verify content scripts.

Check the terminal for `[Nebula:extensions] Loaded …` lines, or in DevTools:

```js
await window.nebula.extensionsSyncStatus()
```

Private tabs use a memory partition — extensions are not loaded there.

The **Step 0 spike** (`NEBULA_EXTENSION_SPIKE=1`) remains a separate dev path and can load in addition to your settings list if you use both.

### Automated test (Step 2)

```powershell
npx electron scripts/test-extensions-loader.js
```

## Step 3 — Management polish

- Each extension row shows **name**, **version** (from `manifest.json`), **MV2/MV3**, and a **load status** pill (Loaded / Disabled / Load error).
- **Enable/disable** per row unloads or reloads on the session without removing the entry.
- Changing the list **reloads normal browsing tabs** on the active profile so content scripts update (private tabs and the home page are skipped).

## Step 4 — Toolbar icons, popups, options

- **Toolbar icons** appear in the main toolbar when extensions with an `action` / `browser_action` are loaded.
- **Click** an icon to open the extension **popup** in a small panel (toggle click to close).
- **Right-click** an icon to open the extension **options** page in a new tab (when declared in the manifest).
- Settings extension rows also show an **Options** button when available.

### Test extension: `extensions/nebula-step4-test`

1. Settings → Browser extensions → **Load unpacked…** → pick `extensions/nebula-step4-test`
2. Enable extensions for your profile
3. **Toolbar** — click the new icon → popup should open (“Extension popup”)
4. **Right-click** the icon → options page opens in a tab
5. On any https page, a **“Step 4 ext”** badge appears (content script)

Automated UI metadata test:

```powershell
npx electron scripts/test-extensions-ui.js
```

## Step 5 — Coexistence with Nebula systems

### 5a — Built-in adblock vs extension ad blockers

- **Pause Nebula adblock while extensions are enabled** (per profile) — turns off Ghostery on that profile’s browsing partition only; private tabs still use the global adblock setting.
- **Warning** when a loaded extension looks like an ad blocker and both are active.

### 5b — Guest preloads

Login capture and YouTube helpers still run alongside extension content scripts. No change — noted in Settings when extensions are enabled.

### 5c — Permissions hint

When you add an unpacked extension, Nebula reads `manifest.json` permissions. Ad-blocker-like extensions are flagged when added.

### 5d — Profile switch

Changing the active profile syncs extensions onto that profile’s partition (Nebula still restarts after profile change from Settings).

Automated conflicts test:

```powershell
node scripts/test-extensions-conflicts.js
```

### Troubleshooting

| Issue | Check |
|-------|--------|
| No log line | `NEBULA_EXTENSION_SPIKE=1` set in the same shell before `npm start` |
| `loadExtension not available` | Your Electron build may not expose extension APIs (unlikely on Nebula’s castlabs build) |
| No badge on page | Hard-refresh tab; confirm profile is Default; not a private tab |
| Load error | `manifest.json` must exist in the extension folder |
