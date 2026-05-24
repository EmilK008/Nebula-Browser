/**
 * Default search engines for omnibox (URL build, past-search extraction, live suggestions).
 */
(function nebulaSearchProvidersInit() {
  "use strict";

  /** @type {Record<string, { id: string, label: string, buildSearchUrl: (q: string) => string, extractQueryFromUrl: (url: string) => string|null, fetchRemoteSuggestions: (q: string, max: number) => Promise<string[]> }>} */
  const PROVIDERS = {
    duckduckgo: {
      id: "duckduckgo",
      label: "DuckDuckGo",
      buildSearchUrl(q) {
        return "https://duckduckgo.com/?q=" + encodeURIComponent(q);
      },
      extractQueryFromUrl(url) {
        try {
          const u = new URL(url);
          if (!u.hostname.endsWith("duckduckgo.com")) return null;
          const qq = u.searchParams.get("q");
          return qq != null && String(qq).trim() ? String(qq).trim() : null;
        } catch {
          return null;
        }
      },
      async fetchRemoteSuggestions(query, max) {
        const url = "https://duckduckgo.com/ac/?q=" + encodeURIComponent(query) + "&type=list";
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].filter((x) => typeof x === "string").slice(0, max);
        }
        return [];
      },
    },
    google: {
      id: "google",
      label: "Google",
      buildSearchUrl(q) {
        return "https://www.google.com/search?q=" + encodeURIComponent(q);
      },
      extractQueryFromUrl(url) {
        try {
          const u = new URL(url);
          const h = u.hostname.toLowerCase();
          if (h !== "google.com" && !h.endsWith(".google.com")) return null;
          const qq = u.searchParams.get("q");
          return qq != null && String(qq).trim() ? String(qq).trim() : null;
        } catch {
          return null;
        }
      },
      async fetchRemoteSuggestions(query, max) {
        const url =
          "https://clients1.google.com/complete/search?client=firefox&q=" + encodeURIComponent(query);
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].filter((x) => typeof x === "string").slice(0, max);
        }
        return [];
      },
    },
    bing: {
      id: "bing",
      label: "Bing",
      buildSearchUrl(q) {
        return "https://www.bing.com/search?q=" + encodeURIComponent(q);
      },
      extractQueryFromUrl(url) {
        try {
          const u = new URL(url);
          const h = u.hostname.toLowerCase();
          if (h !== "bing.com" && !h.endsWith(".bing.com")) return null;
          const qq = u.searchParams.get("q");
          return qq != null && String(qq).trim() ? String(qq).trim() : null;
        } catch {
          return null;
        }
      },
      async fetchRemoteSuggestions(query, max) {
        const url = "https://api.bing.com/osjson.aspx?query=" + encodeURIComponent(query);
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].filter((x) => typeof x === "string").slice(0, max);
        }
        return [];
      },
    },
    ai: {
      id: "ai",
      label: "AI search",
      buildSearchUrl() {
        return "";
      },
      extractQueryFromUrl(url) {
        try {
          const u = new URL(url);
          if (u.protocol !== "nebula:" || u.hostname !== "ai-search") return null;
          const qq = u.searchParams.get("q");
          return qq != null && String(qq).trim() ? String(qq).trim() : null;
        } catch {
          return null;
        }
      },
      async fetchRemoteSuggestions(query, max) {
        if (!query.trim()) return [];
        try {
          return await PROVIDERS.duckduckgo.fetchRemoteSuggestions(query, max);
        } catch {
          return [];
        }
      },
    },
  };

  const ENGINE_IDS = ["duckduckgo", "google", "bing", "ai"];

  function normalizeEngineId(raw) {
    const id = String(raw || "duckduckgo").trim().toLowerCase();
    return ENGINE_IDS.includes(id) ? id : "duckduckgo";
  }

  function getProvider(engineId) {
    return PROVIDERS[normalizeEngineId(engineId)] || PROVIDERS.duckduckgo;
  }

  /** Live-completion source for AI search (same DDG suggest API as default web engines). */
  function getWebSuggestProvider() {
    return PROVIDERS.duckduckgo;
  }

  /** Extract search query from any supported web engine URL (for AI past-search layer). */
  function extractQueryFromAnyWebSearchUrl(url) {
    for (const id of ["duckduckgo", "google", "bing"]) {
      const q = PROVIDERS[id].extractQueryFromUrl(url);
      if (q) return q;
    }
    return null;
  }

  window.NebulaSearchProviders = {
    ENGINE_IDS,
    normalizeEngineId,
    getProvider,
    getWebSuggestProvider,
    extractQueryFromAnyWebSearchUrl,
    PROVIDERS,
  };
})();
