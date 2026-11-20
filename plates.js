/* Books with a note above each picture (.spread--noted): the picture follows straight after its note
   and is made as tall as the room left on its page allows. This measures that room, page by page,
   and hands it to style.css as --plate-h (the picture's greatest height). On narrow screens, where
   the pages are laid out one under the other, the pictures are left to the style sheet. */
(function () {
  var spread = document.querySelector('.spread--noted');
  if (!spread) return;
  var wide = window.matchMedia('(min-width: 821px)');
  var FLOOR = 240;                                       // as in style.css (.is-fitting)

  function fit() {
    var leaves = Array.prototype.slice.call(spread.querySelectorAll(':scope > .leaf'));
    leaves.forEach(function (l) { l.style.removeProperty('--plate-h'); });
    if (!wide.matches) return;
    spread.classList.add('is-fitting');                  // pictures at their smallest: the pages show their true height
    var room = leaves.map(function (l) {
      var fig = l.querySelector('.plate');
      if (!fig) return null;
      var foot = parseFloat(getComputedStyle(l).paddingBottom) || 0;
      return Math.max(FLOOR, Math.floor(l.clientHeight - foot - fig.offsetTop));
    });
    spread.classList.remove('is-fitting');
    leaves.forEach(function (l, i) { if (room[i]) l.style.setProperty('--plate-h', room[i] + 'px'); });
  }

  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);   // the notes' height depends on the typeface
})();
