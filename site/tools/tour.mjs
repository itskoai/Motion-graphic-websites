#!/usr/bin/env node
// A screenshot tour of the whole page: for each scene, shots at several progress points, desktop and mobile, plus a contact sheet.
//   node tools/tour.mjs --url http://127.0.0.1:3000/ --out /path/dir [--mobile] [--reduced]
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, s, i, arr) => { if (s.startsWith('--')) { const k = s.slice(2); const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'; a.push([k, v]); } return a; }, []));
const url = args.url || 'http://127.0.0.1:3000/';
const out = args.out || '/tmp/tour';
const mobile = args.mobile === 'true';
fs.mkdirSync(out, { recursive: true });
const SCENES = [['top', [0, 0.15, 0.4, 0.7, 0.95]], ['create', [0.1, 0.45, 0.8]], ['story', [0.05, 0.25, 0.45, 0.65, 0.85, 0.98]], ['work', [0, 0.3, 0.6, 0.9]], ['creators', [0.2, 0.6]], ['process', [0.1, 0.5, 0.9]], ['next', [0.2, 0.5, 0.8]], ['contact', [0, 0.4, 0.8, 1]]];
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), locale: 'he-IL', colorScheme: 'light', reducedMotion: args.reduced === 'true' ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const log = [], errors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1200);
const files = [];
let lastY = 0;
for (const [id, points] of SCENES) {
  for (const p of points) {
    const y = await page.evaluate(({ id, p }) => {
      let el = document.getElementById(id); if (!el) return null;
      if (el.parentElement && el.parentElement.classList.contains('pin-spacer')) el = el.parentElement;
      const r = el.getBoundingClientRect(); const top = r.top + window.scrollY; const range = Math.max(0, r.height - window.innerHeight);
      return Math.round(top + range * p);
    }, { id, p });
    if (y === null) { log.push(`missing #${id}`); continue; }
    const steps = 10;
    for (let i = 1; i <= steps; i++) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), Math.round(lastY + (y - lastY) * i / steps)); await page.waitForTimeout(70); }
    lastY = y;
    await page.waitForTimeout(900);
    const f = `${out}/${mobile ? 'm' : 'd'}-${id}-${String(Math.round(p * 100)).padStart(3, '0')}.png`;
    await page.screenshot({ path: f });
    files.push(f);
  }
}
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await browser.close();
// contact sheet
try {
  const cols = mobile ? 8 : 4; const w = mobile ? 195 : 480; 
  const inputs = files.map((f) => `-i "${f}"`).join(' ');
  const n = files.length; const rows = Math.ceil(n / cols);
  const layout = files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * Math.round(w * (mobile ? 844 / 390 : 900 / 1440))}`).join('|');
  const scale = files.map((_, i) => `[${i}]scale=${w}:-1[s${i}]`).join(';');
  const refs = files.map((_, i) => `[s${i}]`).join('');
  execSync(`ffmpeg -v error -y ${inputs} -filter_complex "${scale};${refs}xstack=inputs=${n}:layout=${layout}:fill=black" "${out}/sheet-${mobile ? 'm' : 'd'}.jpg"`);
} catch (e) { log.push('sheet failed: ' + String(e).slice(0, 200)); }
console.log(JSON.stringify({ url, mobile, shots: files.length, overflowX, console: log, pageErrors: errors, sheet: `${out}/sheet-${mobile ? 'm' : 'd'}.jpg` }, null, 1));
