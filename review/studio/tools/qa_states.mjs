// State QA: gates, reduced motion (load + live flips), missing video, overflow, forms, menu, dialog, entrances.
// node qa_states.mjs <outdir>
import { launch, Page, sleep } from './cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const out = process.argv[2] || '/tmp/qa-states';
mkdirSync(out, { recursive: true });
const ENC = path.join(ROOT, 'review/studio/enc');
const swaps = [
  { pattern: '*hero-scrub.mp4*', match: 'hero-scrub.mp4', file: path.join(ENC, 'hero-scrub.webm') },
  { pattern: '*door-loop.mp4*', match: 'door-loop.mp4', file: path.join(ENC, 'door-loop.webm') },
  { pattern: '*door-loop-m.mp4*', match: 'door-loop-m.mp4', file: path.join(ENC, 'door-loop-m.webm') },
  { pattern: '*reel.mp4*', match: 'reel.mp4', file: path.join(ENC, 'reel.webm') },
  { pattern: '*site-capture.mp4*', match: 'site-capture.mp4', file: path.join(ENC, 'site-capture.webm') },
];
const BASE = (process.env.SITE_BASE || 'http://127.0.0.1:8790/') + 'index.html';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

const PORT = +process.env.CDP_PORT || 9381;
const chrome = await launch(PORT);
try {
  // ---------- gates: which hero each device gets ----------
  const gates = [
    ['desktop 1440x900', 1440, 900, {}, 'video'],
    ['laptop 1280x800', 1280, 800, {}, 'video'],
    ['narrow window 700x900', 700, 900, {}, 'frames'],
    ['iPad portrait 768x1024 touch', 768, 1024, { mobile: true, touch: true, scale: 2 }, 'frames'],
    ['iPad landscape 1024x768 touch', 1024, 768, { mobile: true, touch: true, scale: 2 }, 'video'],
    ['phone 375x667', 375, 667, { mobile: true, touch: true, scale: 2 }, 'frames'],
    ['phone landscape 844x390 touch', 844, 390, { mobile: true, touch: true, scale: 3 }, 'static'],
    ['short desktop window 1280x500', 1280, 500, {}, 'static'],
    ['laptop at 200% zoom 683x384', 683, 384, {}, 'static'],
  ];
  for (const [name, w, h, opt, want] of gates) {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(w, h, opt);
    await p.go(BASE, 1800);
    const mode = await p.eval('document.documentElement.dataset.hero');
    const overflow = await p.eval('document.documentElement.scrollWidth - innerWidth');
    check(`gate ${name} -> ${want}`, mode === want, `got ${mode}`);
    check(`no sideways scroll ${name}`, overflow <= 0, `overflow ${overflow}px`);
    // try to force sideways: every anchor
    const ov2 = await p.eval(`(async () => { let worst = 0; for (const a of document.querySelectorAll('a[href^="#"]')) { const id = a.getAttribute('href').slice(1); const t = document.getElementById(id); if (t) { t.scrollIntoView(); await new Promise(r => setTimeout(r, 30)); worst = Math.max(worst, document.documentElement.scrollWidth - innerWidth, scrollX); } } return worst; })()`);
    check(`anchors keep page straight ${name}`, ov2 <= 0, `worst ${ov2}`);
    if (want === 'static') {
      const vidReq = p.requests.some((u) => u.includes('hero-scrub') || u.includes('/herom/'));
      check(`static gate loads no scrub media ${name}`, !vidReq);
    }
    await p.close();
  }

  // ---------- reduced motion on load ----------
  {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(1440, 900);
    await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await p.go(BASE, 2500);
    const mode = await p.eval('document.documentElement.dataset.hero');
    check('reduced motion -> static hero', mode === 'static', mode);
    const req = p.requests.filter((u) => u.includes('hero-scrub') || u.includes('/herom/') || (/\/idea\/[dm]\d\d/.test(u) && !/31\.webp/.test(u)));
    check('reduced motion requests no scrub video or frame sequences (one final still only)', req.length === 0, req.slice(0, 3).join(' '));
    const vis = await p.eval(`[...document.querySelectorAll('.reveal, .m-line, .step-l, .minds-p, .xform-outro')].filter(el => +getComputedStyle(el).opacity < 0.99).length`);
    check('reduced motion shows every choreographed element finished', vis === 0, `${vis} not visible`);
    await p.shot(path.join(out, 'rm-top.jpg'));
    await p.eval(`document.querySelector('#idea').scrollIntoView(), 1`); await sleep(600);
    await p.shot(path.join(out, 'rm-idea.jpg'));
    await p.eval(`document.querySelector('#minds').scrollIntoView(), 1`); await sleep(600);
    await p.shot(path.join(out, 'rm-minds.jpg'));
    check('reduced motion console clean', p.errors.length === 0, JSON.stringify(p.errors));
    await p.close();
  }

  // ---------- reduced motion flipped live, both directions ----------
  {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(1440, 900);
    await p.go(BASE, 3000);
    await p.eval(`window.scrollTo(0, document.querySelector('.hero').offsetHeight * 0.3), 1`); await sleep(1200);
    await p.media([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await sleep(800);
    const m1 = await p.eval('document.documentElement.dataset.hero');
    const rm = await p.eval(`document.documentElement.classList.contains('rm')`);
    const xfStatic = await p.eval(`getComputedStyle(document.querySelector('.xform-pin')).position`);
    check('flip ON mid-session -> static hero + pinned scenes', m1 === 'static' && rm && xfStatic === 'relative', `${m1} rm=${rm} xform=${xfStatic}`);
    await p.media([]);
    await sleep(1000);
    const m2 = await p.eval('document.documentElement.dataset.hero');
    await p.eval(`window.scrollTo(0, document.querySelector('.hero').getBoundingClientRect().top + scrollY + (document.querySelector('.hero').offsetHeight - innerHeight) * 0.31), 1`);
    await sleep(1500);
    const op = await p.eval(`+getComputedStyle(document.querySelector('.b2')).opacity`);
    const t = await p.eval(`document.querySelector('.hero-video').currentTime`);
    check('flip OFF -> scrub re-armed, bands recompute', m2 === 'video' && op > 0.95 && t > 0.5, `${m2} b2=${op} t=${t.toFixed(2)}`);
    await p.eval(`document.querySelector('#idea').scrollIntoView(), 1`);
    await p.eval(`window.scrollBy(0, innerHeight * 1.2), 1`); await sleep(1400);
    const xfPos = await p.eval(`getComputedStyle(document.querySelector('.xform-pin')).position`);
    const s = await p.eval(`getComputedStyle(document.querySelector('.xform-frame')).getPropertyValue('--s')`);
    check('flip OFF -> transformation scene driven again', xfPos === 'sticky', `pos ${xfPos} --s ${s}`);
    check('flip console clean', p.errors.length === 0, JSON.stringify(p.errors));
    await p.close();
  }

  // ---------- complete without the video ----------
  {
    const p = await Page.open(PORT, {});
    await p.send('Network.setBlockedURLs', { urls: ['*hero-scrub*'] });
    await p.viewport(1440, 900);
    await p.go(BASE, 3000);
    const failed = await p.eval(`document.querySelector('.hero').classList.contains('media-failed')`);
    const still = await p.eval(`document.querySelector('.hero-still').getAttribute('src')`);
    await p.shot(path.join(out, 'novideo-top.jpg'));
    await p.eval(`window.scrollTo(0, (document.querySelector('.hero').offsetHeight - innerHeight) * 0.92), 1`); await sleep(1500);
    const still2 = await p.eval(`document.querySelector('.hero-still').getAttribute('src')`);
    const settle = await p.eval(`+getComputedStyle(document.querySelector('.settle')).opacity`);
    await p.shot(path.join(out, 'novideo-settle.jpg'));
    check('no video: page falls back to stills and keeps every caption', failed && /poster/.test(still) && /end/.test(still2) && settle > 0.95, `failed=${failed} ${still} -> ${still2} settle=${settle}`);
    const cue = await p.eval(`document.querySelector('.cue').classList.contains('loaded')`);
    check('no video: ring replaced, never stuck', cue);
    await p.close();
  }

  // ---------- frames missing on a phone ----------
  {
    const p = await Page.open(PORT, {});
    await p.send('Network.setBlockedURLs', { urls: ['*/herom/*'] });
    await p.viewport(390, 844, { mobile: true, touch: true, scale: 2 });
    await p.go(BASE, 3500);
    const still = await p.eval(`document.querySelector('.hero-still').getAttribute('src')`);
    const op = await p.eval(`+getComputedStyle(document.querySelector('.b1')).opacity`);
    await p.shot(path.join(out, 'noframes-phone.jpg'));
    check('no frames on phone: portrait still and caption shown', /poster-m/.test(still) && op > 0.95, `${still} b1=${op}`);
    await p.close();
  }

  // ---------- forms against the real PHP endpoint ----------
  {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(1440, 900);
    await p.go(BASE, 2500);
    await p.eval(`document.querySelector('#notify-form').scrollIntoView({block:'center'}), 1`); await sleep(500);
    // empty submit
    await p.eval(`document.querySelector('#notify-form button[type=submit]').click(), 1`); await sleep(300);
    const err1 = await p.eval(`[document.querySelector('#n-email').getAttribute('aria-invalid'), document.querySelector('#notify-form .field-err')?.textContent]`);
    check('notify: empty email blocked with a message', err1[0] === 'true' && !!err1[1], JSON.stringify(err1));
    // email ok, consent missing
    await p.eval(`(() => { const i = document.querySelector('#n-email'); i.value = 'qa+notify@example.com'; i.dispatchEvent(new Event('input', {bubbles:true})); document.querySelector('#notify-form button[type=submit]').click(); return 1; })()`); await sleep(300);
    const st1 = await p.eval(`document.querySelector('#notify-form .form-status').textContent`);
    check('notify: consent box required', /סמנו|לסמן/.test(st1), st1);
    await p.eval(`(() => { document.querySelector('#n-consent').click(); document.querySelector('#notify-form button[type=submit]').click(); return 1; })()`); await sleep(3200);
    const st2 = await p.eval(`[document.querySelector('#notify-form .form-status').textContent, document.querySelector('#notify-form').classList.contains('sent')]`);
    check('notify: saved, honest success shown', /ברשימה/.test(st2[0]) && st2[1], JSON.stringify(st2));
    // inquiry
    await p.eval(`document.querySelector('#inquiry-form').scrollIntoView({block:'center'}), 1`); await sleep(400);
    await p.eval(`(() => { const f = document.querySelector('#inquiry-form'); f.querySelector('#q-name').value = 'בדיקת QA'; f.querySelector('#q-contact').value = '12'; f.querySelector('#q-message').value = 'רוצים סרט קצר למותג'; f.querySelector('button[type=submit]').click(); return 1; })()`); await sleep(300);
    const e2 = await p.eval(`document.querySelector('#q-contact').getAttribute('aria-invalid')`);
    check('inquiry: bad contact caught', e2 === 'true');
    await p.eval(`(() => { const f = document.querySelector('#inquiry-form'); const c = f.querySelector('#q-contact'); c.value = '050-555-0101'; c.dispatchEvent(new Event('input', {bubbles:true})); f.querySelector('button[type=submit]').click(); return 1; })()`); await sleep(3200);
    const st3 = await p.eval(`document.querySelector('#inquiry-form .form-status').textContent`);
    check('inquiry: saved, honest success shown', /קיבלנו/.test(st3), st3);
    await p.shot(path.join(out, 'forms-after.jpg'));
    // endpoint down: must say it failed
    await p.eval(`(() => { window.SITE_CONFIG.forms.endpoint = 'api/missing.php'; const f = document.querySelector('#notify-form-2'); f.querySelector('#n2-email').value = 'qa2@example.com'; f.querySelector('#n2-consent').checked = true; f.querySelector('button[type=submit]').click(); return 1; })()`); await sleep(3200);
    const st4 = await p.eval(`[document.querySelector('#notify-form-2 .form-status').textContent, document.querySelector('#notify-form-2').classList.contains('sent')]`);
    check('endpoint down: failure shown, never a fake success', /השתבש/.test(st4[0]) && !st4[1], JSON.stringify(st4));
    check('forms console clean', p.errors.length === 0, JSON.stringify(p.errors));
    await p.close();
  }

  // ---------- conversion additions: the phone bar, "want one like this?" links, topic chips ----------
  {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(390, 844, { mobile: true, touch: true, scale: 2 });
    await p.go(BASE, 2500);
    const top = (sel, off) => `window.scrollTo(0, document.querySelector('${sel}').getBoundingClientRect().top + scrollY + ${off}), 1`;
    const barOn = () => p.eval(`document.querySelector('[data-subcta]').classList.contains('on')`);
    const atHero = await barOn();
    await p.eval(top('#worlds', 300)); await sleep(800); const atWorlds = await barOn();
    await p.eval(top('#minds', 900)); await sleep(800); const atMinds = await barOn();
    await p.eval(top('#work', 200)); await sleep(800); const atWork = await barOn();
    await p.eval(top('#contact', 100)); await sleep(800); const atContact = await barOn();
    check('phone bar: off in the hero, on between scenes, off over pinned scenes and at the contact scene', !atHero && atWorlds && !atMinds && atWork && !atContact, JSON.stringify({ atHero, atWorlds, atMinds, atWork, atContact }));
    // no topic and no message: a clear prompt, nothing sent
    await p.eval(`(() => { const f = document.querySelector('#inquiry-form'); f.querySelector('#q-name').value = 'בדיקת צ׳יפים'; f.querySelector('#q-contact').value = '050-555-0102'; f.querySelector('button[type=submit]').click(); return 1; })()`); await sleep(400);
    const e0 = await p.eval(`[document.querySelector('#q-message').getAttribute('aria-invalid'), (document.querySelector('#q-message-err') || {}).textContent || '', document.querySelector('.needs').classList.contains('invalid')]`);
    check('inquiry: no topic and no message asks for one of them', e0[0] === 'true' && /סמנו משהו/.test(e0[1]) && e0[2], JSON.stringify(e0));
    // "רוצים דמות כזו?" marks its topic and jumps to the form
    await p.eval(`document.querySelector('.proj-series').scrollIntoView({block:'center'}), 1`); await sleep(700);
    await p.eval(`document.querySelector('.proj-series .proj-ask').click(), 1`); await sleep(2800);
    const chipSeen = (k) => `(() => { const r = document.querySelector('.chip[data-chip="${k}"]').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`;
    const mk = await p.eval(`[document.querySelector('.chip[data-chip="character"]').getAttribute('aria-pressed'), ${chipSeen('character')}, document.querySelector('#q-message').required, document.querySelector('[data-msg-label]').textContent]`);
    check('"רוצים דמות כזו?" marks the topic and lands with it on screen', mk[0] === 'true' && mk[1] && mk[2] === false && /לא חובה/.test(mk[3]), JSON.stringify(mk));
    // the viewer's button closes the viewer and does the same
    await p.eval(`document.querySelector('.proj-site').scrollIntoView({block:'center'}), 1`); await sleep(700);
    await p.eval(`document.querySelector('[data-open="merch"]').click(), 1`); await sleep(700);
    await p.eval(`document.querySelector('#viewer .viewer-foot a').click(), 1`); await sleep(2800);
    const vk = await p.eval(`[document.querySelector('#viewer').open, document.documentElement.classList.contains('viewer-open'), document.querySelector('.chip[data-chip="site"]').getAttribute('aria-pressed'), ${chipSeen('site')}]`);
    check('viewer "רוצים אתר כזה?": closes the viewer, marks the topic, lands with it on screen', !vk[0] && !vk[1] && vk[2] === 'true' && vk[3], JSON.stringify(vk));
    // send with topics only
    await p.eval(`document.querySelector('#inquiry-form button[type=submit]').click(), 1`); await sleep(3300);
    const st = await p.eval(`[document.querySelector('#inquiry-form .form-status').textContent, document.querySelector('.chip[data-chip="character"]').getAttribute('aria-pressed'), (() => { const r = document.querySelector('#inquiry-form .form-status').getBoundingClientRect(); return r.top >= 60 && r.bottom <= innerHeight; })()]`);
    check('inquiry with topics and no message: saved, chips reset, answer on screen', /קיבלנו/.test(st[0]) && st[1] === 'false' && st[2], JSON.stringify(st));
    check('conversion additions: console clean', p.errors.length === 0, JSON.stringify(p.errors));
    await p.close();
  }

  // ---------- double opt-in on (the production default), on a throwaway server ----------
  for (const [label, mailOk] of [['confirm mail sent', true], ['confirm mail fails', false]]) {
    const { spawn } = await import('node:child_process');
    const { readdirSync, readFileSync, rmSync } = await import('node:fs');
    const dir = path.join(out, 'optin-' + (mailOk ? 'ok' : 'fail'));
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const cfg = path.join(dir, 'config.php');
    writeFileSync(cfg, `<?php return ['LEADS_DIR' => '${dir}/leads', 'CONFIRM_EMAILS' => true, 'MAIL_FROM' => 'site@example.com', 'SITE_URL' => 'https://example.com', 'RATE_MAX' => 50, 'SITE_MAX' => 100];`);
    const port = 8796;
    const srv = spawn('php', ['-d', 'sendmail_path=' + (mailOk ? '/bin/true' : '/bin/false'), '-S', `127.0.0.1:${port}`, '-t', path.join(ROOT, 'studio-site')], { env: { ...process.env, LEAD_CONFIG: cfg }, stdio: 'ignore' });
    await sleep(800);
    try {
      const p = await Page.open(PORT, { swaps });
      await p.viewport(1440, 900);
      await p.go(`http://127.0.0.1:${port}/index.html`, 2500);
      await p.eval(`document.querySelector('#notify-form-2').scrollIntoView({block:'center'}), 1`); await sleep(400);
      await p.eval(`(() => { const f = document.querySelector('#notify-form-2'); f.querySelector('#n2-email').value = 'optin@example.com'; f.querySelector('#n2-consent').checked = true; f.querySelector('button[type=submit]').click(); return 1; })()`); await sleep(3400);
      const st = await p.eval(`[document.querySelector('#notify-form-2 .form-status').textContent, document.querySelector('#notify-form-2').classList.contains('sent'), document.querySelector('#notify-form-2 .form-status').className]`);
      const rows = readdirSync(path.join(dir, 'leads')).filter((f) => f.startsWith('notify-'));
      const saved = rows.length ? readFileSync(path.join(dir, 'leads', rows[0]), 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [];
      if (mailOk) {
        check('double opt-in: saved, page asks to confirm by email', /כמעט סיימנו/.test(st[0]) && st[1] && saved.length === 1 && saved[0].confirmed === false, JSON.stringify(st));
        const token = saved[0] && saved[0].token;
        const get = await (await fetch(`http://127.0.0.1:${port}/api/confirm.php?t=${token}`)).text();
        const before = readdirSync(path.join(dir, 'leads')).some((f) => f.startsWith('confirm-'));
        const post = await fetch(`http://127.0.0.1:${port}/api/confirm.php`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 't=' + token });
        const after = readdirSync(path.join(dir, 'leads')).some((f) => f.startsWith('confirm-'));
        check('double opt-in: the link opens a confirm page, only the button press confirms', /עוד לחיצה/.test(get) && !before && post.ok && after, `get=${/עוד לחיצה/.test(get)} before=${before} post=${post.status} after=${after}`);
      } else {
        check('double opt-in: a failed confirm mail is said plainly and the form stays usable', /לא יצא/.test(st[0]) && !st[1] && /err/.test(st[2]) && saved.length === 1, JSON.stringify(st));
      }
      await p.close();
    } finally { srv.kill('SIGKILL'); }
  }

  // ---------- menu, dialog, entrances, links ----------
  {
    const p = await Page.open(PORT, { swaps });
    await p.viewport(390, 844, { mobile: true, touch: true, scale: 2 });
    await p.go(BASE, 2500);
    await p.eval(`document.querySelector('.menu-btn').click(), 1`); await sleep(500);
    const open = await p.eval(`[!document.querySelector('#menu-sheet').hidden, document.querySelector('#main').inert, document.activeElement.textContent]`);
    await p.shot(path.join(out, 'menu-open.jpg'));
    check('menu opens, page behind is inert, focus moves in', open[0] && open[1], JSON.stringify(open));
    await p.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape'})), 1`); await sleep(300);
    const closed = await p.eval(`document.querySelector('#menu-sheet').hidden && !document.querySelector('#main').inert`);
    check('Escape closes the menu', closed);
    await p.eval(`document.querySelector('.menu-btn').click(), 1`); await sleep(300);
    await p.eval(`document.querySelector('#menu-sheet a[href="#work"]').click(), 1`); await sleep(2500);
    const wy = await p.eval(`Math.round(document.querySelector('#work').getBoundingClientRect().top)`);
    check('menu link lands on the section', Math.abs(wy) < 120 && await p.eval(`document.querySelector('#menu-sheet').hidden`), `top ${wy}`);
    await p.eval(`document.querySelector('[data-open="series"]').click(), 1`); await sleep(800);
    const dlg = await p.eval(`[document.querySelector('#viewer').open, document.querySelector('#viewer-t').textContent, !!document.querySelector('#viewer video')]`);
    await p.shot(path.join(out, 'dialog-series.jpg'));
    check('series viewer opens with the reel', dlg[0] && dlg[2], JSON.stringify(dlg));
    await p.eval(`document.querySelector('#viewer [data-close]').click(), 1`); await sleep(400);
    const fb = await p.eval(`[document.querySelector('#viewer').open, document.activeElement.dataset.open]`);
    check('viewer closes and focus returns', !fb[0] && fb[1] === 'series', JSON.stringify(fb));
    await p.eval(`document.querySelector('[data-open="merch"]').click(), 1`); await sleep(800);
    const imgs = await p.eval(`document.querySelectorAll('#viewer .viewer-gallery img').length`);
    await p.shot(path.join(out, 'dialog-merch.jpg'));
    check('merch viewer shows the gallery', imgs >= 5, `${imgs} images`);
    await p.eval(`document.querySelector('#viewer [data-close]').click(), 1`); await sleep(300);
    // entrances
    const total = await p.eval(`document.querySelectorAll('.reveal').length`);
    await p.eval(`(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } return 1; })()`); await sleep(800);
    const inCount = await p.eval(`document.querySelectorAll('.reveal.in').length`);
    check('every entrance plays', inCount === total, `${inCount}/${total}`);
    const privacy = await p.eval(`fetch('privacy.html').then(r => r.status)`);
    check('privacy page reachable', privacy === 200);
    check('ui console clean', p.errors.length === 0 && p.console.length === 0, JSON.stringify(p.errors.concat(p.console)));
    await p.close();
  }
} finally { chrome.kill('SIGKILL'); }
writeFileSync(path.join(out, 'states.json'), JSON.stringify(results, null, 1));
const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} passed`);
