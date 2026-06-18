"use strict";

const path = require("path");
const { app, session } = require("electron");
const loader = require(path.join(__dirname, "..", "lib", "browser-extensions-loader"));
const ui = require(path.join(__dirname, "..", "lib", "browser-extensions-ui"));
const settingsLib = require(path.join(__dirname, "..", "lib", "browser-extensions-settings"));

const TEST_EXT = path.join(__dirname, "..", "extensions", "nebula-step4-test");

app.whenReady().then(async () => {
  try {
    const partition = "persist:nebula-ext-ui-test";
    const settings = {
      profileExtensions: {
        byProfile: {
          default: {
            enabled: true,
            items: [
              settingsLib.normalizeExtensionItem({
                path: TEST_EXT,
                name: "Nebula Step 4 Test",
                version: "1.0.0",
                manifestVersion: 3,
                enabled: true,
              }),
            ],
          },
        },
      },
    };
    await loader.syncProfileExtensionsOnSession(session, partition, settings, "default");
    const actions = await ui.listToolbarActionsForPartition(session, partition, settings, "default");
    console.log("UI_ACTIONS", JSON.stringify(actions, null, 2));
    const ok =
      actions.length === 1 &&
      actions[0].hasPopup &&
      actions[0].hasOptions &&
      actions[0].popupUrl.includes("popup.html") &&
      actions[0].optionsUrl.includes("options.html");
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("UI_TEST_ERROR", e);
    process.exit(1);
  }
});
