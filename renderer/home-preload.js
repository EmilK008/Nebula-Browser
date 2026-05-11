const { contextBridge, ipcRenderer } = require("electron");

/**
 * Runs only on webviews that load `welcome.html` (see renderer.js).
 * Exposes IPC-backed omnibox-style suggestions to the home page (same data as the top bar).
 */
contextBridge.exposeInMainWorld("nebulaHome", {
  getSuggestions: (query) => ipcRenderer.invoke("nebula-home-suggestions", query),
});
