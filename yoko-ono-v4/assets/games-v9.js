/* YOKO ONO: the dice table, rebuilt in code (wood, felt, the real logo). Two real 3D dice
   are thrown across it: they fly in from the near edge, bounce off the far wall and settle below the logo.
   Fair rolls (crypto random). No prize text: the result only invites people to try the real table. */
(function () {
  'use strict';
  var tray = document.getElementById('tray');
  var btn = document.getElementById('roll');
  var out = document.getElementById('dice-result');
  var you = document.getElementById('score-you'), board = document.querySelector('.board');
  var score = 0;
  if (!tray || !btn || !out || !tray.animate) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var dice = Array.prototype.slice.call(tray.querySelectorAll('.die'));
  var PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  /* face placement: front 1, back 6, right 3, left 4, top 2, bottom 5 */
  var FACES = [[1, 'translateZ(var(--h))'], [6, 'rotateY(180deg) translateZ(var(--h))'], [3, 'rotateY(90deg) translateZ(var(--h))'],
               [4, 'rotateY(-90deg) translateZ(var(--h))'], [2, 'rotateX(90deg) translateZ(var(--h))'], [5, 'rotateX(-90deg) translateZ(var(--h))']];
  /* rotation that brings face n to the viewer */
  var SHOW = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 2: [-90, 0], 5: [90, 0] };

  dice.forEach(function (d) {
    var cube = d.querySelector('.cube');
    FACES.forEach(function (f) {
      var face = document.createElement('div');
      face.className = 'face' + (f[0] === 1 ? ' red-one' : '');
      face.style.transform = f[1];
      for (var c = 1; c <= 9; c++) {
        var cell = document.createElement('span');
        if (PIPS[f[0]].indexOf(c) > -1) { cell = document.createElement('i'); }
        cell.style.gridArea = Math.ceil(c / 3) + ' / ' + (((c - 1) % 3) + 1);
        face.appendChild(cell);
      }
      cube.appendChild(face);
    });
  });

  function rnd(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function size() { var s = dice[0].getBoundingClientRect().width; dice.forEach(function (d) { d.style.setProperty('--h', (s / 2) + 'px'); }); return s; }

  var busy = false;
  function roll() {
    if (busy) return;
    busy = true; btn.disabled = true;
    out.classList.remove('win'); out.textContent = 'מתגלגל…';
    var W = tray.clientWidth, H = tray.clientHeight, s = size();
    var vals = [1 + rnd(6), 1 + rnd(6)];
    var done = 0;
    dice.forEach(function (d, i) {
      /* land below the logo, left of the red marker, never on top of each other */
      var endX = W * (0.27 + i * 0.26 + rnd(10) / 100), endY = H * (0.76 + rnd(8) / 100);
      var startX = W * (0.3 + i * 0.25), startY = H * 1.05;
      var wallY = H * (0.14 + rnd(6) / 100), midX = (startX + endX) / 2 + (i ? 1 : -1) * W * 0.08;
      var spinX = 720 + 360 * rnd(2), spinY = 720 + 360 * rnd(2), turn = (i ? -1 : 1) * (8 + rnd(18));
      var f = SHOW[vals[i]];
      var T = function (x, y, z, rx, ry, rz) { return 'translate3d(' + (x - s / 2) + 'px,' + (y - s / 2) + 'px,' + z + 'px) rotateZ(' + rz + 'deg)'; };
      var C = function (rx, ry) { return 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; };
      var dur = reduce.matches ? 1 : 1500 + i * 180;
      d.style.opacity = 1;
      d.animate([
        { transform: T(startX, startY, 120, 0, 0, 0), offset: 0 },
        { transform: T(midX, wallY, 60, 0, 0, turn * .5), offset: .38, easing: 'cubic-bezier(.3,.6,.4,1)' },
        { transform: T((midX + endX) / 2, endY - H * .1, 18, 0, 0, turn * .85), offset: .7 },
        { transform: T(endX, endY - H * .025, 6, 0, 0, turn * .97), offset: .86 },
        { transform: T(endX, endY, 0, 0, 0, turn), offset: 1 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.7,.25,1)', fill: 'forwards' });
      d.querySelector('.cube').animate([
        { transform: C(0, 0) },
        { transform: C(f[0] + spinX * .7, f[1] + spinY * .7), offset: .6 },
        { transform: C(f[0] + spinX, f[1] + spinY) }
      ], { duration: dur, easing: 'cubic-bezier(.15,.75,.3,1)', fill: 'forwards' }).onfinish = function () {
        if (++done === 2) finish(vals);
      };
    });
  }

  function finish(v) {
    busy = false; btn.disabled = false; btn.textContent = 'זרקו שוב';
    if (v[0] === v[1]) {
      out.classList.add('win');
      out.textContent = 'דאבל! עכשיו תנסו את זה על השולחן האמיתי.';
      if (you) { you.textContent = String(++score); you.classList.remove('bump'); void you.offsetWidth; you.classList.add('bump'); }
      if (board) { board.classList.remove('flash'); void board.offsetWidth; board.classList.add('flash'); }
      if (!reduce.matches) confetti();
    } else {
      out.textContent = 'יצא ' + v[0] + ' ו-' + v[1] + '. על השולחן האמיתי זה מרגיש אחרת.';
    }
  }

  function confetti() {
    var W = tray.clientWidth, H = tray.clientHeight, colors = ['#d1261f', '#e8392f', '#c9a86a', '#f3ece2'];
    for (var k = 0; k < 36; k++) {
      var p = document.createElement('span');
      p.className = 'spark';
      p.style.background = colors[k % 4];
      p.style.left = (W * .5) + 'px'; p.style.top = (H * .7) + 'px';
      tray.appendChild(p);
      var a = Math.PI * 2 * k / 36 + rnd(30) / 100, r = W * (.25 + rnd(30) / 100);
      p.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * r + 'px,' + (Math.sin(a) * r + H * .25) + 'px) rotate(' + (360 + rnd(360)) + 'deg)', opacity: 0 }
      ], { duration: 1300 + rnd(500), easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
    }
  }

  btn.addEventListener('click', roll);
  window.addEventListener('resize', function () { if (!busy) size(); });
})();
