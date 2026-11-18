/* Light and dark mode, on every page.
   - Loaded in the <head>, before the stylesheets, so the right colours are there from the first paint.
   - Puts data-theme="light" | "dark" on <html>; the dark colours are at the end of style.css.
   - Adds the small switch in the upper right-hand corner (.theme-switch in style.css):
     a sun on the left = light, a moon on the right = dark.
   - A visitor arrives in light mode. The mode they pick with the switch is kept for the rest of the
     session, on every page they go to (sessionStorage). It is also written into window.name, which the
     browser carries from page to page in the same tab: that covers browsers that do not share storage
     between pages - some do not when the site is opened as files from disk rather than from a server. */
(function () {
  var KEY = 'qz-theme';
  var root = document.documentElement;
  var button = null;

  function saved() {
    var t = null;
    try { t = sessionStorage.getItem(KEY); } catch (err) {}
    if (t !== 'dark' && t !== 'light') t = (/^qz-theme:(dark|light)$/.exec(window.name || '') || [])[1];
    return t || null;
  }
  function save(t) {
    try { sessionStorage.setItem(KEY, t); } catch (err) {}
    try { window.name = KEY + ':' + t; } catch (err) {}
  }
  try { localStorage.removeItem(KEY); } catch (err) {}      // (an earlier version kept the choice for good)
  function theme() { return saved() || 'light'; }
  function apply() {
    var t = theme();
    root.setAttribute('data-theme', t);
    if (button) button.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
  }
  apply();

  function addSwitch() {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-switch';
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-label', 'Dark mode');
    // (no title: the tooltip is .theme-tip below, which names the mode a click would switch to)
    // the knob is the icon: a sun while light, a moon while dark (only one shows - style.css)
    button.innerHTML =
      '<span class="theme-knob" aria-hidden="true">' +
        '<svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
          '<circle cx="12" cy="12" r="4.6"/>' +
          '<path d="M12 1.5v3.2M12 19.3v3.2M1.5 12h3.2M19.3 12h3.2M4.58 4.58l2.26 2.26M17.16 17.16l2.26 2.26M4.58 19.42l2.26-2.26M17.16 6.84l2.26-2.26"/></svg>' +
        '<svg class="theme-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/></svg>' +
      '</span>' +
      '<span class="theme-tip" aria-hidden="true"></span>';      // the tooltip; its words come from style.css
    button.addEventListener('click', function () {
      var next = theme() === 'dark' ? 'light' : 'dark';
      save(next);
      root.setAttribute('data-theme', next);
      button.setAttribute('aria-checked', next === 'dark' ? 'true' : 'false');
    });
    document.body.insertBefore(button, document.body.firstChild);
    apply();
  }
  if (document.body) addSwitch(); else document.addEventListener('DOMContentLoaded', addSwitch);

  // coming back to a page kept by the browser (back/forward): the mode may have been switched on another page
  window.addEventListener('pageshow', function (e) { if (e.persisted) apply(); });
})();
