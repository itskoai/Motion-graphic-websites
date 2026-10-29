/* YOKO ONO · site behaviour. Vanilla JavaScript, no dependencies.
   Sections: helpers, nav + phone panel, hero video, parallax, reveals, the lantern hold, the film strip, hours, sticky bar, motion gates. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  var mq = function (q) { return w.matchMedia ? w.matchMedia(q) : { matches: false, addEventListener: function () {} }; };
  var reduceQ = mq('(prefers-reduced-motion: reduce)');
  var portraitQ = mq('(orientation: portrait)');
  var narrowQ = mq('(max-width: 820px)');
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  function staticMode() { return reduceQ.matches || saveData; }

  /* ---------- Nav + phone panel ---------- */
  var nav = d.querySelector('.nav');
  var burger = d.querySelector('.burger');
  var panel = d.getElementById('navpanel');
  var panelOpen = false;
  function openPanel() {
    panelOpen = true;
    panel.hidden = false;
    root.classList.add('no-scroll');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'סגירת התפריט');
    requestAnimationFrame(function () { panel.classList.add('open'); });
    var first = panel.querySelector('a');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 80);
  }
  function closePanel(returnFocus) {
    if (!panelOpen) return;
    panelOpen = false;
    panel.classList.remove('open');
    root.classList.remove('no-scroll');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'פתיחת התפריט');
    setTimeout(function () { if (!panelOpen) panel.hidden = true; }, 460);
    if (returnFocus) burger.focus({ preventScroll: true });
  }
  if (burger && panel) {
    burger.addEventListener('click', function () { panelOpen ? closePanel(true) : openPanel(); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) closePanel(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panelOpen) closePanel(true); });
    mq('(min-width: 1025px)').addEventListener('change', function (e) { if (e.matches) closePanel(false); });
  }

  /* ---------- Hero video (autoplay loop, poster first, gated) ---------- */
  var hero = d.getElementById('hero');
  var video = d.getElementById('heroVideo');
  var poster = d.getElementById('heroPoster');
  var heroText = hero ? hero.querySelector('.hero-text') : null;
  function heroSource() {
    var portrait = portraitQ.matches && narrowQ.matches;
    return portrait
      ? { v: 'assets/media/hero-9x16.mp4', p: 'assets/media/hero-9x16-poster.jpg', w: 1080, h: 1920 }
      : { v: 'assets/media/hero-16x9.mp4', p: 'assets/media/hero-16x9-poster.jpg', w: 1920, h: 1080 };
  }
  var currentSrc = '';
  function applyHero() {
    if (!hero || !video || !poster) return;
    var s = heroSource();
    if (poster.getAttribute('src') !== s.p) { poster.width = s.w; poster.height = s.h; poster.src = s.p; }
    if (staticMode()) {
      hero.classList.remove('has-video');
      if (currentSrc) { video.pause(); video.removeAttribute('src'); video.load(); currentSrc = ''; }
      return;
    }
    if (currentSrc !== s.v) {
      hero.classList.remove('has-video');
      currentSrc = s.v;
      video.src = s.v;
      video.load();
    }
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  if (video) {
    video.addEventListener('playing', function () { hero.classList.add('has-video'); });
    video.addEventListener('error', function () { hero.classList.remove('has-video'); });
    video.addEventListener('stalled', function () {});
    portraitQ.addEventListener('change', applyHero);
    narrowQ.addEventListener('change', applyHero);
    d.addEventListener('visibilitychange', function () {
      d.body.classList.toggle('paused', d.hidden);
      if (!currentSrc) return;
      if (d.hidden) video.pause(); else { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }

  /* ---------- Parallax (transform only, rAF, only for sections on screen) ---------- */
  var layers = Array.prototype.slice.call(d.querySelectorAll('[data-depth]'));
  var active = [];
  var lastY = -1, ticking = false, vh = w.innerHeight;
  function amp() { return narrowQ.matches ? 0.6 : 1; }
  function setActive(el, on) {
    var i = active.indexOf(el);
    if (on && i < 0) active.push(el);
    if (!on && i >= 0) active.splice(i, 1);
    var sec = el.closest('section, .sec, .hero') || el.parentElement;
    if (sec) sec.classList.toggle('pz-on', on);
    if (!on) { el.style.transform = ''; el._ty = null; }
  }
  var layerObs = null;
  if ('IntersectionObserver' in w) {
    layerObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { setActive(en.target, en.isIntersecting); });
      requestTick();
    }, { rootMargin: '12% 0px 12% 0px' });
  }
  function armParallax() {
    if (!layerObs) return;
    layers.forEach(function (el) { layerObs.observe(el); });
  }
  function disarmParallax() {
    if (layerObs) layerObs.disconnect();
    active.slice().forEach(function (el) { setActive(el, false); });
  }
  function frame() {
    ticking = false;
    var y = w.pageYOffset || root.scrollTop;
    var a = amp();
    for (var i = 0; i < active.length; i++) {
      var el = active[i];
      var depth = parseFloat(el.getAttribute('data-depth')) || 0;
      var anchor = el.parentElement || el;
      var r = anchor.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var ty = (vh / 2 - center) * depth * a;
      if (el._ty == null || Math.abs(el._ty - ty) > 0.3) {
        el._ty = ty;
        el.style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0)';
      }
    }
    if (hero && heroText && !staticMode()) {
      var fade = clamp(1 - y / (vh * 0.62), 0, 1);
      if (heroText._f == null || Math.abs(heroText._f - fade) > 0.01) {
        heroText._f = fade;
        heroText.style.opacity = fade.toFixed(2);
      }
    }
    if (strip && stripOn) stripFrame();
    lastY = y;
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  /* nav state + sticky bar share the scroll listener */
  var sticky = d.getElementById('sticky');
  var footer = d.getElementById('footer');
  var stickyBtns = sticky ? Array.prototype.slice.call(sticky.querySelectorAll('a')) : [];
  var footerVisible = false, stickyShown = false;
  function setSticky(on) {
    if (!sticky || on === stickyShown) return;
    stickyShown = on;
    sticky.classList.toggle('show', on);
    sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
    stickyBtns.forEach(function (b) { b.tabIndex = on ? 0 : -1; });
  }
  function onScroll() {
    var y = w.pageYOffset || root.scrollTop;
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (sticky) setSticky(narrowQ.matches && y > vh * 0.85 && !footerVisible);
    requestTick();
  }
  if (footer && 'IntersectionObserver' in w) {
    new IntersectionObserver(function (en) { footerVisible = en[0].isIntersecting; onScroll(); }, { threshold: 0.05 }).observe(footer);
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', function () { vh = w.innerHeight; onScroll(); }, { passive: true });

  /* ---------- Reveals ---------- */
  var reveals = Array.prototype.slice.call(d.querySelectorAll('.reveal'));
  function showAllReveals() { reveals.forEach(function (el) { el.classList.add('in'); }); }
  if ('IntersectionObserver' in w) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    showAllReveals();
  }

  /* ---------- The lantern hold (the one interactive moment) ---------- */
  var stage = d.getElementById('atmStage');
  var hold = d.getElementById('hold');
  var holdP = 0, holding = false, holdDone = false, holdRaf = 0, holdLast = 0;
  var HOLD_MS = 1400, RELEASE_MS = 900;
  function lightUp() {
    holdDone = true;
    holdP = 1;
    if (hold) { hold.style.setProperty('--p', '1'); hold.setAttribute('aria-pressed', 'true'); hold.setAttribute('aria-label', 'הפנס דולק'); }
    if (stage) stage.classList.add('lit');
  }
  function holdTick(ts) {
    var dt = holdLast ? Math.min(ts - holdLast, 64) : 16;
    holdLast = ts;
    holdP = clamp(holdP + (holding ? dt / HOLD_MS : -dt / RELEASE_MS), 0, 1);
    hold.style.setProperty('--p', holdP.toFixed(3));
    if (holdP >= 1 && !holdDone) { lightUp(); holdRaf = 0; return; }
    if ((holding && holdP < 1) || (!holding && holdP > 0)) holdRaf = requestAnimationFrame(holdTick);
    else { holdRaf = 0; holdLast = 0; }
  }
  function startHold() { if (holdDone) return; holding = true; if (!holdRaf) { holdLast = 0; holdRaf = requestAnimationFrame(holdTick); } }
  function endHold() { holding = false; if (!holdRaf && holdP > 0 && !holdDone) { holdLast = 0; holdRaf = requestAnimationFrame(holdTick); } }
  if (hold && stage) {
    hold.setAttribute('aria-pressed', 'false');
    hold.addEventListener('pointerdown', function (e) { if (e.button && e.button !== 0) return; hold.setPointerCapture && hold.setPointerCapture(e.pointerId); startHold(); });
    hold.addEventListener('pointerup', endHold);
    hold.addEventListener('pointercancel', endHold);
    hold.addEventListener('lostpointercapture', endHold);
    hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endHold(); } });
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    w.addEventListener('blur', endHold);
  }

  /* ---------- The film strip (horizontal parallax on wide screens) ---------- */
  var strip = d.querySelector('[data-strip]');
  var stripOn = false, stripTx = null;
  function stripFrame() {
    var r = strip.getBoundingClientRect();
    var progress = clamp((vh - r.top) / (vh + r.height), 0, 1);
    var overflow = strip.scrollWidth - strip.clientWidth;
    if (overflow <= 0) return;
    var eased = progress * progress * (3 - 2 * progress);
    var tx = (root.dir === 'rtl' ? 1 : -1) * eased * overflow;
    if (stripTx == null || Math.abs(stripTx - tx) > 0.4) {
      stripTx = tx;
      Array.prototype.forEach.call(strip.children, function (c) { c.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,0,0)'; });
    }
  }
  function armStrip() {
    if (!strip) return;
    stripOn = !narrowQ.matches && !staticMode();
    if (!stripOn) { stripTx = null; Array.prototype.forEach.call(strip.children, function (c) { c.style.transform = ''; }); }
    requestTick();
  }
  narrowQ.addEventListener('change', function () { armStrip(); onScroll(); });

  /* ---------- Hours: light today's row (Israel time) ---------- */
  (function () {
    var rows = d.querySelectorAll('.hrow');
    if (!rows.length) return;
    var day;
    try {
      var name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' }).format(new Date());
      day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name);
    } catch (e) { day = new Date().getDay(); }
    if (day < 0) return;
    Array.prototype.forEach.call(rows, function (r) {
      var days = (r.getAttribute('data-days') || '').split(',').map(Number);
      if (days.indexOf(day) >= 0) { r.classList.add('today'); r.setAttribute('aria-current', 'date'); }
    });
  })();

  /* ---------- Year ---------- */
  var yearEl = d.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Motion gates, live in both directions ---------- */
  function pinToFinalStates() {
    showAllReveals();
    if (hero) hero.classList.add('in');
    if (heroText) heroText.style.opacity = '';
    disarmParallax();
    lightUp();
    armStrip();
  }
  function armMotion() {
    if (hero) hero.classList.add('in');
    armParallax();
    armStrip();
    applyHero();
    onScroll();
  }
  reduceQ.addEventListener('change', function (e) {
    root.setAttribute('data-motion', e.matches || saveData ? 'static' : 'full');
    if (e.matches) { applyHero(); pinToFinalStates(); } else armMotion();
  });

  /* ---------- Boot ---------- */
  if (staticMode()) { applyHero(); pinToFinalStates(); }
  else {
    requestAnimationFrame(function () { armMotion(); });
  }
  onScroll();
})();
