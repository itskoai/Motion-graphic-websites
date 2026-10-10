/* חליפת הענן · יובל ואיתי — site engine
   Plain vanilla JS. No build step. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const rng = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     1. Split headlines into word + character spans (once, seeded)
  ------------------------------------------------------------------ */
  function splitText(el, seed) {
    if (el.dataset.split === 'done') return;
    const text = el.textContent.trim();
    const mode = el.dataset.entrance || 'drift';
    const spread = parseFloat(el.dataset.spread || '0.55');
    const rand = rng(seed);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.className = 'vis';
    vis.setAttribute('aria-hidden', 'true');
    const words = text.split(/\s+/);
    const totalChars = text.replace(/\s+/g, '').length;
    let ci = 0;
    words.forEach((word, wi) => {
      const w = document.createElement('span');
      w.className = 'w';
      if (el.dataset.em && el.dataset.em.split(',').map(Number).includes(wi)) w.classList.add('em');
      w.style.setProperty('--th', (wi / Math.max(1, words.length) * spread + rand() * 0.05).toFixed(3));
      Array.from(word).forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'c';
        c.textContent = ch;
        let th;
        if (mode === 'grid') th = ci / Math.max(1, totalChars) * spread + rand() * 0.06;
        else th = rand() * spread;
        c.style.setProperty('--th', th.toFixed(3));
        c.style.setProperty('--jx', ((rand() - 0.5) * 70).toFixed(1) + 'px');
        c.style.setProperty('--jy', ((mode === 'weave' ? (ci % 2 ? 1 : -1) * (14 + rand() * 20) : (rand() - 0.5) * 50)).toFixed(1) + 'px');
        c.style.setProperty('--jr', ((rand() - 0.5) * 24).toFixed(1) + 'deg');
        w.appendChild(c);
        ci++;
      });
      vis.appendChild(w);
      if (wi < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.textContent = '';
    el.appendChild(sr);
    el.appendChild(vis);
    el.dataset.split = 'done';
  }
  $$('[data-entrance]').forEach((el, i) => splitText(el, 1234 + i * 97));

  /* ------------------------------------------------------------------
     2. Global environment: paused tab, living sections, entrances
  ------------------------------------------------------------------ */
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('paused', document.hidden);
  });

  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  const liveIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('live', e.isIntersecting));
  }, { rootMargin: '12% 0px 12% 0px' });
  $$('.living').forEach((el) => liveIO.observe(el));

  /* ------------------------------------------------------------------
     3. Nav state (delta-gated)
  ------------------------------------------------------------------ */
  const nav = $('.nav');
  let navScrolled = null;
  function updateNav() {
    const s = scrollY > 24;
    if (s !== navScrolled) { navScrolled = s; nav.classList.toggle('scrolled', s); }
  }
  addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ------------------------------------------------------------------
     4. The scrub hero
  ------------------------------------------------------------------ */
  const hero = $('#hero');
  const stage = $('.stage');
  const video = $('#heroVideo');
  const posterLayer = $('.poster');
  const ring = $('.ring');
  const bands = $$('.band').map((el) => ({
    el,
    a: parseFloat(el.dataset.a),
    b: parseFloat(el.dataset.b),
    ramp: el.dataset.ramp ? parseFloat(el.dataset.ramp) : null,
    op: -1,
    k: -1,
  }));
  const VIDEO_URL = 'assets/hero-scrub.mp4';
  const VIDEO_BYTES = 5500000; /* real byte size patched after the encode */
  const POSTER_URL = 'assets/hero-poster.jpg';

  let target = 0, shown = 0, rafId = null, lastTick = 0;
  let heroOnScreen = true;
  let scrubOn = false;
  let heroInited = false;
  let loadK = 0, loadStart = 0;

  function heroProgress() {
    const range = hero.offsetHeight - innerHeight;
    if (range <= 0) return 0;
    const top = hero.getBoundingClientRect().top;
    return clamp(-top / range, 0, 1);
  }

  /* seek gating: never overlap seeks, coalesce to newest */
  let seekBusy = false, pendingTime = null;
  function requestSeek(t) {
    if (!video.duration || !isFinite(video.duration)) return;
    if (seekBusy) { pendingTime = t; return; }
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', () => {
    seekBusy = false;
    if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', () => { seekBusy = false; pendingTime = null; failVideo(); });

  function updateCaptions(p) {
    for (let i = 0; i < bands.length; i++) {
      const band = bands[i];
      const { a, b } = band;
      const f = Math.min(0.02, (b - a) / 3);
      let op = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));
      if (i === 0) op = 1 - smoothstep(p, b - f, b);
      if (i === bands.length - 1) op = smoothstep(p, a, a + f);
      const rampLen = band.ramp || Math.min(0.025, (b - a) * 0.35);
      let k = clamp((p - a) / rampLen, 0, 1);
      if (i === 0) k = Math.max(k, loadK);
      if (Math.abs(op - band.op) > 0.004 || (op === 0 && band.op !== 0) || (op === 1 && band.op !== 1)) {
        band.op = op;
        band.el.style.opacity = op.toFixed(3);
        const active = op > 0.02;
        if (band.el.classList.contains('active') !== active) {
          band.el.classList.toggle('active', active);
          band.el.inert = !active;
        }
      }
      if (Math.abs(k - band.k) > 0.008 || (k === 1 && band.k !== 1) || (k === 0 && band.k !== 0)) {
        band.k = k;
        band.el.style.setProperty('--k', k.toFixed(3));
      }
    }
  }

  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    if (loadStart && loadK < 1) {
      loadK = clamp((now - loadStart) / 1400, 0, 1);
      loadK = loadK * loadK * (3 - 2 * loadK);
    }
    const kSmooth = 0.16;
    shown += (target - shown) * (1 - Math.pow(1 - kSmooth, dt / 16.667));
    const converged = Math.abs(target - shown) < 0.0005 && loadK >= 1;
    if (converged) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    if (video.duration) requestSeek(shown * video.duration);
    updateCaptions(shown);
  }
  function wake() {
    if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
  }
  function onScroll() {
    target = heroProgress();
    wake();
  }

  const heroIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      heroOnScreen = e.isIntersecting;
      if (heroOnScreen && scrubOn) wake();
    });
  });
  heroIO.observe(hero);

  /* Blob loader with the honest ring */
  let started = false;
  function startBlobFetch() {
    if (started) return;
    started = true;
    loadHeroBlob().catch(failVideo);
  }
  async function loadHeroBlob() {
    const ctrl = new AbortController();
    let watchdog = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal });
    if (!res.ok || !res.body) throw new Error('video fetch failed');
    const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
    const reader = res.body.getReader();
    const chunks = [];
    let got = 0, lastRing = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(watchdog);
      watchdog = setTimeout(() => ctrl.abort(), 20000);
      chunks.push(value);
      got += value.length;
      const frac = Math.min(1, got / total);
      const now = performance.now();
      if (now - lastRing > 100 || frac === 1) {
        lastRing = now;
        ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
      }
    }
    clearTimeout(watchdog);
    ring.style.setProperty('--ld', 0);
    video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
    video.load();
    video.addEventListener('canplay', () => {
      requestSeek(heroProgress() * video.duration);
      stage.classList.add('video-ready');
      ring.classList.add('done');
    }, { once: true });
  }
  function failVideo() {
    stage.classList.add('video-failed');
    ring.classList.add('done');
  }

  function initHeroOnce() {
    if (heroInited) return;
    heroInited = true;
    posterLayer.style.backgroundImage = `url('${POSTER_URL}')`;
    const img = new Image();
    img.onload = startBlobFetch;
    img.onerror = startBlobFetch;
    img.src = POSTER_URL;
    setTimeout(startBlobFetch, 4000);
  }

  /* The five static-hero gates: identical strings in CSS and here */
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)',
  ];
  const MQLS = GATES.map((q) => matchMedia(q));

  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    document.documentElement.classList.add('scrub');
    initHeroOnce();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    bands.forEach((b) => { b.op = -1; b.k = -1; });
    unpinFinalStates();
    if (!loadStart) loadStart = performance.now();
    target = heroProgress();
    updateCaptions(shown);
    onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    document.documentElement.classList.remove('scrub');
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    bands.forEach((b) => {
      b.el.style.opacity = '';
      b.el.style.removeProperty('--k');
      b.el.classList.remove('active');
      b.el.inert = false;
      b.op = -1; b.k = -1;
    });
  }
  function applyHeroMode() {
    if (GATES.some((q) => matchMedia(q).matches)) disableScrub();
    else enableScrub();
  }
  MQLS.forEach((m) => m.addEventListener('change', applyHeroMode));

  /* ------------------------------------------------------------------
     5. Scroll-drawn lines and the section progress drives
  ------------------------------------------------------------------ */
  const drawn = $$('.draw').map((el) => {
    const len = el.getTotalLength ? el.getTotalLength() : 1000;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    return { el, len, last: -1, host: el.closest('section') || el.parentElement };
  });
  let pinned = false;
  function driveDrawn() {
    if (pinned) return;
    const vh = innerHeight;
    drawn.forEach((d) => {
      const r = d.host.getBoundingClientRect();
      const p = clamp((vh * 0.92 - r.top) / (r.height * 0.7 + vh * 0.2), 0, 1);
      if (Math.abs(p - d.last) > 0.01 || (p === 1 && d.last !== 1)) {
        d.last = p;
        d.el.style.strokeDashoffset = (d.len * (1 - p)).toFixed(1);
      }
    });
  }
  addEventListener('scroll', driveDrawn, { passive: true });
  addEventListener('resize', driveDrawn);
  driveDrawn();

  function pinToFinalStates() {
    pinned = true;
    drawn.forEach((d) => { d.el.style.strokeDashoffset = '0'; d.last = 1; });
    puffComplete(true);
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }
  function unpinFinalStates() {
    if (!pinned) return;
    pinned = false;
    drawn.forEach((d) => { d.last = -1; });
    driveDrawn();
  }
  reduceMQ.addEventListener('change', (e) => {
    if (e.matches) pinToFinalStates();
    else applyHeroMode();
  });

  /* ------------------------------------------------------------------
     6. The one interactive moment: press and hold to puff the cloud
  ------------------------------------------------------------------ */
  const puffSection = $('#puff');
  const puffBtn = $('#puffBtn');
  let holding = false, puffP = 0, puffRaf = null, puffLast = 0, puffDone = false, puffShown = -1;
  function puffComplete(instant) {
    if (puffDone) return;
    puffDone = true;
    puffP = 1;
    writePuff();
    puffSection.classList.add('done');
    if (instant) puffSection.classList.add('instant');
    puffBtn.setAttribute('aria-pressed', 'true');
    puffBtn.querySelector('.hint').textContent = puffBtn.dataset.doneText;
  }
  function writePuff() {
    if (Math.abs(puffP - puffShown) > 0.01 || puffP === 0 || puffP === 1) {
      puffShown = puffP;
      puffSection.style.setProperty('--p', puffP.toFixed(3));
    }
  }
  function puffTick(now) {
    const dt = Math.min(80, now - (puffLast || now));
    puffLast = now;
    if (holding) puffP = clamp(puffP + dt / 1400, 0, 1);
    else puffP = clamp(puffP - dt / 700, 0, 1);
    writePuff();
    if (puffP >= 1 && holding) { puffComplete(false); puffRaf = null; puffLast = 0; return; }
    if ((!holding && puffP <= 0) || puffDone) { puffRaf = null; puffLast = 0; return; }
    puffRaf = requestAnimationFrame(puffTick);
  }
  function holdStart(e) {
    if (puffDone) return;
    if (e.type === 'pointerdown' && e.button !== 0) return;
    holding = true;
    puffSection.classList.add('holding');
    if (puffRaf === null) puffRaf = requestAnimationFrame(puffTick);
    e.preventDefault();
  }
  function holdEnd() {
    if (!holding) return;
    holding = false;
    puffSection.classList.remove('holding');
    if (puffRaf === null && !puffDone) puffRaf = requestAnimationFrame(puffTick);
  }
  if (puffBtn) {
    puffBtn.addEventListener('pointerdown', holdStart);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => puffBtn.addEventListener(t, holdEnd));
    addEventListener('pointerup', holdEnd);
    puffBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) holdStart(e); });
    puffBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') holdEnd(); });
    puffBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ------------------------------------------------------------------
     7. Which cloud are you: the sky picker
  ------------------------------------------------------------------ */
  const skyPick = $('#skyPick');
  if (skyPick) {
    $$('[data-sky]', skyPick).forEach((btn) => {
      btn.addEventListener('click', () => {
        const sky = btn.dataset.sky;
        skyPick.dataset.picked = sky;
        $$('[data-sky]', skyPick).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        $$('.sky-result', skyPick).forEach((r) => { r.hidden = r.dataset.for !== sky; });
        const radio = $(`input[name="color"][value="${sky}"]`);
        if (radio) radio.checked = true;
      });
    });
  }

  /* ------------------------------------------------------------------
     8. 360 views: click the dots to switch the view
  ------------------------------------------------------------------ */
  $$('.turn').forEach((turn) => {
    const img = $('img', turn);
    const dots = $$('.turn-dot', turn);
    const views = parseInt(turn.dataset.views || '4', 10);
    function setView(i) {
      img.style.setProperty('--view', i);
      dots.forEach((d, n) => d.setAttribute('aria-selected', String(n === i)));
      turn.dataset.view = i;
    }
    dots.forEach((d, i) => d.addEventListener('click', () => setView(i)));
    turn.addEventListener('keydown', (e) => {
      const cur = parseInt(turn.dataset.view || '0', 10);
      if (e.key === 'ArrowLeft') setView((cur + 1) % views);
      if (e.key === 'ArrowRight') setView((cur - 1 + views) % views);
    });
    setView(0);
  });

  /* ------------------------------------------------------------------
     9. The drop-list form (static site: JS-only success state)
  ------------------------------------------------------------------ */
  const form = $('#dropForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#f-name').value.trim();
      const contact = $('#f-contact').value.trim();
      const err = $('.form-error', form);
      const okPhone = /^0\d{1,2}[-\s]?\d{3}[-\s]?\d{4}$/.test(contact) || /^\+?\d{9,13}$/.test(contact.replace(/[-\s]/g, ''));
      const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      if (!name || !(okPhone || okMail)) {
        err.hidden = false;
        err.textContent = !name ? 'חסר שם. איך נקרא לכם?' : 'צריך טלפון או מייל שבאמת אפשר להגיע אליו.';
        (!name ? $('#f-name') : $('#f-contact')).focus();
        return;
      }
      err.hidden = true;
      const color = (form.querySelector('input[name="color"]:checked') || {}).value || 'both';
      const done = $('.form-done');
      done.querySelector('.done-name').textContent = name;
      done.querySelector('.done-color').textContent = { night: 'לילה', day: 'יום', both: 'שניהם' }[color];
      form.classList.add('sent');
      done.hidden = false;
      done.focus();
    });
  }

  /* ------------------------------------------------------------------
     10. Boot
  ------------------------------------------------------------------ */
  if (reduceMQ.matches) pinToFinalStates();
  applyHeroMode();
  document.documentElement.classList.add('ready');
})();
