"use strict";

const SETTINGS_KEY = "autokorea_settings";
const DEFAULTS = { enabled: true, disabledHosts: [] };

const $enabled = document.getElementById("enabled");
const $siteEnabled = document.getElementById("site-enabled");
const $host = document.getElementById("host");
const $openOptions = document.getElementById("open-options");
const $reloadTab = document.getElementById("reload-tab");

let currentHost = "";

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(SETTINGS_KEY, (got) => {
      resolve({ ...DEFAULTS, ...((got && got[SETTINGS_KEY]) || {}) });
    });
  });
}

function saveSettings(next) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [SETTINGS_KEY]: next }, () => resolve());
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
  });
}

function hostFromUrl(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return "";
    return u.hostname;
  } catch (_) {
    return "";
  }
}

function isHostDisabled(host, list) {
  const h = (host || "").toLowerCase();
  return (list || []).some((p) => {
    const x = String(p || "").trim().toLowerCase();
    return x && (h === x || h.endsWith("." + x));
  });
}

async function init() {
  const tab = await getActiveTab();
  currentHost = hostFromUrl(tab && tab.url);
  $host.textContent = currentHost || "(이 페이지에서는 동작 안 함)";
  $siteEnabled.disabled = !currentHost;

  const settings = await getSettings();
  $enabled.checked = settings.enabled !== false;
  $siteEnabled.checked = !!currentHost && !isHostDisabled(currentHost, settings.disabledHosts);
}

$enabled.addEventListener("change", async () => {
  const s = await getSettings();
  s.enabled = $enabled.checked;
  await saveSettings(s);
});

$siteEnabled.addEventListener("change", async () => {
  if (!currentHost) return;
  const s = await getSettings();
  const set = new Set((s.disabledHosts || []).map((x) => String(x).toLowerCase()));
  if ($siteEnabled.checked) set.delete(currentHost.toLowerCase());
  else set.add(currentHost.toLowerCase());
  s.disabledHosts = Array.from(set);
  await saveSettings(s);
});

$openOptions.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

$reloadTab.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (tab && tab.id != null) chrome.tabs.reload(tab.id);
  window.close();
});

init();
