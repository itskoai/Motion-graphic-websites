/* YOKO ONO · site script. Plain JavaScript, no build, no dependencies.
   One scroll listener and one rAF loop that eases the walk and rests when converged. Every scroll-driven DOM write is
   delta-gated. The film is fetched as a Blob behind the poster and the ring, seeks are gated and watched, and the five
   hero gates are re-decided live (head.js made the first decision before paint). The page is complete if the film never
   arrives. Below the walk: reveals, a quiet parallax, the gallery rail, the lightbox, and a privacy-first click beacon. */
(function () {
  'use strict';
  var d = document.documentElement, body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var smoothstep = function (p, e0, e1) { var t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  var hero = $('#top'), stage = $('#stage'), video = $('#film'), ring = $('#ring'), backdrop = $('#backdrop');
  var poster = $('#poster'), doorPoster = $('#doorPoster'), nav = $('#nav'), skipBtn = $('#skipIntro');
  var bands = $$('.band[data-range]');
  var PROG_END = 0.84;            /* the film reaches its last frame here; the rest of the hero contracts the arch */
  var POSTER_720 = 'assets/media/walk-poster-720.jpg', POSTER_1080 = 'assets/media/walk-poster-1080.jpg';
  var END_720 = 'assets/media/walk-end-720.jpg', END_1080 = 'assets/media/walk-end-1080.jpg';
  var mode = window.yokoDecide ? window.yokoDecide() : { hero: 'static', stage: 'door', reduce: false, phone: false };

  /* ---------- split every .split line into words, once, with seeded thresholds ---------- */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  $$('.split').forEach(function (el, ei) {
    var holder = el.closest('.band') || el.closest('.reveal') || el.parentElement;
    var spread = parseFloat((holder && holder.getAttribute('data-spread')) || '0.5');
    var text = el.textContent.replace(/\s+/g, ' ').trim(), words = text.split(' '), r = rng(1000 + ei * 77);
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text; el.appendChild(sr);
    var vis = document.createElement('span'); vis.className = 'vis'; vis.setAttribute('aria-hidden', 'true');
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      s.style.setProperty('--th', (i / words.length * spread + r() * 0.04).toFixed(3));
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.appendChild(vis);
  });
  bands.forEach(function (b) {
    var rg = b.getAttribute('data-range').split(',');
    b.r0 = parseFloat(rg[0]); b.r1 = parseFloat(rg[1]);
    b.ramp = b.hasAttribute('data-ramp') ? parseFloat(b.getAttribute('data-ramp')) : null;
    b.op = -1; b.k = -1; b.on = false;
  });

  /* ---------- hero progress, captions, the settle ---------- */
  function heroProgress() {
    var rect = hero.getBoundingClientRect(), range = hero.offsetHeight - window.innerHeight;
    if (range <= 0) return 1;
    return clamp(-rect.top / range, 0, 1);
  }
  var loadK = 0, loadStart = 0, stageState = { scrolled: false, settled: false, past: false }, shownS = -1;
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
    var s = smoothstep(p, PROG_END, 1);
    if (Math.abs(s - shownS) > 0.004 || (s === 0 && shownS !== 0) || (s === 1 && shownS !== 1)) { shownS = s; stage.style.setProperty('--s', s.toFixed(3)); }
    var scrolled = p > 0.015, settled = p > 0.8, past = p > 0.97;
    if (scrolled !== stageState.scrolled) { stageState.scrolled = scrolled; stage.classList.toggle('scrolled', scrolled); }
    if (settled !== stageState.settled) { stageState.settled = settled; stage.classList.toggle('settled', settled); }
    if (past !== stageState.past) { stageState.past = past; setPastHero(); }
  }

  /* ---------- the film: streamed Blob, gated seeks, eased time ---------- */
  var seekBusy = false, pendingTime = null, videoReady = false, seekWatch = null;
  function requestSeek(t) {
    if (!videoReady || !video.duration) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true; video.currentTime = t;
    clearTimeout(seekWatch);
    seekWatch = setTimeout(function () {       /* a browser that never fires seeked (same time, odd decoder) must not freeze the walk */
      if (!seekBusy) return;
      seekBusy = false;
      if (pendingTime !== null) { var p = pendingTime; pendingTime = null; requestSeek(p); }
    }, 1200);
  }
  video.addEventListener('seeked', function () {
    seekBusy = false; clearTimeout(seekWatch);
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
    ring.style.setProperty('--ld', 100);
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
          if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', Math.round(100 * (1 - frac))); }
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
  function hiRes() { return window.devicePixelRatio > 1.4 || window.innerHeight > 900; }
  function paintPosters() {
    var gate = hiRes() ? POSTER_1080 : POSTER_720, room = hiRes() ? END_1080 : END_720;
    poster.style.backgroundImage = 'url(' + gate + ')';
    poster.classList.add('on');
    doorPoster.style.backgroundImage = 'url(' + (mode.hero === 'static' ? room : gate) + ')';
    posterImg = new Image();
    posterImg.onload = function () { if (mode.stage === 'door' && mode.hero === 'scrub') drawBackdrop(posterImg); stage.classList.add('open'); if (mode.hero === 'scrub') { startBlobFetch(); requestAnimationFrame(loadRamp); } };
    posterImg.onerror = function () { stage.classList.add('open'); if (mode.hero === 'scrub') { startBlobFetch(); requestAnimationFrame(loadRamp); } };
    posterImg.src = gate;
    setTimeout(function () { stage.classList.add('open'); if (mode.hero === 'scrub') startBlobFetch(); }, 4000);
  }
  function initHeroOnce() { if (heroInit) return; heroInit = true; paintPosters(); }

  /* ---------- the gates, decided live ---------- */
  var scrubOn = false;
  function enableScrub() {
    if (scrubOn) return; scrubOn = true;
    initHeroOnce();
    doorPoster.style.backgroundImage = 'url(' + (hiRes() ? POSTER_1080 : POSTER_720) + ')';
    window.addEventListener('scroll', onHeroScroll, { passive: true });
    bands.forEach(function (b) { b.op = -1; b.k = -1; }); shownS = -1;
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
    if (mode.hero === 'static') {
      disableScrub(); initHeroOnce();
      doorPoster.style.backgroundImage = 'url(' + (hiRes() ? END_1080 : END_720) + ')';
      stage.style.setProperty('--s', '0');
      bands.forEach(function (b) { b.style.opacity = ''; b.style.setProperty('--k', '1'); b.op = -1; b.k = -1; });
    } else enableScrub();
    if (prevStage !== mode.stage) {
      if (mode.stage === 'door' && mode.hero === 'scrub') drawBackdrop(videoReady ? video : (posterImg || video));
      bands.forEach(function (b) { b.op = -1; b.k = -1; }); shownS = -1;
      if (mode.hero === 'scrub') updateCaptions(shown);
    }
    if (mode.reduce) pinToFinalStates(); else unpinFinalStates();
    onPageScroll();
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

  /* ---------- the skip action ---------- */
  function heroEnd() { return mode.hero === 'static' ? hero.offsetTop + hero.offsetHeight : hero.offsetTop + hero.offsetHeight - window.innerHeight; }
  if (skipBtn) skipBtn.addEventListener('click', function () {
    var y = heroEnd();
    try { window.scrollTo({ top: y, behavior: mode.reduce ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, y); }
    var h = $('#food-h');
    if (h) setTimeout(function () { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }, mode.reduce ? 50 : 900);
  });

  /* ---------- page: nav, sticky bar, parallax, reveals ---------- */
  var navSolid = false, pastHero = false, parallaxEls = [], parallaxOn = new Set(), pRaf = null;
  function setPastHero() {
    var past = (mode.stage === 'door' && stageState.past) || hero.getBoundingClientRect().bottom < window.innerHeight * 0.6 || (mode.hero === 'static' && (window.scrollY || window.pageYOffset) > window.innerHeight * 0.7);
    if (past !== pastHero) { pastHero = past; body.classList.toggle('past-hero', past); }
  }
  $$('[data-depth]').forEach(function (img) {
    var frame = img.closest('.img-frame') || img.parentElement;
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
      setPastHero();
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
      setTimeout(function () { el.classList.add('done'); }, 2000);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  document.addEventListener('visibilitychange', function () { body.classList.toggle('paused', document.hidden); });

  /* ---------- the gallery: the rail, the drawer, the lightbox ---------- */
  var rail = $('#gallery'), railMore = $('#railMore'), railClose = $('#railClose'), thumbs = $$('.thumb', rail);
  var railBackdrop = document.createElement('div'); railBackdrop.className = 'rail-backdrop'; body.appendChild(railBackdrop);
  var stripMQ = window.matchMedia('(max-width: 820px), (orientation: portrait) and (pointer: coarse)');
  function isStrip() { return stripMQ.matches; }
  function openRail() {
    rail.classList.add('open'); body.classList.add('rail-open'); railMore.setAttribute('aria-expanded', 'true');
    setTimeout(function () { railClose.focus(); }, 30);
  }
  function closeRail(returnFocus) {
    if (!rail.classList.contains('open')) return;
    rail.classList.remove('open'); body.classList.remove('rail-open'); railMore.setAttribute('aria-expanded', 'false');
    if (returnFocus) railMore.focus();
  }
  railMore.addEventListener('click', function () { if (isStrip()) openLightbox(0, railMore); else if (rail.classList.contains('open')) closeRail(true); else openRail(); });
  railClose.addEventListener('click', function () { closeRail(true); });
  railBackdrop.addEventListener('click', function () { closeRail(true); });
  if (stripMQ.addEventListener) stripMQ.addEventListener('change', function () { closeRail(false); });

  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount'), lbClose = $('#lbClose'), lbPrev = $('#lbPrev'), lbNext = $('#lbNext');
  var lbIndex = -1, lbOpener = null, inertEls = [], lbLoadToken = 0;
  var items = thumbs.map(function (b) { var im = b.querySelector('img'); return { full: b.getAttribute('data-full'), w: +b.getAttribute('data-w'), h: +b.getAttribute('data-h'), alt: im.getAttribute('alt'), cap: (b.querySelector('.thumb-cap') || im).textContent || im.getAttribute('alt'), btn: b }; });
  function preload(i) { var it = items[(i + items.length) % items.length]; if (it && !it.pre) { it.pre = new Image(); it.pre.src = it.full; } }
  function showItem(i) {
    lbIndex = (i + items.length) % items.length;
    var it = items[lbIndex], token = ++lbLoadToken;
    lbImg.classList.remove('on');
    var im = new Image();
    im.onload = function () { if (token !== lbLoadToken) return; lbImg.src = it.full; lbImg.width = it.w; lbImg.height = it.h; lbImg.alt = it.alt; requestAnimationFrame(function () { lbImg.classList.add('on'); }); };
    im.onerror = function () { if (token !== lbLoadToken) return; lbImg.src = it.btn.querySelector('img').src; lbImg.alt = it.alt; lbImg.classList.add('on'); };
    im.src = it.full;
    lbCap.textContent = it.cap;
    lbCount.textContent = (lbIndex + 1) + ' / ' + items.length;
    preload(lbIndex + 1); preload(lbIndex - 1);
  }
  function openLightbox(i, opener) {
    lbOpener = opener || items[i].btn;
    inertEls = $$('.nav, .hero, main, .footer, .sticky-cta');
    inertEls.forEach(function (el) { el.inert = true; });
    body.classList.add('lb-open');
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('on'); });
    showItem(i);
    setTimeout(function () { lbClose.focus(); }, 30);
  }
  function closeLightbox() {
    if (lb.hidden) return;
    lb.classList.remove('on');
    inertEls.forEach(function (el) { el.inert = false; }); inertEls = [];
    body.classList.remove('lb-open');
    setTimeout(function () { lb.hidden = true; lbImg.classList.remove('on'); lbImg.removeAttribute('src'); }, 320);
    if (lbOpener && lbOpener.focus) lbOpener.focus();
  }
  thumbs.forEach(function (b, i) { b.addEventListener('click', function () { openLightbox(i, b); }); });
  lbClose.addEventListener('click', closeLightbox);
  lbNext.addEventListener('click', function () { showItem(lbIndex + 1); });
  lbPrev.addEventListener('click', function () { showItem(lbIndex - 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showItem(lbIndex + 1); return; }   /* RTL: next is to the left */
      if (e.key === 'ArrowRight') { e.preventDefault(); showItem(lbIndex - 1); return; }
      if (e.key === 'Tab') {                                                              /* focus stays inside the dialog */
        var f = [lbClose, lbPrev, lbNext], first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (f.indexOf(document.activeElement) < 0) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'Escape' && rail.classList.contains('open')) closeRail(true);
  });
  var swipeX = null, swipeY = null;
  lb.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; swipeX = e.clientX; swipeY = e.clientY; });
  lb.addEventListener('pointerup', function (e) {
    if (swipeX === null) return;
    var dx = e.clientX - swipeX, dy = e.clientY - swipeY; swipeX = swipeY = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) showItem(dx < 0 ? lbIndex + 1 : lbIndex - 1);
  });
  lb.addEventListener('pointercancel', function () { swipeX = swipeY = null; });

  /* ---------- the click beacon: an event name and the layout, nothing else ---------- */
  function beacon(ev) {
    if (!navigator.sendBeacon) return;
    try { navigator.sendBeacon('api/click.php', new URLSearchParams({ e: ev, s: mode.phone ? 'phone' : 'desktop' })); } catch (e) { /* never in the visitor's way */ }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-ev]');
    if (el) beacon(el.getAttribute('data-ev'));
  });

  /* ---------- reduced motion, both directions ---------- */
  function pinToFinalStates() {
    $$('.reveal').forEach(function (el) { el.classList.add('in', 'done'); });
    parallaxEls.forEach(function (x) { x.py = 0; x.img.style.removeProperty('--py'); });
  }
  function unpinFinalStates() { onPageScroll(); }

  /* ---------- go ---------- */
  applyHeroMode();
})();
