/**
 * Settings panel section search (category titles + keywords, fuzzy match).
 */
(function nebulaSettingsSearchInit() {
  "use strict";

  const MIN_SCORE = 0.38;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/&amp;/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function levenshteinDistance(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const row = new Array(n + 1);
    for (let j = 0; j <= n; j++) row[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = row[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
        prev = tmp;
      }
    }
    return row[n];
  }

  function similarityRatio(a, b) {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (b.includes(a)) return 0.95;
    if (a.includes(b)) return 0.88;
    const dist = levenshteinDistance(a, b);
    return 1 - dist / Math.max(a.length, b.length);
  }

  /**
   * Fuzzy score of query against a section's category + keywords (0–1).
   * @param {string} query
   * @param {string} category
   * @param {string} keywords comma-separated
   */
  function scoreSection(query, category, keywords) {
    const q = normalize(query);
    if (!q) return 1;
    const cat = normalize(category);
    const kw = normalize(String(keywords || "").replace(/,/g, " "));
    const combined = (cat + " " + kw).trim();

    if (cat.includes(q) || combined.includes(q)) return 1;

    let best = similarityRatio(q, cat);
    best = Math.max(best, similarityRatio(q, combined) * 0.92);

    const qWords = q.split(/\s+/).filter(Boolean);
    const catWords = cat.split(/\s+/).filter(Boolean);
    const kwWords = kw.split(/\s+/).filter(Boolean);
    const allWords = [...catWords, ...kwWords];

    if (qWords.length > 1) {
      let sum = 0;
      for (const w of qWords) {
        let wb = similarityRatio(w, cat);
        for (const tw of allWords) wb = Math.max(wb, similarityRatio(w, tw));
        if (cat.includes(w)) wb = Math.max(wb, 0.94);
        if (combined.includes(w)) wb = Math.max(wb, 0.9);
        sum += wb;
      }
      best = Math.max(best, sum / qWords.length);
    } else {
      for (const tw of allWords) best = Math.max(best, similarityRatio(q, tw));
    }

    return best;
  }

  /**
   * @param {string} query
   * @param {HTMLElement[]} sections
   * @returns {{ visible: number }}
   */
  function filterSettingsSections(query, sections) {
    const q = String(query || "").trim();
    let visible = 0;
    for (const sec of sections) {
      if (!q) {
        sec.hidden = false;
        sec.classList.remove("settings-section--filtered-out");
        visible++;
        continue;
      }
      const category =
        sec.dataset.settingsCategory ||
        sec.querySelector(".settings-section-title")?.textContent?.trim() ||
        "";
      const keywords = sec.dataset.settingsKeywords || "";
      const score = scoreSection(q, category, keywords);
      const show = score >= MIN_SCORE;
      sec.hidden = !show;
      sec.classList.toggle("settings-section--filtered-out", !show);
      if (show) visible++;
    }
    return { visible };
  }

  window.NebulaSettingsSearch = {
    scoreSection,
    filterSettingsSections,
    MIN_SCORE,
  };
})();
