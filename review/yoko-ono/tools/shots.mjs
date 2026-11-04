// Screenshots of the site at hero positions and sections, desktop and phone. Usage: node review/yoko-ono/tools/shots.mjs <outdir> [base]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
import fs from 'node:fs'; import path from 'node:path';
const out = process.argv[2] || 'review/yoko-ono/qa/shots', base = process.argv[3] || 'http://127.0.0.1:8790/';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
async function run(label, opts) {
  const ctx = await browser.newContext({ ...opts, locale: 'he-IL' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e));
  await page.route(/walk-(720|540)\.mp4/, r => r.fulfill({ path: 'review/yoko-ono/enc/walk-720.webm', contentType: 'video/webm' }));
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready') || document.getElementById('stage').classList.contains('video-failed'), null, { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const st = await page.evaluate(() => ({ hero: document.documentElement.dataset.hero, stage: document.documentElement.dataset.stage, ready: document.getElementById('stage').classList.contains('video-ready') }));
  console.log(label, JSON.stringify(st));
  for (const f of [0, 0.08, 0.3, 0.5, 0.6, 0.76, 0.88, 0.94, 1]) {
    await page.evaluate(fr => { const h = document.getElementById('top'); window.scrollTo(0, Math.round((h.offsetHeight - innerHeight) * fr)); }, f);
    await page.waitForTimeout(900);
    const t = await page.evaluate(() => +document.getElementById('film').currentTime.toFixed(2));
    await page.screenshot({ path: path.join(out, `${label}-p${f}.png`) });
    console.log(label, 'p', f, 't', t);
  }
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in', 'done')));
  for (const id of ['food', 'visit', 'footer']) {
    await page.evaluate(i => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id); await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, `${label}-${id}.png`) });
  }
  await page.evaluate(() => document.getElementById('food').scrollIntoView({ block: 'start', behavior: 'instant' })); await page.waitForTimeout(300);
  await page.click('#railMore'); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `${label}-rail-open.png`) });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('.thumb >> nth=0'); await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, `${label}-lightbox.png`) });
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  console.log(label, 'overflow', JSON.stringify(ov), 'errors', JSON.stringify(errs.filter(e => !/favicon|ERR_FAILED|net::ERR_ABORTED/.test(e)).slice(0, 8)));
  await ctx.close();
}
await run('d1440', { viewport: { width: 1440, height: 900 } });
await run('ph', devices['iPhone 11 Pro']);
await browser.close();
