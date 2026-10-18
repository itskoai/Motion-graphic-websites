// Hero QA: flick test, scrub accuracy, and worst-frame legibility captures.
// node qa_hero.mjs <outdir> [desktop|mobile|both]
import { launch, Page, sleep } from './cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const out = process.argv[2] || '/tmp/qa';
const which = process.argv[3] || 'both';
mkdirSync(out, { recursive: true });
const ENC = path.join(ROOT, 'review/studio/enc');
const swaps = [{ pattern: '*hero-scrub.mp4*', match: 'hero-scrub.mp4', file: path.join(ENC, 'hero-scrub.webm') }];
const BASE = (process.env.SITE_BASE || 'http://127.0.0.1:8790/') + 'index.html';
const KP = [[0, 0], [0.16, 3], [0.42, 40], [0.72, 100], [1, 133]];
const frameAt = (p) => { for (let i = 1; i < KP.length; i++) if (p <= KP[i][0]) { const [a, fa] = KP[i - 1], [b, fb] = KP[i]; return fa + (fb - fa) * (p - a) / (b - a); } return 133; };

const GEO = `(() => { const h = document.querySelector('.hero'), s = document.querySelector('.hero-stage'); return { top: h.getBoundingClientRect().top + scrollY, range: h.offsetHeight - s.offsetHeight, vh: innerHeight }; })()`;
const OPS = `[...document.querySelectorAll('.band')].map(b => +getComputedStyle(b).opacity)`;

async function flick(p, step, count) {
  await p.scroll(0, 50); await sleep(900);
  const rows = [];
  for (let i = 0; i < count; i++) {
    await p.eval(`window.scrollBy(0, ${step}); true`);
    await sleep(400);
    rows.push({ y: await p.eval('Math.round(scrollY)'), ops: await p.eval(OPS) });
  }
  return rows;
}
function flickReport(rows, nb) {
  const res = [];
  for (let b = 0; b < nb; b++) {
    let best = 0, cur = 0, reached = false;
    for (const r of rows) { if (r.ops[b] >= 0.98) { cur++; reached = true; best = Math.max(best, cur); } else cur = 0; }
    res.push({ band: b, fullSteps: best, reached });
  }
  return res;
}

async function run(kind) {
  const port = (+process.env.CDP_PORT || 9371) + (kind === 'desktop' ? 0 : 1);
  const chrome = await launch(port);
  const report = { kind };
  try {
    const p = await Page.open(port, { swaps });
    if (kind === 'desktop') await p.viewport(1440, 900); else await p.viewport(390, 844, { mobile: true, touch: true, scale: 2 });
    await p.go(BASE, 2500); await sleep(3000);
    report.mode = await p.eval('document.documentElement.dataset.hero');
    const geo = await p.eval(GEO);
    report.geo = geo;
    const bands = await p.eval(`[...document.querySelectorAll('.band')].map(b => b.dataset.band.split(',').map(Number))`);
    // 1. flick test
    const nb = bands.length;
    const total = geo.range + geo.vh;
    report.flick = {};
    for (const step of [120, 240, 360]) {
      const rows = await flick(p, step, Math.ceil(total / step) + 2);
      report.flick[step] = flickReport(rows, nb);
    }
    // 2. scrub accuracy (desktop video only): down then back up
    if (report.mode === 'video') {
      const probes = [0.05, 0.3, 0.55, 0.8, 1, 0.6, 0.2, 0];
      report.scrub = [];
      for (const q of probes) {
        await p.scroll(Math.round(geo.top + q * geo.range), 50); await sleep(1400);
        const t = await p.eval(`document.querySelector('.hero-video').currentTime`);
        const want = (Math.min(133, frameAt(q)) + 0.5) / 24;
        report.scrub.push({ q, t: +t.toFixed(3), want: +want.toFixed(3), offFrames: +(Math.abs(t - want) * 24).toFixed(2) });
      }
    }
    // 3. legibility captures: hide the glyphs, shoot the composited frame, keep the text boxes
    report.audit = [];
    let n = 0;
    for (let bi = 0; bi < nb; bi++) {
      const [a, b] = bands[bi];
      const f = Math.min(0.02, (b - a) / 3);
      const samples = [a + f + 0.012, (a + b) / 2, b - f - 0.004].map((q) => Math.min(1, Math.max(0, q)));
      if (bi === 0) samples[0] = 0;
      for (const q of samples) {
        await p.scroll(Math.round(geo.top + q * geo.range), 50); await sleep(1500);
        const boxes = await p.eval(`(() => {
          const band = document.querySelectorAll('.band')[${bi}];
          const sel = band.querySelectorAll('.hl, .sub, .kicker');
          return [...sel].map(el => { const r = el.getBoundingClientRect(); return { cls: el.className.split(' ')[0], x: r.left, y: r.top, w: r.width, h: r.height, op: +getComputedStyle(band).opacity }; });
        })()`);
        await p.eval(`(() => { const s = document.createElement('style'); s.id = 'qa-hide'; s.textContent = '.band .hl, .band .sub, .band .kicker { visibility: hidden !important; } .band .chip-soft { visibility: visible !important; color: transparent !important; text-shadow: none !important; }'; document.head.appendChild(s); return 1; })()`);
        await sleep(120);
        const file = path.join(out, `${kind}-band${bi}-${n++}.png`);
        await p.shot(file);
        await p.eval(`document.getElementById('qa-hide').remove(), 1`);
        report.audit.push({ band: bi, q: +q.toFixed(3), file, boxes, dpr: kind === 'desktop' ? 1 : 2 });
      }
    }
    report.errors = p.errors; report.console = p.console;
    await p.close();
  } finally { chrome.kill('SIGKILL'); }
  writeFileSync(path.join(out, `${kind}-report.json`), JSON.stringify(report, null, 1));
  console.log(kind, 'mode', report.mode, 'flick', JSON.stringify(report.flick), 'scrub', JSON.stringify(report.scrub || []), 'errors', JSON.stringify(report.errors));
}
if (which !== 'mobile') await run('desktop');
if (which !== 'desktop') await run('mobile');
