"use strict";

const path = require("path");
const { app, session } = require("electron");

app.whenReady().then(async () => {
  try {
    const s = session.fromPartition("persist:nebula-ext-probe2");
    const extPath = path.join(__dirname, "..", "extensions", "nebula-step0-spike");
    const loadFn =
      s.extensions && typeof s.extensions.loadExtension === "function"
        ? (p) => s.extensions.loadExtension(p)
        : (p) => s.loadExtension(p);
    const ext = await loadFn(extPath);
    console.log("EXT_KEYS", Object.keys(ext));
    console.log("EXT", JSON.stringify(ext, null, 2));
    if (s.extensions) {
      console.log("EXT_PROTO", Object.getOwnPropertyNames(Object.getPrototypeOf(s.extensions)));
      const names = Object.getOwnPropertyNames(s.extensions).filter((k) => typeof s.extensions[k] === "function");
      console.log("EXT_FUNCS", names);
    }
    const all = await (s.extensions?.getAllExtensions?.() || s.getAllExtensions?.());
    console.log("ALL", JSON.stringify(all, null, 2));
    process.exit(0);
  } catch (e) {
    console.error("PROBE_ERR", e);
    process.exit(1);
  }
});
