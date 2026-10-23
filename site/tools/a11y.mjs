#!/usr/bin/env node
// Runs axe-core against the page (desktop or --mobile), optionally scrolled to --to selector. Prints violations as JSON.
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, s, i, arr) => { if (s.startsWith('--')) { const k = s.slice(2); const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'; a.push([k, v]); } return a; }, []));
const url = args.url || 'http://127.0.0.1:3000/';
const mobile = args.mobile === 'true';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...(mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }), locale: 'he-IL', reducedMotion: args.reduced === 'true' ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
if (args.to) { await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView(), args.to); await page.waitForTimeout(800); }
await page.addScriptTag({ content: axeSource });
const result = await page.evaluate(async () => {
  // @ts-ignore
  const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
  return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target, summary: n.failureSummary?.slice(0, 200) })) , count: v.nodes.length })), passes: r.passes.length, incomplete: r.incomplete.length };
});
await browser.close();
console.log(JSON.stringify({ url, mobile, ...result }, null, 1));
