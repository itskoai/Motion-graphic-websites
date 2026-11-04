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
  var hero = $('hero'), stage = $('stage'), walk = $('walk');
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
  /* Two frame sets, one per orientation: portrait viewports load frames-mobile (720x1280), landscape
     viewports load frames-desktop (1280x720). Only the current set is fetched; a rotate swaps sets. */
  var N = 172, imgs = [], loaded = 0, cur = -1, band = 'a', cueHidden = false, live = false, ticking = false, engineOn = false;
  var ctx = null, dpr = 1, set = '', gen = 0;

  function pickSet() { return stage.clientWidth / stage.clientHeight >= 1 ? 'frames-desktop' : 'frames-mobile'; }
  function src(i) { return 'assets/hero/' + set + '/f_' + String(i).padStart(3, '0') + '.webp'; }
  function ready(im) { return im && im.complete && im.naturalWidth > 0; }
  function nearest(i) {
    if (ready(imgs[i])) return imgs[i];
    for (var d = 1; d < N; d++) {
      if (i - d >= 0 && ready(imgs[i - d])) return imgs[i - d];
      if (i + d < N && ready(imgs[i + d])) return imgs[i + d];
    }
    return null;
  }
  function onLoad(g) {
    if (g !== gen) return; /* a frame from the set we left behind */
    loaded++;
    loadBar.style.width = (loaded / N * 100).toFixed(1) + '%';
    if (loaded === N) loadBar.classList.add('is-done');
    schedule();
  }
  /* One frame request: a transient host error (a 503 on a cold cache) is retried twice before the
     frame is given up; a given-up frame is skipped by nearest(), never a blank screen. */
  function fetchFrame(i, g, done) {
    var tries = 0;
    function go() {
      if (g !== gen) return;
      var im = new Image();
      im.decoding = 'async';
      im.onload = done;
      im.onerror = function () {
        if (++tries <= 2) { setTimeout(go, 1200 * tries); return; }
        done();
      };
      im.src = src(i);
      imgs[i - 1] = im;
    }
    go();
  }
  function loadSet() {
    var g = ++gen;
    imgs = []; loaded = 0; cur = -1;
    loadBar.classList.remove('is-done');
    loadBar.style.width = '0%';
    var first = 30, next = first + 1, lanes = 4;
    for (var i = 1; i <= first; i++) fetchFrame(i, g, function () { onLoad(g); });
    function lane() {
      if (g !== gen || next > N) return;
      fetchFrame(next++, g, function () { onLoad(g); lane(); });
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
    var want = pickSet();
    if (want !== set) { set = want; loadSet(); }
    walk.width = Math.round(walk.clientWidth * dpr);
    walk.height = Math.round(walk.clientHeight * dpr);
    cur = -1;
    draw();
  }

  function progress() {
    var r = hero.getBoundingClientRect();
    var range = hero.offsetHeight - stage.offsetHeight;
    if (range <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / range));
  }

  /* Caption bands by scroll progress: the street, the door, the dining room, the serving moment. */
  function bandFor(p) {
    if (p < 0.20) return 'a';
    if (p < 0.31) return 'b';
    if (p >= 0.40 && p <= 0.70) return 'c';
    if (p >= 0.85) return 'd';
    return 'none';
  }

  function draw() {
    if (!engineOn) return;
    var p = progress();
    var i = Math.round(p * (N - 1));

    var b = bandFor(p);
    if (b !== band) {
      band = b;
      ui.setAttribute('data-band', b);
      Array.prototype.forEach.call(ui.querySelectorAll('.band'), function (el) {
        el.setAttribute('aria-hidden', el.classList.contains('band-' + b) ? 'false' : 'true');
      });
    }
    var hideCue = p > 0.04;
    if (hideCue !== cueHidden) { cueHidden = hideCue; cue.classList.toggle('is-hidden', hideCue); }

    if (i === cur) return;
    var im = nearest(i);
    if (!im) return;
    cover(walk, ctx, im);
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
    if (!ctx) { html.classList.add('is-static'); return; }
    engineOn = true;
    ctx.imageSmoothingQuality = 'high';
    size();
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { size(); }).observe(stage);
    } else {
      window.addEventListener('resize', size);
    }
  }

  function stopEngine() {
    engineOn = false; live = false; gen++;
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
