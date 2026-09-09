// theme.js — Auto / Light / Dark toggle for the landing app.
// Load in <head> (blocking, tiny) so the right theme applies before first paint.
(function () {
  var KEY = 'fs-landing-theme';
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  var mode;
  try { mode = localStorage.getItem(KEY) || 'auto'; } catch (e) { mode = 'auto'; }
  if (['auto', 'light', 'dark'].indexOf(mode) === -1) mode = 'auto';

  var ICONS = {
    auto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" stroke="none"></path></svg>',
    light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"></circle><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"></path></svg>',
    dark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z"></path></svg>'
  };
  var LABEL = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var NEXT = { auto: 'light', light: 'dark', dark: 'auto' };

  function resolved() { return mode === 'auto' ? (mq.matches ? 'dark' : 'light') : mode; }

  function apply() {
    var root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-resolved', resolved());
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) {
      btns[i].innerHTML = ICONS[mode];
      var t = 'Theme: ' + LABEL[mode] + (mode === 'auto' ? ' (follows device)' : '') + ' — click to change';
      btns[i].title = t;
      btns[i].setAttribute('aria-label', t);
    }
  }

  function cycle() {
    mode = NEXT[mode];
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    apply();
  }

  apply(); // pre-paint: sets data-resolved before body renders

  if (mq.addEventListener) mq.addEventListener('change', apply);
  else if (mq.addListener) mq.addListener(apply);

  window.addEventListener('DOMContentLoaded', function () {
    apply(); // now the buttons exist — fill their icons
    var btns = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', cycle);
  });
})();
