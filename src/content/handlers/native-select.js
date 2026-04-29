(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});
  const { detector } = ns;
  const handled = new WeakSet();

  function setSelectValue(select, value) {
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    if (desc && desc.set) {
      desc.set.call(select, value);
    } else {
      select.value = value;
    }
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function process(select) {
    if (handled.has(select)) return false;
    if (select.disabled) return false;
    if (select.multiple) return false;
    const options = Array.from(select.options).filter((o) => !o.disabled && o.value !== "");
    if (options.length === 0) return false;

    const labels = options.map((o) => (o.textContent || "").trim());
    if (!detector.looksLikeCountryList(labels)) {
      handled.add(select);
      return false;
    }

    const idxByLabel = detector.pickKoreaIndex(options, (o) => o.textContent || "");
    let chosen = idxByLabel >= 0 ? options[idxByLabel] : null;

    if (!chosen) {
      const idxByValue = detector.pickKoreaIndex(options, (o) => o.value || "");
      if (idxByValue >= 0) chosen = options[idxByValue];
    }

    if (!chosen) {
      handled.add(select);
      return false;
    }

    if (select.value === chosen.value) {
      handled.add(select);
      return false;
    }

    setSelectValue(select, chosen.value);
    handled.add(select);
    return true;
  }

  function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const selects = scope.querySelectorAll("select");
    let changed = 0;
    for (const sel of selects) {
      if (process(sel)) changed++;
    }
    return changed;
  }

  ns.handlers = ns.handlers || {};
  ns.handlers.nativeSelect = { scan, process };
})();
