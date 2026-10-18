// Records a scroll-through of the merch website (own project) as JPEG frames for the work section.
// node review/studio/tools/capture_site.mjs <outdir>
import { launch, Page, sleep } from './cdp.mjs';
import { mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const out = process.argv[2] || path.join(ROOT, 'review/studio/frames/site');
mkdirSync(out, { recursive: true });

const port = 9351;
const srv = spawn('python3', ['-m', 'http.server', '8771', '--bind', '127.0.0.1'], { cwd: path.join(ROOT, 'yuval-itay-set'), stdio: 'ignore' });
await sleep(700);
const chrome = await launch(port);
try {
  const p = await Page.open(port, { swaps: [{ pattern: '*hero-scrub.mp4*', match: 'hero-scrub.mp4', file: path.join(ROOT, 'review/studio/enc/yi-hero.webm') }] });
  await p.viewport(1280, 800);
  await p.go('http://127.0.0.1:8771/index.html', 2500);
  await sleep(2500);
  const H = await p.eval('document.documentElement.scrollHeight');
  const heroEnd = await p.eval("(() => { const h = document.querySelector('#hero'); return h ? h.offsetHeight - innerHeight : 3200 })()");
  // a calm, cinematic scroll: the hero scrub, then a slow glide through the next sections
  const N = 240, stops = [];
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const target = Math.min(H - 800, heroEnd + 2600);
  for (let i = 0; i < N; i++) stops.push(Math.round(ease(i / (N - 1)) * target));
  for (let i = 0; i < N; i++) {
    await p.scroll(stops[i], 70);
    await sleep(55);
    await p.shot(path.join(out, String(i).padStart(4, '0') + '.jpg'));
  }
  console.log('frames', N, 'height', H, 'heroEnd', heroEnd, 'errors', JSON.stringify(p.errors), JSON.stringify(p.console.slice(0, 5)));
  await p.close();
} finally { chrome.kill('SIGKILL'); srv.kill(); }
