(function () {
  if (document.getElementById("nebula-ext-spike-badge")) return;
  const el = document.createElement("div");
  el.id = "nebula-ext-spike-badge";
  el.textContent = "Nebula ext ✓";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:fixed;bottom:8px;left:8px;z-index:2147483647;padding:4px 8px;" +
    "background:#6eb5ff;color:#0c0d10;font:12px/1.2 system-ui,sans-serif;" +
    "border-radius:4px;pointer-events:none;opacity:0.9;box-shadow:0 1px 4px rgba(0,0,0,.35);";
  (document.documentElement || document.body).appendChild(el);
})();
