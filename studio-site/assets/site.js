/* OUTFRAME site engine. Plain JS, no build step.
   One scroll listener sets targets; one rAF loop eases every scene toward its target and rests when converged. */
window.__ofReady = 1;
(() => {
  'use strict';

  const CFG = window.SITE_CONFIG || {};
  const D = document, root = D.documentElement;
  const $ = (s, c = D) => c.querySelector(s);
  const $$ = (s, c = D) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const MEDIA = 'assets/media/';
  const WORDS = /[ \t\n\r]+/;   // split on real spaces only, so &nbsp; keeps phrases together
  root.classList.add('js');
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* ignore */ }

  /* ------------------------------------------------------------------ gates */
  // Same conditions as the head script. Phones and portrait tablets get the portrait frame sequence;
  // landscape phones, reduced motion and data saver get the composed still.
  const Q = {
    phone: '(max-width: 720px)',
    portraitTablet: '(orientation: portrait) and (max-width: 1024px)',
    coarsePortrait: '(orientation: portrait) and (pointer: coarse)',
    landscapePhone: '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    reduce: '(prefers-reduced-motion: reduce)',
    wide: '(min-width: 901px)'
  };
  const MQ = {}; for (const k in Q) MQ[k] = matchMedia(Q[k]);
  const onMQ = (m, fn) => (m.addEventListener ? m.addEventListener('change', fn) : m.addListener(fn));
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let reduced = MQ.reduce.matches;
  const heroModeNow = () => (MQ.reduce.matches || saveData || MQ.landscapePhone.matches) ? 'static'
    : (MQ.phone.matches || MQ.portraitTablet.matches || MQ.coarsePortrait.matches) ? 'frames' : 'video';
  const unpinNow = () => reduced || MQ.landscapePhone.matches;
  const isPortraitSet = () => MQ.phone.matches || (innerHeight > innerWidth * 1.05);
  root.classList.toggle('rm', reduced);
  // the header's stop-motion button: pauses every looping video and the ambient motion, for this visit
  let motionOff = false;
  try { motionOff = sessionStorage.getItem('of-still') === '1'; } catch (e) { /* storage blocked */ }
  root.classList.toggle('still', motionOff);

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

    const srNames = [];
    (CFG.founders || []).forEach((f, i) => {
      if (!f) return;
      const name = (f.name || '').trim(), role = (f.role || '').trim(), photo = (f.photo || '').trim();
      const n = $(`[data-founder="${i}"]`), r = $(`[data-founder-role="${i}"]`);
      if (n && name) n.textContent = name;
      if (r && role) r.textContent = role;
      if (name) srNames.push(role ? name + ', ' + role : name);
      if (photo) {
        const side = $$('.side')[i];
        const img = side && $('.side-photo', side);
        if (img) { img.src = photo; img.alt = ''; img.hidden = false; }
      }
    });
    const sr = $('[data-founders-sr]');
    if (sr && srNames.length) sr.textContent = srNames.join(' · ');

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
    const words = text.split(WORDS);
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
      const words = p.textContent.trim().split(WORDS);
      p.textContent = '';
      p.style.setProperty('--n', String(words.length));
      words.forEach((w, i) => {
        const s = D.createElement('span'); s.className = 'vw'; s.textContent = w;
        s.style.setProperty('--i', String(i));
        p.appendChild(s); if (i < words.length - 1) p.appendChild(D.createTextNode(' '));
      });
    });
    // the reason lights in the beam's colour
    $$('.vline-last .vw').slice(3).forEach((w) => w.classList.add('em'));
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
  let anchor = null, secs = [], measureT = 0;
  function onScroll() {
    const y = scrollY;
    for (const s of scenes) if (s.live) s.target = s.progress(y);
    // while a re-measure is pending (rotation, mode switch) the page height is stale: keep the old anchor
    if (!measureT) for (const s of secs) if (y < s.top + s.h) { anchor = { s, f: (y - s.top) / Math.max(1, s.h) }; break; }
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
    secs = $$('main > section, .site-foot').map((el) => ({ el, top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight }));
    onScroll();
  }
  const pinned = (s) => (y) => clamp((y - s.top) / s.range, 0, 1);

  // A jump link scrolls through scenes the visitor never asked to see: do not start their media on the way.
  let jumpUntil = 0;
  const jumping = () => performance.now() < jumpUntil;
  if ('onscrollend' in window) addEventListener('scrollend', () => { jumpUntil = 0; });
  const wakeSoon = (s) => { const go = () => { if (!s.live) return; if (jumping()) { setTimeout(go, 250); return; } s.wake(); }; go(); };

  // Each scene only works while it is near the screen.
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const s = scenes.find((x) => x.el === e.target);
      if (!s) continue;
      const was = s.live;
      s.live = e.isIntersecting && s.on;
      if (s.live && !was) { s.target = s.progress(scrollY); s.shown = s.target; s.dirty = true; if (s.wake) wakeSoon(s); requestTick(); }
      if (!s.live && was && s.sleep) s.sleep();
    }
  }, { rootMargin: '60% 0px 60% 0px' });

  const vars = new WeakMap();
  function setVar(el, name, v, eps = 0.004) {
    let m = vars.get(el); if (!m) vars.set(el, m = {});
    if (m[name] === v) return;
    if (m[name] !== undefined && Math.abs(m[name] - v) < eps && v !== 0 && v !== 1) return;
    m[name] = v; el.style.setProperty(name, (+v).toFixed(4));
  }
  function setOpacity(el, v) {
    let m = vars.get(el); if (!m) vars.set(el, m = {});
    if (m.op === v) return;
    if (m.op !== undefined && Math.abs(m.op - v) < 0.004 && v !== 0 && v !== 1) return;
    m.op = v; el.style.opacity = v.toFixed(3);
  }

  /* ------------------------------------------------------------------ SC 01 hero */
  const hero = $('.hero');
  const stage = $('.hero-stage');
  const still = $('.hero-still');
  const video = $('.hero-video');
  const canvas = $('.hero-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const cue = $('.cue');
  const ring = $('.cue .ring');
  const FPS = 24;
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

  let heroMode = null, videoFailed = false, framesFailed = false, cueGone = null, stillMode = '', heroReady = false;
  const H = scene({ el: hero, pin: stage, k: 0.16 });
  H.progress = pinned(H);
  H.render = (p) => {
    if (heroMode === 'static') return;
    const f = frameAt(p);
    if (heroMode === 'video' && !videoFailed) requestSeek((Math.min(133, f) + 0.5) / FPS);
    if (heroMode === 'frames' && !framesFailed) drawHeroFrame(mobileIndex(f));
    if (heroMode === 'video' || videoFailed || framesFailed) setStillFor(p);
    updateBands(p);
    const gone = p > 0.03;
    if (gone !== cueGone) { cueGone = gone; cue.classList.toggle('gone', gone); }
  };
  function setStillFor(p) {
    // In frames mode the canvas draws frame 00 almost at once (preloaded in the head), so the still is only a fallback.
    const portrait = heroMode === 'frames';
    const want = (p > 0.5 ? 'end' : 'poster') + (portrait ? '-m' : '');
    if (want === stillMode) return;
    stillMode = want;
    still.src = MEDIA + 'hero-' + want + '.jpg';
  }

  // --- video path: streamed Blob with an honest ring, gated seeks
  let seekBusy = false, pendingTime = null, videoStarted = false, heroBlobUrl = '';
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
  video.addEventListener('error', () => { seekBusy = false; pendingTime = null; failHero('video'); });

  function initVideo() {
    if (videoStarted) return; videoStarted = true;
    stillMode = ''; setStillFor(H.shown);
    let started = false;
    const start = () => { if (started) return; started = true; loadHeroBlob().catch(() => failHero('video')); };
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
    heroBlobUrl = URL.createObjectURL(new Blob(chunks, { type: res.headers.get('Content-Type') || 'video/mp4' }));
    // WebKit honours preload="none" strictly: switch it, listen first, then kick the pipeline once.
    video.preload = 'auto';
    video.addEventListener('loadeddata', () => {
      if (heroMode !== 'video') return;
      if (videoFailed) { videoFailed = false; hero.classList.remove('media-failed'); }
      video.pause();
      heroReady = true;
      hero.classList.add('video-ready');
      cue.classList.add('loaded');
      requestSeek((frameAt(H.shown) + 0.5) / FPS);
      H.dirty = true; requestTick();
    }, { once: true });
    video.src = heroBlobUrl;
    video.load();
    const pp = video.play(); if (pp && pp.then) pp.then(() => video.pause(), () => {});
    setTimeout(() => { if (!heroReady && heroMode === 'video' && !videoFailed) failHero('video'); }, 6000);
  }
  function failHero(src) {
    if (src === 'video') { if (videoFailed) return; videoFailed = true; } else { if (framesFailed) return; framesFailed = true; }
    if (src !== heroMode) return;
    hero.classList.add('media-failed');
    cue.classList.add('loaded');
    stillMode = ''; setStillFor(H.shown);
  }

  // --- frames path: a portrait image sequence on a canvas, loaded coarse to fine, blended between neighbours
  const FR_N = 68;
  const frames = new Array(FR_N); const frameOk = new Uint8Array(FR_N);
  let framesStarted = false, lastDrawn = -1, cw = 0, ch = 0, curFi = 0;
  function initFrames() {
    if (framesStarted) { sizeCanvas(); return; }
    framesStarted = true;
    sizeCanvas();
    // only if frame 00 is very late does the poster stand in
    setTimeout(() => { if (!heroReady && heroMode === 'frames') { stillMode = ''; setStillFor(H.shown); } }, 4500);
    const order = []; const seen = new Set();
    const push = (i) => { if (i >= 0 && i < FR_N && !seen.has(i)) { seen.add(i); order.push(i); } };
    push(0); push(FR_N - 1);
    [16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < FR_N; i += step) push(i); });
    let next = 0, inflight = 0, fails = 0, retry0 = false;
    const pump = () => {
      while (inflight < 6 && next < order.length) {
        const i = order[next++]; inflight++;
        const img = new Image();
        img.src = MEDIA + 'herom/' + String(i).padStart(2, '0') + '.webp';
        const ok = () => {
          inflight--; frames[i] = img; frameOk[i] = 1;
          if (i === 0 && heroMode === 'frames') { heroReady = true; hero.classList.add('frames-ready'); cue.classList.add('loaded'); }
          if (Math.abs(i - curFi) < 3 || i === 0) { lastDrawn = -1; H.dirty = true; requestTick(); }
          pump();
        };
        const bad = () => {
          inflight--;
          if (i === 0 && !retry0) { retry0 = true; setTimeout(() => { order.splice(next, 0, 0); pump(); }, 700); }
          else if (i === 0 && !heroReady) failHero('frames');
          else if (++fails > 6 && !heroReady) failHero('frames');
          pump();
        };
        (img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(ok, bad);
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
  function drawCover(c, img, w, h, alpha) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(w / iw, h / ih);
    const dw = iw * s, dh = ih * s;
    c.globalAlpha = alpha;
    c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  function drawHeroFrame(fi) {
    curFi = fi;
    if (Math.abs(fi - lastDrawn) < 0.004) return;
    const i0 = Math.floor(fi); let t = fi - i0;
    let a = frameOk[i0] ? i0 : nearestLoaded(i0, -1);
    if (a < 0) a = nearestLoaded(i0, 1);
    if (a < 0) return;
    const b = Math.min(FR_N - 1, i0 + 1);
    if (a !== i0) t = 0;
    drawCover(ctx, frames[a], cw, ch, 1);
    if (t > 0.02 && frameOk[b] && b !== a) drawCover(ctx, frames[b], cw, ch, t);
    ctx.globalAlpha = 1;
    lastDrawn = fi;
  }

  // --- mode switching, decided live
  function applyHeroMode() {
    const mode = heroModeNow();
    const unpin = unpinNow();
    if (root.classList.contains('unpin') !== unpin) setUnpinned(unpin);
    if (mode === heroMode) return;
    heroMode = mode;
    root.setAttribute('data-hero', mode);
    hero.classList.remove('video-ready', 'frames-ready', 'media-failed');
    heroReady = false;
    if (mode === 'video') {
      if (videoStarted && video.readyState >= 2 && !videoFailed) { heroReady = true; hero.classList.add('video-ready'); }
      if (videoFailed) hero.classList.add('media-failed');
      stillMode = ''; setStillFor(H.shown);
      initVideo();
    } else if (mode === 'frames') {
      if (framesStarted && frameOk[0]) { heroReady = true; hero.classList.add('frames-ready'); }
      if (framesFailed) { hero.classList.add('media-failed'); stillMode = ''; setStillFor(H.shown); } else { still.removeAttribute('src'); stillMode = ''; }
      initFrames();
    } else { stillMode = ''; still.src = MEDIA + (isPortraitSet() ? 'hero-end-m.jpg' : 'hero-end.jpg'); }
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
  const head = $('#site-head');
  const XN = 32;
  let xSet = '', xImgs = [], xOk = new Uint8Array(XN), xStarted = false, xCover = 1.6, xw = 0, xh = 0, xGen = 0;
  const X = scene({ el: xf, pin: xfPin, k: 0.14 });
  X.progress = pinned(X);
  X.wake = () => loadXform();
  X.sleep = () => setOverMedia(false);
  const xformSet = () => (MQ.phone.matches ? 'm' : 'd');
  function loadXform() {
    const set = xformSet();
    if (xStarted && set === xSet) return;
    xStarted = true; xSet = set; xImgs = new Array(XN); xOk = new Uint8Array(XN);
    const gen = ++xGen;
    const order = [0, 31, 16, 8, 24, 4, 12, 20, 28]; for (let i = 0; i < XN; i++) if (!order.includes(i)) order.push(i);
    let n = 0, inflight = 0;
    const pump = () => {
      if (gen !== xGen) return;
      while (inflight < 4 && n < order.length) {
        const i = order[n++]; inflight++;
        const img = new Image();
        img.src = MEDIA + 'idea/' + set + String(i).padStart(2, '0') + '.webp';
        (img.decode ? img.decode() : new Promise((r, j) => { img.onload = r; img.onerror = j; })).then(() => {
          inflight--; if (gen !== xGen) return;
          xImgs[i] = img; xOk[i] = 1; X.dirty = true; requestTick(); pump();
        }, () => { inflight--; pump(); });
      }
    };
    pump();
  }
  X.onMeasure = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const fw = xfFrame.offsetWidth, fh = xfFrame.offsetHeight;
    if (!fw || !fh) return;
    const pr = xfPin.getBoundingClientRect(), fr = xfFrame.getBoundingClientRect();
    const cy = (fr.top + fr.bottom) / 2 - pr.top, pinH = xfPin.offsetHeight;
    xCover = Math.max(innerWidth / fw, 2 * Math.max(cy, pinH - cy) / fh) * 1.04;
    // the bitmap is sized for the full-bleed end state, so the world is sharp when it fills the screen
    const k = Math.min(xCover * dpr, 2560 / fw);
    const w = Math.round(fw * k), h = Math.round(fh * k);
    if (w !== xw || h !== xh) { xfCanvas.width = xw = w; xfCanvas.height = xh = h; paper = null; X.dirty = true; }
    if (xStarted && xformSet() !== xSet) loadXform();
  };
  function xNearest(i) { for (let d = 0; d < XN; d++) { if (i - d >= 0 && xOk[i - d]) return i - d; if (i + d < XN && xOk[i + d]) return i + d; } return -1; }

  // --- the storyboard: drawn by hand (strokes generated once, seeded), revealed stroke by stroke by scroll
  let paper = null;
  const SK = buildSketch();
  function buildSketch() {
    const r = rng(23);
    const J = (a) => (r() - 0.5) * a;
    const strokes = [];
    const add = (pts, w = 1, a = 0.85) => strokes.push({ pts, w, a });
    const wob = (x0, y0, x1, y1, n, amp) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([x0 + (x1 - x0) * t + J(amp * 0.4), y0 + (y1 - y0) * t + J(amp)]); } return p; };
    // the frame line an artist draws first
    add(wob(0.03, 0.05, 0.97, 0.05, 10, 0.004), 0.8, 0.35); add(wob(0.97, 0.05, 0.97, 0.95, 8, 0.002), 0.8, 0.35);
    add(wob(0.97, 0.95, 0.03, 0.95, 10, 0.004), 0.8, 0.35); add(wob(0.03, 0.95, 0.03, 0.05, 8, 0.002), 0.8, 0.35);
    // horizon, twice, and the mountain ridge
    add(wob(0.01, 0.655, 0.99, 0.652, 26, 0.0025), 1.35, 0.92);
    add(wob(0.04, 0.658, 0.96, 0.656, 18, 0.003), 0.8, 0.4);
    const ridge = []; const peaks = [[0.12, 0.02], [0.24, 0.012], [0.4, 0.008], [0.55, 0.006], [0.71, 0.013], [0.86, 0.018]];
    for (let x = 0; x <= 1.0001; x += 0.02) { let v = 0.652; peaks.forEach(([c, h]) => { v -= h * Math.exp(-Math.pow((x - c) / 0.05, 2)); }); ridge.push([x, v + J(0.002)]); }
    add(ridge, 0.9, 0.7);
    // the figure under the red umbrella, and its reflection
    const dome = []; for (let i = 0; i <= 12; i++) { const t = i / 12; dome.push([0.621 + 0.032 * t, 0.613 - 0.013 * Math.sin(Math.PI * t)]); }
    add(dome, 1.4, 0.95);
    add([[0.621, 0.613], [0.629, 0.616], [0.637, 0.613], [0.645, 0.616], [0.653, 0.613]], 1.1, 0.85);
    add([[0.637, 0.614], [0.6372, 0.628]], 1, 0.8);
    add([[0.632, 0.624], [0.6295, 0.66], [0.627, 0.692]], 1.3, 0.95);
    add([[0.643, 0.624], [0.645, 0.66], [0.648, 0.692]], 1.3, 0.95);
    add([[0.626, 0.692], [0.637, 0.695], [0.648, 0.692]], 1.1, 0.9);
    add([[0.633, 0.694], [0.633, 0.703]], 1, 0.85); add([[0.641, 0.694], [0.642, 0.703]], 1, 0.85);
    for (let i = 0; i < 5; i++) { const x = 0.632 + i * 0.0028; add([[x, 0.632 + J(0.004)], [x - 0.001, 0.684 + J(0.006)]], 0.7, 0.45); }
    add(wob(0.615, 0.704, 0.66, 0.704, 4, 0.0015), 0.9, 0.6);
    add([[0.628, 0.71], [0.629, 0.74]], 0.8, 0.35); add([[0.647, 0.71], [0.646, 0.74]], 0.8, 0.35);
    add([[0.632, 0.745], [0.636, 0.752], [0.642, 0.745]], 0.7, 0.3);
    const rdome = []; for (let i = 0; i <= 10; i++) { const t = i / 10; rdome.push([0.622 + 0.03 * t, 0.772 + 0.011 * Math.sin(Math.PI * t)]); }
    add(rdome, 0.8, 0.4);
    // the band of light along the horizon
    add(wob(0.12, 0.586, 0.48, 0.584, 10, 0.003), 0.6, 0.35); add(wob(0.30, 0.601, 0.70, 0.598, 10, 0.003), 0.6, 0.35);
    add(wob(0.05, 0.616, 0.35, 0.614, 8, 0.002), 0.6, 0.3); add(wob(0.55, 0.611, 0.92, 0.609, 8, 0.002), 0.6, 0.3);
    // storm clouds as scalloped contours
    const scallop = (y, x0, x1, n, depth) => { const p = []; const step = (x1 - x0) / n; for (let k = 0; k < n; k++) { const dep = depth * (0.6 + r() * 0.7); for (let i = 0; i <= 6; i++) { const t = i / 6; p.push([x0 + step * (k + t), y - dep * Math.sin(Math.PI * t) + J(0.004)]); } } return p; };
    add(scallop(0.53, 0.0, 1.0, 9, 0.03), 1.1, 0.75);
    add(scallop(0.41, 0.05, 0.95, 7, 0.04), 1.1, 0.72);
    add(scallop(0.26, 0.0, 0.8, 6, 0.045), 1.1, 0.7);
    add(scallop(0.13, 0.3, 1.0, 5, 0.04), 1.0, 0.65);
    // shade under the heavy masses, and the rain on the right
    for (let i = 0; i < 26; i++) { const x = r() * 0.42, y = 0.07 + r() * 0.16; add([[x, y], [x + 0.012, y - 0.022]], 0.7, 0.32); }
    for (let i = 0; i < 18; i++) { const x = 0.55 + r() * 0.44, y = 0.29 + r() * 0.09; add([[x, y], [x + 0.012, y - 0.022]], 0.7, 0.3); }
    for (let i = 0; i < 26; i++) { const x = 0.66 + r() * 0.31, y = 0.44 + J(0.03); add([[x, y], [x - 0.007, y + 0.14 + J(0.03)]], 0.7, 0.42); }
    // the mirror water
    for (let i = 0; i < 34; i++) { const y = 0.68 + Math.pow(r(), 0.8) * 0.26, x = r() * 0.94, l = 0.02 + r() * 0.06 * (y - 0.6) * 3; add(wob(x, y, x + l, y + J(0.002), 3, 0.0015), 0.7, 0.28 + r() * 0.2); }
    const ell = []; for (let i = 0; i <= 20; i++) { const t = (i / 20) * Math.PI * 2; ell.push([0.17 + 0.085 * Math.cos(t) + J(0.004), 0.83 + 0.028 * Math.sin(t) + J(0.003)]); }
    add(ell, 0.7, 0.32);
    // lengths in screen-proportional units, for drawing by progress
    let total = 0;
    strokes.forEach((s) => { let L = 0; for (let i = 1; i < s.pts.length; i++) L += Math.hypot((s.pts[i][0] - s.pts[i - 1][0]) * 16, (s.pts[i][1] - s.pts[i - 1][1]) * 9); s.len = Math.max(L, 0.05); total += s.len; });
    return { strokes, total };
  }
  function paperFor(w, h) {
    const c = D.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#efe9dd'; g.fillRect(0, 0, w, h);
    const tile = D.createElement('canvas'); tile.width = tile.height = 128;
    const tg = tile.getContext('2d'); const id = tg.createImageData(128, 128); const r = rng(5);
    for (let i = 0; i < id.data.length; i += 4) { const v = 120 + r() * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 14; }
    tg.putImageData(id, 0, 0);
    g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, w, h);
    const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(70,58,36,0)'); vg.addColorStop(1, 'rgba(70,58,36,0.12)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
    return c;
  }
  function drawSketch(c, w, h, p, crop, pap) {
    c.globalAlpha = 1;
    c.drawImage(pap, 0, 0, w, h);
    const u0 = crop ? 0.375 : 0, us = crop ? 0.45 : 1;
    const X0 = (u) => ((u - u0) / us) * w, Y0 = (v) => v * h;
    const unit = (crop ? h * 0.8 : w) / 1000;
    let budget = p * SK.total;
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (const s of SK.strokes) {
      if (budget <= 0) break;
      const frac = Math.min(1, budget / s.len); budget -= s.len;
      const pts = s.pts; const n = pts.length;
      const upto = 1 + (n - 1) * frac;
      for (let pass = 0; pass < 2; pass++) {
        c.strokeStyle = 'rgba(46,48,55,' + (pass ? s.a * 0.35 : s.a).toFixed(3) + ')';
        c.lineWidth = Math.max(0.8, s.w * unit * (pass ? 0.6 : 1.15));
        const off = pass ? unit * 0.7 : 0;
        c.beginPath();
        c.moveTo(X0(pts[0][0]) + off, Y0(pts[0][1]) + off * 0.4);
        const last = Math.floor(upto);
        for (let i = 1; i < last && i < n; i++) {
          const j = Math.min(i + 1, n - 1);
          const mx = (pts[i][0] + pts[j][0]) / 2, my = (pts[i][1] + pts[j][1]) / 2;
          c.quadraticCurveTo(X0(pts[i][0]) + off, Y0(pts[i][1]) + off * 0.4, X0(mx) + off, Y0(my) + off * 0.4);
        }
        if (last < n) { const t = upto - last, a = pts[last - 1], b = pts[last]; c.lineTo(X0(a[0] + (b[0] - a[0]) * t) + off, Y0(a[1] + (b[1] - a[1]) * t) + off * 0.4); }
        c.stroke();
      }
    }
    // the storyboard notes arrive last
    const ta = smooth(p, 0.82, 1);
    if (ta > 0) {
      c.globalAlpha = ta * 0.78;
      c.fillStyle = '#2e3037'; c.strokeStyle = '#2e3037';
      const fs = Math.max(10, Math.round(h * 0.034));
      c.font = '400 ' + fs + 'px "IBM Plex Mono", ui-monospace, monospace';
      try { c.direction = 'ltr'; } catch (e) { /* older engines */ }
      c.textAlign = 'left';
      c.fillText('EXT. SALT FLAT · DUSK', w * 0.055, h * 0.915);
      c.textAlign = 'right';
      c.fillText('CRANE UP', w * 0.935, h * 0.36);
      c.lineWidth = Math.max(1, unit * 1.1);
      const ax = w * 0.92; c.beginPath(); c.moveTo(ax, h * 0.31); c.lineTo(ax, h * 0.12); c.moveTo(ax - w * 0.012, h * 0.15); c.lineTo(ax, h * 0.12); c.lineTo(ax + w * 0.012, h * 0.15); c.stroke();
      c.globalAlpha = 1;
    }
  }

  let xState = -1, xLastTc = '', xLastTcAt = 0, overMedia = false;
  function setOverMedia(om) { if (om !== overMedia) { overMedia = om; head.classList.toggle('over-media', om); } }
  X.render = (q, now) => {
    // state edges: idea, frame, motion, world, then the outro line
    const st = q < 0.15 ? 0 : q < 0.30 ? 1 : q < 0.52 ? 2 : 3;
    if (st !== xState) { xState = st; xfSteps.forEach((li, i) => li.classList.toggle('on', i === st)); }
    const draw = smooth(q, 0, 0.13);
    const wipe = smooth(q, 0.15, 0.29);
    const fi = q < 0.30 ? 0 : q < 0.52 ? (q - 0.30) / 0.22 * 23 : 23 + clamp((q - 0.52) / 0.40, 0, 1) * 8;
    const world = smooth(q, 0.52, 0.70);
    const scale = 1 + (xCover - 1) * easeOut(smooth(q, 0.52, 0.74));
    setVar(xfFrame, '--s', scale, 0.0008);
    setVar(xfFrame, '--world', world);
    setVar(xfFrame, '--chrome', 1 - smooth(q, 0.44, 0.52));
    setVar(xfBeam, '--sp', clamp(q / 0.78, 0, 1));
    setOpacity(xfHead, 1 - smooth(q, 0.44, 0.52));
    setOpacity(xfCaption, 1 - smooth(q, 0.78, 0.82));
    setOpacity(xfOutro, smooth(q, 0.82, 0.88));
    setOverMedia(world > 0.5 && q < 0.97);
    if (!xw) return;
    if (wipe < 1) { if (!paper) paper = paperFor(xw, xh); drawSketch(xctx, xw, xh, draw, xSet === 'm', paper); }
    if (wipe > 0) {
      const i0 = Math.floor(fi), t = fi - i0;
      const a = xOk[i0] ? i0 : xNearest(i0);
      if (a >= 0) {
        xctx.save();
        if (wipe < 1) { const half = xw * wipe / 2; xctx.beginPath(); xctx.rect(xw / 2 - half, 0, half * 2, xh); xctx.clip(); }
        drawCover(xctx, xImgs[a], xw, xh, 1);
        const b = Math.min(XN - 1, i0 + 1);
        if (a === i0 && t > 0.02 && xOk[b]) drawCover(xctx, xImgs[b], xw, xh, t);
        xctx.restore();
        if (wipe < 1) {   // the two edges of the reveal are beams of light
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
    const f24 = Math.round(fi * 5);
    const tc = '00:00:' + String(Math.floor(f24 / 24)).padStart(2, '0') + ':' + String(f24 % 24).padStart(2, '0');
    if (tc !== xLastTc && now - xLastTcAt > 100) { xLastTc = tc; xLastTcAt = now; xfTc.textContent = tc; }
  };
  // reduced motion and landscape phones: the finished sketch beside the finished world
  function drawStaticSketch() {
    const c = $('.xform-sketch-canvas'); const fig = c.parentElement;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(fig.clientWidth * dpr), h = Math.round(fig.clientHeight * dpr);
    if (!w || !h) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    drawSketch(c.getContext('2d'), w, h, 1, MQ.phone.matches, paperFor(w, h));
  }

  /* ------------------------------------------------------------------ SC 03 worlds */
  function initWorlds() {
    const items = $$('.world');
    const layers = $$('.wm');
    const media = $('.worlds-media');
    const slit = $('.wm-slit');
    const siteVideo = $('.wm-site video');
    let active = -1, frameVisible = false;
    const playSite = () => {
      if (!siteVideo) return;
      if (active === 2 && frameVisible && !reduced && !motionOff && MQ.wide.matches && !jumping() && !D.hidden && !(viewer && viewer.open)) {
        if (!siteVideo.src) siteVideo.src = siteVideo.dataset.src;
        siteVideo.play().catch(() => {});
      } else siteVideo.pause();
    };
    const activate = (i) => {
      if (i === active) return;
      layers.forEach((l) => l.classList.remove('was'));
      if (active >= 0) layers[active].classList.add('was');
      layers.forEach((l, j) => l.classList.toggle('on', j === i));
      items.forEach((it, j) => it.classList.toggle('on', j === i));
      media.dataset.on = String(i);
      if (!reduced && MQ.wide.matches && active >= 0) { slit.classList.remove('flash'); void slit.offsetWidth; slit.classList.add('flash'); }
      active = i;
      playSite();
    };
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) activate(+e.target.dataset.i); });
    }, { rootMargin: '-46% 0px -46% 0px' });
    items.forEach((it) => io.observe(it));
    activate(0);
    new IntersectionObserver(([e]) => { frameVisible = e.isIntersecting; playSite(); }).observe($('.wm-frame'));
    onMQ(MQ.wide, playSite);
    const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }), { threshold: 0.25 });
    items.forEach((it) => seen.observe(it));
    return { playSite, pause: () => { if (siteVideo) siteVideo.pause(); } };
  }

  /* ------------------------------------------------------------------ SC 04 minds */
  const minds = $('.minds');
  const M = scene({ el: minds, pin: $('.minds-pin'), k: 0.14 });
  M.progress = pinned(M);
  const mindsPin = $('.minds-pin');
  const sideVideos = $$('.side-video');
  M.wake = () => {
    if (reduced || motionOff || D.hidden) return;
    sideVideos.forEach((v, i) => {
      if (!v.src) {
        v.src = MQ.phone.matches && v.dataset.srcM ? v.dataset.srcM : v.dataset.src;
        // the second side runs half a loop behind, so the two lights never move as one mirror image
        if (i === 1) v.addEventListener('loadedmetadata', () => { try { v.currentTime = v.duration / 2; } catch (e) { /* ignore */ } }, { once: true });
      }
      v.play().catch(() => {});
    });
  };
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
      const rel = L.top - y;
      setVar(L.el, '--lit', clamp((vh * 0.82 - rel) / (L.h + vh * 0.22), 0, 1), 0.006);
    }
    setVar(horizon, '--hy', 82 - 60 * V.shown, 0.05);
  };

  /* ------------------------------------------------------------------ SC 07 process rail */
  const process = $('.process');
  const P = scene({ el: process });
  const rail = $('.process-rail');
  const pSteps = $$('.pstep');
  let railTop = 0, railShown = true, nodeAt = [0.02, 0.5, 0.98];
  P.onMeasure = () => {
    const r = rail.getBoundingClientRect(); railTop = r.top + scrollY; railShown = getComputedStyle(rail).display !== 'none';
    if (railShown && r.width) nodeAt = pSteps.map((st) => { const n = $('.pnode', st).getBoundingClientRect(); return clamp((r.right - (n.left + n.width / 2)) / r.width, 0.01, 1); });
  };
  P.progress = (y) => clamp((vh * 0.8 - (railTop - y)) / (vh * 0.42), 0, 1);
  let pLit = -1;
  P.render = (rp) => {
    if (!railShown) return;
    setVar(rail, '--rp', rp);
    const lit = nodeAt.filter((f) => rp >= f + 0.005).length;
    if (lit !== pLit) { pLit = lit; pSteps.forEach((s, i) => s.classList.toggle('lit', i < lit)); }
  };
  // on one-column layouts each step lights as it reaches the middle of the screen
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    if (railShown) return;
    e.target.classList.toggle('lit', e.isIntersecting || e.boundingClientRect.top < 0);
  }), { rootMargin: '0px 0px -45% 0px' });
  pSteps.forEach((s) => pio.observe(s));

  /* ------------------------------------------------------------------ spine + header */
  const spFill = $('.spine-fill');
  const spTc = $('.spine-tc .tc');
  const spSc = $('.spine-tc .sc');
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
    if (!X.live) setOverMedia(false);
  };
  S.animating = () => S.dirty;
  const sceneIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) spSc.textContent = 'SC ' + String(e.target.dataset.scene).padStart(2, '0');
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

  /* ------------------------------------------------------------------ deferred posters and work media */
  const posterIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const v = e.target; if (v.dataset.poster && !v.getAttribute('poster')) v.poster = v.dataset.poster;
    posterIO.unobserve(v);
  }), { rootMargin: '100% 0px' });
  $$('video[data-poster]').forEach((v) => posterIO.observe(v));

  const viewer = $('#viewer');
  const workVideos = $$('.proj-video');
  const wantPlay = new Set();
  const playWork = (v) => { if (reduced || motionOff || D.hidden || jumping() || viewer.open) return; if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); };
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) { wantPlay.add(v); playWork(v); if (jumping()) setTimeout(() => { if (wantPlay.has(v)) playWork(v); }, 1800); }
    else { wantPlay.delete(v); v.pause(); }
  }), { threshold: 0.35 });
  workVideos.forEach((v) => vio.observe(v));

  /* ------------------------------------------------------------------ overlays and history (back closes them) */
  let overlay = null, ignorePop = false;
  function pushOverlay(name) { try { history.pushState({ overlay: name }, ''); overlay = name; } catch (e) { overlay = null; } }
  function popOverlay(name) { if (overlay === name) { overlay = null; ignorePop = true; try { history.back(); } catch (e) { ignorePop = false; } } }
  addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; return; }
    if (!overlay) return;
    const n = overlay; overlay = null;
    if (n === 'viewer' && viewer.open) viewer.close();
    if (n === 'menu' && !sheet.hidden) setMenu(false);
  });

  /* ------------------------------------------------------------------ viewer dialog */
  const vBody = $('.viewer-body', viewer);
  const vTitle = $('#viewer-t');
  let opener = null, worldsCtl = null;
  const GALLERY = ['look-night', 'look-falls', 'look-car', 'faces-itay', 'turn-itay'];
  const GALLERY_ALT = {
    'look-night': 'יובל ואיתי, דמויות AI שיצרנו, בחליפות המרצ׳ ברחוב בלילה',
    'look-falls': 'יובל ואיתי בחליפות המרצ׳ ליד מפל',
    'look-car': 'יובל ואיתי בחליפות המרצ׳ ליד מכונית',
    'faces-itay': 'איתי בכמה הבעות פנים',
    'turn-itay': 'איתי בחליפת המרצ׳ מכל הצדדים'
  };
  function openViewer(kind, btn) {
    opener = btn;
    vBody.textContent = '';
    const vid = (src, poster, cls) => { const v = D.createElement('video'); v.src = src; v.poster = poster; v.controls = true; v.playsInline = true; v.muted = true; v.loop = true; v.preload = 'metadata'; if (cls) v.className = cls; return v; };
    const note = (t) => { const p = D.createElement('p'); p.className = 'viewer-note'; p.textContent = t; return p; };
    if (kind === 'series') {
      vTitle.textContent = 'דור העתיד';
      vBody.append(vid(MEDIA + 'reel.mp4', MEDIA + 'reel-poster.jpg', 'v-vertical'),
        note('שומר נרדם מול המסכים, נסיעה לילית, מכונית שעפה מעל העיר וטיסה אחת מתוחה. יובל ואיתי הם דמויות שיצרנו, לא ילדים אמיתיים. הסרטון בלי קול.'));
    } else if (kind === 'merch') {
      vTitle.textContent = 'אתר המרצ׳ של דור העתיד';
      const g = D.createElement('div'); g.className = 'viewer-gallery';
      GALLERY.forEach((n) => { const i = D.createElement('img'); i.src = MEDIA + 'merch/' + n + '-720.webp'; i.alt = GALLERY_ALT[n] || ''; i.loading = 'lazy'; i.decoding = 'async'; g.appendChild(i); });
      vBody.append(vid(MEDIA + 'site-capture.mp4', MEDIA + 'site-poster.jpg'),
        note('הקלטה של גלילה באתר, ותמונות המוצר שיצרנו בשבילו. יובל ואיתי הם דמויות שיצרנו, לא ילדים אמיתיים.'), g);
    } else {
      vTitle.textContent = 'הסרט שפותח את האתר';
      vBody.append(vid(heroBlobUrl || MEDIA + 'hero-scrub.mp4', MEDIA + 'hero-poster.jpg'),
        note('קו אור בחושך נפתח לדלת, והמצלמה עוברת דרכה אל ים של עננים. הסרט מהפתיח, מההתחלה ועד הסוף, בלי קול ובלי גלילה.'));
    }
    workVideos.forEach((v) => v.pause());
    if (worldsCtl) worldsCtl.pause();
    if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
    root.classList.add('viewer-open');
    pushOverlay('viewer');
    const v = $('video', vBody); if (v && !reduced && !motionOff) v.play().catch(() => {});
  }
  function closeViewer() {
    if (!viewer.open) return;
    if (typeof viewer.close === 'function') viewer.close(); else { viewer.removeAttribute('open'); viewer.dispatchEvent(new Event('close')); }
  }
  // every way of closing (button, Esc, back, backdrop) runs the same clean-up
  viewer.addEventListener('close', () => {
    $$('video', vBody).forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
    root.classList.remove('viewer-open');
    popOverlay('viewer');
    wantPlay.forEach(playWork);
    if (worldsCtl) worldsCtl.playSite();
    if (opener) opener.focus();
  });
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.closest('[data-close]')) closeViewer(); });
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openViewer(b.dataset.open, b)));

  /* ------------------------------------------------------------------ SC 08 the hold */
  const mystery = $('.mystery');
  const peekBtn = $('.peek-btn');
  const peekOut = $('#peek-out');
  const peekLabel = $('.peek-label');
  const PEEK_LABEL = peekLabel.textContent;
  let hold = 0, holding = false, holdRaf = 0, holdLast = 0, peekTimer = 0, holdStart = 0;
  function holdTick(now) {
    const dt = Math.min(64, now - (holdLast || now)); holdLast = now;
    hold = clamp(hold + (holding ? dt / 1700 : -dt / 900), 0, 1);
    mystery.style.setProperty('--hold', hold.toFixed(4));
    if (hold >= 1) { completePeek(); holding = false; }
    if (holding || hold > 0) holdRaf = requestAnimationFrame(holdTick); else { holdRaf = 0; holdLast = 0; }
  }
  function startHold() { if (reduced) { completePeek(); return; } holding = true; holdStart = performance.now(); if (!holdRaf) holdRaf = requestAnimationFrame(holdTick); }
  function endHold() {
    if (!holding) return;
    holding = false;
    if (!reduced && performance.now() - holdStart < 450 && hold < 0.3) {   // a short tap: say how it works
      peekLabel.textContent = 'לחצו והחזיקו';
      clearTimeout(peekTimer);
      peekTimer = setTimeout(() => { peekLabel.textContent = PEEK_LABEL; }, 2200);
    }
  }
  function completePeek() {
    mystery.classList.remove('peeked'); void mystery.offsetWidth; mystery.classList.add('peeked');
    peekOut.textContent = 'עוד לא.';
    peekOut.classList.add('on');
    peekLabel.textContent = 'החזיקו שוב';
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { peekOut.classList.remove('on'); peekLabel.textContent = PEEK_LABEL; }, 5200);
    hold = reduced ? 0 : 0.999; holding = false;
    if (!reduced && !holdRaf) holdRaf = requestAnimationFrame(holdTick);
  }
  peekBtn.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; try { peekBtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } startHold(); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => peekBtn.addEventListener(t, endHold));
  peekBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  peekBtn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') endHold(); });
  peekBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  // screen readers and switch access send one synthetic click (detail 0): they get the answer at once
  peekBtn.addEventListener('click', (e) => { if (e.detail === 0) { e.preventDefault(); if (!holding) completePeek(); } });

  /* ------------------------------------------------------------------ forms */
  const MSG = {
    required: 'שדה חובה',
    email: 'כתובת המייל לא נראית תקינה. כדאי לבדוק שוב.',
    contact: 'המייל או הטלפון לא נראים תקינים. כדאי לבדוק שוב.',
    consent: 'כדי שנוכל לעדכן אתכם, סמנו את תיבת האישור.',
    rate: 'שלחתם כמה פעמים ברצף. נסו שוב בעוד כמה דקות.',
    sending: 'שולחים…',
    notifyOk: 'אתם ברשימה. נכתוב לכם כשהאור יידלק.',
    confirmSent: 'שלחנו אליכם מייל קצר עם קישור לאישור ההרשמה.',
    notifyErr: 'משהו השתבש בדרך. נסו שוב בעוד רגע.',
    inquiryOk: 'קיבלנו. נקרא, נדמיין קצת ונחזור אליכם.',
    inquiryErr: 'ההודעה לא נשלחה. נסו שוב, או כתבו לנו ישירות במייל.',
    inquiryErrNoMail: 'ההודעה לא נשלחה. נסו שוב בעוד רגע.'
  };
  // the same rules the server applies (PHP FILTER_VALIDATE_EMAIL, ASCII domains)
  const EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
  const PHONE_RE = /^\+?[0-9][0-9\s\-().]{7,18}$/;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  async function submitLead(kind, data) {
    const mode = (CFG.forms && CFG.forms.mode) || 'auto';
    // an optional page-provided store (the private preview only); the real site posts to the endpoint
    if (mode !== 'endpoint' && typeof window.SITE_LEAD_STORE === 'function') {
      const store = await window.SITE_LEAD_STORE();
      if (store) return store.save(kind, data);
      if (mode === 'store') throw Object.assign(new Error('store unavailable'), { code: 'store' });
    }
    const ep = CFG.forms && CFG.forms.endpoint;
    if (!ep) throw Object.assign(new Error('no endpoint'), { code: 'config' });
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ kind }, data)), signal: ctrl.signal, credentials: 'same-origin' });
      let body = null; try { body = await res.json(); } catch (e) { /* not JSON: treat as failure */ }
      if (!res.ok || !body || body.ok !== true) throw Object.assign(new Error('rejected ' + res.status), { code: body && body.error });
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
    let t0 = 0;
    form.addEventListener('focusin', () => { if (!t0) t0 = performance.now(); });
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing || !e.target.matches('input[enterkeyhint="next"]')) return;
      e.preventDefault();
      const f = $$('.field input, .field textarea', form);
      const n = f[f.indexOf(e.target) + 1];
      if (n) n.focus();
    });
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) fieldError(e.target, ''); });
    form.addEventListener('change', (e) => { if (e.target.type === 'checkbox') e.target.closest('.consent').classList.remove('invalid'); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.classList.contains('busy')) return;
      if (!t0) t0 = performance.now();
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
        const ct = form.elements.consentText;
        data.consentText = norm(ct ? ct.value : consent.closest('.consent').textContent);
        data.source = ($('input[name="source"]', form) || {}).value || '';
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
      data.page = location.pathname;
      form.classList.add('busy'); btn.disabled = true;
      if (label) label.textContent = MSG.sending;
      try {
        const since = performance.now() - t0;
        if (since < 1600) await sleep(1600 - since);   // the server treats instant posts as bots
        data.elapsed = Math.round(performance.now() - t0);
        const res = await submitLead(kind, data);
        status.className = 'form-status ok';
        status.textContent = kind === 'notify' ? MSG.notifyOk + (res && res.confirm === 'sent' ? ' ' + MSG.confirmSent : '') : MSG.inquiryOk;
        form.classList.add('sent');
        form.reset();
        status.tabIndex = -1; status.focus({ preventScroll: true });
      } catch (err) {
        const code = err && err.code;
        status.className = 'form-status err';
        const hasMail = !!((CFG.contact && CFG.contact.email) || '').trim();
        const generic = kind === 'notify' ? MSG.notifyErr : (hasMail ? MSG.inquiryErr : MSG.inquiryErrNoMail);
        if (code === 'email' || code === 'contact') {
          const f = $(code === 'email' ? 'input[name="email"]' : 'input[name="contact"]', form);
          if (f) { fieldError(f, MSG[code]); f.focus(); }
          status.textContent = '';
        } else if (code === 'consent' && !($('input[name="consent"]', form) || {}).checked) {
          const c = $('.consent', form); if (c) c.classList.add('invalid');
          status.textContent = MSG.consent;
        } else if (code === 'rate') status.textContent = MSG.rate;
        else status.textContent = generic;
      } finally {
        form.classList.remove('busy'); btn.disabled = false;
        if (label) label.textContent = labelText;
      }
    });
  });

  /* ------------------------------------------------------------------ navigation */
  const menuBtn = $('.menu-btn');
  const menuLabel = $('.menu-label', menuBtn);
  const sheet = $('#menu-sheet');
  const mainEl = $('#main'), footEl = $('.site-foot');
  function setMenu(open) {
    const was = !sheet.hidden;
    if (was === open) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'סגירה' : 'תפריט';
    sheet.hidden = !open;
    sheet.classList.toggle('open', open);
    [mainEl, footEl].forEach((el) => el.toggleAttribute('inert', open));
    root.classList.toggle('menu-open', open);
    if (open) { pushOverlay('menu'); const a = $('a', sheet); if (a) a.focus(); }
    else { popOverlay('menu'); menuBtn.focus({ preventScroll: true }); }
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  onMQ(matchMedia('(max-width: 1000px)'), (e) => { if (!e.matches && !sheet.hidden) setMenu(false); });

  const motionBtn = $('[data-motion]');
  function setStill(on) {
    motionOff = on;
    root.classList.toggle('still', on);
    if (motionBtn) motionBtn.setAttribute('aria-pressed', String(on));
    try { if (on) sessionStorage.setItem('of-still', '1'); else sessionStorage.removeItem('of-still'); } catch (e) { /* storage blocked */ }
    if (on) {
      sideVideos.forEach((v) => v.pause());
      workVideos.forEach((v) => v.pause());
      if (worldsCtl) worldsCtl.pause();
    } else if (!reduced && !D.hidden) {
      if (M.live) M.wake();
      wantPlay.forEach(playWork);
      if (worldsCtl) worldsCtl.playSite();
    }
  }
  if (motionBtn) {
    motionBtn.setAttribute('aria-pressed', String(motionOff));
    motionBtn.addEventListener('click', () => setStill(!motionOff));
  }
  D.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) setMenu(false); });

  D.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? D.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    const fromMenu = !sheet.hidden;
    if (fromMenu) setMenu(false);
    const headH = head.offsetHeight;
    let y = id === 'top' || !target ? 0 : target.getBoundingClientRect().top + scrollY;
    if (target && target !== hero && !target.matches('.xform, .minds')) y -= headH * 0.6;
    if (target && target.matches('.xform, .minds')) y += 2;
    y = Math.max(0, y);
    jumpUntil = performance.now() + Math.min(2500, 600 + Math.abs(y - scrollY) / 8);
    // after a menu close the history step back runs first, so the scroll is not undone by it
    const go = () => window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    if (fromMenu) setTimeout(go, 60); else go();
    const focusEl = target && (target.matches('main, section') ? target : null);
    if (focusEl) { if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1'); setTimeout(() => focusEl.focus({ preventScroll: true }), reduced ? 80 : 900); }
    if (!fromMenu && !overlay && history.replaceState && id) { try { history.replaceState(history.state, '', '#' + id); } catch (err) { /* ignore */ } }
  });

  /* ------------------------------------------------------------------ unpinned layout (reduced motion, landscape phones) */
  function setUnpinned(on) {
    root.classList.toggle('unpin', on);
    if (on) {
      [M, X].forEach((s) => { s.on = false; s.live = false; });
      sideVideos.forEach((v) => v.pause());
      xfSteps.forEach((s) => s.classList.add('on'));
      [xfHead, xfCaption, xfOutro].forEach((el) => { el.style.opacity = ''; vars.delete(el); });
      [xfFrame, mindsPin, xfBeam].forEach((el) => vars.delete(el));
      ['--s', '--world', '--chrome'].forEach((p) => xfFrame.style.removeProperty(p));
      ['--mx', '--seam', '--mm', '--mc'].forEach((p) => mindsPin.style.removeProperty(p));
      setOverMedia(false);
      requestAnimationFrame(drawStaticSketch);
    } else {
      [M, X].forEach((s) => { s.on = true; s.drawn = -1; s.dirty = true; near.unobserve(s.el); near.observe(s.el); });
      xState = -1;
      xfSteps.forEach((s) => s.classList.remove('on'));
    }
    measureSoon();
  }

  /* ------------------------------------------------------------------ reduced motion, live in both directions */
  function pinToFinalStates() {
    [V, P].forEach((s) => { s.on = false; s.live = false; });
    workVideos.forEach((v) => v.pause());
    if (worldsCtl) worldsCtl.pause();
    $$('.reveal, .m-lines').forEach((el) => el.classList.add('in', 'done'));
    pSteps.forEach((s) => s.classList.add('lit'));
    $$('.vline').forEach((el) => { el.style.removeProperty('--lit'); vars.delete(el); });
    hold = 0; holding = false; mystery.style.setProperty('--hold', '0');
  }
  function unpinFinalStates() {
    [V, P].forEach((s) => { s.on = true; s.drawn = -1; s.dirty = true; near.unobserve(s.el); near.observe(s.el); });
    pLit = -1;
    wantPlay.forEach(playWork);
    if (worldsCtl) worldsCtl.playSite();
    measureSoon();
  }
  onMQ(MQ.reduce, (e) => {
    reduced = e.matches;
    root.classList.toggle('rm', reduced);
    if (reduced) pinToFinalStates(); else unpinFinalStates();
    applyHeroMode();
  });
  [MQ.phone, MQ.portraitTablet, MQ.coarsePortrait, MQ.landscapePhone].forEach((m) => onMQ(m, applyHeroMode));

  /* ------------------------------------------------------------------ boot */
  function measureSoon() {
    clearTimeout(measureT);
    measureT = setTimeout(() => {
      measureT = 0;
      const a = anchor, oldH = docH;
      if (heroMode === 'frames') sizeCanvas();
      measure();
      // a rotation or mode switch changes every pinned height: stay on the same part of the same section
      if (a && oldH > 1 && Math.abs(docH - oldH) > vh * 0.5) {
        const r = a.s.el.getBoundingClientRect();
        window.scrollTo(0, Math.max(0, r.top + scrollY + a.f * a.s.el.offsetHeight));
      }
      if (root.classList.contains('unpin')) drawStaticSketch();
    }, 80);
  }

  applyConfig();
  $$('.split').forEach((el, i) => splitHeadline(el, 7 + i * 13));
  splitVision();
  applyHeroMode();
  scenes.forEach((s) => { if (s !== S) near.observe(s.el); });
  if (reduced) pinToFinalStates();
  worldsCtl = initWorlds();

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measureSoon);
  addEventListener('orientationchange', measureSoon);
  addEventListener('load', measureSoon);
  if ('ResizeObserver' in window) new ResizeObserver(measureSoon).observe(D.body);
  D.addEventListener('visibilitychange', () => {
    D.body.classList.toggle('paused', D.hidden);
    if (D.hidden) {
      [...sideVideos, ...workVideos].forEach((v) => v.pause());
      if (worldsCtl) worldsCtl.pause();
      $$('video', vBody).forEach((v) => v.pause());
    } else if (!reduced) {
      if (M.live) M.wake();
      wantPlay.forEach(playWork);
      if (worldsCtl) worldsCtl.playSite();
    }
  });

  const afterFonts = () => { $$('.fx-focus').forEach(measureFocus); paper = null; measure(); if (root.classList.contains('unpin')) drawStaticSketch(); };
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(afterFonts); else setTimeout(afterFonts, 300);
  measure();
  root.classList.add('ready');

  // band one opens settled: a one-time ramp on load that hands over to scroll.
  // If the script arrived late, the headline has already been on screen as plain text, so it stays put.
  if (reduced || performance.now() > 1200) { loadK = 1; H.dirty = true; requestTick(); }
  else {
    const t0 = performance.now() + 150;
    const ramp = (now) => {
      loadK = easeOut(clamp((now - t0) / 1300, 0, 1));
      H.dirty = true; requestTick();
      if (loadK < 1) requestAnimationFrame(ramp);
    };
    requestAnimationFrame(ramp);
  }
})();
