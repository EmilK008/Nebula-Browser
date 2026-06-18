"use strict";

const assert = require("assert");
const conflicts = require("../lib/browser-extensions-conflicts");
const settingsLib = require("../lib/browser-extensions-settings");

assert.strictEqual(
  conflicts.extensionManifestLooksLikeAdblock({
    name: "uBlock Origin",
    permissions: ["declarativeNetRequest"],
  }),
  true
);

assert.strictEqual(
  conflicts.extensionManifestLooksLikeAdblock({
    name: "Nebula Step 4 Test",
    permissions: ["storage"],
  }),
  false
);

const settings = {
  adblockEnabled: true,
  profileExtensions: {
    byProfile: {
      default: {
        enabled: true,
        pauseBuiltinAdblock: true,
        items: [],
      },
    },
  },
};

assert.strictEqual(conflicts.resolveBuiltinAdblockEnabled(settings, "default"), false);

settings.profileExtensions.byProfile.default.pauseBuiltinAdblock = false;
assert.strictEqual(conflicts.resolveBuiltinAdblockEnabled(settings, "default"), true);

const report = conflicts.getExtensionsConflictReport(settings, "default", [
  {
    name: "uBlock Origin",
    manifest: { name: "uBlock Origin", permissions: ["declarativeNetRequest"] },
  },
]);
assert.ok(report.hints.some((h) => h.includes("double ad blocking")));

const meta = settingsLib.readUnpackedExtensionMeta(
  require("path").join(__dirname, "..", "extensions", "nebula-step4-test")
);
assert.strictEqual(meta.ok, true);
assert.ok(Array.isArray(meta.permissions));

console.log("browser-extensions-conflicts tests ok");
