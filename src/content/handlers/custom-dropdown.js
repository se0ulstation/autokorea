(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});
  const { detector } = ns;
  const handled = new WeakSet();
  const inFlight = new WeakSet();

  const COUNTRY_HINT_RE = /\b(country|countries|nation|region|territory|국가|나라|지역|国家|国|국적)\b/i;

  function nearbyText(el) {
    const parts = [];
    if (el.getAttribute("aria-label")) parts.push(el.getAttribute("aria-label"));
    if (el.getAttribute("placeholder")) parts.push(el.getAttribute("placeholder"));
    if (el.getAttribute("name")) parts.push(el.getAttribute("name"));
    if (el.id) parts.push(el.id);
    const labelledby = el.getAttribute("aria-labelledby");
    if (labelledby) {
      for (const id of labelledby.split(/\s+/)) {
        const lab = document.getElementById(id);
        if (lab) parts.push(lab.textContent || "");
      }
    }
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lab) parts.push(lab.textContent || "");
    }
    let p = el.parentElement;
    let hops = 0;
    while (p && hops < 3) {
      const lbl = p.querySelector("label");
      if (lbl) parts.push(lbl.textContent || "");
      p = p.parentElement;
      hops++;
    }
    return parts.join(" ");
  }

  function looksLikeCountryTrigger(el) {
    return COUNTRY_HINT_RE.test(nearbyText(el));
  }

  function findTriggers(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const candidates = scope.querySelectorAll(
      '[role="combobox"], [aria-haspopup="listbox"], [aria-haspopup="dialog"], [aria-haspopup="true"], button[aria-expanded]'
    );
    const out = [];
    for (const el of candidates) {
      if (handled.has(el) || inFlight.has(el)) continue;
      if (el.tagName === "SELECT") continue;
      if (looksLikeCountryTrigger(el)) out.push(el);
    }
    return out;
  }

  function snapshotListboxIds() {
    const set = new Set();
    document.querySelectorAll('[role="listbox"], [role="dialog"]').forEach((el) => set.add(el));
    return set;
  }

  function findNewListbox(before) {
    const all = document.querySelectorAll('[role="listbox"], [role="dialog"]');
    for (const el of all) {
      if (!before.has(el)) return el;
    }
    for (const el of all) {
      const style = el.ownerDocument.defaultView.getComputedStyle(el);
      if (style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null) return el;
    }
    return null;
  }

  function findKoreaOption(listbox) {
    const opts = listbox.querySelectorAll('[role="option"], li, [data-value], [data-country], [data-country-code]');
    if (!opts.length) return null;
    const arr = Array.from(opts);
    const idx = detector.pickKoreaIndex(arr, (el) => {
      const dc = el.getAttribute("data-country") || el.getAttribute("data-country-code") || el.getAttribute("data-value");
      if (dc) {
        const c = detector.classify(dc);
        if (c.kind === "kr") return dc;
      }
      return el.textContent || "";
    });
    return idx >= 0 ? arr[idx] : null;
  }

  function dispatchKey(el, key) {
    for (const type of ["keydown", "keypress", "keyup"]) {
      el.dispatchEvent(new KeyboardEvent(type, { key, code: key, bubbles: true, cancelable: true }));
    }
  }

  function setInputValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) desc.set.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function tryTrigger(trigger) {
    if (handled.has(trigger) || inFlight.has(trigger)) return false;
    inFlight.add(trigger);

    try {
      const before = snapshotListboxIds();
      trigger.click();

      await new Promise((r) => setTimeout(r, 80));
      let listbox = findNewListbox(before);
      if (!listbox) {
        await new Promise((r) => setTimeout(r, 200));
        listbox = findNewListbox(before);
      }
      if (!listbox) return false;

      let target = findKoreaOption(listbox);
      if (!target) {
        const search =
          listbox.querySelector('input[type="search"]') ||
          listbox.querySelector('input[type="text"]') ||
          listbox.querySelector("input:not([type])") ||
          document.querySelector('[role="combobox"] input, input[aria-controls="' + (listbox.id || "") + '"]');
        if (search) {
          for (const q of ["kor", "Korea", "Korea, Republic of", "한국", "대한민국"]) {
            setInputValue(search, q);
            await new Promise((r) => setTimeout(r, 220));
            target = findKoreaOption(listbox);
            if (target) break;
          }
        }
      }

      if (!target) {
        dispatchKey(trigger, "Escape");
        dispatchKey(document.activeElement || trigger, "Escape");
        return false;
      }

      target.scrollIntoView({ block: "nearest" });
      target.click();
      handled.add(trigger);
      return true;
    } catch (_) {
      return false;
    } finally {
      setTimeout(() => inFlight.delete(trigger), 600);
    }
  }

  async function scan(root) {
    const triggers = findTriggers(root);
    let changed = 0;
    for (const t of triggers) {
      const ok = await tryTrigger(t);
      if (ok) changed++;
    }
    return changed;
  }

  ns.handlers = ns.handlers || {};
  ns.handlers.customDropdown = { scan };
})();
