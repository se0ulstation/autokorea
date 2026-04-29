(function () {
  "use strict";

  const ns = globalThis.__AutoKorea;
  if (!ns || !ns.observer || !ns.handlers) return;

  const SETTINGS_KEY = "autokorea_settings";
  const DEFAULTS = { enabled: true, disabledHosts: [] };

  function loadSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(SETTINGS_KEY, (got) => {
          if (chrome.runtime.lastError) {
            resolve(DEFAULTS);
            return;
          }
          const v = got && got[SETTINGS_KEY];
          if (!v) resolve(DEFAULTS);
          else resolve({ ...DEFAULTS, ...v });
        });
      } catch (_) {
        resolve(DEFAULTS);
      }
    });
  }

  function hostMatches(host, patterns) {
    if (!patterns || !patterns.length) return false;
    const h = (host || "").toLowerCase();
    for (const raw of patterns) {
      const p = String(raw || "").trim().toLowerCase();
      if (!p) continue;
      if (h === p) return true;
      if (h.endsWith("." + p)) return true;
    }
    return false;
  }

  async function boot() {
    const settings = await loadSettings();
    if (!settings.enabled) return;
    if (hostMatches(location.hostname, settings.disabledHosts)) return;

    let scanning = false;
    let pendingChange = false;

    async function runScan() {
      if (scanning) return;
      scanning = true;
      try {
        let total = 0;
        try { total += ns.handlers.nativeSelect.scan(document) || 0; } catch (_) {}
        try { total += await ns.handlers.phoneCountry.scan(document) || 0; } catch (_) {}
        try { total += await ns.handlers.customDropdown.scan(document) || 0; } catch (_) {}
        if (total > 0) ns.toast.show(total);
        if (pendingChange) {
          pendingChange = false;
          setTimeout(runScan, 200);
        }
      } finally {
        scanning = false;
      }
    }

    ns.observer.start(() => {
      if (scanning) {
        pendingChange = true;
      } else {
        runScan();
      }
    });

    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "sync") return;
        if (!changes[SETTINGS_KEY]) return;
        const next = { ...DEFAULTS, ...(changes[SETTINGS_KEY].newValue || {}) };
        if (!next.enabled || hostMatches(location.hostname, next.disabledHosts)) {
          location.reload();
        }
      });
    } catch (_) {}
  }

  boot();
})();
