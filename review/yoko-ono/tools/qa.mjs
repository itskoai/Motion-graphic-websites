// Headless QA for the Yoko Ono site. Usage: node review/yoko-ono/tools/qa.mjs <outdir> [base]
// Serves nothing itself: start `python3 -m http.server 8790 -d yoko-ono-site` first (or pass a base URL).
// The bundled Chromium has no H.264 decoder, so the MP4 requests are answered with VP9 copies of the same frames.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'review/yoko-ono/qa';
const base = process.argv[3] || 'http://127.0.0.1:8790/';
fs.mkdirSync(out, { recursive: true });
const ENC = 'review/yoko-ono/enc/';
const report = { console: [], checks: [] };
const check = (name, ok, info) => { report.checks.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };

async function newPage(browser, opts, label, { blockVideo = false, reduced = false } = {}) {
  const ctx = await browser.newContext({ ...opts, locale: 'he-IL', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') report.console.push({ label, type: m.type(), text: m.text() }); });
  page.on('pageerror', e => report.console.push({ label, type: 'pageerror', text: String(e) }));
  const requested = [];
  page.on('request', r => requested.push(r.url()));
  await page.route(/hero-film-(720|540)\.mp4/, r => blockVideo ? r.abort() : r.fulfill({ path: ENC + 'hero-film-720.webm', contentType: 'video/webm' }));
  await page.route(/room-loop\.mp4/, r => r.fulfill({ path: ENC + 'room-loop.webm', contentType: 'video/webm' }));
  page.requested = requested; page.ctx = ctx; page.label = label;
  return page;
}
const attrs = p => p.evaluate(() => ({ hero: document.documentElement.dataset.hero, stage: document.documentElement.dataset.stage, open: document.getElementById('stage').classList.contains('open'), ready: document.getElementById('stage').classList.contains('video-ready'), failed: document.getElementById('stage').classList.contains('video-failed') }));
const probe = p => p.evaluate(() => {
  const v = document.getElementById('film');
  const bands = [...document.querySelectorAll('.band[data-range]')].map(b => ({ op: +getComputedStyle(b).opacity, k: +getComputedStyle(b).getPropertyValue('--k') || 0, on: b.classList.contains('on') }));
  return { t: +v.currentTime.toFixed(2), dur: +(v.duration || 0).toFixed(2), bands, y: Math.round(scrollY), settled: document.getElementById('stage').classList.contains('settled') };
});
async function scrollTo(page, frac) {
  await page.evaluate(f => { const h = document.getElementById('top'); const range = h.offsetHeight - innerHeight; window.scrollTo(0, Math.round(range * f)); }, frac);
  await page.waitForTimeout(900);
}

const browser = await chromium.launch();
try {
  // ---------- desktop 1280x800 ----------
  for (const [w, h] of [[1280, 800], [1440, 900]]) {
    const page = await newPage(browser, { viewport: { width: w, height: h } }, `desktop${w}`);
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready') || document.getElementById('stage').classList.contains('video-failed'), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(1800);
    const a = await attrs(page);
    check(`desktop${w}: scrub door mode, video ready`, a.hero === 'scrub' && a.stage === 'door' && a.ready && a.open, a);
    await page.screenshot({ path: path.join(out, `d${w}-top.png`) });
    const p0 = await probe(page);
    check(`desktop${w}: band 1 settled at top`, p0.bands[0].op > 0.98 && p0.bands[0].k > 0.98, p0.bands[0]);
    const samples = [];
    for (const f of [0.1, 0.38, 0.5, 0.65, 0.78, 0.9, 1]) {
      await scrollTo(page, f); const pr = await probe(page); samples.push({ f, t: pr.t, bands: pr.bands.map(b => +b.op.toFixed(2)), settled: pr.settled });
      if (f === 0.38 || f === 0.65 || f === 0.9) await page.screenshot({ path: path.join(out, `d${w}-p${f}.png`) });
    }
    console.log('desktop samples', JSON.stringify(samples));
    check(`desktop${w}: film time follows scroll (monotonic, reaches end)`, samples.every((s, i) => i === 0 || s.t >= samples[i - 1].t - 0.01) && samples[samples.length - 1].t > samples[0].t + 5, samples.map(s => s.t));
    check(`desktop${w}: settle band on at the end`, samples[samples.length - 1].bands[3] > 0.98 && samples[samples.length - 1].settled);
    // scroll back up: reversible
    await scrollTo(page, 0.1); const back = await probe(page);
    check(`desktop${w}: reverse scroll returns the film`, back.t < 2.5 && back.bands[0].op > 0.5, { t: back.t, b: back.bands[0] });
    // flick test
    for (const step of [120, 240, 360]) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
      const log = [];
      const total = await page.evaluate(() => document.getElementById('top').offsetHeight - innerHeight);
      for (let y = 0; y < total + step; y += step) { await page.evaluate(s => window.scrollBy(0, s), step); await page.waitForTimeout(380); log.push((await probe(page)).bands.map(b => b.op)); }
      const full = [0, 1, 2, 3].map(i => log.filter(r => r[i] > 0.97).length);
      check(`desktop${w}: flick ${step}px: steps at full opacity per band`, step === 120 ? full.every(n => n >= 5) : full.every(n => n >= 1), full);
    }
    // below-fold full page
    await page.evaluate(() => window.scrollTo(0, document.getElementById('top').offsetHeight)); await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'done')));
    for (const id of ['experience', 'food', 'place', 'delivery', 'events', 'find', 'footer']) {
      await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `d${w}-${id}.png`) });
    }
    // overflow
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`desktop${w}: no horizontal overflow`, ov.sw <= ov.cw + 1, ov);
    // hold interaction
    await page.evaluate(() => document.getElementById('find').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(500);
    const hb = await page.locator('#hold').boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.waitForTimeout(600);
    const mid = await page.evaluate(() => +getComputedStyle(document.getElementById('hours')).getPropertyValue('--h'));
    await page.mouse.up(); await page.waitForTimeout(900);
    const eased = await page.evaluate(() => +getComputedStyle(document.getElementById('hours')).getPropertyValue('--h'));
    check(`desktop${w}: hold builds then eases back on release`, mid > 0.25 && mid < 0.7 && eased < mid, { mid, eased });
    await page.mouse.down(); await page.waitForTimeout(1700); await page.mouse.up(); await page.waitForTimeout(600);
    const lit = await page.evaluate(() => document.getElementById('hours').classList.contains('lit'));
    check(`desktop${w}: hold completes and lights the lanterns`, lit);
    await page.screenshot({ path: path.join(out, `d${w}-lit.png`) });
    // links
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
    check(`desktop${w}: tel, ontopo, wolt, maps, mail links present`, ['tel:+972779386192', 'https://ontopo.com/he/il/page/14510630', 'https://wolt.com/he/isr/hasharon/restaurant/yoko-ono'].every(u => links.includes(u)) && links.some(u => u.startsWith('https://www.google.com/maps/dir/')) && links.some(u => u.startsWith('mailto:yokoono.israel@gmail.com')));
    await page.ctx.close();
  }

  // ---------- phones ----------
  for (const [label, opts] of [['iphone11pro', devices['iPhone 11 Pro']], ['phone375x667', { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const page = await newPage(browser, opts, label);
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready') || document.getElementById('stage').classList.contains('video-failed'), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const a = await attrs(page);
    check(`${label}: full-bleed scrub on a phone`, a.hero === 'scrub' && a.stage === 'full' && a.ready, a);
    await page.screenshot({ path: path.join(out, `${label}-top.png`) });
    const s = [];
    for (const f of [0.38, 0.65, 0.95]) { await scrollTo(page, f); s.push(await probe(page)); await page.screenshot({ path: path.join(out, `${label}-p${f}.png`) }); }
    check(`${label}: film follows scroll`, s[2].t > s[0].t + 3, s.map(x => x.t));
    check(`${label}: settle on at end`, s[2].bands[3].op > 0.98);
    await page.evaluate(() => window.scrollTo(0, document.getElementById('top').offsetHeight + 200)); await page.waitForTimeout(900);
    const sticky = await page.evaluate(() => document.body.classList.contains('past-hero') && getComputedStyle(document.getElementById('stickyCta')).transform === 'none');
    check(`${label}: sticky reserve bar appears after the hero`, sticky);
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'done')));
    for (const id of ['experience', 'food', 'place', 'find', 'footer']) { await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, `${label}-${id}.png`) }); }
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`${label}: no horizontal overflow`, ov.sw <= ov.cw + 1, ov);
    const small = await page.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !e.closest('.nav-links'); }).map(e => (e.textContent || '').trim().slice(0, 20) + ' ' + Math.round(e.getBoundingClientRect().height)));
    check(`${label}: touch targets under 40px (list)`, small.length <= 10, small);
    await page.ctx.close();
  }

  // ---------- reduced motion: static hero, no video request ----------
  {
    const page = await newPage(browser, { viewport: { width: 1280, height: 800 } }, 'reduced', { reduced: true });
    await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const a = await attrs(page);
    const videoReq = page.requested.some(u => /hero-film/.test(u));
    check('reduced motion: static hero, no video requested', a.hero === 'static' && !videoReq, { a, videoReq });
    const vis = await page.evaluate(() => { const s = document.querySelector('.static-copy'); const r = s.getBoundingClientRect(); return getComputedStyle(s).display !== 'none' && r.width > 100 && +getComputedStyle(s).opacity > 0.9; });
    check('reduced motion: static copy visible', vis);
    await page.screenshot({ path: path.join(out, 'reduced-top.png') });
    const lit = await page.evaluate(() => document.getElementById('hours').classList.contains('lit'));
    check('reduced motion: lanterns lit without holding', lit);
    await page.ctx.close();
  }
  // ---------- live flip of reduced motion both ways ----------
  {
    const page = await newPage(browser, { viewport: { width: 1280, height: 800 } }, 'flip');
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready'), null, { timeout: 25000 }).catch(() => {});
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(600);
    const a1 = await attrs(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(600);
    await scrollTo(page, 0.5); const p2 = await probe(page);
    check('reduced motion flipped on then off: static, then scrub re-armed', a1.hero === 'static' && (await attrs(page)).hero === 'scrub' && p2.t > 2, { a1, t: p2.t });
    await page.ctx.close();
  }
  // ---------- video blocked: complete over the poster ----------
  {
    const page = await newPage(browser, { viewport: { width: 1280, height: 800 } }, 'novideo', { blockVideo: true });
    await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const a = await attrs(page);
    await scrollTo(page, 0.9); const pr = await probe(page);
    check('video blocked: failed state, poster painted, settle copy still works', a.failed && pr.bands[3].op > 0.98 && (await page.evaluate(() => getComputedStyle(document.getElementById('doorPoster')).backgroundImage.includes('hero-poster'))), { a, b: pr.bands[3] });
    await page.screenshot({ path: path.join(out, 'novideo-settle.png') });
    await page.ctx.close();
  }
  // ---------- no JavaScript ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    const page = await ctx.newPage(); await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(800);
    const ok = await page.evaluate(() => { const s = document.querySelector('.static-copy'); return getComputedStyle(s).display !== 'none' && getComputedStyle(document.querySelector('.poster')).opacity === '1'; });
    check('no JavaScript: poster and static copy shown', ok);
    await page.screenshot({ path: path.join(out, 'nojs-top.png') });
    await ctx.close();
  }
} finally {
  await browser.close();
}
const errs = report.console.filter(c => !/favicon|ERR_FAILED|net::ERR_ABORTED|hero-film/.test(c.text));
check('console: zero errors/warnings across runs', errs.length === 0, errs.slice(0, 12));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.checks.filter(c => c.ok).length}/${report.checks.length} checks passed. Screenshots in ${out}`);
