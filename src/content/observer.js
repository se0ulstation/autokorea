(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});

  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        t = null;
        fn.apply(this, args);
      }, wait);
    };
  }

  function start(onScan) {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", () => start(onScan), { once: true });
      return;
    }

    const trigger = debounce(() => {
      try {
        onScan();
      } catch (_) {}
    }, 150);

    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.addedNodes && m.addedNodes.length) {
          trigger();
          return;
        }
        if (m.type === "attributes") {
          trigger();
          return;
        }
      }
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-expanded", "aria-hidden", "hidden", "style"]
    });

    // Patching history.pushState in the isolated world does NOT intercept page-side
    // calls (V8 worlds isolate property writes), so we rely on MutationObserver
    // for SPA route renders + popstate for native back/forward.
    window.addEventListener("popstate", () => trigger());
    window.addEventListener("hashchange", () => trigger());

    trigger();
  }

  ns.observer = { start, debounce };
})();
