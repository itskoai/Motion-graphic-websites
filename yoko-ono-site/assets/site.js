/* YOKO ONO · site script. Plain JavaScript, no build, no dependencies.
   One scroll listener and one rAF loop that eases the walk and rests when converged. Every scroll-driven DOM write is
   delta-gated. The hero video is fetched as a Blob behind the umbrella ring, seeks are gated, and the five hero gates are
   re-decided live (head.js made the first decision before paint). The page is complete if the video never arrives. */
(function () {
  'use strict';
  var d = document.documentElement, body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) { var t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  var hero = $('#top'), stage = $('#stage'), video = $('#film'), ring = $('#ring'), backdrop = $('#backdrop');
  var poster = $('#poster'), doorPoster = $('#doorPoster'), nav = $('#nav');
  var bands = $$('.band[data-range]');
  var PROG_END = 0.84;            /* the film reaches its last frame here; the rest of the hero holds it for the settle */
  var POSTER_720 = 'assets/media/hero-poster-720.jpg', POSTER_1080 = 'assets/media/hero-poster-1080.jpg';
  var mode = window.yokoDecide ? window.yokoDecide() : { hero: 'static', stage: 'door', reduce: false };

  /* ---------- split the hero lines into words, once, with seeded offsets ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  bands.forEach(function (b, bi) {
    $$('.split', b).forEach(function (el) {
      var text = el.textContent.replace(/\s+/g, ' ').trim(), words = text.split(' '), r = rng(1000 + bi * 77);
      var spread = parseFloat(b.getAttribute('data-spread') || '0.5');
      el.textContent = '';
      var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text; el.appendChild(sr);
      var vis = document.createElement('span'); vis.className = 'vis'; vis.setAttribute('aria-hidden', 'true');
      words.forEach(function (w, i) {
        var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
        s.style.setProperty('--th', (i / words.length * spread + r() * 0.05).toFixed(3));
        vis.appendChild(s);
        if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
      });
      el.appendChild(vis);
    });
    var rg = b.getAttribute('data-range').split(',');
    b.r0 = parseFloat(rg[0]); b.r1 = parseFloat(rg[1]);
    b.ramp = b.hasAttribute('data-ramp') ? parseFloat(b.getAttribute('data-ramp')) : null;
    b.op = -1; b.k = -1; b.on = false;
  });

  /* ---------- hero progress and captions ---------- */
  function heroProgress() {
    var rect = hero.getBoundingClientRect(), range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 1;
    return clamp(-rect.top / range, 0, 1);
  }
  var loadK = 0, loadStart = 0, stageState = { scrolled: false, settled: false };
  function updateCaptions(p) {
    bands.forEach(function (b, i) {
      var a = b.r0, z = b.r1, f = Math.min(0.02, (z - a) / 3);
      var op = (i === 0 ? 1 : smoothstep(p, a, a + f)) * (z >= 1 ? 1 : (1 - smoothstep(p, z - f, z)));
      var ramp = b.ramp || Math.min(0.025, (z - a) * 0.35);
      var k = clamp((p - a) / ramp, 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      if (Math.abs(op - b.op) > 0.004 || (op === 0 && b.op !== 0) || (op === 1 && b.op !== 1)) { b.op = op; b.style.opacity = op.toFixed(3); }
      if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) { b.k = k; b.style.setProperty('--k', k.toFixed(3)); }
      var on = op > 0.5;
      if (on !== b.on) { b.on = on; b.classList.toggle('on', on); }
    });
    var scrolled = p > 0.015, settled = p > 0.8;
    if (scrolled !== stageState.scrolled) { stageState.scrolled = scrolled; stage.classList.toggle('scrolled', scrolled); }
    if (settled !== stageState.settled) { stageState.settled = settled; stage.classList.toggle('settled', settled); }
  }

  /* ---------- the film: streamed Blob, gated seeks, eased time ---------- */
  var seekBusy = false, pendingTime = null, videoReady = false;
  function requestSeek(t) {
    if (!videoReady || !video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true; video.currentTime = t;
  }
  video.addEventListener('seeked', function () {
    seekBusy = false;
    if (mode.stage === 'door') drawBackdrop(video);
    if (pendingTime !== null) { var t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', function () { seekBusy = false; pendingTime = null; if (!videoReady) failVideo(); });

  var bctx = backdrop.getContext && backdrop.getContext('2d', { alpha: false });
  function drawBackdrop(src) {
    if (!bctx) return;
    try { bctx.drawImage(src, 0, 0, backdrop.width, backdrop.height); backdrop.classList.add('on'); } catch (e) { /* a frame not yet decodable: the next seek paints */ }
  }

  var target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true, filmTime = -1;
  function tick(now) {
    var dt = Math.min(100, now - (lastTick || now)); lastTick = now;
    var k = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (video.duration) {
      var t = Math.min(1, shown / PROG_END) * Math.max(0, video.duration - 0.04);
      if (Math.abs(t - filmTime) > 0.012) { filmTime = t; requestSeek(t); }
    }
    updateCaptions(shown);
  }
  function onHeroScroll() {
    target = heroProgress();
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  function loadRamp(now) {
    if (!loadStart) loadStart = now;
    var t = clamp((now - loadStart) / 1700, 0, 1);
    loadK = t * t * (3 - 2 * t);
    bands[0].k = -1; updateCaptions(shown);
    if (t < 1) requestAnimationFrame(loadRamp);
  }

  var started = false, blobUrl = null;
  function chooseSource() {
    var narrow = Math.min(window.innerWidth, window.innerHeight) <= 460 || (mode.stage === 'full' && window.innerWidth <= 540);
    return narrow ? { url: video.getAttribute('data-src-540'), bytes: +video.getAttribute('data-bytes-540') || 0 }
                  : { url: video.getAttribute('data-src-720'), bytes: +video.getAttribute('data-bytes-720') || 0 };
  }
  function failVideo() {
    stage.classList.add('video-failed');
    ring.style.setProperty('--ld', 126);
  }
  function startBlobFetch() {
    if (started) return; started = true;
    loadHeroBlob().catch(failVideo);
  }
  function loadHeroBlob() {
    var src = chooseSource();
    var ctrl = new AbortController(), watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(src.url, { priority: 'low', signal: ctrl.signal }).then(function (res) {
      if (!res.ok || !res.body) throw new Error('video ' + res.status);
      var total = Number(res.headers.get('Content-Length')) || src.bytes || 0;
      var reader = res.body.getReader(), chunks = [], got = 0, lastRing = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          clearTimeout(watchdog); watchdog = setTimeout(function () { ctrl.abort(); }, 20000);
          chunks.push(r.value); got += r.value.length;
          var frac = total ? Math.min(1, got / total) : 0.5, now = performance.now();
          if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', Math.round(126 * (1 - frac))); }
          return pump();
        });
      }
      return pump().then(function () {
        clearTimeout(watchdog);
        ring.style.setProperty('--ld', 0);
        blobUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.src = blobUrl; video.load();
        return new Promise(function (resolve, reject) {
          var done = false;
          function ok() { if (done) return; done = true; videoReady = true; filmTime = -1; shown = target = heroProgress(); tick(performance.now()); stage.classList.add('video-ready'); resolve(); }
          video.addEventListener('loadeddata', ok, { once: true });
          video.addEventListener('canplay', ok, { once: true });
          video.addEventListener('error', function () { if (!done) { done = true; reject(new Error('decode')); } }, { once: true });
          setTimeout(function () { if (!done) { done = true; reject(new Error('timeout')); } }, 20000);
        });
      });
    });
  }

  /* ---------- posters and the door ---------- */
  var heroInit = false, posterImg = null;
  function paintPosters() {
    var hi = window.devicePixelRatio > 1.4 || window.innerHeight > 900 ? POSTER_1080 : POSTER_720;
    doorPoster.style.backgroundImage = 'url(' + hi + ')';
    poster.style.backgroundImage = 'url(' + hi + ')';
    poster.classList.add('on');
    posterImg = new Image();
    posterImg.onload = function () { if (mode.stage === 'door') drawBackdrop(posterImg); stage.classList.add('open'); if (mode.hero === 'scrub') { startBlobFetch(); requestAnimationFrame(loadRamp); } };
    posterImg.onerror = function () { stage.classList.add('open'); if (mode.hero === 'scrub') { startBlobFetch(); requestAnimationFrame(loadRamp); } };
    posterImg.src = hi;
    setTimeout(function () { stage.classList.add('open'); if (mode.hero === 'scrub') startBlobFetch(); }, 4000);
  }
  function initHeroOnce() { if (heroInit) return; heroInit = true; paintPosters(); }

  /* ---------- the gates, decided live ---------- */
  var scrubOn = false;
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    bands.forEach(function (b) { b.op = -1; b.k = -1; });
    filmTime = -1;
    onHeroScroll();
    if (rafId === null) tick(performance.now());
  }
  function disableScrub() {
    if (!scrubOn) return; scrubOn = false;
    window.removeEventListener('scroll', onHeroScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function applyHeroMode() {
    var prevStage = mode.stage;
    mode = window.yokoDecide ? window.yokoDecide() : mode;
    if (mode.hero === 'static') { disableScrub(); initHeroOnce(); if (mode.stage === 'door' && posterImg && posterImg.complete) drawBackdrop(posterImg); }
    else enableScrub();
    if (prevStage !== mode.stage) {
      if (mode.stage === 'door') drawBackdrop(videoReady ? video : (posterImg || video));
      bands.forEach(function (b) { b.op = -1; b.k = -1; });
      updateCaptions(mode.hero === 'static' ? 1 : shown);
    }
    if (mode.reduce) pinToFinalStates(); else unpinFinalStates();
  }
  var GATES = ['(prefers-reduced-motion: reduce)', '(max-width: 820px)', '(orientation: portrait) and (pointer: coarse)',
               '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)'];
  var MQLS = GATES.map(function (q) { return window.matchMedia(q); });
  MQLS.forEach(function (m) { if (m.addEventListener) m.addEventListener('change', applyHeroMode); else m.addListener(applyHeroMode); });
  if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', applyHeroMode);

  var heroIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { heroOnScreen = e.isIntersecting; if (heroOnScreen && scrubOn) onHeroScroll(); });
  }, { threshold: 0 });
  heroIO.observe(hero);

  /* ---------- page: nav, sticky bar, parallax, reveals, loop video ---------- */
  var navSolid = false, pastHero = false, parallaxEls = [], parallaxOn = new Set(), pRaf = null;
  $$('[data-depth]').forEach(function (img) {
    var frame = img.closest('.img-frame') || img.closest('.bg-fig') || img.parentElement;
    parallaxEls.push({ img: img, frame: frame, depth: parseFloat(img.getAttribute('data-depth')) || 0.1, py: 0 });
  });
  var pIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var item = parallaxEls.filter(function (x) { return x.frame === e.target; })[0];
      if (!item) return;
      if (e.isIntersecting) parallaxOn.add(item); else parallaxOn.delete(item);
    });
    runParallax();
  }, { rootMargin: '80px 0px' });
  parallaxEls.forEach(function (x) { pIO.observe(x.frame); });
  function runParallax() {
    if (mode.reduce) return;
    var vh = window.innerHeight;
    parallaxOn.forEach(function (x) {
      var r = x.frame.getBoundingClientRect();
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      var py = Math.round(-c * x.depth * 140);
      if (Math.abs(py - x.py) >= 1) { x.py = py; x.img.style.setProperty('--py', py + 'px'); }
    });
  }
  function onPageScroll() {
    if (pRaf !== null) return;
    pRaf = requestAnimationFrame(function () {
      pRaf = null;
      var y = window.scrollY || window.pageYOffset;
      var solid = y > 40;
      if (solid !== navSolid) { navSolid = solid; nav.classList.toggle('solid', solid); }
      var past = hero.getBoundingClientRect().bottom < window.innerHeight * 0.6;
      if (past !== pastHero) { pastHero = past; body.classList.toggle('past-hero', past); }
      runParallax();
    });
  }
  window.addEventListener('scroll', onPageScroll, { passive: true });
  window.addEventListener('resize', onPageScroll);
  onPageScroll();

  var revealIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('in'); revealIO.unobserve(el);
      setTimeout(function () { el.classList.add('done'); }, 1900);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  var ceiling = $('.ceiling');
  if (ceiling) new IntersectionObserver(function (es) { ceiling.classList.toggle('off', !es[0].isIntersecting); }).observe(ceiling);

  $$('video.loop').forEach(function (v) {
    var loaded = false;
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !mode.reduce) {
        if (!loaded) { loaded = true; v.src = v.getAttribute('data-src'); v.load(); }
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } else if (loaded) v.pause();
    }, { threshold: 0.2 }).observe(v);
  });

  document.addEventListener('visibilitychange', function () { body.classList.toggle('paused', document.hidden); });

  /* ---------- the one interactive moment: hold to light the lanterns ---------- */
  var hours = $('#hours'), hold = $('#hold'), h = 0, hRaf = null, holding = false, lastH = 0, hDisplayed = -1;
  function setH(v) { if (Math.abs(v - hDisplayed) > 0.004 || v === 0 || v === 1) { hDisplayed = v; hours.style.setProperty('--h', v.toFixed(3)); } }
  function lightUp() { if (hours.classList.contains('lit')) return; hours.classList.add('lit'); setH(1); hold.setAttribute('aria-pressed', 'true'); }
  function hTick(now) {
    var dt = Math.min(80, now - (lastH || now)); lastH = now;
    h = clamp(h + (holding ? dt / 1400 : -dt / 700), 0, 1);
    setH(h);
    if (h >= 1) { lightUp(); hRaf = null; lastH = 0; return; }
    if (h <= 0 && !holding) { hRaf = null; lastH = 0; return; }
    hRaf = requestAnimationFrame(hTick);
  }
  function startHold(e) { if (hours.classList.contains('lit')) return; if (e && e.preventDefault && e.type !== 'keydown') e.preventDefault(); holding = true; if (hRaf === null) hRaf = requestAnimationFrame(hTick); }
  function endHold() { holding = false; if (hRaf === null && h > 0) hRaf = requestAnimationFrame(hTick); }
  if (hold) {
    hold.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') { hold.setPointerCapture && hold.setPointerCapture(e.pointerId); startHold(e); } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { hold.addEventListener(t, endHold); });
    hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(e); } });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') endHold(); });
    hold.addEventListener('blur', endHold);
    hold.addEventListener('click', function (e) { e.preventDefault(); });
  }

  /* ---------- reduced motion, both directions ---------- */
  function pinToFinalStates() {
    $$('.reveal').forEach(function (el) { el.classList.add('in', 'done'); });
    parallaxEls.forEach(function (x) { x.py = 0; x.img.style.removeProperty('--py'); });
    lightUp();
    $$('video.loop').forEach(function (v) { v.pause(); });
  }
  function unpinFinalStates() { onPageScroll(); }

  /* ---------- go ---------- */
  applyHeroMode();
  if (mode.hero === 'static') updateCaptions(1);
})();
