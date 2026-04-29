"use strict";

const SETTINGS_KEY = "autokorea_settings";
const DEFAULTS = { enabled: true, disabledHosts: [] };

const $enabled = document.getElementById("enabled");
const $disabled = document.getElementById("disabled");
const $save = document.getElementById("save");
const $reset = document.getElementById("reset");
const $saved = document.getElementById("saved");

function load() {
  chrome.storage.sync.get(SETTINGS_KEY, (got) => {
    const v = { ...DEFAULTS, ...((got && got[SETTINGS_KEY]) || {}) };
    $enabled.checked = v.enabled !== false;
    $disabled.value = (v.disabledHosts || []).join("\n");
  });
}

function parseHosts(text) {
  return Array.from(
    new Set(
      String(text || "")
        .split(/\r?\n/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .map((s) => s.replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    )
  );
}

function save() {
  const next = {
    enabled: $enabled.checked,
    disabledHosts: parseHosts($disabled.value)
  };
  chrome.storage.sync.set({ [SETTINGS_KEY]: next }, () => {
    $saved.classList.add("show");
    setTimeout(() => $saved.classList.remove("show"), 1200);
  });
}

$save.addEventListener("click", save);
$enabled.addEventListener("change", save);
$reset.addEventListener("click", () => {
  if (!confirm("모든 설정을 초기화할까요?")) return;
  chrome.storage.sync.set({ [SETTINGS_KEY]: DEFAULTS }, load);
});

load();
