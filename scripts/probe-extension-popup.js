"use strict";

const path = require("path");
const { app, BrowserWindow, session } = require("electron");

app.whenReady().then(async () => {
  const part = "persist:nebula-ext-probe3";
  const s = session.fromPartition(part);
  const extPath = path.join(__dirname, "..", "extensions", "nebula-step4-test");
  const loadFn =
    s.extensions && typeof s.extensions.loadExtension === "function"
      ? (p) => s.extensions.loadExtension(p)
      : (p) => s.loadExtension(p);
  let ext;
  try {
    ext = await loadFn(extPath);
  } catch (e) {
    console.log("LOAD_ERR", e.message);
    process.exit(1);
  }
  const popup = ext.manifest?.action?.default_popup || ext.manifest?.browser_action?.default_popup;
  const popupUrl = popup ? `${ext.url}${popup.replace(/^\//, "")}` : "";
  console.log("POPUP_URL", popupUrl);
  const win = new BrowserWindow({ width: 400, height: 500, show: false, webPreferences: { partition: part } });
  win.webContents.on("did-finish-load", () => {
    console.log("WIN_LOADED", win.webContents.getURL());
    setTimeout(() => app.quit(), 500);
  });
  win.webContents.on("did-fail-load", (_e, code, desc) => {
    console.log("WIN_FAIL", code, desc);
    setTimeout(() => app.quit(), 500);
  });
  if (popupUrl) win.loadURL(popupUrl);
  else {
    console.log("NO_POPUP");
    app.quit();
  }
});
