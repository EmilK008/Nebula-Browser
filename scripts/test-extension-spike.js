"use strict";

const path = require("path");
const { app, session } = require("electron");
const spike = require(path.join(__dirname, "..", "lib", "extension-spike"));

app.whenReady().then(async () => {
  try {
    const r = await spike.maybeLoadExtensionSpike(session, "persist:nebula");
    console.log("SPIKE_RESULT", JSON.stringify(r));
    process.exit(r && r.loaded ? 0 : 1);
  } catch (e) {
    console.error("SPIKE_ERROR", e);
    process.exit(1);
  }
});
