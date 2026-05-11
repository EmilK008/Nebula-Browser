/**
 * YouTube: skip / sped-up ads (muted during ad) / black-screen + cold-start recovery.
 */
(function initNebulaYoutubeAdSkip() {
  "use strict";

  const YT_HOST_RE = /(^|\.)youtube\.com$/i;
  const POLL_MS = 380;
  const NATIVE_COOLDOWN_MS = 650;
  const BLACK_CHECK_MS = 8200;
  const BLACK_CHECK_AGAIN_MS = 15500;
  /** First watch after app launch: player sometimes stays black until a reload. */
  const COLD_START_CHECK_MS = 4500;

  function isYouTubePageUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const h = new URL(url).hostname;
      return YT_HOST_RE.test(h) || h === "youtu.be";
    } catch {
      return false;
    }
  }

  function isYouTubeWatchUrl(url) {
    if (!url || typeof url !== "string") return false;
    try {
      const u = new URL(url);
      const h = u.hostname;
      if (h === "youtu.be" && u.pathname.length > 1) return true;
      if (h === "music.youtube.com" && u.pathname === "/watch") return true;
      if (!YT_HOST_RE.test(h)) return false;
      if (u.pathname === "/watch" && u.searchParams.get("v")) return true;
      if (u.pathname.startsWith("/live/")) return true;
      return false;
    } catch {
      return false;
    }
  }

  /** One-shot repair: sessionStorage `nebulaYtBlkRecover` prevents infinite reloads. */
  var BLACK_RECOVER_INJECT =
    "(function(){try{" +
    "var k='nebulaYtBlkRecover';" +
    "var v=document.querySelector('.html5-video-player video');" +
    "if(v&&v.videoWidth>0){try{sessionStorage.removeItem(k);}catch(e){}return false;}" +
    "try{if(sessionStorage.getItem(k)==='1')return false;}catch(e2){return false;}" +
    "var big=document.querySelector('.ytp-large-play-button');" +
    "if(big){" +
    "var st=window.getComputedStyle(big);" +
    "if(st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity)>0.05)return false;" +
    "}" +
    "if(!v||document.hidden)return false;" +
    "if(v.error){try{sessionStorage.setItem(k,'1');}catch(e3){}location.reload();return true;}" +
    "if(v.networkState===3&&v.videoWidth===0){try{sessionStorage.setItem(k,'1');}catch(e4){}location.reload();return true;}" +
    "if(v.readyState>=2&&v.videoWidth===0){try{sessionStorage.setItem(k,'1');}catch(e5){}location.reload();return true;}" +
    "return false;" +
    "}catch(err){return false;}})()";

  /** First launch / first watch: returns ok | bigplay | bad */
  var COLD_START_INJECT =
    "(function(){try{" +
    "var v=document.querySelector('.html5-video-player video');" +
    "if(v&&v.videoWidth>0)return'ok';" +
    "var big=document.querySelector('.ytp-large-play-button');" +
    "if(big){var st=window.getComputedStyle(big);" +
    "if(st.display!=='none'&&st.visibility!=='hidden'&&Number(st.opacity)>0.05)return'bigplay';}" +
    "return'bad';" +
    "}catch(e){return'err';}})()";

  /** One reload-at-most for the first watch navigation after Nebula starts (shell session). */
  var coldStartFirstWatchPending = true;

  function clearColdStartTimer(webview) {
    if (!webview) return;
    if (webview._nebulaColdStartT) {
      clearTimeout(webview._nebulaColdStartT);
      webview._nebulaColdStartT = null;
    }
  }

  function runColdStartWatchCheck(webview) {
    if (!coldStartFirstWatchPending) return;
    try {
      if (!isYouTubeWatchUrl(webview.getURL())) return;
      coldStartFirstWatchPending = false;
      var p = webview.executeJavaScript(COLD_START_INJECT, false);
      if (p && typeof p.then === "function") {
        p.then(function (r) {
          if (r === "bad") {
            try {
              webview.reload();
            } catch (e) {
              /* ignore */
            }
          }
        }).catch(function () {});
      }
    } catch (e) {
      /* ignore */
    }
  }

  function scheduleColdStartWatchCheck(webview) {
    if (!coldStartFirstWatchPending) return;
    if (!isYouTubeWatchUrl(webview.getURL())) return;
    if (webview._nebulaColdStartT) return;
    webview._nebulaColdStartT = window.setTimeout(function () {
      webview._nebulaColdStartT = null;
      runColdStartWatchCheck(webview);
    }, COLD_START_CHECK_MS);
  }

  /** Serialized into YouTube page — defines __nebulaYtSkipProbe + __nebulaYtAdSpeedSync. */
  function pageWorldRunner() {
    if (window.__nebulaYtProbeV5) return;
    window.__nebulaYtProbeV5 = true;

    var BLK_KEY = "nebulaYtBlkRecover";

    var AD_PLAYBACK_TARGET = 3;
    var nebulaSavedPlaybackRate = 1;
    var nebulaSavedMuted = false;
    var nebulaSavedVolume = 1;
    var nebulaAdSpeedArm = false;

    window.__nebulaYtAdSpeedSync = function () {
      var player = document.querySelector(".html5-video-player");
      if (!player) return;
      var v = player.querySelector("video");
      if (!v) return;
      try {
        if (v.videoWidth > 0) {
          sessionStorage.removeItem(BLK_KEY);
        }
      } catch (e0) {
        /* ignore */
      }
      var adOn = player.classList.contains("ad-showing");
      if (adOn) {
        if (v.videoWidth <= 0 && v.readyState === 0) {
          return;
        }
        if (!nebulaAdSpeedArm) {
          nebulaSavedPlaybackRate = v.playbackRate;
          nebulaSavedMuted = v.muted;
          nebulaSavedVolume = v.volume;
          nebulaAdSpeedArm = true;
        }
        try {
          v.muted = true;
        } catch (eM) {
          /* ignore */
        }
        try {
          if (v.videoWidth > 0 && v.playbackRate < AD_PLAYBACK_TARGET - 0.05) {
            v.playbackRate = Math.min(4, AD_PLAYBACK_TARGET);
          }
        } catch (e) {
          /* ignore */
        }
      } else if (nebulaAdSpeedArm) {
        try {
          v.playbackRate = nebulaSavedPlaybackRate;
          v.muted = nebulaSavedMuted;
          v.volume = nebulaSavedVolume;
        } catch (e2) {
          /* ignore */
        }
        nebulaAdSpeedArm = false;
      }
    };

    var SKIP_SELECTORS = [
      "button.ytp-ad-skip-button",
      "button.ytp-ad-skip-button-modern",
      "button.ytp-skip-ad-button",
      ".ytp-skip-ad-button",
      "a.ytp-ad-skip-button-modern",
      ".ytp-ad-skip-button-container button",
      ".ytp-ad-skip-button-container a",
      ".ytp-ad-skip-button-slot button",
      ".ytp-ad-preview-slot button",
      "button.ytp-ad-skip-button-slot",
      "button[aria-label*='Skip ad']",
      "button[aria-label*='Skip Ad']",
      "a[aria-label*='Skip ad']",
      "a[aria-label*='Skip Ad']",
      "button[aria-label*='Skip'][class*='ytp']",
      ".ytp-ad-player-overlay-layout button[aria-label*='Skip']",
      ".ytp-ad-preview-container button",
    ];

    function visible(el) {
      if (!el || el.nodeType !== 1) return false;
      if (el.disabled || el.getAttribute("aria-hidden") === "true") return false;
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      var st = window.getComputedStyle(el);
      if (st.visibility === "hidden" || st.display === "none") return false;
      return true;
    }

    function getSearchRoots() {
      var roots = [];
      var mp = document.getElementById("movie_player");
      if (mp) roots.push(mp);
      var am = document.querySelector(".ytp-ad-module");
      if (am) roots.push(am);
      var pa = document.getElementById("player-api");
      if (pa) roots.push(pa);
      var pc =
        document.querySelector("ytd-watch-flexy #player-container") || document.getElementById("player-container");
      if (pc) roots.push(pc);
      if (roots.length === 0) roots.push(document.documentElement);
      return roots;
    }

    function deepQueryFromRoot(selector, root) {
      var out = [];
      function visit(node) {
        if (!node) return;
        try {
          if (node.nodeType === 1 || node.nodeType === 11) {
            if (node.nodeType === 1 && node.matches && node.matches(selector)) out.push(node);
            if (node.querySelectorAll) {
              var found = node.querySelectorAll(selector);
              for (var i = 0; i < found.length; i++) out.push(found[i]);
            }
          }
        } catch (e) {
          /* bad selector */
        }
        if (node.shadowRoot) visit(node.shadowRoot);
        var kids = node.children;
        if (kids) {
          for (var c = 0; c < kids.length; c++) visit(kids[c]);
        }
      }
      visit(root);
      return out;
    }

    function deepQuerySelectorAll(selector) {
      var roots = getSearchRoots();
      var merged = [];
      for (var r = 0; r < roots.length; r++) {
        var part = deepQueryFromRoot(selector, roots[r]);
        for (var j = 0; j < part.length; j++) {
          if (merged.indexOf(part[j]) === -1) merged.push(part[j]);
        }
      }
      return merged;
    }

    function resolveButton(node) {
      if (!node || node.nodeType !== 1) return null;
      var n = node.nodeName;
      if (n === "BUTTON" || n === "A" || node.getAttribute("role") === "button") return node;
      var btn = node.closest("button, a[role='button'], a.ytp-ad-skip-button-modern, a.ytp-skip-ad-button");
      if (btn) return btn;
      var pe = node.parentElement;
      if (pe && (pe.nodeName === "BUTTON" || pe.nodeName === "A")) return pe;
      return null;
    }

    function findSkipByText() {
      var roots = getSearchRoots();
      var maxBtns = roots.length === 1 && roots[0] === document.documentElement ? 150 : 500;
      var candidates = [];
      for (var r = 0; r < roots.length; r++) {
        var btns = deepQueryFromRoot(
          "button, a[role='button'], a.ytp-skip-ad-button, a.ytp-ad-skip-button-modern, .ytp-ad-button",
          roots[r]
        );
        for (var k = 0; k < btns.length && candidates.length < maxBtns; k++) candidates.push(btns[k]);
      }
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (!visible(el)) continue;
        var al = (el.getAttribute("aria-label") || "").trim();
        var tx = (el.textContent || "").trim();
        var lower = (al + " " + tx).toLowerCase();
        if (lower.indexOf("skip") === -1) continue;
        var cls = el.className && el.className.toString ? el.className.toString() : "";
        if (cls.indexOf("ytp") !== -1 || al.toLowerCase().indexOf("skip") !== -1) return el;
      }
      return null;
    }

    function findFirstSkipTarget() {
      var s, i, nodes, btn;
      for (s = 0; s < SKIP_SELECTORS.length; s++) {
        nodes = deepQuerySelectorAll(SKIP_SELECTORS[s]);
        for (i = 0; i < nodes.length; i++) {
          btn = resolveButton(nodes[i]);
          if (btn && visible(btn)) return btn;
        }
      }
      return findSkipByText();
    }

    window.__nebulaYtSkipProbe = function () {
      var player = document.querySelector(".html5-video-player");
      if (!player || !player.classList.contains("ad-showing")) return null;
      var el = findFirstSkipTarget();
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) };
    };
  }

  var PROBE_INJECT = "(" + pageWorldRunner.toString() + ")()";

  function clearBlackTimers(webview) {
    if (!webview) return;
    if (webview._nebulaBlkT1) {
      clearTimeout(webview._nebulaBlkT1);
      webview._nebulaBlkT1 = null;
    }
    if (webview._nebulaBlkT2) {
      clearTimeout(webview._nebulaBlkT2);
      webview._nebulaBlkT2 = null;
    }
  }

  function runBlackScreenCheck(webview) {
    try {
      if (!isYouTubeWatchUrl(webview.getURL())) return;
      var p = webview.executeJavaScript(BLACK_RECOVER_INJECT, false);
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {
      /* ignore */
    }
  }

  function scheduleBlackScreenChecks(webview) {
    clearBlackTimers(webview);
    if (!isYouTubeWatchUrl(webview.getURL())) return;
    webview._nebulaBlkT1 = window.setTimeout(function () {
      runBlackScreenCheck(webview);
    }, BLACK_CHECK_MS);
    webview._nebulaBlkT2 = window.setTimeout(function () {
      runBlackScreenCheck(webview);
    }, BLACK_CHECK_AGAIN_MS);
  }

  function install(webview) {
    if (!webview || typeof webview.addEventListener !== "function") return;

    function injectProbe() {
      try {
        if (!isYouTubePageUrl(webview.getURL())) return;
        var p = webview.executeJavaScript(PROBE_INJECT, false);
        if (p && typeof p.catch === "function") p.catch(function () {});
      } catch (e) {
        /* destroyed */
      }
    }

    function injectWithRetries() {
      injectProbe();
      setTimeout(injectProbe, 800);
      setTimeout(injectProbe, 2000);
    }

    function onYoutubeNavigation() {
      injectWithRetries();
      if (isYouTubeWatchUrl(webview.getURL())) {
        scheduleBlackScreenChecks(webview);
        scheduleColdStartWatchCheck(webview);
      } else {
        clearBlackTimers(webview);
        clearColdStartTimer(webview);
      }
    }

    webview.addEventListener("did-finish-load", onYoutubeNavigation);
    webview.addEventListener("did-navigate-in-page", onYoutubeNavigation);
    webview.addEventListener("did-navigate", onYoutubeNavigation);

    var lastNative = 0;
    var pollInflight = false;
    var pollTimer = window.setInterval(function () {
      try {
        if (!isYouTubePageUrl(webview.getURL())) return;
        if (typeof webview.getWebContentsId !== "function") return;
        if (!window.nebula || typeof window.nebula.guestClick !== "function") return;
        if (pollInflight) return;
        var now = Date.now();
        if (now - lastNative < NATIVE_COOLDOWN_MS) return;
        var pr = webview.executeJavaScript(
          "(function(){if(typeof window.__nebulaYtAdSpeedSync==='function')window.__nebulaYtAdSpeedSync();return typeof window.__nebulaYtSkipProbe==='function'?window.__nebulaYtSkipProbe():null;})()",
          false
        );
        if (!pr || typeof pr.then !== "function") return;
        pollInflight = true;
        pr.then(function (pt) {
          pollInflight = false;
          if (!pt || typeof pt.x !== "number" || typeof pt.y !== "number") return undefined;
          var t2 = Date.now();
          if (t2 - lastNative < NATIVE_COOLDOWN_MS) return undefined;
          lastNative = t2;
          var id = webview.getWebContentsId();
          return window.nebula.guestClick(id, pt.x, pt.y);
        }).catch(function () {
          pollInflight = false;
        });
      } catch (e) {
        pollInflight = false;
      }
    }, POLL_MS);

    webview._nebulaYtPollTimer = pollTimer;
  }

  function stop(webview) {
    if (!webview) return;
    clearBlackTimers(webview);
    clearColdStartTimer(webview);
    if (webview._nebulaYtPollTimer) {
      clearInterval(webview._nebulaYtPollTimer);
      webview._nebulaYtPollTimer = null;
    }
  }

  window.NebulaYoutubeAdSkip = {
    install: install,
    stop: stop,
    isYouTubePageUrl: isYouTubePageUrl,
    isYouTubeWatchUrl: isYouTubeWatchUrl,
  };
})();
