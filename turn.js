/* Book pages with more than one spread (.spread--turn): the book shows two pages at a time.
   Clicking the right-hand page turns it over to the next two; clicking the left-hand page turns
   back. So that a click always does something, the left page of the first spread also turns
   forward, and the right page of the last spread turns back to the start. Arrow keys work too.
   On narrow screens the pages are simply laid out one under the other (style.css). */
(function () {
  var spread = document.querySelector('.spread--turn');
  if (!spread) return;
  var leaves = Array.prototype.slice.call(spread.querySelectorAll(':scope > .leaf'));
  if (leaves.length % 2) {                               // an odd page out gets a blank page opposite
    var blank = document.createElement('section');
    blank.className = 'leaf leaf--right'; blank.hidden = true;
    spread.appendChild(blank); leaves.push(blank);
  }
  var spreads = leaves.length / 2, at = 0, busy = false;
  if (spreads < 2) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stacked = window.matchMedia('(max-width: 820px)');
  var hint = document.querySelector('.turn-hint'), count = document.querySelector('.turn-count');
  var MS = 900;                                          // as long as the turn in style.css
  spread.classList.add('can-turn');
  if (hint) hint.hidden = false;

  function show(i, on) { leaves[i].hidden = !on; }
  function label() { if (count) count.textContent = (at + 1) + ' / ' + spreads; }
  label();

  // the sheet that turns: `front` is the page being lifted, `back` the page on its other side
  function sheet(front, back, over, dir) {
    var el = document.createElement('div');
    el.className = 'turning turning--' + dir;
    el.style.left = over.offsetLeft + 'px'; el.style.top = over.offsetTop + 'px';
    el.style.width = over.offsetWidth + 'px'; el.style.height = over.offsetHeight + 'px';
    [front, back].forEach(function (leaf) {
      var c = leaf.cloneNode(true); c.hidden = false; el.appendChild(c);
    });
    return el;
  }

  function go(to) {
    if (busy || to === at || stacked.matches) return;
    var L = 2 * at, R = L + 1, nL = 2 * to, nR = nL + 1, fwd = to > at;
    if (reduce.matches) {
      show(L, false); show(R, false); show(nL, true); show(nR, true);
      at = to; label(); return;
    }
    busy = true;
    var el;
    if (fwd) {
      // the right-hand page lifts and comes down on the left; the next right-hand page is already beneath it
      el = sheet(leaves[R], leaves[nL], leaves[R], 'fwd');
      spread.appendChild(el);
      show(R, false); show(nR, true);
    } else {
      el = sheet(leaves[L], leaves[nR], leaves[L], 'back');
      spread.appendChild(el);
      show(L, false); show(nL, true);
    }
    setTimeout(function () {
      if (fwd) { show(L, false); show(nL, true); } else { show(R, false); show(nR, true); }
      el.remove();
      at = to; busy = false; label();
    }, MS);
  }
  function next() { go(at + 1 < spreads ? at + 1 : 0); }
  function prev() { if (at > 0) go(at - 1); else next(); }

  spread.addEventListener('click', function (e) {
    if (e.target.closest('a, button')) return;           // links on a page still work as links
    var leaf = e.target.closest('.leaf');
    if (!leaf || leaf.parentNode !== spread) return;
    if (leaf.classList.contains('leaf--left')) prev(); else next();
  });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { if (at + 1 < spreads) go(at + 1); }
    else if (e.key === 'ArrowLeft') { if (at > 0) go(at - 1); }
  });
  leaves.slice(2).forEach(function (l) {                 // fetch the photos on later pages ahead of the turn
    var im = l.querySelector('img'); if (im) new Image().src = im.getAttribute('src');
  });
})();
