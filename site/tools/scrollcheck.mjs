#!/usr/bin/env node
/*
 * Scrolls the whole page down in steps and back up, collecting console errors, page errors and failed requests.
 *   node tools/scrollcheck.mjs --url http://127.0.0.1:3000/ [--mobile] [--reduced] [--step 300]
 */
import { chromium, devices } from 'playwright';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, s, i, arr) => { if (s.startsWith('--')) { const k = s.slice(2); const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'; a.push([k, v]); } return a; }, []));
const url = args.url || 'http://127.0.0.1:3000/';
const mobile = args.mobile === 'true';
const step = Number(args.step || 300);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }), reducedMotion: args.reduced === 'true' ? 'reduce' : 'no-preference', locale: 'he-IL', colorScheme: 'dark' });
const page = await ctx.newPage();
const log = [], pageErrors = [], failed = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('requestfailed', (r) => { if (!/favicon/.test(r.url())) failed.push(`${r.url()} ${r.failure()?.errorText || ''}`); });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
const loadMs = Date.now() - t0;
const height = await page.evaluate(() => document.documentElement.scrollHeight);
let frames = 0; let maxLong = 0;
await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: 'longtask', buffered: true }); });
for (let y = 0; y <= height; y += step) { await page.mouse.wheel(0, step); await page.waitForTimeout(60); frames++; }
await page.waitForTimeout(500);
for (let y = height; y >= 0; y -= step) { await page.mouse.wheel(0, -step); await page.waitForTimeout(60); }
await page.waitForTimeout(500);
const longTasks = await page.evaluate(() => window.__long || []);
maxLong = Math.max(0, ...longTasks);
const finalY = await page.evaluate(() => window.scrollY);
const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await browser.close();
console.log(JSON.stringify({ url, mobile, reduced: args.reduced === 'true', loadMs, docHeight: height, finalScrollY: finalY, overflowX, longTasks: longTasks.length, maxLongTaskMs: Math.round(maxLong), console: log, pageErrors, failedRequests: failed }, null, 1));
