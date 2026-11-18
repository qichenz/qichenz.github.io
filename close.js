/* Book pages: clicking "<< back" closes the book - its front cover swings shut over the
   pages, at the same speed it opened with on the home page - and then the browser goes
   back to the home page, where the closed book flies back onto the pile (home.js). */
(function () {
  var back = document.querySelector('a.back');
  var spread = document.querySelector('.spread');
  if (!back || !spread) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var TITLES = { 'past-work': 'Past Work', 'present-interests': 'Present Interests', 'future-theories': 'Future Theories',
                 'ceramics': 'Ceramics', 'reading': 'What I’m Reading' };
  var slug = (document.body.className.match(/book-(?!page)([a-z-]+)/) || [])[1];
  var busy = false, overlay = null;

  back.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;   // new tab etc.
    if (busy) { e.preventDefault(); return; }
    var leaves = spread.querySelectorAll('.leaf');
    var stacked = leaves.length > 1 && leaves[1].offsetTop > leaves[0].offsetTop;     // narrow screens: one page above the other
    if (reduce.matches || stacked) return;
    e.preventDefault();
    busy = true;

    // a 3-D stand-in for the open book, laid exactly over it: the right-hand page stays put,
    // the left-hand page is the inside of the front cover
    var r = spread.getBoundingClientRect();
    function copy() {                                   // the book as it lies, to show on each half
      var c = spread.cloneNode(true);
      c.removeAttribute('id');
      c.style.cssText += ';width:' + r.width + 'px;height:' + r.height + 'px;max-width:none;margin:0;box-shadow:none;view-transition-name:none;';
      return c;
    }
    overlay = document.createElement('div');
    overlay.className = 'closing';
    overlay.innerHTML =
      '<div class="closing-book">' +
        '<div class="cb-half"></div>' +
        '<div class="cb-cover">' +
          '<div class="ob-face ob-front"><span></span></div>' +
          '<div class="cb-inside"></div>' +
        '</div>' +
      '</div>';
    var book = overlay.querySelector('.closing-book'), cover = overlay.querySelector('.cb-cover');
    book.style.left = r.left + 'px'; book.style.top = r.top + 'px';
    book.style.width = r.width + 'px'; book.style.height = r.height + 'px';
    overlay.querySelector('.ob-front span').textContent = TITLES[slug] || '';
    var right = copy(); right.style.marginLeft = (-r.width / 2) + 'px';
    overlay.querySelector('.cb-half').appendChild(right);
    overlay.querySelector('.cb-inside').appendChild(copy());
    document.body.appendChild(overlay);
    spread.style.viewTransitionName = 'none';
    spread.style.visibility = 'hidden';

    book.getBoundingClientRect();                       // commit the open position
    cover.style.transform = 'rotateY(0deg)';            // the cover swings shut ...
    book.style.transform = 'translateX(-25%)';          // ... and the closed book settles mid-page
    setTimeout(function () {                            // then back to the desk, where home.js flies it onto the pile
      try { sessionStorage.setItem('qz-return', slug); } catch (err) {}
      window.location.href = back.href;
    }, 650);
  });

  // returning to this page with the browser's forward/back buttons: the book lies open again
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    if (overlay) { overlay.remove(); overlay = null; }
    spread.style.visibility = ''; spread.style.viewTransitionName = '';
  });
})();
