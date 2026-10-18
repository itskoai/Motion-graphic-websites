// Screenshot tour of the studio site. node shots.mjs <outdir> <desktop|mobile|both> [baseUrl]
import { launch, Page, sleep } from './cdp.mjs';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const out = process.argv[2] || '/tmp/shots';
const which = process.argv[3] || 'both';
const base = process.argv[4] || process.env.SITE_BASE || 'http://127.0.0.1:8790/';
mkdirSync(out, { recursive: true });
const ENC = path.join(ROOT, 'review/studio/enc');
const swaps = [
  { pattern: '*hero-scrub.mp4*', match: 'hero-scrub.mp4', file: path.join(ENC, 'hero-scrub.webm') },
  { pattern: '*door-loop.mp4*', match: 'door-loop.mp4', file: path.join(ENC, 'door-loop.webm') },
  { pattern: '*reel.mp4*', match: 'reel.mp4', file: path.join(ENC, 'reel.webm') },
  { pattern: '*site-capture.mp4*', match: 'site-capture.mp4', file: path.join(ENC, 'site-capture.webm') },
];

// positions: [label, js expression returning a scrollY]
const sec = (sel, f) => `(() => { const el = document.querySelector('${sel}'); const top = el.getBoundingClientRect().top + scrollY; const r = el.offsetHeight - innerHeight; return Math.round(top + ${f} * Math.max(r, 0)); })()`;
const at = (sel, off = 0) => `(() => { const el = document.querySelector('${sel}'); return Math.round(el.getBoundingClientRect().top + scrollY + ${off}); })()`;
const TOUR = [
  ['01-hero-0', '0'], ['02-hero-b1end', sec('.hero', 0.12)], ['03-hero-b2', sec('.hero', 0.31)], ['04-hero-b3', sec('.hero', 0.56)],
  ['05-hero-gap', sec('.hero', 0.71)], ['06-hero-settle', sec('.hero', 0.9)], ['07-hero-end', sec('.hero', 1)],
  ['08-xf-idea', sec('.xform', 0.06)], ['09-xf-wipe', sec('.xform', 0.22)], ['10-xf-motion', sec('.xform', 0.42)], ['11-xf-world', sec('.xform', 0.66)], ['12-xf-outro', sec('.xform', 0.92)],
  ['13-worlds-head', at('.worlds', 0)], ['14-worlds-1', at('.world[data-i="1"]', -200)], ['15-worlds-3', at('.world[data-i="3"]', -200)],
  ['16-minds-0', sec('.minds', 0.05)], ['17-minds-meet', sec('.minds', 0.5)], ['18-minds-end', sec('.minds', 0.9)],
  ['19-vision', at('.vision', 200)], ['20-vision-2', at('.vline-last', -400)],
  ['21-work', at('.work', 0)], ['22-work-p1', at('.proj-series', -80)], ['23-work-p2', at('.proj-site', -80)], ['24-work-p3', at('.proj-film', -80)],
  ['25-process', at('.process', 100)], ['26-mystery', at('.mystery', 0)], ['27-mystery-form', at('#notify-form', -300)],
  ['28-final', at('.final', 0)], ['29-final-forms', at('.paths', -120)], ['30-footer', 'document.documentElement.scrollHeight - innerHeight'],
];

async function run(kind) {
  const port = (+process.env.CDP_PORT || 9361) + (kind === 'desktop' ? 0 : 1);
  const chrome = await launch(port);
  try {
    const p = await Page.open(port, { swaps });
    if (kind === 'desktop') await p.viewport(1440, 900);
    else await p.viewport(390, 844, { mobile: true, touch: true, scale: 2 });
    await p.go(base + 'index.html', 2500);
    await sleep(2500);
    const mode = await p.eval("document.documentElement.dataset.hero");
    console.log(kind, 'mode', mode);
    for (const [label, expr] of TOUR) {
      const y = await p.eval(expr);
      // walk there in steps so scroll-driven scenes see a real path
      const cur = await p.eval('scrollY');
      const steps = Math.min(12, Math.max(1, Math.round(Math.abs(y - cur) / 600)));
      for (let i = 1; i <= steps; i++) await p.scroll(Math.round(cur + (y - cur) * i / steps), 40);
      await sleep(kind === 'desktop' ? 1300 : 1500);
      await p.shot(path.join(out, `${kind}-${label}.jpg`));
    }
    console.log(kind, 'errors', JSON.stringify(p.errors), 'console', JSON.stringify(p.console.slice(0, 12)));
    await p.close();
  } finally { chrome.kill('SIGKILL'); }
}
if (which === 'both' || which === 'desktop') await run('desktop');
if (which === 'both' || which === 'mobile') await run('mobile');
