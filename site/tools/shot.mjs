#!/usr/bin/env node
/*
 * Screenshot + console-error tool for scene builders and QA (headless Chromium via Playwright).
 *
 *   node tools/shot.mjs --url http://127.0.0.1:3000/ --out /tmp/x.png
 *     --w 1440 --h 900            viewport (default 1440x900; --mobile = 390x844 with touch + Safari-ish UA)
 *     --to "#work"                scroll so that this element's top hits the viewport top, then settle
 *     --progress 0.5              with --to: scroll to this fraction of the element's own scroll range
 *                                 (element height - viewport height), useful for pinned scenes
 *     --y 1200                    absolute scrollY instead
 *     --full                      full-page screenshot (expensive on pinned pages; prefer --to)
 *     --reduced                   emulate prefers-reduced-motion: reduce
 *     --settle 900                ms to wait after scrolling (default 900)
 *     --steps 12                  scroll to the target in N wheel steps (lets ScrollTrigger scrub catch up)
 *     --dark                      (default) color scheme dark
 *     --clip "#story"             clip the screenshot to this element's bounding box
 *   Prints JSON: {console: [...errors and warnings], pageErrors: [...], scrollY, docHeight, shot}
 */
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, s, i, arr) => {
  if (s.startsWith('--')) { const k = s.slice(2); const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'; a.push([k, v]); }
  return a;
}, []));

const url = args.url || 'http://127.0.0.1:3000/';
const out = args.out || '/tmp/shot.png';
const mobile = args.mobile === 'true';
const w = Number(args.w || (mobile ? 390 : 1440));
const h = Number(args.h || (mobile ? 844 : 900));
const settle = Number(args.settle || 900);
const steps = Number(args.steps || 1);

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({
  ...(mobile ? { ...devices['iPhone 13'], viewport: { width: w, height: h } } : { viewport: { width: w, height: h }, deviceScaleFactor: 1 }),
  reducedMotion: args.reduced === 'true' ? 'reduce' : 'no-preference',
  colorScheme: 'dark',
  locale: 'he-IL',
});
const page = await ctx.newPage();
const log = [], pageErrors = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) log.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(400);

let targetY = null;
if (args.y) targetY = Number(args.y);
if (args.to) {
  targetY = await page.evaluate(({ sel, progress }) => {
    let el = document.querySelector(sel);
    if (!el) return null;
    // A pinned scene lives inside a ScrollTrigger pin-spacer: its scroll range is the spacer's, not the element's
    if (el.parentElement && el.parentElement.classList.contains('pin-spacer')) el = el.parentElement;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const range = Math.max(0, r.height - window.innerHeight);
    return Math.round(top + range * (progress || 0));
  }, { sel: args.to, progress: Number(args.progress || 0) });
  if (targetY === null) { console.error(`selector not found: ${args.to}`); }
}
if (targetY !== null) {
  if (steps > 1) {
    const start = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(start + (targetY - start) * i / steps));
      await page.waitForTimeout(80);
    }
  } else {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), targetY);
  }
}
await page.waitForTimeout(settle);

const info = await page.evaluate(() => ({ scrollY: window.scrollY, docHeight: document.documentElement.scrollHeight, innerWidth: window.innerWidth, innerHeight: window.innerHeight, overflowX: document.documentElement.scrollWidth > window.innerWidth ? document.documentElement.scrollWidth : 0 }));
const opts = { path: out, fullPage: args.full === 'true' };
if (args.clip) {
  const box = await page.locator(args.clip).first().boundingBox();
  if (box) opts.clip = { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, w), height: Math.min(box.height, h) };
}
await page.screenshot(opts);
await browser.close();
console.log(JSON.stringify({ shot: out, ...info, console: log, pageErrors }, null, 1));
