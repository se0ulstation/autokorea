(function () {
  "use strict";

  const ns = (globalThis.__AutoKorea = globalThis.__AutoKorea || {});

  let host = null;
  let shadow = null;
  let card = null;
  let countEl = null;
  let hideTimer = null;
  let count = 0;

  function ensureMounted() {
    if (host && document.body.contains(host)) return;
    host = document.createElement("div");
    host.id = "__autokorea_toast_host";
    host.style.cssText = "all: initial; position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 2147483647; pointer-events: none;";
    shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .card {
        pointer-events: auto;
        font: 15px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, rgba(28,28,32,0.96), rgba(20,20,24,0.96));
        color: #fff;
        padding: 14px 18px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 12px 36px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2);
        min-width: 320px;
        max-width: 480px;
        opacity: 0;
        transform: translateY(-12px);
        transition: opacity .22s ease, transform .22s ease;
        backdrop-filter: blur(10px) saturate(1.4);
        -webkit-backdrop-filter: blur(10px) saturate(1.4);
      }
      .card.show { opacity: 1; transform: translateY(0); }
      .row { display: flex; align-items: center; gap: 12px; }
      .flag {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
      }
      .msg { flex: 1; font-weight: 500; letter-spacing: -0.01em; }
      .msg b { color: #fef08a; font-weight: 700; }
      .close {
        color: #9ca3af;
        cursor: pointer;
        user-select: none;
        font-size: 20px;
        line-height: 1;
        padding: 2px 6px;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .close:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .actions { margin-top: 10px; display: flex; gap: 14px; font-size: 12px; padding-left: 36px; }
      .link { color: #93c5fd; cursor: pointer; text-decoration: none; }
      .link:hover { text-decoration: underline; }
    `;
    shadow.appendChild(style);

    card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="row">
        <span class="flag">🇰🇷</span>
        <span class="msg" id="ak-msg"></span>
        <span class="close" id="ak-close" title="닫기">×</span>
      </div>
      <div class="actions">
        <span class="link" id="ak-disable-site">이 사이트에서 끄기</span>
        <span class="link" id="ak-options">옵션</span>
      </div>
    `;
    shadow.appendChild(card);
    document.body.appendChild(host);

    countEl = shadow.getElementById("ak-msg");
    shadow.getElementById("ak-close").addEventListener("click", hide);
    shadow.getElementById("ak-disable-site").addEventListener("click", () => {
      const sendDisable = () => {
        try {
          chrome.runtime.sendMessage({ type: "autokorea:disable-host", host: location.hostname }, () => {
            try { location.reload(); } catch (_) {}
          });
        } catch (_) {
          try { location.reload(); } catch (_) {}
        }
      };
      flashMessage("이 사이트에서 비활성화 중…");
      setTimeout(sendDisable, 600);
    });
    shadow.getElementById("ak-options").addEventListener("click", () => {
      try {
        chrome.runtime.sendMessage({ type: "autokorea:open-options" });
      } catch (_) {}
    });
  }

  function show(addCount) {
    ensureMounted();
    count += typeof addCount === "number" && addCount > 0 ? addCount : 1;
    countEl.innerHTML = `<b>${count}개</b> 필드를 한국으로 채웠어요`;
    requestAnimationFrame(() => card.classList.add("show"));
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 3800);
  }

  function flashMessage(text) {
    ensureMounted();
    const msg = shadow.getElementById("ak-msg");
    msg.textContent = text;
    card.classList.add("show");
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 2600);
  }

  function hide() {
    if (!card) return;
    card.classList.remove("show");
  }

  ns.toast = { show, hide, flashMessage };
})();
