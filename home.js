/* Home page: clicking a book pulls it out of the pile (whatever sits on top of it
   drops down), lifts it to the middle of the page and opens its cover; then the
   browser goes to that book's page, which shows the same book lying open. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var busy = false;

  function allBooks() { return Array.prototype.slice.call(document.querySelectorAll('.books .book')); }   // top first
  function swap(book, suffix) {
    var img = book.querySelector('img');
    img.dataset.pile = img.getAttribute('src');
    img.src = img.dataset.pile.replace('.webp', suffix + '.webp');
  }
  function unswap(book) {
    var img = book.querySelector('img');
    if (img.dataset.pile) { img.src = img.dataset.pile; delete img.dataset.pile; }
  }
  // what a pulled-out book leaves behind: how far it slides, and what settles into the gap
  function gap(link) {
    var books = allBooks(), i = books.indexOf(link), r = link.getBoundingClientRect();
    return {
      below: books[i + 1],
      above: books.slice(0, i).concat([document.querySelector('.books .mug')]).filter(Boolean),
      thickness: i < books.length - 1 ? books[i + 1].getBoundingClientRect().top - r.top : r.height * 0.72,
      slide: 'translate(' + (-r.width * 0.62) + 'px,' + (-r.height * 0.06) + 'px)'
    };
  }
  // the 3-D book that flies between the pile and the middle of the page
  function makeOverlay(link) {
    var overlay = document.createElement('div');
    overlay.className = 'opening book-' + link.dataset.book;
    overlay.innerHTML =
      '<div class="opening-book">' +
        '<div class="ob-spine"><img alt=""></div>' +
        '<div class="ob-half ob-right"><div class="ob-paper"></div></div>' +
        '<div class="ob-cover">' +
          '<div class="ob-face ob-front"><span></span></div>' +
          '<div class="ob-face ob-back"><div class="ob-paper"></div></div>' +
        '</div>' +
      '</div>';
    overlay.querySelector('.ob-front span').textContent = link.dataset.openBook;
    document.body.appendChild(overlay);
    return overlay;
  }
  // Fits the 3-D book to the pulled-out book `link` and returns its two poses:
  // onPile (turned so its spine picture lies exactly over that book) and midPage (upright, cover facing us)
  function poses(link, overlay) {
    var book = overlay.querySelector('.opening-book');
    var from = link.getBoundingClientRect();
    var keepT = book.style.transition, keepF = book.style.transform;
    book.style.transition = 'none';
    book.style.transform = 'none';
    var to = book.getBoundingClientRect();              // the open book's place: its cover is the right half
    book.style.transform = keepF;
    book.getBoundingClientRect();
    book.style.transition = keepT;
    var H = to.height, half = to.width / 2;
    var scale = from.width / H;                         // the spine is as long as the cover is tall
    var t = from.height / scale;                        // thickness of the book, at full size
    // the book's own picture is fixed to the spine side of the 3-D book
    var spine = overlay.querySelector('.ob-spine'), pic = spine.querySelector('img');
    spine.style.width = t + 'px';
    pic.src = link.querySelector('img').getAttribute('src');
    pic.style.width = H + 'px'; pic.style.height = t + 'px';
    var dx = (from.left + from.width / 2) - (to.left + half);
    var dy = (from.top + from.height / 2) - (to.top + H / 2) - from.height / 2;
    return {
      onPile: 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ') rotateZ(-90deg) rotateY(90deg)',
      midPage: 'translate(' + (-half / 2) + 'px, 0px) scale(1) rotateZ(0deg) rotateY(0deg)'
    };
  }

  function open(link, e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;   // new tab etc.
    if (reduce.matches || busy) { if (busy) e.preventDefault(); return; }
    e.preventDefault();
    busy = true;

    // 1. pull the book out sideways; the books (and mug) above it settle down into the gap
    var g = gap(link);
    swap(link, '-out');                                     // its cover unshaded, title showing
    if (g.below) swap(g.below, '-bare');                    // and no shadow left behind on the book beneath
    link.classList.add('is-pulled');
    link.style.transform = g.slide;
    setTimeout(function () {
      g.above.forEach(function (el) {
        el.classList.add('is-dropping');
        el.style.transform = 'translateY(' + g.thickness + 'px)';
      });
    }, 210);

    // 2. the book lifts off, grows and tumbles through the air - its spine turning away, its
    //    front cover turning to face us - on its way to the middle of the page
    setTimeout(function () {
      var overlay = makeOverlay(link);
      var book = overlay.querySelector('.opening-book');
      var p = poses(link, overlay);
      book.style.transition = 'none';
      book.style.transform = p.onPile;
      book.getBoundingClientRect();                       // commit the starting position
      link.style.transition = 'none'; link.style.opacity = '0';
      book.style.transition = '';
      overlay.classList.add('is-in');
      book.style.transform = p.midPage;

      // 3. a beat, then the cover swings open ...
      setTimeout(function () { book.style.transform = ''; overlay.classList.add('is-open'); }, 900);
      // 4. ... and on to the page
      setTimeout(function () { window.location.href = link.href; }, 1550);
    }, 400);
  }

  /* Coming back from a book page ("<< back" closed the book there, see close.js): the same
     journey in reverse. The closed book is in the middle of the page; it tumbles back down
     to the pile, the books above lift to make room, and it slides home. */
  function putBack(link) {
    busy = true;
    var overlay = makeOverlay(link);                      // shown at once, closed, mid-page
    var book = overlay.querySelector('.opening-book');
    overlay.classList.add('is-in', 'is-returning');
    link.style.transition = 'none'; link.style.opacity = '0';

    function fly() {
      // the pile as the book left it: this one out to the side, the ones above sunk into its place
      var g = gap(link);
      swap(link, '-out');
      if (g.below) swap(g.below, '-bare');
      link.style.transform = g.slide;
      g.above.forEach(function (el) { el.style.transition = 'none'; el.style.transform = 'translateY(' + g.thickness + 'px)'; });
      var p = poses(link, overlay);
      book.style.transition = 'none';
      book.style.transform = p.midPage;
      book.getBoundingClientRect();
      book.style.transition = '';
      overlay.classList.remove('is-returning');
      overlay.style.backgroundColor = 'rgba(var(--veil), 0)';           // the desk comes back into view
      book.style.transform = p.onPile;                                    // 1. the flight back, spine turning to face us
      setTimeout(function () { overlay.classList.remove('is-in'); }, 620);  // cover fades as it turns edge-on
      setTimeout(function () {                                            // 2. landed: it is the real book again
        link.style.opacity = '';
        overlay.remove();
        link.getBoundingClientRect();
        g.above.forEach(function (el) { el.classList.add('is-dropping'); el.style.transition = ''; el.style.transform = ''; });   // 3. the pile lifts ...
        setTimeout(function () {                                          // 4. ... and the book slides back in
          link.classList.add('is-pulled'); link.style.transition = ''; link.style.transform = '';
          setTimeout(function () {
            unswap(link); if (g.below) unswap(g.below);
            link.classList.remove('is-pulled');
            g.above.forEach(function (el) { el.classList.remove('is-dropping'); });
            busy = false;
          }, 420);
        }, 190);
      }, 850);
    }
    // the pile is only in its final place once the pictures and the title's font have loaded
    var waiting = 3;
    function ready() { if (--waiting === 0) fly(); }
    var pic = new Image();
    pic.onload = pic.onerror = ready;
    if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready, ready); else ready();
    pic.src = link.querySelector('img').getAttribute('src').replace('.webp', '-out.webp');
  }
  (function () {
    var slug = null;
    try { slug = sessionStorage.getItem('qz-return'); sessionStorage.removeItem('qz-return'); } catch (err) {}
    var link = slug && document.querySelector('a[data-book="' + slug + '"]');
    if (link && !reduce.matches) putBack(link);
  })();

  // the lava lamp is a switch: one click turns it off (the wax stops and goes dark), the next turns it on
  var lamp = document.querySelector('.lamp');
  // (with the quiet snap of its switch: sounds/switch-on.wav and switch-off.wav, made by tools/make_click.py)
  var lampOn = new Audio('sounds/switch-on.wav'), lampOff = new Audio('sounds/switch-off.wav');
  lampOn.preload = lampOff.preload = 'auto';
  if (lamp) lamp.addEventListener('click', function () {
    var off = lamp.classList.toggle('is-off');
    var snap = off ? lampOff : lampOn;
    try { snap.currentTime = 0; } catch (err) {}
    snap.volume = 0.25;
    var snapped = snap.play(); if (snapped && snapped.catch) snapped.catch(function () {});
    lamp.setAttribute('aria-pressed', off ? 'false' : 'true');
  });

  // the cat purrs when clicked: the recording plays (sounds/purr.wav) and the little marks around
  // the cat keep pulsing for as long as it lasts. Clicking again starts the purr over.
  var cat = document.querySelector('.cat');
  if (cat) {
    var purr = new Audio('sounds/purr.wav'), purrTimer = null, purrFade = null;
    purr.preload = 'auto';
    var purrClear = function () {
      clearTimeout(purrTimer); cancelAnimationFrame(purrFade);
      cat.classList.remove('is-purring');
    };
    var purrStop = function () { purrClear(); tailCalm(); };

    // Petting the cat also stirs its tail: while the purr plays, the slow swing (the CSS animations on
    // .cat-tail-a / .cat-tail-b) runs faster, and a quicker swish is laid over it on .cat-tail-swish.
    // Both start from, and settle back to, wherever the tail is at that moment, so it never jumps.
    var tailSwish = cat.querySelector('.cat-tail-swish'), swish = null, settle = null;
    var tailSpeed = function (rate) {
      if (!cat.getAnimations) return;
      cat.getAnimations({ subtree: true }).forEach(function (a) {
        if (/^cat-tail-/.test(a.animationName || '')) { if (a.updatePlaybackRate) a.updatePlaybackRate(rate); else a.playbackRate = rate; }
      });
    };
    var tailAngle = function () {                         // how far the swish has the tail turned right now, in degrees
      var m = /matrix\(([^,]+),([^,]+)/.exec(getComputedStyle(tailSwish).transform || '');
      return m ? Math.atan2(parseFloat(m[2]), parseFloat(m[1])) * 180 / Math.PI : 0;
    };
    var tailStir = function () {
      if (!tailSwish || !tailSwish.animate || reduce.matches || swish) return;      // (already swishing: it just carries on)
      var from = tailAngle();
      if (settle) { settle.cancel(); settle = null; }
      tailSpeed(1.7);
      swish = tailSwish.animate(
        [from, 9, -8, 8, -9, 9].map(function (deg) { return { transform: 'rotate(' + deg + 'deg)', easing: 'ease-in-out' }; }),
        { duration: 2800 });                              // (each stroke eases in and out, 560ms like the ones that follow)
      // after the first few strokes it keeps going from side to side until the purr ends
      var first = swish;
      first.onfinish = function () {
        if (swish !== first) return;
        swish = tailSwish.animate([{ transform: 'rotate(9deg)' }, { transform: 'rotate(-9deg)' }],
          { duration: 560, easing: 'ease-in-out', iterations: Infinity, direction: 'alternate' });
      };
    };
    var tailCalm = function () {
      if (!swish) return;
      var from = tailAngle();
      swish.onfinish = null; swish.cancel(); swish = null;
      tailSpeed(1);
      settle = tailSwish.animate([{ transform: 'rotate(' + from + 'deg)' }, { transform: 'rotate(0deg)' }],
        { duration: 900, easing: 'ease-out' });
    };
    // the recording stops dead at its loudest, so its last half second is faded out
    var purrEase = function () {
      var left = purr.duration - purr.currentTime;
      if (left === left) purr.volume = Math.max(0, Math.min(1, left / 0.5));      // (not before the length is known)
      purrFade = requestAnimationFrame(purrEase);
    };
    purr.addEventListener('ended', purrStop);
    cat.addEventListener('click', function () {
      purrClear();
      cat.getBoundingClientRect();                        // restart the marks if clicked again
      cat.classList.add('is-purring');
      tailStir();
      try { purr.currentTime = 0; } catch (err) {}
      purr.volume = 1;
      var playing = purr.play();
      purrFade = requestAnimationFrame(purrEase);
      // no sound (blocked, or the file is missing): the marks still show for a moment
      if (playing && playing.catch) playing.catch(function () { clearTimeout(purrTimer); purrTimer = setTimeout(purrStop, 600); });
      purrTimer = setTimeout(purrStop, 12000);            // never left pulsing for ever
    });
  }

  // the name card turns over when clicked, to the note on its back, and back again at the next click
  var nameCard = document.querySelector('.card-flip');
  if (nameCard) nameCard.addEventListener('click', function () { nameCard.classList.toggle('is-flipped'); });

  // the boombox plays when clicked (sounds/mendelssohn_op67-2.mp3) and stops when clicked again.
  // While it plays the shelf has .is-playing: the play key stays down and the reels turn (style.css).
  // Like a tape, it carries on from where it was stopped; at the end of the piece it shuts itself
  // off and rewinds.
  var shelf = document.querySelector('.shelf'), deck = shelf && shelf.querySelector('.bb-hit');
  if (deck) {
    var tape = new Audio('sounds/mendelssohn_op67-2.mp3');
    tape.preload = 'metadata';
    // the waveform above the handle: 46 bars, their heights following a gentle swell so that it reads
    // as a wave, each rising and falling at its own pace (style.css shows it only while playing)
    var wave = document.querySelector('.wave');
    if (wave && !wave.firstChild) for (var n = 0; n < 46; n++) {
      var bar = document.createElement('i');
      var swell = 0.5 + 0.3*Math.sin(n*0.41 + 0.6) + 0.2*Math.sin(n*1.13 + 2);
      bar.style.setProperty('--h', Math.max(0.28, Math.min(1, swell + 0.25*Math.sin(n*2.7))).toFixed(2));
      bar.style.animationDuration = (0.42 + 0.33*Math.abs(Math.sin(n*1.9 + 1))).toFixed(2) + 's';
      bar.style.animationDelay = (-1.3*Math.abs(Math.sin(n*3.3))).toFixed(2) + 's';
      wave.appendChild(bar);
    }
    var deckSet = function (on) {
      shelf.classList.toggle('is-playing', on);
      deck.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    // the play key's own sound, quietly: a clunk as it goes down, a clack as it springs back up
    // (sounds/key-down.wav and key-up.wav, made by tools/make_click.py)
    var keyDown = new Audio('sounds/key-down.wav'), keyUp = new Audio('sounds/key-up.wav');
    var keySound = function (snd) {
      try { snd.currentTime = 0; } catch (err) {}
      snd.volume = 0.45;
      var p = snd.play(); if (p && p.catch) p.catch(function () {});
    };
    keyDown.preload = keyUp.preload = 'auto';
    var deckStop = function () { tape.pause(); deckSet(false); };
    var deckToggle = function () {
      if (shelf.classList.contains('is-playing')) { keySound(keyUp); deckStop(); return; }
      keySound(keyDown);
      deckSet(true);
      var playing = tape.play();
      // no sound (blocked, or the file is missing): the key pops back up
      if (playing && playing.catch) playing.catch(function () { setTimeout(function () { if (tape.paused) deckSet(false); }, 250); });
    };
    tape.addEventListener('ended', function () { deckSet(false); try { tape.currentTime = 0; } catch (err) {} });
    tape.addEventListener('error', function () { deckSet(false); });
    deck.addEventListener('click', deckToggle);
    deck.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deckToggle(); }
    });
  }

  document.querySelectorAll('a[data-open-book]').forEach(function (link) {
    ['-out', '-bare'].forEach(function (sfx) {             // preload the swapped-in pictures
      new Image().src = link.querySelector('img').getAttribute('src').replace('.webp', sfx + '.webp');
    });
    link.addEventListener('click', function (e) { open(link, e); });
  });
  // coming back with the browser's back button: everything goes back on the pile
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    document.querySelectorAll('.opening').forEach(function (o) { o.remove(); });
    document.querySelectorAll('img[data-pile]').forEach(function (im) { im.src = im.dataset.pile; delete im.dataset.pile; });
    document.querySelectorAll('.is-pulled, .is-dropping').forEach(function (el) {
      el.classList.remove('is-pulled', 'is-dropping');
      el.style.transform = ''; el.style.opacity = ''; el.style.transition = '';
    });
  });
})();
