/* YOKO ONO: turns the food grid (.grid-food) into a sushi conveyor belt.
   The plates are duplicated once so the loop is seamless. The belt stops on hover or touch,
   and a tap or Enter on a plate opens the photo large (Escape or tap outside closes). */
(function () {
  'use strict';
  var grid = document.querySelector('.grid-food');
  if (!grid) return;
  var figs = Array.prototype.slice.call(grid.querySelectorAll('figure'));
  if (!figs.length) return;

  grid.classList.add('belt');
  grid.setAttribute('aria-label', 'מנות ביוקו אונו');
  var rail = document.createElement('div'); rail.className = 'belt-rail';
  var track = document.createElement('div'); track.className = 'belt-track';
  figs.forEach(function (f) {
    f.className = 'frame'; f.tabIndex = 0; f.setAttribute('role', 'button');
    f.setAttribute('aria-label', 'הגדלת התמונה: ' + (f.querySelector('img').alt || ''));
    f.querySelector('img').sizes = '230px';
    track.appendChild(f);
  });
  figs.forEach(function (f) {
    var c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; c.removeAttribute('role'); track.appendChild(c);
  });
  rail.appendChild(track); grid.appendChild(rail);

  function measure() {
    var half = track.scrollWidth / 2;
    /* RTL page: the belt moves toward the reading direction start, i.e. to the right */
    var dir = getComputedStyle(document.documentElement).direction === 'rtl' ? 1 : -1;
    track.style.setProperty('--shift', (dir * half) + 'px');
    track.style.setProperty('--dur', Math.round(half / 38) + 's');
  }
  window.addEventListener('load', measure); window.addEventListener('resize', measure); measure();

  var holdTimer;
  grid.addEventListener('touchstart', function () { grid.classList.add('hold'); clearTimeout(holdTimer); }, { passive: true });
  grid.addEventListener('touchend', function () { clearTimeout(holdTimer); holdTimer = setTimeout(function () { grid.classList.remove('hold'); }, 2500); }, { passive: true });

  var view, lastFocus;
  function open(fig) {
    var img = fig.querySelector('img');
    lastFocus = document.activeElement;
    view = document.createElement('div'); view.className = 'plate-view'; view.setAttribute('role', 'dialog'); view.setAttribute('aria-modal', 'true'); view.setAttribute('aria-label', img.alt);
    var big = document.createElement('img'); big.src = (img.currentSrc || img.src).replace('-800.', '-1400.'); big.alt = img.alt;
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'סגירה'); x.textContent = '×';
    view.appendChild(big); view.appendChild(x); document.body.appendChild(view);
    grid.classList.add('hold');
    requestAnimationFrame(function () { view.classList.add('open'); });
    x.focus();
    x.addEventListener('click', close);
    view.addEventListener('click', function (e) { if (e.target === view) close(); });
  }
  function close() {
    if (!view) return;
    view.remove(); view = null; grid.classList.remove('hold');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  track.addEventListener('click', function (e) { var f = e.target.closest('.frame'); if (f) open(f); });
  track.addEventListener('keydown', function (e) { var f = e.target.closest('.frame'); if (f && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(f); } });
})();
