(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});
  const handledContainers = new WeakSet();

  const PATTERNS = [
    {
      name: "intl-tel-input",
      container: ".iti",
      trigger: ".iti__selected-country, .iti__selected-flag",
      kr: '.iti__country[data-country-code="kr"], li[data-country-code="kr"]'
    },
    {
      name: "react-phone-input-2",
      container: ".react-tel-input, .flag-dropdown",
      trigger: ".selected-flag",
      kr: '.country[data-country-code="kr"]'
    },
    {
      name: "react-phone-number-input",
      container: ".PhoneInput",
      trigger: ".PhoneInputCountry",
      kr: 'option[value="KR"]',
      isSelect: true
    },
    {
      name: "generic-data-country",
      container: "[data-country-trigger-root], form, body",
      trigger: '[data-country-trigger], [aria-label*="country code" i]',
      kr: '[data-country="KR"], [data-country="kr"], [data-iso2="kr"]'
    }
  ];

  function visible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function alreadyKorea(container, name) {
    if (name === "intl-tel-input") {
      const flag = container.querySelector(
        ".iti__selected-flag .iti__flag, .iti__selected-country .iti__flag, .iti__flag"
      );
      if (flag && flag.classList.contains("iti__kr")) return true;
      const sc = container.querySelector(".iti__selected-country, .iti__selected-flag");
      if (sc) {
        const code = sc.getAttribute("data-country-code") || sc.getAttribute("title") || "";
        if (/\bkr\b/i.test(code) || /korea/i.test(code)) return true;
      }
      const hiddenInput = container.querySelector('input[type="hidden"][name*="country" i]');
      if (hiddenInput && hiddenInput.value && hiddenInput.value.toLowerCase() === "kr") return true;
    }
    if (name === "react-phone-input-2") {
      const flag = container.querySelector(".selected-flag .flag");
      if (flag && /\bkr\b/.test(flag.className)) return true;
      const sf = container.querySelector(".selected-flag");
      if (sf && /korea/i.test(sf.getAttribute("title") || "")) return true;
    }
    if (name === "react-phone-number-input") {
      const sel = container.querySelector("select");
      if (sel && (sel.value || "").toUpperCase() === "KR") return true;
    }
    if (name === "generic-data-country") {
      const trigger = container.querySelector("[data-country], [data-iso2]");
      if (trigger) {
        const v = (trigger.getAttribute("data-country") || trigger.getAttribute("data-iso2") || "").toLowerCase();
        if (v === "kr") return true;
      }
    }
    return false;
  }

  async function processContainer(container, pattern) {
    if (handledContainers.has(container)) return false;

    if (alreadyKorea(container, pattern.name)) {
      handledContainers.add(container);
      return false;
    }

    const trigger = container.querySelector(pattern.trigger);
    if (!trigger) return false;

    if (pattern.isSelect) {
      const sel = container.querySelector("select");
      if (!sel) return false;
      const opt = sel.querySelector(pattern.kr);
      if (!opt) return false;
      if (sel.value === opt.value) {
        handledContainers.add(container);
        return false;
      }
      const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
      if (desc && desc.set) desc.set.call(sel, opt.value);
      else sel.value = opt.value;
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      handledContainers.add(container);
      return true;
    }

    handledContainers.add(container);
    trigger.click();
    await new Promise((r) => setTimeout(r, 140));

    let krEl = container.querySelector(pattern.kr) || document.querySelector(pattern.kr);
    if (!krEl || !visible(krEl)) {
      await new Promise((r) => setTimeout(r, 200));
      krEl = container.querySelector(pattern.kr) || document.querySelector(pattern.kr);
    }
    if (!krEl) {
      document.body.click();
      return false;
    }

    krEl.scrollIntoView({ block: "nearest" });
    krEl.click();
    return true;
  }

  async function scan(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const seen = new Set();
    let changed = 0;
    for (const p of PATTERNS) {
      if (p.container === "form" || p.container === "body") continue;
      const containers = scope.querySelectorAll(p.container);
      for (const c of containers) {
        if (seen.has(c)) continue;
        seen.add(c);
        try {
          const ok = await processContainer(c, p);
          if (ok) changed++;
        } catch (_) {}
      }
    }
    return changed;
  }

  ns.handlers = ns.handlers || {};
  ns.handlers.phoneCountry = { scan };
})();
