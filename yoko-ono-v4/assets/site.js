/* YOKO ONO v4: the walk in, scrubbed by scroll. Plain JavaScript, no dependencies. */
(function () {
  'use strict';

  /* Menu site: BUSINESS-INFO says yoko-ono-menu.com may be lapsed. Until the owner confirms it loads,
     every menu button goes to the Wolt page. Flip this to true once confirmed. */
  var MENU_SITE_CONFIRMED = false;
  var MENU_SITE = 'https://www.yoko-ono-menu.com/';
  if (MENU_SITE_CONFIRMED) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-menu-link]'), function (a) { a.href = MENU_SITE; });
  }

  var html = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var nav = $('nav'), navToggle = $('nav-toggle'), navLinks = $('nav-links');
  var hero = $('hero'), stage = $('stage'), walk = $('walk'), bg = $('walk-bg'), poster = $('poster');
  var ui = $('hero-ui'), cue = $('cue'), loadBar = $('load'), mobileBar = $('mobile-bar');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Nav ---------- */
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'סגירת התפריט' : 'פתיחת התפריט');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.focus(); }
    });
  }

  /* ---------- Reveals ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Chrome that follows the scroll: solid nav, phone bar ---------- */
  var navSolid = false, barOn = false;
  function chrome() {
    var r = hero.getBoundingClientRect();
    var solid = window.scrollY > 24;
    if (solid !== navSolid) { navSolid = solid; nav.classList.toggle('is-solid', solid); }
    var on = r.bottom < window.innerHeight * 0.5;
    if (on !== barOn) {
      barOn = on; mobileBar.classList.toggle('is-on', on);
      mobileBar.setAttribute('aria-hidden', on ? 'false' : 'true');
      Array.prototype.forEach.call(mobileBar.querySelectorAll('a'), function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
    }
  }

  /* ---------- The walk ---------- */
  var N = 181, imgs = [], loaded = 0, cur = -1, band = 'a', cueHidden = false, live = false, ticking = false, engineOn = false;
  var ctx = null, bctx = null, dpr = 1, columnMode = false;

  function src(i) { return 'assets/hero/frames/f_' + String(i).padStart(3, '0') + '.webp'; }
  function ready(im) { return im && im.complete && im.naturalWidth > 0; }
  function nearest(i) {
    if (ready(imgs[i])) return imgs[i];
    for (var d = 1; d < N; d++) {
      if (i - d >= 0 && ready(imgs[i - d])) return imgs[i - d];
      if (i + d < N && ready(imgs[i + d])) return imgs[i + d];
    }
    return null;
  }
  function onLoad() {
    loaded++;
    loadBar.style.width = (loaded / N * 100).toFixed(1) + '%';
    if (loaded === N) loadBar.classList.add('is-done');
    schedule();
  }
  function load(i) {
    var im = new Image();
    im.decoding = 'async';
    im.onload = onLoad;
    im.onerror = onLoad; /* a missing frame is skipped by nearest(), never a blank screen */
    im.src = src(i);
    imgs[i - 1] = im;
  }
  function loadAll() {
    var first = 30, next = first + 1, lanes = 4;
    for (var i = 1; i <= first; i++) load(i);
    function lane() {
      if (next > N) return;
      var i = next++;
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { onLoad(); lane(); };
      im.onerror = function () { onLoad(); lane(); };
      im.src = src(i);
      imgs[i - 1] = im;
    }
    for (var k = 0; k < lanes; k++) lane();
  }

  function cover(c, x, im) {
    var s = Math.max(c.width / im.naturalWidth, c.height / im.naturalHeight);
    var w = im.naturalWidth * s, h = im.naturalHeight * s;
    x.drawImage(im, (c.width - w) / 2, (c.height - h) / 2, w, h);
  }

  function size() {
    if (!engineOn) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    columnMode = getComputedStyle(bg).display !== 'none';
    var w = walk.clientWidth, h = walk.clientHeight;
    walk.width = Math.round(w * dpr); walk.height = Math.round(h * dpr);
    if (columnMode) {
      bg.width = Math.max(48, Math.round(stage.clientWidth / 14));
      bg.height = Math.max(48, Math.round(stage.clientHeight / 14));
    }
    cur = -1;
    draw();
  }

  function progress() {
    var r = hero.getBoundingClientRect();
    var range = hero.offsetHeight - stage.offsetHeight;
    if (range <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / range));
  }

  function draw() {
    if (!engineOn) return;
    var p = progress();
    var i = Math.round(p * (N - 1));

    var b = p < 0.14 ? 'a' : (p >= 0.30 && p < 0.58) ? 'b' : p >= 0.82 ? 'c' : 'none';
    if (b !== band) {
      band = b;
      ui.setAttribute('data-band', b);
      ui.querySelector('.band-a').setAttribute('aria-hidden', b === 'a' ? 'false' : 'true');
      ui.querySelector('.band-b').setAttribute('aria-hidden', b === 'b' ? 'false' : 'true');
      ui.querySelector('.band-c').setAttribute('aria-hidden', b === 'c' ? 'false' : 'true');
    }
    var hideCue = p > 0.04;
    if (hideCue !== cueHidden) { cueHidden = hideCue; cue.classList.toggle('is-hidden', hideCue); }

    if (i === cur) return;
    var im = nearest(i);
    if (!im) return;
    cover(walk, ctx, im);
    if (columnMode) cover(bg, bctx, im);
    cur = i;
    if (!live) { live = true; hero.classList.add('is-live'); }
  }

  function schedule() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; chrome(); draw(); });
  }

  function startEngine() {
    if (engineOn || reduce.matches || html.classList.contains('is-static')) return;
    ctx = walk.getContext('2d', { alpha: false });
    bctx = bg.getContext('2d', { alpha: false });
    if (!ctx || !bctx) { html.classList.add('is-static'); return; }
    engineOn = true;
    ctx.imageSmoothingQuality = 'high';
    loadAll();
    size();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { size(); }).observe(stage);
    } else {
      window.addEventListener('resize', size);
    }
  }

  function stopEngine() {
    engineOn = false; live = false;
    hero.classList.remove('is-live');
    html.classList.add('is-static');
    ui.setAttribute('data-band', 'a');
  }

  reduce.addEventListener('change', function () {
    if (reduce.matches) stopEngine(); else { html.classList.remove('is-static'); startEngine(); }
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  startEngine();
  chrome();
})();
