/* Open-book pages with running copy (.spread--flow): if the text ever outgrows the two
   pages, make the book taller rather than let it spill out. */
(function () {
  var spread = document.querySelector('.spread--flow');
  if (!spread) return;
  var flow = spread.querySelector('.flow');
  function fit() {
    spread.style.minHeight = '';
    for (var n = 0; n < 80 && flow.scrollWidth > flow.clientWidth + 1; n++)
      spread.style.minHeight = (spread.offsetHeight + 40) + 'px';
  }
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
