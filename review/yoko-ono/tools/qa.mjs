// Headless QA for the Yoko Ono site (version 3). Usage: node review/yoko-ono/tools/qa.mjs <outdir> [base]
// Start `python3 -m http.server 8790 -d yoko-ono-site` first (or pass a base URL).
// The bundled Chromium has no H.264 decoder, so the MP4 requests are answered with a VP9 copy of the same frames.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/home/user/Motion-graphic-websites';
const out = process.argv[2] || path.join(ROOT, 'review/yoko-ono/qa');
const base = process.argv[3] || 'http://127.0.0.1:8790/';
fs.mkdirSync(out, { recursive: true });
const WEBM = path.join(ROOT, 'review/yoko-ono/enc/walk-720.webm');
const report = { console: [], checks: [] };
const check = (name, ok, info) => { report.checks.push({ name, ok: !!ok, info }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };

async function newPage(browser, opts, label, { blockVideo = false, reduced = false } = {}) {
  const ctx = await browser.newContext({ ...opts, locale: 'he-IL', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') report.console.push({ label, type: m.type(), text: m.text() }); });
  page.on('pageerror', e => report.console.push({ label, type: 'pageerror', text: String(e) }));
  const requested = [];
  page.on('request', r => requested.push(r.url()));
  await page.route(/walk-(720|540)\.mp4/, r => blockVideo ? r.abort() : r.fulfill({ path: WEBM, contentType: 'video/webm' }));
  await page.route(/click\.php/, r => r.fulfill({ status: 204, body: '' }));
  page.requested = requested; page.ctx = ctx; page.label = label;
  return page;
}
const attrs = p => p.evaluate(() => ({ hero: document.documentElement.dataset.hero, stage: document.documentElement.dataset.stage, open: document.getElementById('stage').classList.contains('open'), ready: document.getElementById('stage').classList.contains('video-ready'), failed: document.getElementById('stage').classList.contains('video-failed') }));
const probe = p => p.evaluate(() => {
  const v = document.getElementById('film'), st = document.getElementById('stage');
  const bands = [...document.querySelectorAll('.band[data-range]')].map(b => ({ op: +getComputedStyle(b).opacity, k: +getComputedStyle(b).getPropertyValue('--k') || 0, on: b.classList.contains('on') }));
  return { t: +v.currentTime.toFixed(2), dur: +(v.duration || 0).toFixed(2), bands, s: +getComputedStyle(st).getPropertyValue('--s') || 0, y: Math.round(scrollY), settled: st.classList.contains('settled'), past: document.body.classList.contains('past-hero') };
});
async function scrollTo(page, frac) {
  await page.evaluate(f => { const h = document.getElementById('top'); const range = h.offsetHeight - innerHeight; window.scrollTo(0, Math.round(range * f)); }, frac);
  await page.waitForTimeout(900);
}
const waitReady = p => p.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready') || document.getElementById('stage').classList.contains('video-failed'), null, { timeout: 25000 }).catch(() => {});

const browser = await chromium.launch();
try {
  // ---------- desktop ----------
  for (const [w, h] of [[1280, 800], [1440, 900]]) {
    const page = await newPage(browser, { viewport: { width: w, height: h } }, `desktop${w}`);
    await page.goto(base, { waitUntil: 'load' });
    await waitReady(page); await page.waitForTimeout(1800);
    const a = await attrs(page);
    check(`desktop${w}: scrub door mode, video ready`, a.hero === 'scrub' && a.stage === 'door' && a.ready && a.open, a);
    const posterHidden = await page.evaluate(() => getComputedStyle(document.getElementById('poster')).display === 'none' && document.getElementById('backdrop').classList.contains('on'));
    check(`desktop${w}: ambient canvas on, full-bleed poster hidden`, posterHidden);
    await page.screenshot({ path: path.join(out, `d${w}-top.png`) });
    const p0 = await probe(page);
    check(`desktop${w}: scene A settled at top`, p0.bands[0].op > 0.98 && p0.bands[0].k > 0.98, p0.bands[0]);
    const samples = [];
    for (const f of [0.1, 0.3, 0.5, 0.62, 0.76, 0.9, 1]) {
      await scrollTo(page, f); const pr = await probe(page); samples.push({ f, t: pr.t, s: pr.s, bands: pr.bands.map(b => +b.op.toFixed(2)), past: pr.past });
      if (f === 0.5 || f === 0.9 || f === 1) await page.screenshot({ path: path.join(out, `d${w}-p${f}.png`) });
    }
    console.log('desktop samples', JSON.stringify(samples));
    check(`desktop${w}: film time follows scroll (monotonic, reaches the end)`, samples.every((s, i) => i === 0 || s.t >= samples[i - 1].t - 0.01) && samples[samples.length - 1].t > 9.5, samples.map(s => s.t));
    check(`desktop${w}: scene C on mid-walk, settle on at the end with the arch contracted`, samples[2].bands[1] > 0.98 && samples[samples.length - 1].bands[2] > 0.98 && samples[samples.length - 1].s > 0.99 && samples[samples.length - 1].past, { c: samples[2].bands[1], settle: samples[samples.length - 1] });
    await scrollTo(page, 0.05); const back = await probe(page);
    check(`desktop${w}: reverse scroll returns the film and scene A`, back.t < 2 && back.bands[0].op > 0.5 && back.s === 0 && !back.past, { t: back.t, b: back.bands[0], s: back.s });
    for (const step of [120, 240, 360]) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
      const log = [];
      const total = await page.evaluate(() => document.getElementById('top').offsetHeight - innerHeight);
      for (let y = 0; y < total + step; y += step) { await page.evaluate(s => window.scrollBy(0, s), step); await page.waitForTimeout(380); log.push((await probe(page)).bands.map(b => b.op)); }
      const full = [0, 1, 2].map(i => log.filter(r => r[i] > 0.97).length);
      check(`desktop${w}: flick ${step}px: steps at full opacity per band`, step === 120 ? full.every(n => n >= 5) : full.every(n => n >= 1), full);
    }
    // the skip action
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
    await page.click('#skipIntro'); await page.waitForTimeout(2200);
    const afterSkip = await page.evaluate(() => ({ y: Math.round(scrollY), end: document.getElementById('top').offsetHeight - innerHeight, focus: document.activeElement && document.activeElement.id }));
    check(`desktop${w}: skip scrolls to the end of the walk and focuses the food headline`, Math.abs(afterSkip.y - afterSkip.end) < 4 && afterSkip.focus === 'food-h', afterSkip);
    // below the walk
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'done')));
    for (const id of ['food', 'visit', 'footer']) {
      await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `d${w}-${id}.png`) });
    }
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`desktop${w}: no horizontal overflow`, ov.sw <= ov.cw + 1, ov);
    // the rail: open, escape, focus back
    await page.evaluate(() => document.getElementById('food').scrollIntoView({ block: 'start', behavior: 'instant' })); await page.waitForTimeout(400);
    const railVisible = await page.evaluate(() => { const r = document.querySelector('.rail-list li:nth-child(1) .thumb').getBoundingClientRect(); const r6 = document.querySelector('.rail-list li:nth-child(6)'); return r.width > 40 && r.x >= 0 && r.x < 200 && getComputedStyle(r6).display === 'none'; });
    check(`desktop${w}: rail shows five previews in the left margin`, railVisible);
    await page.click('#railMore'); await page.waitForTimeout(600);
    const railOpen = await page.evaluate(() => ({ open: document.getElementById('gallery').classList.contains('open'), count: [...document.querySelectorAll('.rail-list li')].filter(li => li.getBoundingClientRect().width > 0).length, focus: document.activeElement && document.activeElement.id, expanded: document.getElementById('railMore').getAttribute('aria-expanded') }));
    check(`desktop${w}: rail opens into the drawer with all eleven photos, focus on close`, railOpen.open && railOpen.count === 11 && railOpen.focus === 'railClose' && railOpen.expanded === 'true', railOpen);
    await page.screenshot({ path: path.join(out, `d${w}-rail-open.png`) });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    const railClosed = await page.evaluate(() => ({ open: document.getElementById('gallery').classList.contains('open'), focus: document.activeElement && document.activeElement.id }));
    check(`desktop${w}: escape closes the drawer and returns focus`, !railClosed.open && railClosed.focus === 'railMore', railClosed);
    // the lightbox
    await page.click('.rail-list li:nth-child(2) .thumb'); await page.waitForTimeout(1200);
    const lb1 = await page.evaluate(() => ({ hidden: document.getElementById('lightbox').hidden, count: document.getElementById('lbCount').textContent, cap: document.getElementById('lbCap').textContent, src: document.getElementById('lbImg').getAttribute('src'), focus: document.activeElement && document.activeElement.id, inert: document.querySelector('main').inert, locked: document.body.classList.contains('lb-open') }));
    check(`desktop${w}: lightbox opens on the second photo with the original file, caption, counter, focus trapped`, !lb1.hidden && lb1.count === '2 / 11' && /p-nigiri-full/.test(lb1.src) && lb1.cap.length > 3 && lb1.focus === 'lbClose' && lb1.inert && lb1.locked, lb1);
    await page.screenshot({ path: path.join(out, `d${w}-lightbox.png`) });
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(900);
    const lb2 = await page.evaluate(() => document.getElementById('lbCount').textContent);
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(100);
    const tabbed = await page.evaluate(() => document.activeElement && document.activeElement.id);
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    const lb3 = await page.evaluate(() => ({ hidden: document.getElementById('lightbox').hidden, inert: document.querySelector('main').inert, focus: document.activeElement && document.activeElement.className }));
    check(`desktop${w}: arrow moves to the next photo, tab cycles inside, escape closes and restores`, lb2 === '3 / 11' && ['lbClose', 'lbPrev', 'lbNext'].includes(tabbed) && lb3.hidden && !lb3.inert && /thumb/.test(lb3.focus), { lb2, tabbed, lb3 });
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
    check(`desktop${w}: tel, ontopo, wolt, maps, mail, instagram, facebook links present`, ['tel:+972779386192', 'https://ontopo.com/he/il/page/14510630', 'https://wolt.com/he/isr/hasharon/restaurant/yoko-ono', 'https://www.instagram.com/yoko_ono_fusion/', 'https://www.facebook.com/share/1cHAUizDXE/'].every(u => links.includes(u)) && links.some(u => u.startsWith('https://www.google.com/maps/dir/')) && links.some(u => u.startsWith('mailto:yokoono.israel@gmail.com')));
    const beacons = page.requested.filter(u => /click\.php/.test(u)).length;
    check(`desktop${w}: click beacons were sent for the skip and the gallery`, beacons >= 2, beacons);
    await page.ctx.close();
  }

  // ---------- phones ----------
  for (const [label, opts] of [['iphone11pro', devices['iPhone 11 Pro']], ['phone375x667', { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const page = await newPage(browser, opts, label);
    await page.goto(base, { waitUntil: 'load' });
    await waitReady(page); await page.waitForTimeout(1500);
    const a = await attrs(page);
    check(`${label}: full-bleed scrub on a phone`, a.hero === 'scrub' && a.stage === 'full' && a.ready, a);
    await page.screenshot({ path: path.join(out, `${label}-top.png`) });
    const s = [];
    for (const f of [0.5, 0.76, 1]) { await scrollTo(page, f); s.push(await probe(page)); await page.screenshot({ path: path.join(out, `${label}-p${f}.png`) }); }
    check(`${label}: film follows scroll, settle on at the end`, s[2].t > s[0].t + 3 && s[2].bands[2].op > 0.98 && s[2].s > 0.99, s.map(x => [x.t, x.s]));
    const ctaVisible = await page.evaluate(() => { const b = document.querySelector('.settle-cta .btn-gold').getBoundingClientRect(); const bar = document.getElementById('stickyCta').getBoundingClientRect(); return { btnBottom: Math.round(b.bottom), barTop: Math.round(bar.top), vh: innerHeight, past: document.body.classList.contains('past-hero') }; });
    check(`${label}: at the settle the buttons sit above the fold and the sticky bar is not yet shown`, ctaVisible.btnBottom <= ctaVisible.vh && !ctaVisible.past, ctaVisible);
    await page.evaluate(() => window.scrollTo(0, document.getElementById('top').offsetHeight + 200)); await page.waitForTimeout(900);
    const sticky = await page.evaluate(() => document.body.classList.contains('past-hero') && getComputedStyle(document.getElementById('stickyCta')).transform === 'none');
    check(`${label}: sticky reserve bar appears after the hero`, sticky);
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'done')));
    for (const id of ['food', 'gallery', 'visit', 'footer']) { await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, `${label}-${id}.png`) }); }
    const strip = await page.evaluate(() => { const l = document.getElementById('railList'); const first = l.querySelector('li:nth-child(1)').getBoundingClientRect(), second = l.querySelector('li:nth-child(2)').getBoundingClientRect(); return { scrollable: l.scrollWidth > l.clientWidth + 40, horizontal: Math.abs(first.top - second.top) < 2, count: [...l.querySelectorAll('li')].filter(li => getComputedStyle(li).display !== 'none').length }; });
    check(`${label}: the rail is a horizontal strip of all eleven photos`, strip.scrollable && strip.horizontal && strip.count === 11, strip);
    await page.evaluate(() => document.getElementById('railMore').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(300);
    await page.click('#railMore'); await page.waitForTimeout(1000);
    const lbp = await page.evaluate(() => ({ hidden: document.getElementById('lightbox').hidden, count: document.getElementById('lbCount').textContent }));
    check(`${label}: the all-photos button opens the lightbox on the first photo`, !lbp.hidden && lbp.count === '1 / 11', lbp);
    await page.screenshot({ path: path.join(out, `${label}-lightbox.png`) });
    // swipe to the next photo
    const box = await page.locator('#lbImg').boundingBox();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(800);
    const swiped = await page.evaluate(() => document.getElementById('lbCount').textContent);
    check(`${label}: a swipe to the left shows the next photo`, swiped === '2 / 11', swiped);
    await page.click('#lbClose'); await page.waitForTimeout(500);
    const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`${label}: no horizontal overflow`, ov.sw <= ov.cw + 1, ov);
    const small = await page.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 40 && !e.closest('.nav-links') && !e.closest('.foot-links') && !e.closest('.detail'); }).map(e => (e.textContent || '').trim().slice(0, 20) + ' ' + Math.round(e.getBoundingClientRect().height)));
    check(`${label}: touch targets under 40px (list)`, small.length <= 4, small);
    await page.ctx.close();
  }

  // ---------- reduced motion: static hero, no video request ----------
  {
    const page = await newPage(browser, { viewport: { width: 1280, height: 800 } }, 'reduced', { reduced: true });
    await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const a = await attrs(page);
    const videoReq = page.requested.some(u => /walk-(720|540)\.mp4/.test(u));
    check('reduced motion: static hero, no video requested', a.hero === 'static' && !videoReq, { a, videoReq });
    const vis = await page.evaluate(() => { const t = document.querySelector('.title').getBoundingClientRect(); const d = document.getElementById('door').getBoundingClientRect(); const dp = getComputedStyle(document.getElementById('doorPoster')).backgroundImage; const st = document.getElementById('experience'); return { title: t.width > 100 && t.height > 10, arch: d.width > 200 && d.height > d.width, end: /walk-end/.test(dp), settleOp: +getComputedStyle(st).opacity, gate: /walk-poster/.test(getComputedStyle(document.getElementById('poster')).backgroundImage) }; });
    check('reduced motion: gate poster with the title, then the room in its arch and the experience copy', vis.title && vis.arch && vis.end && vis.settleOp === 1 && vis.gate, vis);
    await page.screenshot({ path: path.join(out, 'reduced-top.png') });
    await page.evaluate(() => document.getElementById('experience').scrollIntoView({ block: 'start', behavior: 'instant' })); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, 'reduced-experience.png') });
    await page.ctx.close();
  }
  // ---------- live flip of reduced motion both ways ----------
  {
    const page = await newPage(browser, { viewport: { width: 1280, height: 800 } }, 'flip');
    await page.goto(base, { waitUntil: 'load' }); await waitReady(page);
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
    await scrollTo(page, 0.95); const pr = await probe(page);
    check('video blocked: failed state, gate painted in the door, settle copy still arrives', a.failed && pr.bands[2].op > 0.98 && pr.s > 0.5 && (await page.evaluate(() => /walk-poster/.test(getComputedStyle(document.getElementById('doorPoster')).backgroundImage))), { a, b: pr.bands[2], s: pr.s });
    await page.screenshot({ path: path.join(out, 'novideo-settle.png') });
    await page.ctx.close();
  }
  // ---------- no JavaScript ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    const page = await ctx.newPage(); await page.goto(base, { waitUntil: 'load' }); await page.waitForTimeout(800);
    const ok = await page.evaluate(() => { const t = document.querySelector('.title').getBoundingClientRect(); return t.width > 100 && /walk-poster/.test(getComputedStyle(document.getElementById('poster')).backgroundImage) && /walk-end/.test(getComputedStyle(document.getElementById('doorPoster')).backgroundImage) && +getComputedStyle(document.getElementById('experience')).opacity === 1; });
    check('no JavaScript: gate poster, title, the room in its arch and the copy shown', ok);
    await page.screenshot({ path: path.join(out, 'nojs-top.png') });
    await ctx.close();
  }
} finally {
  await browser.close();
}
const errs = report.console.filter(c => !/favicon|ERR_FAILED|net::ERR_ABORTED|walk-(720|540)/.test(c.text));
check('console: zero errors/warnings across runs', errs.length === 0, errs.slice(0, 12));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.checks.filter(c => c.ok).length}/${report.checks.length} checks passed. Screenshots in ${out}`);
