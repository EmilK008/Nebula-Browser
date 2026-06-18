# Nebula

**Nebula** is a desktop web browser built in cursor by composer 2/2.5 with [Electron](https://www.electronjs.org/) and a custom window chrome: tabs, address bar, bookmarks, downloads, and settings live in a tailored UI around Chromium-powered `<webview>` tabs. It targets people who want a focused browsing shell with strong local-first controls (profiles, optional ad blocking, vault, and optional AI tools).

This repository is the **nebula-browser** app (`com.nebula.browser`). Releases and updates are tracked on GitHub (`EmilK008/Nebula-Browser` per `package.json`).

## Features (high level)

- **Browsing core** — Multi-tab browsing, navigation controls, omnibox, history, downloads, find-in-page, and session restore prompts where enabled.
- **Profiles & private tabs** — Separate cookies, session snapshots, bookmarks, and history per profile; private tabs use an ephemeral partition (no session restore / history writes for those tabs).
- **Bookmarks** — Bar and star, import/export (HTML/JSON), and import from **Chrome**, **Edge**, or **Firefox** on the same machine (plus bookmark files). First-run onboarding can walk you through optional import.
- **Appearance** — Window chrome theme (dark, light, or match OS), accent color, comfortable/compact density, optional **force dark mode** for page content (restart to apply), configurable bookmarks bar and toolbar layout.
- **Ad blocking** — [@ghostery/adblocker-electron](https://github.com/ghostery/adblocker) integration for cleaner pages where lists apply.
- **Translation** — Toolbar translation flow (e.g. Google Translate wrapper, LibreTranslate in-page, DeepL/Libre keys via the vault where applicable).
- **Password vault & optional local account** — Saved credentials and related secrets; optional master password / account flow from Settings (and first-run wizard).
- **Network & proxy** — Direct, system proxy, or fixed proxy rules aligned with Chromium so tabs and main-process features share the same egress behavior.
- **AI assistant (optional)** — Side panel with provider keys in the vault: chat, streaming, optional web search (e.g. Brave), optional safe page text fetch, optional tab tools (open tab / read tab text with configurable confirmations), and related Settings.
- **VPN helper (toolbar)** — Shortcuts to common VPN providers (open app, get client); not a bundled VPN; full-tunnel still uses the provider’s own app.
- **Updates** — In-app update path for Windows installer builds (see changelog for NSIS / relaunch behavior); portable layout coexists with standard user data when configured.

For a version-by-version list, open **Settings → Changelog** in the app or read `renderer/changelog.json`.

## Requirements

### Prebuilt Windows `.exe`

- **Windows 10 or 11, 64-bit (x64)** — matches the release artifacts built from this repo.

### To run or hack on the source

- **Node.js** (LTS recommended) and **npm**
- **Windows x64** is the primary **packaged** target in this repo (`electron-builder` config). Developing with `npm start` follows normal Electron platform support for your OS; release artifacts here are built for **Windows**.

Native dependency **better-sqlite3** (Firefox bookmark import fallback) is rebuilt for the pinned Electron version on `npm install` via `electron-builder install-app-deps`.

## Install & run (Windows .exe)

Download the latest **Windows x64** build from [**GitHub Releases**](https://github.com/EmilK008/Nebula-Browser/releases).

### Installer (`Nebula-<version>-x64.exe`)

1. Run the installer and follow the prompts (you can change the installation directory).
2. Launch **Nebula** from the Start menu or the optional desktop shortcut.

### Portable (`Nebula-<version>-Portable.exe`)

1. Place the portable `.exe` wherever you like (for example a folder on your PC or a USB stick).
2. Double-click it to run. Data location follows Nebula’s portable vs standard user-data rules (see **Settings → Changelog** / `renderer/changelog.json` if you use both installer and portable builds).

### Notes

- **SmartScreen**: Windows may show “Windows protected your PC” for apps that are not Microsoft-signed. If you trust the release, use **More info** → **Run anyway**.
- **Updates**: In-app updates are intended for **installer** installs. Portable users can grab a newer release from GitHub when you want to upgrade.

## Install & run (from source)

1. **Clone** this repository and open a terminal in the project root (the folder that contains `package.json`).

2. **Install dependencies** (this also compiles native modules for Electron):

   ```bash
   npm install
   ```

3. **Start Nebula** in development mode:

   ```bash
   npm start
   ```

   This runs `electron .` using the Electron version from `devDependencies` (castlabs build with Widevine-friendly packaging for distribution).

## Building installers (Windows)

From the project root:

| Command | Purpose |
|--------|---------|
| `npm run dist` | Production Windows build (portable + NSIS) via `electron-builder`; output under `dist/` |
| `npm run dist:dir` | Unpacked directory build (faster iteration) under `dist/` |

Artifacts are named like `Nebula-<version>-x64.exe` (installer) and `Nebula-<version>-Portable.exe` per `package.json` `build` settings.

### Castlabs EVS (production VMP signing)

Shipped Windows builds run `castlabs_evs.vmp sign-pkg` in an `afterPack` hook (`scripts/evs-afterpack.js`). EVS tokens expire about monthly; when they do, the client asks for your password.

**Many terminals (including Cursor’s) cannot accept EVS password input** — the prompt appears but typing does nothing. Pass credentials on the command line or in a local file instead (same workaround as EVS account signup).

1. **Local credentials file** (recommended):

   ```powershell
   cd C:\Browser
   copy .evs-credentials.example .evs-credentials
   # Edit .evs-credentials — set EVS_ACCOUNT_NAME and EVS_PASSWD
   npm run evs:reauth
   npm run dist
   ```

   `.evs-credentials` is gitignored.

2. **One-off in PowerShell** (password may land in shell history):

   ```powershell
   py -3 -m castlabs_evs.account reauth -A YOUR_ACCOUNT_NAME -P YOUR_PASSWORD
   npm run dist
   ```

   During `npm run dist`, the build passes the same `-A`/`-P` flags to `sign-pkg` if `EVS_ACCOUNT_NAME` and `EVS_PASSWD` are set (or loaded from `.evs-credentials`).

3. **New EVS account** (email only needed for signup, not signing):

   ```powershell
   py -3 -m castlabs_evs.account signup -A accountname -E you@example.com -P yourpassword -F First -L Last -O "Your Org"
   ```

4. **Skip signing for a local test build**, then sign manually:

   ```powershell
   $env:NEBULA_SKIP_EVS="1"
   npm run dist:dir
   py -3 -m castlabs_evs.vmp sign-pkg -A YOUR_ACCOUNT_NAME -P YOUR_PASSWORD dist\win-unpacked
   ```

Requires `py -3 -m pip install castlabs-evs`. Verify with `npm run verify:vmp`. See the [Castlabs EVS wiki](https://github.com/castlabs/electron-releases/wiki/EVS).

Other scripts (see `package.json`):

- `npm run verify:vmp` — VMP / packaging verification helper for releases
- `npm run changelog:date` — Changelog date helper

## Data & privacy (short)

- Browsing data, settings, and vault material are stored **locally** under the app’s user data directory (and portable variants when you use the portable build — see changelog for layout details).
- Optional cloud APIs (AI, translation, search) are only used when **you** configure keys or features in Settings; review each provider’s terms before enabling.

## License

MIT — see `package.json` (`"license": "MIT"`).

## Contributing

Issues and pull requests are welcome on the GitHub repo configured for updates (`EmilK008/Nebula-Browser`). When changing Electron major versions, run a fresh `npm install` so native addons (e.g. **better-sqlite3**) rebuild against the new headers.
