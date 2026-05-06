// ==UserScript==
// @name         Dåliga Nyheter – Fusk (Vuex direkt)
// @namespace    https://badnewsswedish.eu
// @version      2.0
// @description  Fuska direkt i Vuex-state – funkar på riktiga badnewsswedish.eu
// @match        https://www.badnewsswedish.eu/*
// @match        https://badnewsswedish.eu/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var MAX_FOLLOWERS = 99500;
  var MAX_TRUST = 100; // trust går -100 till 100 på riktiga sajten

  // ─── Hämta Vuex store ────────────────────────────────────────
  function getStore() {
    var root = document.getElementById('app');
    if (!root) return null;

    // Vue 2: __vue__ på rot-elementet
    var vue = root.__vue__;
    if (!vue) return null;

    // Ibland sitter store på root, ibland på första barnet
    if (vue.$store) return vue.$store;
    if (vue.$children && vue.$children[0] && vue.$children[0].$store) {
      return vue.$children[0].$store;
    }

    // Sök nedåt i trädet
    function search(vm) {
      if (!vm) return null;
      if (vm.$store) return vm.$store;
      for (var i = 0; i < (vm.$children || []).length; i++) {
        var found = search(vm.$children[i]);
        if (found) return found;
      }
      return null;
    }
    return search(vue);
  }

  // ─── Kör fusk ────────────────────────────────────────────
  function runCheats(store) {
    // Followers & trust
    store.commit('setFollowers', MAX_FOLLOWERS);
    store.commit('setTrust', MAX_TRUST);

    // Lås upp alla badges
    if (store.state.badges && store.state.badges.length > 0) {
      var earnedBadges = store.state.badges.map(function (b) {
        return Object.assign({}, b, { earned: true, lastEarned: false });
      });
      store.commit('setBadges', earnedBadges);
      store.commit('setBadgesWon', store.state.badgesTotal || earnedBadges.length);
    }
  }

  // ─── Välj bästa svar ─────────────────────────────────────────
  function autoAnswer() {
    var btns = Array.from(document.querySelectorAll(
      '.question-option, .answer, [class*="option"], [class*="choice"], [class*="answer"], button'
    )).filter(function (el) {
      return el.offsetParent !== null && el.textContent.trim().length > 5;
    });

    if (!btns.length) {
      alert('Inga svar hittades – är du mitt i en fråga?');
      return;
    }

    var best = btns.reduce(function (a, b) {
      return b.textContent.length > a.textContent.length ? b : a;
    });
    best.click();
  }

  // ─── Visa panel ──────────────────────────────────────────────
  function showPanel(store) {
    var old = document.getElementById('__fusk_panel__');
    if (old) { old.remove(); return; }

    var panel = document.createElement('div');
    panel.id = '__fusk_panel__';
    panel.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px',
      'z-index:2147483647',
      'background:#ffff00', 'color:#000',
      'font-family:monospace', 'font-size:13px',
      'padding:16px 18px', 'border:3px solid #000',
      'min-width:210px',
      'box-shadow:0 4px 24px rgba(0,0,0,0.4)',
      'touch-action:none',
      'user-select:none'
    ].join(';');

    var trust = store ? store.state.trust : MAX_TRUST;
    var fol   = store ? store.state.followers : MAX_FOLLOWERS;

    panel.innerHTML = [
      '<div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;margin-bottom:4px">⚡ FUSK AKTIVERAT</div>',
      '<div style="font-size:28px;font-weight:700;line-height:1;margin-bottom:2px" id="__fusk_fol__">' + fol.toLocaleString('sv-SE') + '</div>',
      '<div style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#555;margin-bottom:8px">FÖLJARE</div>',
      '<div style="background:#000;color:#fff;padding:6px 10px;display:flex;gap:8px;align-items:center;margin-bottom:8px">',
      '  <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;flex:1">TROVÄRDIGHET</span>',
      '  <span style="font-weight:700" id="__fusk_trust__">' + trust + '%</span>',
      '</div>',
      '<div style="display:flex;gap:4px;margin-bottom:10px">',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">🎭</span>',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">😱</span>',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">⚔️</span>',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">🔍</span>',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">🗑️</span>',
      '  <span style="background:#f00;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">👾</span>',
      '</div>',
      '<div style="display:flex;flex-direction:column;gap:5px">',
      '  <button id="__fusk_max__" style="background:#000;color:#ffff00;border:none;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:9px;cursor:pointer;width:100%">🏆 MAX POÄNG</button>',
      '  <button id="__fusk_win__" style="background:#0000cc;color:#fff;border:none;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:9px;cursor:pointer;width:100%">🎉 VISA SLUTSKÄRM</button>',
      '  <button id="__fusk_auto__" style="background:#006600;color:#fff;border:none;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:9px;cursor:pointer;width:100%">⚡ AUTO-SVAR</button>',
      '  <button id="__fusk_close__" style="background:#555;color:#fff;border:none;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:9px;cursor:pointer;width:100%">✕ STÄNG</button>',
      '</div>'
    ].join('');

    document.body.appendChild(panel);

    document.getElementById('__fusk_max__').onclick = function () {
      var s = getStore();
      if (s) {
        runCheats(s);
        document.getElementById('__fusk_fol__').textContent = MAX_FOLLOWERS.toLocaleString('sv-SE');
        document.getElementById('__fusk_trust__').textContent = MAX_TRUST + '%';
      } else {
        alert('Spelet ej laddat ännu. Vänta och försök igen.');
      }
    };

    document.getElementById('__fusk_win__').onclick = function () {
      var s = getStore();
      if (s) {
        runCheats(s);
        setTimeout(function () { s.dispatch('gameWin'); }, 200);
      } else {
        alert('Spelet ej laddat ännu. Starta spelet och försök igen.');
      }
    };

    document.getElementById('__fusk_auto__').onclick = autoAnswer;
    document.getElementById('__fusk_close__').onclick = function () { panel.remove(); };

    // Touch-drag
    var dragging = false, ox = 16, oy = 16, sx, sy;
    panel.addEventListener('touchstart', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      ox = Math.max(0, Math.min(window.innerWidth  - panel.offsetWidth,  ox - (e.touches[0].clientX - sx)));
      oy = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, oy - (e.touches[0].clientY - sy)));
      panel.style.right = ox + 'px'; panel.style.bottom = oy + 'px';
      panel.style.left = 'auto';    panel.style.top    = 'auto';
      sx = e.touches[0].clientX;   sy = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function () { dragging = false; });
  }

  // ─── Vänta på att spelet laddas och injektera ─────────────────────────
  function init() {
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (attempts > 40) { clearInterval(iv); return; }

      var store = getStore();
      if (!store || store.state.loading) return;

      clearInterval(iv);
      runCheats(store);
      showPanel(store);
    }, 500);
  }

  init();

})();
