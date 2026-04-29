"use strict";

const SETTINGS_KEY = "autokorea_settings";
const DEFAULTS = { enabled: true, disabledHosts: [] };

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTINGS_KEY, (got) => {
      const v = got && got[SETTINGS_KEY];
      resolve({ ...DEFAULTS, ...(v || {}) });
    });
  });
}

function saveSettings(next) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: next }, () => resolve());
  });
}

async function disableHost(host) {
  if (!host) return;
  const cur = await loadSettings();
  const norm = host.toLowerCase();
  if (cur.disabledHosts.includes(norm)) return;
  cur.disabledHosts.push(norm);
  await saveSettings(cur);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg.type !== "string") return;
  if (msg.type === "autokorea:disable-host") {
    const host = msg.host || (sender.url ? new URL(sender.url).hostname : "");
    disableHost(host).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "autokorea:open-options") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  const cur = await loadSettings();
  await saveSettings(cur);
});
