/* Home page: the Great Pyrenees postcard barks when clicked. The card shows the dog with its
   eyes and mouth open (data-bark), the barking plays (sounds/bark.wav, a recording), and when
   it is over the card goes back to the smiling dog.
   The recording has silence before and after the barks, so only the part between START and END
   (seconds) is played; if the recording is ever replaced, set these to suit it (0 and Infinity
   play the whole file). */
(function () {
  var card = document.querySelector('.postcard[data-bark]');
  if (!card) return;
  var img = card.querySelector('img');
  var calm = img.getAttribute('src'), barking = card.getAttribute('data-bark');
  var START = 0.8, END = 1.95;             // the barks sit between these two moments of the recording
  var FALLBACK_MS = 1150;                  // how long the barking face shows if the sound cannot play
  var timer = null, busy = false;

  // fetched up front, so that it can start part-way in on the very first click
  var sound = new Audio('sounds/bark.wav');
  sound.preload = 'auto';
  sound.volume = 0.15;                     // a little under full, so he does not startle (1 is the recording as it is)
  sound.addEventListener('ended', function () { if (busy) done(); });
  sound.addEventListener('timeupdate', function () { if (busy && sound.currentTime >= END) done(); });
  sound.addEventListener('error', function () { if (busy) { clearTimeout(timer); timer = setTimeout(done, FALLBACK_MS); } });

  new Image().src = barking;               // have the second picture ready before the first click

  function done() {
    clearTimeout(timer);
    sound.pause();
    img.src = calm;
    card.classList.remove('is-barking');
    busy = false;
  }

  card.addEventListener('click', function () {
    if (busy) return;                      // let him finish
    busy = true;
    img.src = barking;
    card.classList.add('is-barking');
    try { sound.currentTime = START; } catch (err) {}
    var playing = sound.play();
    // if the browser refuses to play (or the file is missing), still show the bark for a moment
    if (playing && playing.catch) playing.catch(function () { clearTimeout(timer); timer = setTimeout(done, FALLBACK_MS); });
    // and never get stuck on the barking face, whatever happens to the sound
    timer = setTimeout(done, 6000);
  });
})();
