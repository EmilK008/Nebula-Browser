"use strict";

const { app, session } = require("electron");

app.whenReady().then(() => {
  const s = session.fromPartition("persist:nebula-ext-probe");
  const out = {
    hasExtensions: !!s.extensions,
    extensionsKeys: s.extensions ? Object.keys(s.extensions) : [],
    loadExtensionType: typeof s.loadExtension,
    extensionsLoadType: s.extensions ? typeof s.extensions.loadExtension : "n/a",
  };
  console.log("SESSION_EXT_PROBE", JSON.stringify(out, null, 2));
  app.quit();
});
