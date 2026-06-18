"use strict";

const path = require("path");
const { app, session } = require("electron");
const loader = require(path.join(__dirname, "..", "lib", "browser-extensions-loader"));
const settingsLib = require(path.join(__dirname, "..", "lib", "browser-extensions-settings"));

const SPIKE_PATH = path.join(__dirname, "..", "extensions", "nebula-step0-spike");

app.whenReady().then(async () => {
  try {
    const partition = "persist:nebula-ext-loader-test";
    const settings = {
      profileExtensions: {
        byProfile: {
          default: {
            enabled: true,
            items: [
              settingsLib.normalizeExtensionItem({
                path: SPIKE_PATH,
                name: "Nebula Extension Spike",
                manifestVersion: 3,
                enabled: true,
              }),
            ],
          },
        },
      },
    };
    const r = await loader.syncProfileExtensionsOnSession(session, partition, settings, "default");
    console.log("LOADER_RESULT", JSON.stringify(r, null, 2));
    const ok = r.ok && (r.loaded.length > 0 || r.skipped.length > 0);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("LOADER_ERROR", e);
    process.exit(1);
  }
});
