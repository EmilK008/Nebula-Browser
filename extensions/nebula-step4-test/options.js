const noteInput = document.getElementById("note");
const savedEl = document.getElementById("saved");
let saveTimer = null;

chrome.storage.sync.get({ testNote: "" }, (data) => {
  if (noteInput) noteInput.value = data.testNote || "";
});

noteInput?.addEventListener("input", () => {
  if (saveTimer) clearTimeout(saveTimer);
  if (savedEl) savedEl.hidden = true;
  saveTimer = setTimeout(() => {
    const v = noteInput?.value || "";
    chrome.storage.sync.set({ testNote: v }, () => {
      if (savedEl) savedEl.hidden = false;
    });
  }, 350);
});
