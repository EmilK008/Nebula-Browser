const countEl = document.getElementById("count");
const bumpBtn = document.getElementById("bump");

function render(n) {
  if (countEl) countEl.textContent = `Opens: ${n}`;
}

chrome.storage.local.get({ popupOpens: 0 }, (data) => {
  render(Number(data.popupOpens) || 0);
});

bumpBtn?.addEventListener("click", () => {
  chrome.storage.local.get({ popupOpens: 0 }, (data) => {
    const next = (Number(data.popupOpens) || 0) + 1;
    chrome.storage.local.set({ popupOpens: next }, () => render(next));
  });
});
