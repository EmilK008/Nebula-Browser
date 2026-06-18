(function () {
  if (document.getElementById("nebula-step4-badge")) return;
  const el = document.createElement("div");
  el.id = "nebula-step4-badge";
  el.textContent = "Step 4 ext";
  el.style.cssText =
    "position:fixed;bottom:12px;right:12px;z-index:2147483646;padding:4px 8px;border-radius:6px;background:#2d6cdf;color:#fff;font:12px/1.3 system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none;";
  document.documentElement.appendChild(el);
})();
