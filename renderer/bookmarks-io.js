/**
 * Parse/export bookmarks for Chrome-style JSON and Netscape HTML.
 * Chrome "Bookmarks" file: %LocalAppData%\Google\Chrome\User Data\Default\Bookmarks
 * Or export HTML from Chrome: Bookmark manager → ⋯ → Export bookmarks.
 */
(function bookmarksIoInit() {
  "use strict";

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function walkChromeNode(node, out) {
    if (!node || typeof node !== "object") return;
    if (node.type === "url" && typeof node.url === "string") {
      out.push({ url: node.url, title: typeof node.name === "string" ? node.name : "" });
      return;
    }
    var ch = node.children;
    if (Array.isArray(ch)) {
      for (var i = 0; i < ch.length; i++) walkChromeNode(ch[i], out);
    }
  }

  function parseChromeBookmarksJson(text) {
    var json = JSON.parse(text);
    var out = [];
    var roots = json.roots || {};
    var keys = Object.keys(roots);
    for (var k = 0; k < keys.length; k++) walkChromeNode(roots[keys[k]], out);
    return out;
  }

  function parseNetscapeHtml(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var out = [];
    var nodes = doc.querySelectorAll("a[href]");
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      var href = a.getAttribute("href");
      if (!href || href.trim().toLowerCase().indexOf("javascript:") === 0) continue;
      try {
        var u = new URL(href);
        if (u.protocol !== "http:" && u.protocol !== "https:") continue;
        var title = (a.textContent || "").trim();
        out.push({ url: u.href, title: title || u.hostname });
      } catch (e) {
        /* skip bad URL */
      }
    }
    return out;
  }

  /**
   * @param {string} text raw file
   * @returns {{ url: string, title: string }[]}
   */
  function parseBookmarkFile(text) {
    var t = text.trim();
    if (t.charAt(0) === "{") {
      try {
        return parseChromeBookmarksJson(text);
      } catch (e) {
        return parseNetscapeHtml(text);
      }
    }
    return parseNetscapeHtml(text);
  }

  /**
   * @param {{ url: string, title: string }[]} bookmarks
   */
  function exportNetscapeHtml(bookmarks) {
    var lines = [
      "<!DOCTYPE NETSCAPE-Bookmark-file-1>",
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
      "<TITLE>Bookmarks</TITLE>",
      "<H1>Bookmarks</H1>",
      "<DL><p>",
    ];
    for (var i = 0; i < bookmarks.length; i++) {
      var b = bookmarks[i];
      if (!b || typeof b.url !== "string") continue;
      lines.push('    <DT><A HREF="' + escapeHtml(b.url) + '">' + escapeHtml(b.title || b.url) + "</A>");
    }
    lines.push("</DL><p>");
    return lines.join("\n");
  }

  /**
   * @param {{ url: string, title: string }[]} bookmarks
   */
  function exportNebulaJson(bookmarks) {
    return JSON.stringify(bookmarks, null, 2);
  }

  window.NebulaBookmarksIO = {
    parseBookmarkFile: parseBookmarkFile,
    exportNetscapeHtml: exportNetscapeHtml,
    exportNebulaJson: exportNebulaJson,
  };
})();
