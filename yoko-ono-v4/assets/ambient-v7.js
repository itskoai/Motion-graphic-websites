/* YOKO ONO: builds the Japanese evening layer (umbrellas, lantern light, hanging lanterns)
   behind every section from #choose to the end of <main>. No libraries, no innerHTML.
   Elements are laid out along the whole page at the edges, away from the reading column,
   and drift with a gentle depth parallax as the visitor scrolls. */
(function () {
  'use strict';
  var main = document.getElementById('top');
  var first = document.getElementById('choose');
  if (!main || !first) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var layer = document.createElement('div');
  layer.className = 'ambient';
  layer.setAttribute('aria-hidden', 'true');
  main.insertBefore(layer, first);

  function svg(viewBox, parts) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('focusable', 'false');
    parts.forEach(function (p) {
      var el = document.createElementNS(NS, p[0]);
      Object.keys(p[1]).forEach(function (k) { el.setAttribute(k, p[1][k]); });
      s.appendChild(el);
    });
    return s;
  }
  function umbrellaSvg() {
    return svg('0 0 120 70', [
      ['path', { d: 'M2 60A58 58 0 0 1 118 60Z', fill: 'currentColor', opacity: '.5' }],
      ['path', { d: 'M60 2V60M60 2Q35 22 10 58M60 2Q85 22 110 58M60 2Q50 30 38 60M60 2Q70 30 82 60M60 2Q42 26 24 59M60 2Q78 26 96 59', stroke: 'currentColor', 'stroke-width': '1.1', fill: 'none', opacity: '.8' }],
      ['path', { d: 'M2 60Q16 55 24 59Q31 55 38 60Q49 55 60 60Q71 55 82 60Q89 55 96 59Q104 55 118 60', stroke: 'currentColor', 'stroke-width': '1.1', fill: 'none' }],
      ['path', { d: 'M60 60V70', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round' }]
    ]);
  }
  function lanternSvg() {
    return svg('0 0 48 112', [
      ['path', { 'class': 'line', d: 'M24 0V30', 'stroke-width': '1' }],
      ['ellipse', { 'class': 'core', cx: '24', cy: '62', rx: '17', ry: '22' }],
      ['rect', { 'class': 'line', x: '16.5', y: '30', width: '15', height: '5', rx: '1.5', 'stroke-width': '1.2' }],
      ['ellipse', { 'class': 'line', cx: '24', cy: '62', rx: '19', ry: '27', 'stroke-width': '1.3' }],
      ['path', { 'class': 'line', d: 'M12 41Q5 62 12 83M24 35V89M36 41Q43 62 36 83M6 54H42M5 62H43M6 70H42', 'stroke-width': '.7', opacity: '.55' }],
      ['rect', { 'class': 'line', x: '16.5', y: '89', width: '15', height: '5', rx: '1.5', 'stroke-width': '1.2' }],
      ['path', { 'class': 'line', d: 'M24 94V101M20 101L24 111L28 101', 'stroke-width': '1.1', 'stroke-linejoin': 'round' }]
    ]);
  }

  /* Layout: y is a fraction of the layer height; x keeps to the outer edges. depth: parallax strength.
     The first umbrellas sit high so the palm sign section opens under them. */
  var desktop = [
    ['umb', .015, 5, 375, 0.2, .14, 0, -6, 24], ['umb', .03, 74, 275, 0.15, .1, 2, -14, 20],
    ['lan', .05, 92, 69, 0.85, .2, 0, -2, 6],    ['orb', .06, 12, 229, 1, .22, 7, -3],
    ['orb', .13, 86, 162, 0.84, .3, 5, -9],      ['orb', .2, 4, 108, 0.72, .4, 4, -5],
    ['umb', .26, 90, 325, 0.17, .12, 1, -9, 26], ['lan', .3, 6, 57, 0.72, .25, 0, -4, 7],
    ['orb', .34, 94, 202, 0.9, .2, 8, -12],     ['orb', .42, 10, 148, 0.78, .35, 6, -2],
    ['umb', .48, 2, 300, 0.15, .1, 3, -17, 22],  ['orb', .55, 88, 121, 0.72, .4, 5, -7],
    ['lan', .6, 94, 63, 0.8, .2, 0, -3, 6.5],   ['orb', .66, 6, 216, 0.96, .25, 9, -11],
    ['umb', .72, 84, 350, 0.19, .12, 1, -4, 23],  ['orb', .8, 90, 162, 0.84, .3, 6, -8],
    ['lan', .84, 4, 66, 0.8, .22, 0, -5, 7],    ['orb', .9, 14, 135, 0.78, .35, 5, -1],
    ['umb', .95, 70, 250, 0.13, .1, 2, -10, 21]
  ];
  var phone = [
    ['umb', .01, -8, 237, 0.19, .1, 0, -6, 24], ['lan', .04, 88, 45, 0.8, .15, 0, -2, 6],
    ['orb', .08, 86, 162, 0.96, .2, 6, -3],     ['orb', .22, 2, 121, 0.78, .3, 5, -9],
    ['umb', .3, 74, 212, 0.15, .1, 1, -9, 26], ['orb', .4, 92, 148, 0.84, .22, 7, -12],
    ['lan', .5, 4, 42, 0.72, .2, 0, -4, 7],     ['orb', .6, 6, 162, 0.9, .25, 8, -11],
    ['umb', .7, -6, 200, 0.15, .1, 2, -17, 22],['orb', .8, 90, 121, 0.78, .3, 5, -8],
    ['orb', .92, 10, 135, 0.78, .3, 5, -1]
  ];

  var items = [], built = '';
  function build() {
    var mode = window.innerWidth < 760 ? 'phone' : 'desktop';
    if (mode === built) return;
    built = mode; items = [];
    while (layer.firstChild) layer.removeChild(layer.firstChild);
    (mode === 'phone' ? phone : desktop).forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'a a-' + d[0];
      el.style.left = d[2] + '%';
      el.style.setProperty('--o', d[4]);
      el.style.setProperty('--d', d[7] + 's');
      if (d[0] === 'orb') {
        el.style.setProperty('--s', d[3] + 'px');
        el.style.setProperty('--b', d[6] + 'px');
        el.style.setProperty('--f', (5 + (d[3] % 5)) + 's');
        el.appendChild(document.createElement('i'));
      } else {
        el.style.setProperty('--w', d[3] + 'px');
        el.style.setProperty('--b', d[6] + 'px');
        el.style.setProperty('--f', d[8] + 's');
        el.style.setProperty('--g', (d[8] * .8) + 's');
        el.appendChild(d[0] === 'umb' ? umbrellaSvg() : lanternSvg());
      }
      layer.appendChild(el);
      items.push({ el: el, y: d[1], depth: d[5] });
    });
    place();
  }

  var top = 0, height = 0, ticking = false, visible = true;
  function place() {
    var r = first.getBoundingClientRect(), m = main.getBoundingClientRect();
    top = r.top - m.top;
    height = m.height - top;
    layer.style.top = top + 'px';
    layer.style.height = height + 'px';
    items.forEach(function (it) { it.base = it.y * height; it.el.style.top = it.base + 'px'; });
    frame();
  }
  function frame() {
    ticking = false;
    if (reduce.matches || !visible) return;
    var mid = window.scrollY + window.innerHeight / 2 - (main.getBoundingClientRect().top + window.scrollY) - top;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], off = (it.base - mid) * it.depth;
      if (off > 400 || off < -400) off = off > 0 ? 400 : -400;
      it.el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  new IntersectionObserver(function (e) {
    visible = e[0].isIntersecting;
    layer.classList.toggle('paused', !visible);
    if (visible) onScroll();
  }, { rootMargin: '200px 0px' }).observe(layer);
  document.addEventListener('visibilitychange', function () { layer.classList.toggle('paused', document.hidden || !visible); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { build(); place(); });
  window.addEventListener('load', place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(main);
  build();
})();
