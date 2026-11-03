// Worst-pixel legibility audit: for every hero band, at desktop and phone, hide the glyphs, screenshot the composited
// page at the band's mid progress, and find the lightest pixel inside the text box (the worst case for light text).
// Usage: node review/yoko-ono/tools/legibility.mjs <outdir> [base]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const { PNG } = (() => { try { return require('pngjs'); } catch (e) { return { PNG: null }; } })();
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const out = process.argv[2] || 'review/yoko-ono/qa';
const base = process.argv[3] || 'http://127.0.0.1:8790/';
fs.mkdirSync(out, { recursive: true });
const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const INK = lum(244, 236, 225), INK2 = lum(196, 182, 166);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function lightest(pngPath) {
  // Pillow does the pixel scan (no extra npm packages needed)
  const r = execFileSync('python3', ['-c', `
from PIL import Image; import sys
im=Image.open(sys.argv[1]).convert('RGB'); px=im.getdata()
def f(v):
    v/=255; return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
best=0
for (r,g,b) in px:
    l=0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
    if l>best: best=l
print(best)`, pngPath]).toString().trim();
  return parseFloat(r);
}

const browser = await chromium.launch();
const results = [];
for (const [label, opts] of (process.env.ONLY_PHONE ? [['iphone11pro', devices['iPhone 11 Pro']]] : [['desktop1280', { viewport: { width: 1280, height: 800 } }], ['desktop1440', { viewport: { width: 1440, height: 900 } }], ['iphone11pro', devices['iPhone 11 Pro']]])) {
  const ctx = await browser.newContext({ ...opts, locale: 'he-IL' });
  const page = await ctx.newPage();
  await page.route(/hero-film-(720|540)\.mp4/, r => r.fulfill({ path: 'review/yoko-ono/enc/hero-film-720.webm', contentType: 'video/webm' }));
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('stage').classList.contains('video-ready'), null, { timeout: 25000 });
  await page.waitForTimeout(1200);
  const bands = await page.evaluate(() => [...document.querySelectorAll('.band[data-range]')].map(b => b.getAttribute('data-range').split(',').map(Number)));
  for (let i = 0; i < bands.length; i++) {
    const [a, z] = bands[i];
    // three positions across the band: early, middle, late (the worst frame may be at any of them)
    for (const t of [0.25, 0.5, 0.8]) {
      const f = a + (z - a) * t;
      await page.evaluate(fr => { const h = document.getElementById('top'); window.scrollTo(0, Math.round((h.offsetHeight - innerHeight) * fr)); }, f);
      await page.waitForTimeout(900);
      const boxes = await page.evaluate(i => {
        const b = document.querySelectorAll('.band[data-range]')[i];
        const q = s => { const el = b.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return { h: q('.bl'), s: q('.bs') };
      }, i);
      await page.addStyleTag({ content: '.band .vis,.band .bs,.band .cta-row,.band .kicker,.kicker-hero,.cue{visibility:hidden!important}' });
      for (const [key, box] of Object.entries(boxes)) {
        if (!box || box.w < 4 || box.h < 4) continue;
        const file = path.join(out, `leg-${label}-b${i + 1}-${key}-${t}.png`);
        await page.screenshot({ path: file, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.w, opts.viewport.width - box.x), height: box.h } });
        const L = lightest(file);
        const r = ratio(key === 'h' ? INK : INK2, L);
        results.push({ label, band: i + 1, part: key, t, ratio: +r.toFixed(2) });
        fs.unlinkSync(file);
      }
      await page.evaluate(() => { document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('visibility:hidden!important')) s.remove(); }); });
    }
  }
  await ctx.close();
}
await browser.close();
const worst = {};
for (const r of results) { const k = `${r.label} band${r.band} ${r.part === 'h' ? 'headline' : 'subline'}`; worst[k] = Math.min(worst[k] ?? 99, r.ratio); }
let ok = true;
for (const [k, v] of Object.entries(worst)) { const floor = k.endsWith('headline') ? 3.5 : 4.5; const pass = v >= floor; ok = ok && pass; console.log((pass ? 'PASS ' : 'FAIL ') + k.padEnd(34) + ' worst ' + v + ':1'); }
fs.writeFileSync(path.join(out, 'legibility.json'), JSON.stringify({ worst, results }, null, 2));
console.log(ok ? 'All bands clear the floor.' : 'Some bands need a deeper scrim.');
