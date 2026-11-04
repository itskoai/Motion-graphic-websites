// Renders the share image and the icon PNGs from their sources. Usage: node review/yoko-ono/tools/icons.mjs (from the repo root)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import path from 'node:path'; import fs from 'node:fs';
const root = '/home/user/Motion-graphic-websites';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(root, 'review/yoko-ono/og/og.html'), { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
await page.screenshot({ path: path.join(root, 'review/yoko-ono/og/og.png'), type: 'png' });
const svg = fs.readFileSync(path.join(root, 'yoko-ono-site/assets/media/favicon.svg'), 'utf8');
for (const [size, file] of [[32, 'favicon-32.png'], [192, 'favicon-192.png'], [180, 'touch-icon-180.png']]) {
  const p = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#101010">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body>`);
  await p.screenshot({ path: path.join(root, 'yoko-ono-site/assets/media/', file) });
  await p.close();
}
await browser.close();
console.log('rendered');
