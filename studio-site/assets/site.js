/* OUTFRAME site engine. Plain JS, no build step.
   One scroll listener sets targets; one rAF loop eases every scene toward its target and rests when converged. */
(() => {
  'use strict';

  const CFG = window.SITE_CONFIG || {};
  const D = document, root = D.documentElement;
  const $ = (s, c = D) => c.querySelector(s);
  const $$ = (s, c = D) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const MEDIA = 'assets/media/';

  /* ------------------------------------------------------------------ gates */
  // The same five conditions as the inline head script. Phones and portrait tablets get the portrait frame sequence;
  // landscape phones, reduced motion and data saver get the composed still.
  const Q = {
    phone: '(max-width: 720px)',
    portraitTablet: '(orientation: portrait) and (max-width: 1024px)',
    coarsePortrait: '(orientation: portrait) and (pointer: coarse)',
    landscapePhone: '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    reduce: '(prefers-reduced-motion: reduce)'
  };
  const MQ = {}; for (const k in Q) MQ[k] = matchMedia(Q[k]);
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let reduced = MQ.reduce.matches;
  const heroModeNow = () => (MQ.reduce.matches || saveData || MQ.landscapePhone.matches) ? 'static'
    : (MQ.phone.matches || MQ.portraitTablet.matches || MQ.coarsePortrait.matches) ? 'frames' : 'video';
  const isPortraitSet = () => MQ.phone.matches || (innerHeight > innerWidth * 1.05);

  root.classList.toggle('rm', reduced);

  /* ------------------------------------------------------------------ config */
  function applyConfig() {
    const brand = (CFG.brand && CFG.brand.name) || 'OUTFRAME';
    $$('[data-brand]').forEach((el) => { el.textContent = brand; });
    $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    const email = ((CFG.contact && CFG.contact.email) || '').trim();
    if (email) {
      $$('[data-contact-email]').forEach((el) => { el.textContent = email; });
      $$('[data-contact-wrap]').forEach((el) => { el.hidden = false; });
      $$('[data-copy-email]').forEach((b) => b.addEventListener('click', () => {
        const done = () => { b.textContent = 'הועתק'; setTimeout(() => { b.textContent = 'העתקה'; }, 1800); };
        const sel = () => { const r = D.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
        try { navigator.clipboard.writeText(email).then(done, sel); } catch (e) { sel(); }
      }));
    }

    const socials = (CFG.socials || []).filter((s) => s && s.url);
    const list = $('[data-socials]');
    if (list && socials.length) {
      socials.forEach((s) => {
        const li = D.createElement('li'); const a = D.createElement('a');
        a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.label;
        li.appendChild(a); list.appendChild(li);
      });
      list.hidden = false;
    }

    (CFG.founders || []).forEach((f, i) => {
      if (!f) return;
      const name = (f.name || '').trim(), role = (f.role || '').trim(), photo = (f.photo || '').trim();
      const n = $(`[data-founder="${i}"]`), r = $(`[data-founder-role="${i}"]`);
      if (n && name) n.textContent = name;
      if (r && role) r.textContent = role;
      if (photo) {
        const side = $$('.side')[i];
        const img = side && $('.side-photo', side);
        if (img) { img.src = photo; img.alt = name; img.hidden = false; }
      }
    });

    const proj = CFG.projects || {};
    $$('[data-link]').forEach((a) => {
      const url = proj[a.dataset.link] && proj[a.dataset.link].url;
      if (url) { a.href = url; a.hidden = false; }
    });
  }

  /* ------------------------------------------------------------------ text splitting */
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  function splitHeadline(el, seed) {
    const text = el.textContent.trim();
    const fx = el.dataset.fx;
    const r = rng(seed);
    el.textContent = '';
    const sr = D.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = D.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    el.append(sr, vis);
    el.classList.add('fx-' + fx);
    const words = text.split(/\s+/);
    if (fx === 'part') {
      const cut = Math.ceil(words.length / 2.5);
      [words.slice(0, cut), words.slice(cut)].forEach((group, gi) => {
        const h = D.createElement('span'); h.className = 'half';
        h.style.setProperty('--jx', (gi === 0 ? -1 : 1) * 70 + 'px');
        group.forEach((w, wi) => {
          const s = D.createElement('span'); s.className = 'w'; s.textContent = w;
          h.appendChild(s); if (wi < group.length - 1) h.appendChild(D.createTextNode(' '));
        });
        vis.appendChild(h); if (gi === 0) vis.appendChild(D.createTextNode(' '));
      });
      return;
    }
    words.forEach((w, wi) => {
      const ws = D.createElement('span'); ws.className = 'w';
      ws.style.setProperty('--th', (fx === 'depth' ? wi * 0.16 : fx === 'rise' ? wi * 0.09 : 0).toFixed(3));
      if (fx === 'focus') {
        Array.from(w).forEach((ch) => {
          const c = D.createElement('span'); c.className = 'c'; c.textContent = ch;
          c.dataset.r = r().toFixed(3);
          ws.appendChild(c);
        });
      } else ws.textContent = w;
      vis.appendChild(ws);
      if (wi < words.length - 1) vis.appendChild(D.createTextNode(' '));
    });
  }

  // b1: characters open out of the beam line. Offsets are measured once the fonts are in.
  function measureFocus(el) {
    const box = el.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cs = $$('.c', el);
    let maxd = 1;
    const data = cs.map((c) => { const b = c.getBoundingClientRect(); const d = cx - (b.left + b.width / 2); maxd = Math.max(maxd, Math.abs(d)); return d; });
    cs.forEach((c, i) => {
      c.style.setProperty('--jx', data[i].toFixed(1) + 'px');
      c.style.setProperty('--th', (Math.abs(data[i]) / maxd * 0.42 + (+c.dataset.r) * 0.08).toFixed(3));
    });
  }

  function splitVision() {
    $$('.vline').forEach((p) => {
      const text = p.textContent.trim();
      const words = text.split(/\s+/);
      p.textContent = '';
      p.style.setProperty('--n', String(words.length));
      words.forEach((w, i) => {
        const s = D.createElement('span'); s.className = 'vw'; s.textContent = w;
        s.style.setProperty('--i', String(i));
        p.appendChild(s); if (i < words.length - 1) p.appendChild(D.createTextNode(' '));
      });
    });
  }

  /* ------------------------------------------------------------------ the loop */
  const scenes = [];
  let raf = 0, lastT = 0, vh = innerHeight;
  function requestTick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    const dt = Math.min(100, now - (lastT || now)); lastT = now;
    let busy = false;
    for (const s of scenes) {
      if (!s.live) continue;
      if (s.k) {
        const a = 1 - Math.pow(1 - s.k, dt / 16.667);
        s.shown += (s.target - s.shown) * a;
        if (Math.abs(s.target - s.shown) < 0.0004) s.shown = s.target; else busy = true;
      } else s.shown = s.target;
      if (s.shown !== s.drawn || s.dirty) { s.dirty = false; s.drawn = s.shown; s.render(s.shown, now); }
      if (s.animating && s.animating(now)) busy = true;
    }
    if (busy) raf = requestAnimationFrame(tick); else lastT = 0;
  }
  function onScroll() {
    const y = scrollY;
    for (const s of scenes) if (s.live) s.target = s.progress(y);
    requestTick();
  }
  function scene(def) {
    const s = Object.assign({ live: false, on: true, k: 0, target: 0, shown: 0, drawn: -1, dirty: true, top: 0, h: 1, range: 1 }, def);
    scenes.push(s);
    return s;
  }
  function measure() {
    vh = innerHeight;
    for (const s of scenes) {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + scrollY; s.h = s.el.offsetHeight;
      const pinH = s.pin ? s.pin.offsetHeight : vh;
      s.range = Math.max(1, s.h - pinH);
      if (s.onMeasure) s.onMeasure();
      s.dirty = true;
    }
    onScroll();
  }
  const pinned = (s) => (y) => clamp((y - s.top) / s.range, 0, 1);

  // Each scene only works while it is near the screen.
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const s = scenes.find((x) => x.el === e.target);
      if (!s) continue;
      const was = s.live;
      s.live = e.isIntersecting && s.on;
      if (s.live && !was) { s.target = s.progress(scrollY); s.shown = s.target; s.dirty = true; if (s.wake) s.wake(); requestTick(); }
      if (!s.live && was && s.sleep) s.sleep();
    }
  }, { rootMargin: '60% 0px 60% 0px' });

  /* ------------------------------------------------------------------ SC 01 hero */
  const hero = $('.hero');
  const stage = $('.hero-stage');
  const still = $('.hero-still');
  const video = $('.hero-video');
  const canvas = $('.hero-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const cue = $('.cue');
  const ring = $('.cue .ring');
  const HERO_FRAMES = 134, FPS = 24;
  const VIDEO_URL = MEDIA + 'hero-scrub.mp4';
  const VIDEO_BYTES = 2043362;   // real byte size: the fallback when Content-Length is missing
  // progress to desktop frame: the beam holds, the frame opens, we pass through, the world settles
  const KP = [[0, 0], [0.16, 3], [0.42, 40], [0.72, 100], [1, 133]];
  const frameAt = (p) => { for (let i = 1; i < KP.length; i++) if (p <= KP[i][0]) { const [a, fa] = KP[i - 1], [b, fb] = KP[i]; return fa + (fb - fa) * (p - a) / (b - a); } return 133; };
  // where each portrait frame sits on the desktop timeline (every second frame, plus the last)
  const SEQ = []; for (let i = 0; i < 67; i++) SEQ.push(i * 2); SEQ.push(133);
  const mobileIndex = (f) => { for (let i = 1; i < SEQ.length; i++) if (f <= SEQ[i]) return i - 1 + (f - SEQ[i - 1]) / (SEQ[i] - SEQ[i - 1]); return SEQ.length - 1; };

  const bands = $$('.band').map((el) => {
    const [a, b] = el.dataset.band.split(',').map(Number);
    return { el, a, b, ramp: +el.dataset.ramp || 0, op: -1, k: -1, live: null, first: a === 0, last: b === 1 };
  });
  let loadK = 0;
  // keyboard users who tab into a band that is not on screen yet get scrolled to it
  bands.forEach((B) => B.el.addEventListener('focusin', () => {
    if (B.live || heroMode === 'static') return;
    window.scrollTo({ top: H.top + (B.a + Math.min(0.05, (B.b - B.a) / 2)) * H.range, behavior: 'auto' });
  }));
  function updateBands(p) {
    for (const B of bands) {
      const f = Math.min(0.02, (B.b - B.a) / 3);
      const op = (B.first ? 1 : smooth(p, B.a, B.a + f)) * (B.last ? 1 : 1 - smooth(p, B.b - f, B.b));
      let k = clamp((p - B.a) / (B.ramp || Math.min(0.025, (B.b - B.a) * 0.35)), 0, 1);
      if (B.first) k = Math.max(k, loadK);
      if (Math.abs(op - B.op) > 0.004 || ((op === 0 || op === 1) && op !== B.op)) { B.el.style.opacity = op.toFixed(3); B.op = op; }
      if (Math.abs(k - B.k) > 0.008 || ((k === 0 || k === 1) && k !== B.k)) { B.el.style.setProperty('--k', k.toFixed(3)); B.k = k; }
      const live = op > 0.6;
      if (live !== B.live) { B.live = live; B.el.classList.toggle('live', live); }
    }
  }

  let heroMode = null, videoFailed = false, framesFailed = false, cueGone = null, stillMode = '';
  const H = scene({ el: hero, pin: stage, k: 0.16 });
  H.progress = pinned(H);
  H.render = (p) => {
    if (heroMode === 'static') return;
    const f = frameAt(p);
    if (heroMode === 'video' && !videoFailed) requestSeek((Math.min(133, f) + 0.5) / FPS);
    if (heroMode === 'frames' && !framesFailed) drawHeroFrame(mobileIndex(f));
    if (videoFailed || framesFailed || !heroReady) setStillFor(p);
    updateBands(p);
    const gone = p > 0.03;
    if (gone !== cueGone) { cueGone = gone; cue.classList.toggle('gone', gone); }
  };
  let heroReady = false;
  function setStillFor(p) {
    const portrait = heroMode === 'frames';
    const want = (p > 0.5 ? 'end' : 'poster') + (portrait ? '-m' : '');
    if (want === stillMode) return;
    stillMode = want;
    still.src = MEDIA + 'hero-' + want + '.jpg';
  }

  // --- video path: streamed Blob with an honest ring, gated seeks
  let seekBusy = false, pendingTime = null, videoStarted = false;
  function requestSeek(t) {
    if (!video.duration) return;
    t = Math.min(t, video.duration - 0.02);
    if (seekBusy) { pendingTime = t; return; }
    if (Math.abs(video.currentTime - t) < 0.004) return;
    seekBusy = true;
    video.currentTime = t;
  }
  video.addEventListener('seeked', () => {
    seekBusy = false;
    if (pendingTime !== null) { const t = pendingTime; pendingTime = null; requestSeek(t); }
  });
  video.addEventListener('error', () => { seekBusy = false; pendingTime = null; if (heroMode === 'video') failHero(); });

  function initVideo() {
    if (videoStarted) return; videoStarted = true;
    stillMode = ''; setStillFor(0);
    let started = false;
    const start = () => { if (started) return; started = true; loadHeroBlob().catch(failHero); };
    const probe = new Image(); probe.onload = start; probe.onerror = start; probe.src = MEDIA + 'hero-poster.jpg';
    setTimeout(start, 4000);
  }
  async function loadHeroBlob() {
    const ctrl = new AbortController();
    let watchdog = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal });
    if (!res.ok || !res.body) throw new Error('video ' + res.status);
    const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
    const reader = res.body.getReader();
    const chunks = []; let got = 0, lastRing = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      clearTimeout(watchdog); watchdog = setTimeout(() => ctrl.abort(), 20000);
      chunks.push(value); got += value.length;
      const frac = Math.min(1, got / total), now = performance.now();
      if (now - lastRing > 100 || frac === 1) { lastRing = now; ring.style.setProperty('--ld', String(Math.round(126 * (1 - frac)))); }
    }
    clearTimeout(watchdog);
    ring.style.setProperty('--ld', '0');
    video.src = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('Content-Type') || 'video/mp4' }));
    video.load();
    video.addEventListener('loadeddata', () => {
      heroReady = true;
      hero.classList.add('video-ready');
      cue.classList.add('loaded');
      requestSeek((frameAt(H.shown) + 0.5) / FPS);
      H.dirty = true; requestTick();
    }, { once: true });
  }
  function failHero() {
    if (heroMode === 'video') videoFailed = true; else framesFailed = true;
    hero.classList.add('media-failed');
    cue.classList.add('loaded');
    stillMode = ''; setStillFor(H.shown);
  }

  // --- frames path: a portrait image sequence on a canvas, loaded coarse to fine, blended between neighbours
  const FR_N = 68;
  const frames = new Array(FR_N); const frameOk = new Uint8Array(FR_N);
  let framesStarted = false, lastDrawn = -1, cw = 0, ch = 0;
  function initFrames() {
    if (framesStarted) { sizeCanvas(); return; }
    framesStarted = true;
    stillMode = ''; setStillFor(0);
    sizeCanvas();
    const order = []; const seen = new Set();
    const push = (i) => { if (i >= 0 && i < FR_N && !seen.has(i)) { seen.add(i); order.push(i); } };
    push(0); push(FR_N - 1);
    [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < FR_N; i += step) push(i); });
    let next = 0, inflight = 0, fails = 0;
    const pump = () => {
      while (inflight < 6 && next < order.length) {
        const i = order[next++]; inflight++;
        const img = new Image(); img.decoding = 'async';
        img.onload = () => {
          inflight--; frames[i] = img; frameOk[i] = 1;
          if (i === 0) { heroReady = true; hero.classList.add('frames-ready'); cue.classList.add('loaded'); }
          if (Math.abs(i - curFi) < 3 || i === 0) { lastDrawn = -1; H.dirty = true; requestTick(); }
          pump();
        };
        img.onerror = () => { inflight--; if (++fails > 6 && !heroReady) failHero(); pump(); };
        img.src = MEDIA + 'herom/' + String(i).padStart(2, '0') + '.webp';
      }
    };
    pump();
  }
  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (w && h && (w !== cw || h !== ch)) { canvas.width = cw = w; canvas.height = ch = h; lastDrawn = -1; H.dirty = true; }
  }
  function nearestLoaded(i, dir) { for (let d = 0; d < FR_N; d++) { const j = i + d * dir; if (j < 0 || j >= FR_N) break; if (frameOk[j]) return j; } return -1; }
  function drawCover(img, alpha) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s, dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) * 0.5, dw, dh);
  }
  let curFi = 0;
  function drawHeroFrame(fi) {
    curFi = fi;
    if (Math.abs(fi - lastDrawn) < 0.004) return;
    let i0 = Math.floor(fi), t = fi - i0;
    let a = frameOk[i0] ? i0 : nearestLoaded(i0, -1);
    if (a < 0) a = nearestLoaded(i0, 1);
    if (a < 0) return;
    let b = Math.min(FR_N - 1, i0 + 1);
    if (a !== i0) t = 0;
    drawCover(frames[a], 1);
    if (t > 0.02 && frameOk[b] && b !== a) drawCover(frames[b], t);
    ctx.globalAlpha = 1;
    lastDrawn = fi;
  }

  // --- mode switching, decided live
  function applyHeroMode() {
    const mode = heroModeNow();
    if (mode === heroMode) return;
    heroMode = mode;
    root.setAttribute('data-hero', mode);
    hero.classList.remove('video-ready', 'frames-ready');
    heroReady = false;
    if (mode === 'video') { if (videoStarted && video.readyState >= 2 && !videoFailed) { heroReady = true; hero.classList.add('video-ready'); } initVideo(); }
    else if (mode === 'frames') { if (framesStarted && frameOk[0]) { heroReady = true; hero.classList.add('frames-ready'); } initFrames(); }
    else { stillMode = ''; still.src = MEDIA + (isPortraitSet() ? 'hero-end-m.jpg' : 'hero-end.jpg'); }
    bands.forEach((B) => { B.op = -1; B.k = -1; B.live = null; });
    H.on = mode !== 'static';
    near.unobserve(hero); near.observe(hero);   // re-reads whether the hero is on screen under the new mode
    measureSoon();
  }

  /* ------------------------------------------------------------------ SC 02 transformation */
  const xf = $('.xform');
  const xfPin = $('.xform-pin');
  const xfFrame = $('.xform-frame');
  const xfCanvas = $('.xform-canvas');
  const xctx = xfCanvas.getContext('2d', { alpha: false });
  const xfSteps = $$('.step');
  const xfHead = $('.xform-head');
  const xfCaption = $('.xform-caption');
  const xfOutro = $('.xform-outro');
  const xfTc = $('.slate-tc');
  const xfBeam = $('.steps-beam');
  const XN = 32;
  let xSet = '', xImgs = [], xOk = new Uint8Array(XN), xSketch = null, xStarted = false, xCover = 1.6, xw = 0, xh = 0;
  const X = scene({ el: xf, pin: xfPin, k: 0.14 });
  X.progress = pinned(X);
  X.wake = () => loadXform();
  function xformSet() { return MQ.phone.matches ? 'm' : 'd'; }
  function loadXform() {
    const set = xformSet();
    if (xStarted && set === xSet) return;
    xStarted = true; xSet = set; xImgs = new Array(XN); xOk = new Uint8Array(XN); xSketch = null;
    const sk = new Image(); sk.onload = () => { xSketch = sk; X.dirty = true; requestTick(); }; sk.src = MEDIA + 'idea/sketch-' + set + '.webp';
    const order = [0, 31, 16, 8, 24, 4, 12, 20, 28]; for (let i = 0; i < XN; i++) if (!order.includes(i)) order.push(i);
    let n = 0, inflight = 0;
    const pump = () => {
      while (inflight < 4 && n < order.length) {
        const i = order[n++]; inflight++;
        const img = new Image(); img.decoding = 'async';
        img.onload = () => { inflight--; xImgs[i] = img; xOk[i] = 1; X.dirty = true; requestTick(); pump(); };
        img.onerror = () => { inflight--; pump(); };
        img.src = MEDIA + 'idea/' + set + String(i).padStart(2, '0') + '.webp';
      }
    };
    pump();
  }
  X.onMeasure = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const fw = xfFrame.offsetWidth, fh = xfFrame.offsetHeight;
    const w = Math.round(fw * dpr), h = Math.round(fh * dpr);
    if (w && h && (w !== xw || h !== xh)) { xfCanvas.width = xw = w; xfCanvas.height = xh = h; }
    xCover = Math.max(innerWidth / fw, xfPin.offsetHeight / fh) * 1.04;
    if (xStarted && xformSet() !== xSet) loadXform();
  };
  function xNearest(i) { for (let d = 0; d < XN; d++) { if (i - d >= 0 && xOk[i - d]) return i - d; if (i + d < XN && xOk[i + d]) return i + d; } return -1; }
  function xDraw(img, alpha) {
    const s = Math.max(xw / img.naturalWidth, xh / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    xctx.globalAlpha = alpha; xctx.drawImage(img, (xw - dw) / 2, (xh - dh) / 2, dw, dh);
  }
  let xState = -1, xLastTc = '', xLastTcAt = 0;
  const vars = new WeakMap();
  function setVar(el, name, v, eps = 0.004) {
    let m = vars.get(el); if (!m) vars.set(el, m = {});
    if (m[name] !== undefined && Math.abs(m[name] - v) < eps && v !== 0 && v !== 1) return;
    if (m[name] === v) return;
    m[name] = v; el.style.setProperty(name, (+v).toFixed(4));
  }
  function setOpacity(el, v) {
    let m = vars.get(el); if (!m) vars.set(el, m = {});
    if (m.op !== undefined && Math.abs(m.op - v) < 0.004 && v !== 0 && v !== 1) return;
    if (m.op === v) return;
    m.op = v; el.style.opacity = v.toFixed(3);
  }
  X.render = (q, now) => {
    // state edges: idea, frame, motion, world, then the outro line
    const st = q < 0.15 ? 0 : q < 0.30 ? 1 : q < 0.52 ? 2 : 3;
    if (st !== xState) { xState = st; xfSteps.forEach((li, i) => li.classList.toggle('on', i === st)); }
    const wipe = smooth(q, 0.15, 0.29);
    const fi = q < 0.30 ? 0 : q < 0.52 ? (q - 0.30) / 0.22 * 23 : 23 + clamp((q - 0.52) / 0.40, 0, 1) * 8;
    const world = smooth(q, 0.52, 0.70);
    const scale = 1 + (xCover - 1) * easeOut(smooth(q, 0.52, 0.74));
    setVar(xfFrame, '--s', scale, 0.0008);
    setVar(xfFrame, '--world', world);
    setVar(xfBeam, '--sp', clamp(q / 0.78, 0, 1));
    setOpacity(xfHead, 1 - smooth(q, 0.5, 0.6));
    setOpacity(xfCaption, 1 - smooth(q, 0.78, 0.82));
    setOpacity(xfOutro, smooth(q, 0.82, 0.88));
    // the picture
    if (!xw) return;
    if (wipe < 1 && xSketch) { xctx.globalAlpha = 1; xDraw(xSketch, 1); }
    else if (wipe < 1) { xctx.globalAlpha = 1; xctx.fillStyle = '#efe9dd'; xctx.fillRect(0, 0, xw, xh); }
    if (wipe > 0) {
      const i0 = Math.floor(fi), t = fi - i0;
      const a = xOk[i0] ? i0 : xNearest(i0);
      if (a >= 0) {
        xctx.save();
        if (wipe < 1) { const half = xw * wipe / 2; xctx.beginPath(); xctx.rect(xw / 2 - half, 0, half * 2, xh); xctx.clip(); }
        xDraw(xImgs[a], 1);
        const b = Math.min(XN - 1, i0 + 1);
        if (a === i0 && t > 0.02 && xOk[b]) xDraw(xImgs[b], t);
        xctx.restore();
        if (wipe > 0 && wipe < 1) {   // the two edges of the reveal are beams of light
          const half = xw * wipe / 2, lw = Math.max(2, xw * 0.0022);
          xctx.globalAlpha = 1 - wipe * 0.6; xctx.fillStyle = '#fff4e2';
          xctx.shadowColor = 'rgba(255,244,226,.9)'; xctx.shadowBlur = xw * 0.012;
          xctx.fillRect(xw / 2 - half - lw / 2, 0, lw, xh); xctx.fillRect(xw / 2 + half - lw / 2, 0, lw, xh);
          xctx.shadowBlur = 0;
        }
      }
    }
    xctx.globalAlpha = 1;
    // slate timecode, 10Hz and only on change
    const frames24 = Math.round(fi * 5);
    const tc = '00:00:' + String(Math.floor(frames24 / 24)).padStart(2, '0') + ':' + String(frames24 % 24).padStart(2, '0');
    if (tc !== xLastTc && now - xLastTcAt > 100) { xLastTc = tc; xLastTcAt = now; xfTc.textContent = tc; }
  };
  function xformStill() {
    const img = $('.xform-still');
    if (!img.src) img.src = MEDIA + 'idea/' + xformSet() + '31.webp';
  }

  /* ------------------------------------------------------------------ SC 03 worlds */
  function initWorlds() {
    const items = $$('.world');
    const layers = $$('.wm');
    const slit = $('.wm-slit');
    const siteVideo = $('.wm-site video');
    let active = -1;
    const activate = (i) => {
      if (i === active) return;
      layers.forEach((l) => l.classList.remove('was'));
      if (active >= 0) layers[active].classList.add('was');
      layers.forEach((l, j) => l.classList.toggle('on', j === i));
      items.forEach((it, j) => it.classList.toggle('on', j === i));
      if (!reduced) { slit.classList.remove('flash'); void slit.offsetWidth; slit.classList.add('flash'); }
      active = i;
      if (siteVideo) {
        if (i === 2 && !reduced) { if (!siteVideo.src) siteVideo.src = siteVideo.dataset.src; siteVideo.play().catch(() => {}); }
        else siteVideo.pause();
      }
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) activate(+e.target.dataset.i); });
    }, { rootMargin: '-46% 0px -46% 0px' });
    items.forEach((it) => io.observe(it));
    activate(0);
    const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }), { threshold: 0.25 });
    items.forEach((it) => seen.observe(it));
  }

  /* ------------------------------------------------------------------ SC 04 minds */
  const minds = $('.minds');
  const M = scene({ el: minds, pin: $('.minds-pin'), k: 0.14 });
  M.progress = pinned(M);
  const mindsPin = $('.minds-pin');
  const sideVideos = $$('.side-video');
  M.wake = () => { if (reduced) return; sideVideos.forEach((v) => { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }); };
  M.sleep = () => sideVideos.forEach((v) => v.pause());
  M.render = (m) => {
    setVar(mindsPin, '--mx', 0.78 * (1 - easeOut(smooth(m, 0, 0.46))), 0.001);
    setVar(mindsPin, '--seam', smooth(m, 0.42, 0.5) * (1 - 0.5 * smooth(m, 0.6, 0.8)));
    setVar(mindsPin, '--mm', smooth(m, 0.5, 0.6));
    setVar(mindsPin, '--mc', smooth(m, 0.62, 0.74));
  };

  /* ------------------------------------------------------------------ SC 05 vision */
  const vision = $('.vision');
  const V = scene({ el: vision });
  const vLines = [];
  const horizon = $('.vision-horizon');
  V.onMeasure = () => { vLines.length = 0; $$('.vline').forEach((el) => { const r = el.getBoundingClientRect(); vLines.push({ el, top: r.top + scrollY, h: r.height }); }); };
  V.progress = (y) => clamp((y + vh - V.top) / (V.h + vh), 0, 1);
  V.render = () => {
    const y = scrollY;
    for (const L of vLines) {
      const rel = L.top - y;                       // line top relative to the viewport
      const lit = clamp((vh * 0.82 - rel) / (L.h + vh * 0.22), 0, 1);
      setVar(L.el, '--lit', lit, 0.006);
    }
    setVar(horizon, '--hy', 82 - 60 * V.shown, 0.05);
  };

  /* ------------------------------------------------------------------ SC 07 process rail */
  const process = $('.process');
  const P = scene({ el: process });
  const rail = $('.process-rail');
  const pSteps = $$('.pstep');
  let railTop = 0;
  P.onMeasure = () => { const r = rail.getBoundingClientRect(); railTop = r.top + scrollY; };
  P.progress = (y) => clamp((vh * 0.8 - (railTop - y)) / (vh * 0.42), 0, 1);
  let pLit = -1;
  P.render = (rp) => {
    if (getComputedStyle(rail).display === 'none') return;
    setVar(rail, '--rp', rp);
    const lit = rp >= 0.98 ? 3 : rp >= 0.5 ? 2 : rp > 0.02 ? 1 : 0;
    if (lit !== pLit) { pLit = lit; pSteps.forEach((s, i) => s.classList.toggle('lit', i < lit)); }
  };
  // on one-column layouts each step lights as it reaches the middle of the screen
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    if (getComputedStyle(rail).display !== 'none') return;
    e.target.classList.toggle('lit', e.isIntersecting || e.boundingClientRect.top < 0);
  }), { rootMargin: '0px 0px -45% 0px' });
  pSteps.forEach((s) => pio.observe(s));

  /* ------------------------------------------------------------------ spine + header */
  const spine = $('.spine');
  const spFill = $('.spine-fill');
  const spTc = $('.spine-tc .tc');
  const spSc = $('.spine-tc .sc');
  const head = $('#site-head');
  let docH = 1, lastTcAt = 0, lastTc = '', headSolid = null;
  const S = scene({ el: D.body });
  S.live = true;
  S.onMeasure = () => { docH = Math.max(1, D.documentElement.scrollHeight - vh); };
  S.progress = (y) => clamp(y / docH, 0, 1);
  S.render = (sp, now) => {
    setVar(spFill, '--sp', sp, 0.002);
    const fr = Math.round(scrollY / 6);
    const tc = '00:' + String(Math.floor(fr / 1440) % 60).padStart(2, '0') + ':' + String(Math.floor(fr / 24) % 60).padStart(2, '0') + ':' + String(fr % 24).padStart(2, '0');
    if (tc !== lastTc && now - lastTcAt > 100) { lastTc = tc; lastTcAt = now; spTc.textContent = tc; } else if (tc !== lastTc) S.dirty = true;
    const solidAt = heroMode === 'static' ? 40 : H.top + H.range - 60;
    const solid = scrollY > solidAt;
    if (solid !== headSolid) { headSolid = solid; head.classList.toggle('solid', solid); }
  };
  S.animating = () => S.dirty;
  const sceneIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { const n = String(e.target.dataset.scene).padStart(2, '0'); spSc.textContent = 'SC ' + n; }
  }), { rootMargin: '-50% 0px -50% 0px' });
  $$('[data-scene]').forEach((s) => sceneIO.observe(s));

  // nav: mark the section in view
  const navLinks = $$('.nav-list a');
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['worlds', 'work', 'minds', 'next', 'contact', 'idea', 'vision', 'process', 'top'].forEach((id) => { const el = D.getElementById(id); if (el) navIO.observe(el); });

  /* ------------------------------------------------------------------ entrances */
  const revealIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); setTimeout(() => e.target.classList.add('done'), 2400); }
  }), { threshold: 0.12 });
  $$('.reveal, .m-lines').forEach((el) => revealIO.observe(el));

  /* ------------------------------------------------------------------ work media */
  const workVideos = $$('.proj-video');
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !reduced) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); }
    else v.pause();
  }), { threshold: 0.35 });
  workVideos.forEach((v) => vio.observe(v));

  /* ------------------------------------------------------------------ viewer dialog */
  const viewer = $('#viewer');
  const vBody = $('.viewer-body', viewer);
  const vTitle = $('#viewer-t');
  let opener = null;
  const GALLERY = ['look-night', 'look-falls', 'look-car', 'look-gate', 'flat-navy', 'flat-sky', 'macro', 'hoods', 'faces-itay', 'turn-itay'];
  function openViewer(kind, btn) {
    opener = btn;
    vBody.textContent = '';
    const vid = (src, poster, cls) => { const v = D.createElement('video'); v.src = src; v.poster = poster; v.controls = true; v.playsInline = true; v.muted = true; v.loop = true; v.preload = 'metadata'; if (cls) v.className = cls; return v; };
    const note = (t) => { const p = D.createElement('p'); p.className = 'viewer-note'; p.textContent = t; return p; };
    if (kind === 'series') {
      vTitle.textContent = 'דור העתיד';
      vBody.append(vid(MEDIA + 'reel.mp4', MEDIA + 'reel-poster.jpg', 'v-vertical'), note('רגעים מתוך הסדרה. יובל ואיתי הם דמויות שיצרנו, לא ילדים אמיתיים.'));
    } else if (kind === 'merch') {
      vTitle.textContent = 'אתר המרצ׳ של דור העתיד';
      const g = D.createElement('div'); g.className = 'viewer-gallery';
      GALLERY.forEach((n) => { const i = D.createElement('img'); i.src = MEDIA + 'merch/' + n + '.webp'; i.alt = ''; i.loading = 'lazy'; g.appendChild(i); });
      vBody.append(vid(MEDIA + 'site-capture.mp4', MEDIA + 'site-poster.jpg'), note('גלילה באתר, ותמונות מוצר מתוך הפרויקט.'), g);
    } else {
      vTitle.textContent = 'הסרט שפותח את האתר';
      vBody.append(vid(MEDIA + 'hero-scrub.mp4', MEDIA + 'hero-poster.jpg'), note('הסרט מהפתיח, מההתחלה ועד הסוף, בלי גלילה.'));
    }
    if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
    const v = $('video', vBody); if (v && !reduced) v.play().catch(() => {});
  }
  function closeViewer() {
    $$('video', vBody).forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    if (viewer.open) { if (typeof viewer.close === 'function') viewer.close(); else viewer.removeAttribute('open'); }
  }
  viewer.addEventListener('close', () => { $$('video', vBody).forEach((v) => v.pause()); if (opener) opener.focus(); });
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.closest('[data-close]')) closeViewer(); });
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openViewer(b.dataset.open, b)));

  /* ------------------------------------------------------------------ SC 08 the hold */
  const mystery = $('.mystery');
  const peekBtn = $('.peek-btn');
  const peekOut = $('#peek-out');
  const peekLabel = $('.peek-label');
  let hold = 0, holding = false, holdRaf = 0, holdLast = 0, peekTimer = 0;
  function holdTick(now) {
    const dt = Math.min(64, now - (holdLast || now)); holdLast = now;
    hold = clamp(hold + (holding ? dt / 1700 : -dt / 900), 0, 1);
    mystery.style.setProperty('--hold', hold.toFixed(4));
    if (hold >= 1) { completePeek(); holding = false; }
    if (holding || hold > 0) holdRaf = requestAnimationFrame(holdTick); else { holdRaf = 0; holdLast = 0; }
  }
  function startHold() { if (reduced) { completePeek(); return; } holding = true; if (!holdRaf) holdRaf = requestAnimationFrame(holdTick); }
  function endHold() { holding = false; }
  function completePeek() {
    mystery.classList.remove('peeked'); void mystery.offsetWidth; mystery.classList.add('peeked');
    peekOut.textContent = 'עוד לא.';
    peekOut.classList.add('on');
    peekLabel.textContent = 'החזיקו שוב';
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { peekOut.classList.remove('on'); peekLabel.textContent = 'החזיקו כדי להציץ'; }, 5200);
    hold = 0.999; holding = false;
  }
  peekBtn.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; peekBtn.setPointerCapture && peekBtn.setPointerCapture(e.pointerId); startHold(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => peekBtn.addEventListener(t, endHold));
  peekBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  peekBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') endHold(); });
  peekBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  peekBtn.addEventListener('click', (e) => { if (reduced) { e.preventDefault(); completePeek(); } });

  /* ------------------------------------------------------------------ forms */
  const MSG = {
    required: 'שדה חובה',
    email: 'כתובת המייל לא נראית תקינה. כדאי לבדוק שוב.',
    contact: 'כדאי לבדוק את המייל או את מספר הטלפון.',
    consent: 'כדי להצטרף לרשימה צריך לסמן את האישור.',
    sending: 'שולחים…',
    notifyOk: 'אתם ברשימה. נכתוב לכם כשהאור יידלק.',
    notifyErr: 'משהו השתבש בדרך. נסו שוב בעוד רגע.',
    inquiryOk: 'קיבלנו. נקרא, נדמיין קצת ונחזור אליכם.',
    inquiryErr: 'ההודעה לא נשלחה. נסו שוב, או כתבו לנו ישירות במייל.',
    inquiryErrNoMail: 'ההודעה לא נשלחה. נסו שוב בעוד רגע.'
  };
  const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  const PHONE_RE = /^\+?[0-9][0-9\s\-().]{7,18}$/;
  const formT0 = performance.now();

  let storeP = null;
  function previewStore() {
    if (storeP) return storeP;
    storeP = (async () => {
      try {
        if (!window.claude || typeof window.claude.use !== 'function') return null;
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return null;
        const id = await user.id();
        if (!id) return null;
        // One document per visitor (leads/<their id>), readable only by them and the owner. Entries are appended.
        const ref = db.doc('leads/' + id);
        let chain = Promise.resolve();
        return {
          save(kind, data) {
            const run = chain.then(async () => {
              const snap = await ref.get();
              const prev = snap.exists && Array.isArray((snap.data() || {}).entries) ? snap.data().entries : [];
              const entry = Object.assign({ kind, at: new Date().toISOString() }, data);
              delete entry.website;
              await ref.set({ entries: prev.concat([entry]).slice(-200), updatedAt: entry.at });
              return { ok: true };
            });
            chain = run.catch(() => {});
            return run;
          }
        };
      } catch (e) { return null; }
    })();
    return storeP;
  }
  async function submitLead(kind, data) {
    const mode = (CFG.forms && CFG.forms.mode) || 'auto';
    const inViewer = !!(window.claude && typeof window.claude.use === 'function');
    if (mode === 'preview' || (mode === 'auto' && inViewer)) {
      const store = await previewStore();
      if (store) return store.save(kind, data);
      if (mode === 'preview') throw new Error('preview store unavailable');
    }
    const ep = CFG.forms && CFG.forms.endpoint;
    if (!ep) throw new Error('no endpoint');
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ kind }, data)), signal: ctrl.signal, credentials: 'same-origin' });
      let body = null; try { body = await res.json(); } catch (e) { /* not JSON: treat as failure */ }
      if (!res.ok || !body || body.ok !== true) throw new Error('rejected ' + res.status + ' ' + (body && body.error));
      return body;
    } finally { clearTimeout(t); }
  }

  function fieldError(input, msg) {
    const field = input.closest('.field');
    let err = field && $('.field-err', field);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (field && !err) { err = D.createElement('span'); err.className = 'field-err'; err.id = input.id + '-err'; field.appendChild(err); }
      if (err) { err.textContent = msg; input.setAttribute('aria-describedby', err.id); }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) err.remove();
      input.removeAttribute('aria-describedby');
    }
  }

  $$('form.lead').forEach((form) => {
    const kind = form.dataset.kind;
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    const label = btn && $('.btn-label', btn);
    const labelText = label ? label.textContent : '';
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) fieldError(e.target, ''); });
    form.addEventListener('change', (e) => { if (e.target.type === 'checkbox') e.target.closest('.consent').classList.remove('invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.classList.contains('busy')) return;
      status.className = 'form-status'; status.textContent = '';
      let bad = null;
      const data = {};
      const hp = $('input[name="website"]', form);
      if (kind === 'notify') {
        const email = $('input[name="email"]', form), consent = $('input[name="consent"]', form);
        const v = email.value.trim();
        if (!v) { fieldError(email, MSG.required); bad = bad || email; }
        else if (!EMAIL_RE.test(v)) { fieldError(email, MSG.email); bad = bad || email; }
        if (!consent.checked) { consent.closest('.consent').classList.add('invalid'); if (!bad) { status.className = 'form-status err'; status.textContent = MSG.consent; } bad = bad || consent; }
        data.email = v; data.consent = consent.checked;
        data.consentText = consent.closest('.consent').textContent.trim();
        data.source = form.id === 'notify-form' ? 'next-frame' : 'final';
      } else {
        const name = $('input[name="name"]', form), contact = $('input[name="contact"]', form), msg = $('textarea[name="message"]', form);
        const nv = name.value.trim(), cv = contact.value.trim(), mv = msg.value.trim();
        if (!nv) { fieldError(name, MSG.required); bad = bad || name; }
        if (!cv) { fieldError(contact, MSG.required); bad = bad || contact; }
        else if (!(EMAIL_RE.test(cv) || (PHONE_RE.test(cv) && cv.replace(/\D/g, '').length >= 9))) { fieldError(contact, MSG.contact); bad = bad || contact; }
        if (!mv) { fieldError(msg, MSG.required); bad = bad || msg; }
        data.name = nv; data.contact = cv; data.message = mv;
      }
      if (bad) { bad.focus(); return; }
      data.website = hp ? hp.value : '';
      data.elapsed = Math.round(performance.now() - formT0);
      data.page = location.pathname;
      form.classList.add('busy'); btn.disabled = true;
      if (label) label.textContent = MSG.sending;
      try {
        await submitLead(kind, data);
        status.className = 'form-status ok';
        status.textContent = kind === 'notify' ? MSG.notifyOk : MSG.inquiryOk;
        form.classList.add('sent');
        form.reset();
      } catch (err) {
        status.className = 'form-status err';
        const hasMail = !!((CFG.contact && CFG.contact.email) || '').trim();
        status.textContent = kind === 'notify' ? MSG.notifyErr : (hasMail ? MSG.inquiryErr : MSG.inquiryErrNoMail);
      } finally {
        form.classList.remove('busy'); btn.disabled = false;
        if (label) label.textContent = labelText;
      }
    });
  });

  /* ------------------------------------------------------------------ navigation */
  const menuBtn = $('.menu-btn');
  const sheet = $('#menu-sheet');
  const mainEl = $('#main'), footEl = $('.site-foot');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    sheet.classList.toggle('open', open);
    [mainEl, footEl].forEach((el) => el.toggleAttribute('inert', open));
    D.body.style.overflow = open ? 'hidden' : '';
    if (open) { const a = $('a', sheet); if (a) a.focus(); } else menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  D.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) setMenu(false); });

  D.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? D.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    if (!sheet.hidden) setMenu(false);
    const headH = head.offsetHeight;
    let y = id === 'top' || !target ? 0 : target.getBoundingClientRect().top + scrollY;
    if (target && target !== hero && !target.matches('.xform, .minds')) y -= headH * 0.6;
    if (target && target.matches('.xform, .minds')) y += 2;
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
    const focusEl = target && (target.matches('main, section') ? target : null);
    if (focusEl) { if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1'); setTimeout(() => focusEl.focus({ preventScroll: true }), reduced ? 0 : 700); }
    if (history.replaceState && id) history.replaceState(null, '', '#' + id);
  });

  /* ------------------------------------------------------------------ reduced motion, live in both directions */
  function pinToFinalStates() {
    xformStill();
    [M, X, V, P].forEach((s) => { s.on = false; s.live = false; });
    sideVideos.forEach((v) => v.pause());
    workVideos.forEach((v) => v.pause());
    $$('.reveal, .m-lines').forEach((el) => el.classList.add('in', 'done'));
    pSteps.forEach((s) => s.classList.add('lit'));
    xfSteps.forEach((s) => s.classList.add('on'));
    hold = 0; holding = false; mystery.style.setProperty('--hold', '0');
  }
  function unpinFinalStates() {
    [M, X, V, P].forEach((s) => { s.on = true; s.drawn = -1; s.dirty = true; near.unobserve(s.el); near.observe(s.el); });
    xState = -1; pLit = -1;
    xfSteps.forEach((s) => s.classList.remove('on'));
    measureSoon();
  }
  const onMQ = (m, fn) => (m.addEventListener ? m.addEventListener('change', fn) : m.addListener(fn));
  onMQ(MQ.reduce, (e) => {
    reduced = e.matches;
    root.classList.toggle('rm', reduced);
    applyHeroMode();
    if (reduced) pinToFinalStates(); else unpinFinalStates();
  });
  [MQ.phone, MQ.portraitTablet, MQ.coarsePortrait, MQ.landscapePhone].forEach((m) => onMQ(m, applyHeroMode));

  /* ------------------------------------------------------------------ boot */
  let measureT = 0;
  function measureSoon() { clearTimeout(measureT); measureT = setTimeout(() => { if (heroMode === 'frames') sizeCanvas(); measure(); }, 80); }

  applyConfig();
  $$('.split').forEach((el, i) => splitHeadline(el, 7 + i * 13));
  splitVision();
  applyHeroMode();
  scenes.forEach((s) => { if (s !== S) near.observe(s.el); });
  if (reduced) pinToFinalStates();

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measureSoon);
  addEventListener('orientationchange', measureSoon);
  addEventListener('load', measureSoon);
  if ('ResizeObserver' in window) new ResizeObserver(measureSoon).observe(D.body);
  D.addEventListener('visibilitychange', () => {
    D.body.classList.toggle('paused', D.hidden);
    if (D.hidden) [...sideVideos, ...workVideos].forEach((v) => v.pause());
  });

  const afterFonts = () => { $$('.fx-focus').forEach(measureFocus); measure(); };
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(afterFonts); else setTimeout(afterFonts, 300);
  measure();
  initWorlds();

  // band one opens settled: a one-time ramp on load that hands over to scroll
  if (reduced) loadK = 1;
  else {
    const t0 = performance.now() + 250;
    const ramp = (now) => {
      loadK = easeOut(clamp((now - t0) / 1500, 0, 1));
      H.dirty = true; requestTick();
      if (loadK < 1) requestAnimationFrame(ramp);
    };
    requestAnimationFrame(ramp);
  }
})();
