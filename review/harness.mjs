// Headless Chrome test harness for the scrub site. Zero dependencies (Node 22 WebSocket + CDP).
// Usage: node review/harness.mjs <mode> [args]
//   shots            screenshots at 5 sizes + console check
//   flick <step>     flick test on the beat map (120/240/360)
//   audit            worst-frame legibility audit per band (text hidden, lightest pixel in text box)
//   rm               reduced-motion live flips both ways
//   novideo          load with the video blocked
//   touch            coarse pointer portrait: static hero must show
//   hold             press-and-hold the puff button with a real mouse
//   form             submit the form empty, then valid
//   dom              probe band k values and video time at several scroll positions
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PORT = 9333;
const SITE = process.env.SITE_URL || 'http://127.0.0.1:8080/';
const OUT = '/home/user/Motion-graphic-websites/review/shots';
mkdirSync(OUT, { recursive: true });

function getJSON(url, method = 'GET') {
  return new Promise((res, rej) => {
    const req = http.request(url, { method }, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error(d)); } }); });
    req.on('error', rej); req.end();
  });
}

async function launch() {
  const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=/tmp/claude-chrome-${process.pid}`, '--window-size=1440,900', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage'];
  if (process.env.HTTPS_PROXY) args.push(`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=127.0.0.1;localhost');
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await getJSON(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(200); } }
  return proc;
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); this.console = []; this.errors = [];
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else if (m.method) { (this.handlers.get(m.method) || []).forEach((h) => h(m.params)); } };
  }
  static async open() {
    const t = await getJSON(`http://127.0.0.1:${PORT}/json/new?about:blank`, 'PUT');
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => ws.onopen = r);
    const c = new CDP(ws);
    await c.send('Page.enable'); await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Network.enable');
    c.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error' || p.type === 'warning') c.console.push(p.type + ': ' + p.args.map((a) => a.value ?? a.description).join(' ')); });
    c.on('Runtime.exceptionThrown', (p) => c.errors.push(p.exceptionDetails.text + ' ' + (p.exceptionDetails.exception?.description || '')));
    c.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') c.console.push('log: ' + p.entry.text + ' ' + (p.entry.url || '')); });
    // The bundled Chromium has no H.264 decoder, so in tests the mp4 request is answered with a VP9 copy of the same frames.
    if (process.env.TEST_WEBM && existsSync(process.env.TEST_WEBM)) {
      const body = readFileSync(process.env.TEST_WEBM).toString('base64');
      await c.send('Fetch.enable', { patterns: [{ urlPattern: '*hero-scrub.mp4*', requestStage: 'Request' }] });
      c.on('Fetch.requestPaused', (p) => {
        c.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'video/webm' }, { name: 'Content-Length', value: String(Buffer.byteLength(body, 'base64')) }], body }).catch(() => {});
      });
    }
    return c;
  }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
  on(m, h) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(h); }
  async eval(expr) { const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; }
  async viewport(w, h, { mobile = false, touch = false, scale = 1 } = {}) {
    await this.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile, screenOrientation: { type: h > w ? 'portraitPrimary' : 'landscapePrimary', angle: 0 } });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 5 });
    if (touch) await this.send('Emulation.setEmitTouchEventsForMouse', { enabled: true });
  }
  async go(url) { await this.send('Page.navigate', { url }); await new Promise((r) => { const h = () => r(); this.on('Page.loadEventFired', h); }); await sleep(600); await this.eval('document.documentElement.style.scrollBehavior="auto"; true'); }
  async shot(name, clip) { const r = await this.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: false }); const p = `${OUT}/${name}.png`; writeFileSync(p, Buffer.from(r.data, 'base64')); return p; }
  async scroll(y) { await this.eval(`window.scrollTo(0, ${y}); true`); await sleep(120); }
  async close() { try { this.ws.close(); } catch {} }
}

function lightestPixel(png, box) {
  // crop the box and read raw RGB via ffmpeg; return max luminance (0..1) and its rgb
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', png, '-vf', `crop=${box.w}:${box.h}:${box.x}:${box.y}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 });
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  let best = 0, rgb = [0, 0, 0];
  for (let i = 0; i + 2 < raw.length; i += 3) { const L = 0.2126 * f(raw[i]) + 0.7152 * f(raw[i + 1]) + 0.0722 * f(raw[i + 2]); if (L > best) { best = L; rgb = [raw[i], raw[i + 1], raw[i + 2]]; } }
  return { lum: best, rgb };
}
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const mode = process.argv[2] || 'shots';
const chrome = await launch();
const out = [];
try {
  if (mode === 'shots') {
    const sizes = [[1280, 800], [1440, 900], [1920, 1080], [375, 812, true], [375, 667, true]];
    for (const [w, h, mob] of sizes) {
      const c = await CDP.open();
      await c.viewport(w, h, { mobile: !!mob, touch: !!mob, scale: 1 });
      await c.go(SITE); await sleep(1500);
      await c.shot(`top-${w}x${h}`);
      const total = await c.eval('document.documentElement.scrollHeight');
      const stops = [0.12, 0.3, 0.5, 0.7, 0.85, 0.97];
      for (const s of stops) { await c.scroll(Math.round(total * s)); await sleep(500); await c.shot(`at${Math.round(s * 100)}-${w}x${h}`); }
      const sideways = await c.eval('document.documentElement.scrollWidth > document.documentElement.clientWidth');
      out.push(`${w}x${h}: height=${total} sideways=${sideways} errors=${JSON.stringify(c.errors)} console=${JSON.stringify(c.console)}`);
      await c.close();
    }
  }
  if (mode === 'heroshots') {
    for (const [w, h] of [[1440, 900], [1920, 1080], [1280, 800]]) {
      const c = await CDP.open(); await c.viewport(w, h); await c.go(SITE); await sleep(4500);
      const heroH = await c.eval('document.getElementById("hero").offsetHeight');
      for (const p of [0, 0.1, 0.36, 0.64, 0.86, 1]) { await c.scroll(Math.round((heroH - h) * p)); await sleep(900); await c.shot(`hero-p${Math.round(p * 100)}-${w}`); }
      out.push(`${w}x${h} ready=` + await c.eval('document.querySelector(".stage").classList.contains("video-ready")'));
      await c.close();
    }
  }
  if (mode === 'sections') {
    for (const [w, h, mob] of [[1440, 900, false], [375, 812, true]]) {
      const c = await CDP.open(); await c.viewport(w, h, { mobile: mob, touch: mob }); await c.go(SITE); await sleep(1500);
      for (const id of ['colors', 'puff', 'look', 'turn', 'who', 'how', 'sizes', 'faq', 'order']) {
        await c.eval(`document.getElementById('${id}').scrollIntoView({block:'start'}); window.scrollBy(0, -72); true`); await sleep(1400);
        await c.shot(`sec-${id}-${w}`);
      }
      await c.close();
    }
    out.push('section shots written');
  }
  if (mode === 'dom') {
    const c = await CDP.open(); await c.viewport(1440, 900); await c.go(SITE); await sleep(4000);
    const heroH = await c.eval('document.getElementById("hero").offsetHeight');
    out.push('diag: ' + await c.eval(`(()=>{const v=document.getElementById('heroVideo');return 'canPlay h264='+v.canPlayType('video/mp4; codecs="avc1.42E01E"')+' webm='+v.canPlayType('video/webm; codecs="vp9"')+' readyState='+v.readyState+' networkState='+v.networkState+' error='+(v.error?v.error.code+':'+v.error.message:'none')+' src='+(v.src?v.src.slice(0,30):'')+' classes='+document.querySelector('.stage').className+' preload='+v.preload})()`));
    for (const p of [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9, 1]) {
      await c.scroll(Math.round((heroH - 900) * p)); await sleep(700);
      out.push(`p=${p} ` + await c.eval(`(()=>{const v=document.getElementById('heroVideo');return 'video t='+v.currentTime.toFixed(2)+'/'+(v.duration||0).toFixed(2)+' ready='+document.querySelector('.stage').classList.contains('video-ready')+' bands='+[...document.querySelectorAll('.band')].map((b,i)=>i+':op'+getComputedStyle(b).opacity+'/k'+(getComputedStyle(b).getPropertyValue('--k')||'-').trim()).join(' ')})()`));
    }
    out.push('errors=' + JSON.stringify(c.errors) + ' console=' + JSON.stringify(c.console));
    await c.close();
  }
  if (mode === 'flick') {
    const step = parseInt(process.argv[3] || '120', 10);
    const c = await CDP.open(); await c.viewport(1440, 900); await c.go(SITE); await sleep(3500);
    const heroH = await c.eval('document.getElementById("hero").offsetHeight');
    const count = Math.ceil((heroH - 900) / step) + 2;
    const series = [];
    for (let i = 0; i < count; i++) {
      await c.eval(`window.scrollBy(0, ${step}); true`); await sleep(400);
      series.push(await c.eval(`'y='+Math.round(scrollY)+' '+[...document.querySelectorAll('.band')].map((b,n)=>n+':'+(+getComputedStyle(b).opacity).toFixed(2)).join(' ')`));
    }
    // summarize: per band, count of steps at opacity >= 0.98 and max opacity
    const bandsN = await c.eval('document.querySelectorAll(".band").length');
    const stats = Array.from({ length: bandsN }, () => ({ full: 0, max: 0, maxRun: 0, run: 0 }));
    for (const line of series) { line.split(' ').slice(1).forEach((tok) => { const [n, v] = tok.split(':'); const s = stats[+n]; const f = parseFloat(v); s.max = Math.max(s.max, f); if (f >= 0.98) { s.full++; s.run++; s.maxRun = Math.max(s.maxRun, s.run); } else s.run = 0; }); }
    out.push(`step=${step} steps=${count}`); stats.forEach((s, i) => out.push(`band ${i}: fullSteps=${s.full} longestRun=${s.maxRun} max=${s.max.toFixed(2)}`));
    out.push(...series);
    await c.close();
  }
  if (mode === 'audit') {
    const c = await CDP.open(); await c.viewport(1440, 900); await c.go(SITE); await sleep(5000);
    const ready = await c.eval('document.querySelector(".stage").classList.contains("video-ready")');
    out.push('video-ready=' + ready);
    const heroH = await c.eval('document.getElementById("hero").offsetHeight');
    const bands = await c.eval('[...document.querySelectorAll(".band")].map(b=>({a:+b.dataset.a,b:+b.dataset.b}))');
    await c.eval(`(()=>{const s=document.createElement('style');s.id='auditcss';s.textContent='.band .vis,.band .sub,.band .row,.band .chip{visibility:hidden !important}';document.head.appendChild(s);return true})()`);
    for (let i = 0; i < bands.length; i++) {
      const { a, b } = bands[i];
      const probes = [a + (b - a) * 0.15, a + (b - a) * 0.5, a + (b - a) * 0.85];
      let worst = { ratio: 99 };
      for (const p of probes) {
        await c.scroll(Math.round((heroH - 900) * p)); await sleep(900);
        const box = await c.eval(`(()=>{const b=document.querySelectorAll('.band')[${i}];const r=b.getBoundingClientRect();return {x:Math.max(0,Math.round(r.left)),y:Math.max(0,Math.round(r.top)),w:Math.round(r.width),h:Math.round(r.height)}})()`);
        const png = await c.shot(`audit-b${i}-p${Math.round(p * 100)}`);
        const lp = lightestPixel(png, box);
        const ratio = contrast(lum([243, 241, 234]), lp.lum);
        if (ratio < worst.ratio) worst = { ratio, p: p.toFixed(2), rgb: lp.rgb, box };
      }
      out.push(`band ${i}: worst contrast ${worst.ratio.toFixed(2)}:1 at p=${worst.p} lightest=${worst.rgb} box=${JSON.stringify(worst.box)} ${worst.ratio >= 3.5 ? 'PASS' : 'FAIL'}`);
    }
    await c.close();
  }
  if (mode === 'rm') {
    const c = await CDP.open(); await c.viewport(1440, 900);
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const reqs = []; c.on('Network.requestWillBeSent', (p) => reqs.push(p.request.url));
    await c.go(SITE); await sleep(2500);
    out.push('rm-on: static hero visible=' + await c.eval('getComputedStyle(document.querySelector(".static-hero")).display') + ' hero display=' + await c.eval('getComputedStyle(document.getElementById("hero")).display') + ' video requested=' + reqs.some((u) => u.includes('hero-scrub')) + ' poster requested=' + reqs.some((u) => u.includes('hero-poster')));
    await c.shot('rm-on-top');
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }); await sleep(2500);
    out.push('rm-off: hero display=' + await c.eval('getComputedStyle(document.getElementById("hero")).display') + ' scrub armed=' + await c.eval('document.documentElement.classList.contains("scrub")') + ' video requested=' + reqs.some((u) => u.includes('hero-scrub')));
    await c.scroll(1200); await sleep(800);
    out.push('rm-off scrolled: ' + await c.eval(`[...document.querySelectorAll('.band')].map((b,n)=>n+':'+(+getComputedStyle(b).opacity).toFixed(2)).join(' ')`));
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); await sleep(1500);
    out.push('rm-on again: puff done=' + await c.eval('document.getElementById("puff").classList.contains("done")') + ' draw offset=' + await c.eval('document.querySelector(".draw").style.strokeDashoffset') + ' hero display=' + await c.eval('getComputedStyle(document.getElementById("hero")).display'));
    out.push('errors=' + JSON.stringify(c.errors));
    await c.close();
  }
  if (mode === 'novideo') {
    const c = await CDP.open(); await c.viewport(1440, 900);
    await c.send('Network.setBlockedURLs', { urls: ['*hero-scrub.mp4*'] });
    await c.go(SITE); await sleep(3000);
    out.push('failed class=' + await c.eval('document.querySelector(".stage").classList.contains("video-failed")') + ' poster=' + await c.eval('document.querySelector(".poster").style.backgroundImage') + ' ring done=' + await c.eval('document.querySelector(".ring").classList.contains("done")'));
    await c.shot('novideo-top');
    const heroH = await c.eval('document.getElementById("hero").offsetHeight');
    await c.scroll(heroH - 900); await sleep(800); await c.shot('novideo-settle');
    out.push('settle band opacity=' + await c.eval('getComputedStyle(document.querySelectorAll(".band")[3]).opacity'));
    out.push('errors=' + JSON.stringify(c.errors) + ' console=' + JSON.stringify(c.console));
    await c.close();
  }
  if (mode === 'touch') {
    const c = await CDP.open(); await c.viewport(820, 1180, { mobile: true, touch: true });
    const reqs = []; c.on('Network.requestWillBeSent', (p) => reqs.push(p.request.url));
    await c.go(SITE); await sleep(2500);
    out.push('portrait tablet coarse: static=' + await c.eval('getComputedStyle(document.querySelector(".static-hero")).display') + ' hero=' + await c.eval('getComputedStyle(document.getElementById("hero")).display') + ' video requested=' + reqs.some((u) => u.includes('hero-scrub')));
    await c.shot('touch-portrait');
    await c.viewport(1180, 820, { mobile: true, touch: true }); await sleep(2500);
    out.push('rotated landscape coarse 1180x820: hero=' + await c.eval('getComputedStyle(document.getElementById("hero")).display') + ' scrub armed=' + await c.eval('document.documentElement.classList.contains("scrub")') + ' poster=' + await c.eval('document.querySelector(".poster").style.backgroundImage'));
    await c.shot('touch-landscape');
    await c.viewport(844, 390, { mobile: true, touch: true }); await sleep(1500);
    out.push('landscape phone 844x390: static=' + await c.eval('getComputedStyle(document.querySelector(".static-hero")).display'));
    out.push('errors=' + JSON.stringify(c.errors));
    await c.close();
  }
  if (mode === 'hold') {
    const c = await CDP.open(); await c.viewport(1440, 900); await c.go(SITE); await sleep(1500);
    await c.eval('document.documentElement.style.scrollBehavior="auto"; document.getElementById("puffBtn").scrollIntoView({block:"center"}); true'); await sleep(1200);
    const r = await c.eval('(()=>{const r=document.getElementById("puffBtn").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2, tag:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2).tagName}})()');
    out.push('target at ' + JSON.stringify(r));
    await c.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await sleep(500); out.push('mid-hold p=' + await c.eval('getComputedStyle(document.getElementById("puff")).getPropertyValue("--p")'));
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await sleep(900); out.push('after early release p=' + await c.eval('getComputedStyle(document.getElementById("puff")).getPropertyValue("--p")') + ' done=' + await c.eval('document.getElementById("puff").classList.contains("done")'));
    await c.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await sleep(1800);
    await c.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
    await sleep(600); out.push('after full hold p=' + await c.eval('getComputedStyle(document.getElementById("puff")).getPropertyValue("--p")') + ' done=' + await c.eval('document.getElementById("puff").classList.contains("done")') + ' hint=' + await c.eval('document.querySelector("#puffBtn .hint").textContent'));
    await c.shot('hold-done');
    out.push('errors=' + JSON.stringify(c.errors));
    await c.close();
  }
  if (mode === 'form') {
    const c = await CDP.open(); await c.viewport(1440, 900); await c.go(SITE); await sleep(1200);
    await c.eval('document.getElementById("order").scrollIntoView(); true'); await sleep(600);
    await c.eval('document.querySelector("#dropForm button[type=submit]").click(); true'); await sleep(300);
    out.push('empty submit error=' + await c.eval('document.querySelector(".form-error").textContent') + ' hidden=' + await c.eval('document.querySelector(".form-error").hidden'));
    await c.eval('document.getElementById("f-name").value="נועה"; document.getElementById("f-contact").value="0501234567"; document.querySelector("input[name=color][value=day]").checked=true; document.querySelector("#dropForm button[type=submit]").click(); true'); await sleep(500);
    out.push('valid submit done hidden=' + await c.eval('document.querySelector(".form-done").hidden') + ' text=' + await c.eval('document.querySelector(".form-done").textContent.replace(/\\s+/g," ").trim()'));
    await c.shot('form-done');
    // quiz
    await c.eval('document.querySelector("[data-sky=night]").click(); true'); await sleep(300);
    out.push('quiz night: result hidden=' + await c.eval('document.querySelector(".sky-result[data-for=night]").hidden') + ' day hidden=' + await c.eval('document.querySelector(".sky-result[data-for=day]").hidden') + ' radio=' + await c.eval('document.querySelector("input[name=color]:checked").value'));
    // turn dots
    await c.eval('document.querySelectorAll(".turn")[0].querySelectorAll(".turn-dot")[2].click(); true'); await sleep(100);
    out.push('turn dot 2 tx=' + await c.eval('document.querySelectorAll(".turn img")[0].style.getPropertyValue("--tx")'));
    // anchors
    for (const id of ['colors', 'puff', 'look', 'sizes', 'faq', 'order']) out.push(`anchor #${id} exists=` + await c.eval(`!!document.getElementById('${id}')`));
    out.push('errors=' + JSON.stringify(c.errors) + ' console=' + JSON.stringify(c.console));
    await c.close();
  }
} finally {
  chrome.kill('SIGKILL');
}
console.log(out.join('\n'));
