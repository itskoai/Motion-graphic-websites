// Minimal Chrome DevTools Protocol driver. Zero dependencies (Node 22 WebSocket).
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';

export const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export { sleep };

function getJSON(url, method = 'GET') {
  return new Promise((res, rej) => {
    const req = http.request(url, { method }, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(new Error(d)); } }); });
    req.on('error', rej); req.end();
  });
}

export async function launch(port = 9333) {
  const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${port}`,
    `--user-data-dir=/tmp/claude-chrome-${process.pid}-${port}`, '--window-size=1440,900', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage', '--font-render-hinting=none'];
  if (process.env.HTTPS_PROXY) args.push(`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=127.0.0.1;localhost');
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await getJSON(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  proc.port = port;
  return proc;
}

export class Page {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); this.console = []; this.errors = []; this.requests = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) { const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else if (m.method) (this.handlers.get(m.method) || []).forEach((h) => h(m.params));
    };
  }
  static async open(port = 9333, { swaps = [] } = {}) {
    const t = await getJSON(`http://127.0.0.1:${port}/json/new?about:blank`, 'PUT');
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    const p = new Page(ws);
    await p.send('Page.enable'); await p.send('Runtime.enable'); await p.send('Log.enable'); await p.send('Network.enable');
    p.on('Runtime.consoleAPICalled', (e) => { if (e.type === 'error' || e.type === 'warning') p.console.push(e.type + ': ' + e.args.map((a) => a.value ?? a.description).join(' ')); });
    p.on('Runtime.exceptionThrown', (e) => p.errors.push(e.exceptionDetails.text + ' ' + (e.exceptionDetails.exception?.description || '')));
    p.on('Log.entryAdded', (e) => { if (e.entry.level === 'error') p.console.push('log: ' + e.entry.text + ' ' + (e.entry.url || '')); });
    p.on('Network.requestWillBeSent', (e) => p.requests.push(e.request.url));
    // The bundled Chromium has no H.264 decoder: answer mp4 requests with VP9 test copies of the same frames.
    const active = swaps.filter((s) => existsSync(s.file));
    if (active.length) {
      await p.send('Fetch.enable', { patterns: active.map((s) => ({ urlPattern: s.pattern, requestStage: 'Request' })) });
      p.on('Fetch.requestPaused', (e) => {
        const s = active.find((x) => e.request.url.includes(x.match));
        if (!s) { p.send('Fetch.continueRequest', { requestId: e.requestId }).catch(() => {}); return; }
        const body = readFileSync(s.file).toString('base64');
        p.send('Fetch.fulfillRequest', { requestId: e.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'video/webm' }, { name: 'Content-Length', value: String(Buffer.byteLength(body, 'base64')) }], body }).catch(() => {});
      });
    }
    return p;
  }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
  on(m, h) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(h); }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  }
  async viewport(w, h, { mobile = false, touch = false, scale = 1 } = {}) {
    await this.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile, screenOrientation: { type: h > w ? 'portraitPrimary' : 'landscapePrimary', angle: 0 } });
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 5 });
    if (touch) await this.send('Emulation.setEmitTouchEventsForMouse', { enabled: true });
  }
  async media(features) { await this.send('Emulation.setEmulatedMedia', { features }); }
  async go(url, wait = 700) {
    const loaded = new Promise((r) => this.on('Page.loadEventFired', () => r()));
    await this.send('Page.navigate', { url });
    await Promise.race([loaded, sleep(15000)]);
    await sleep(wait);
  }
  async shot(path, clip) {
    const r = await this.send('Page.captureScreenshot', { format: path.endsWith('.jpg') ? 'jpeg' : 'png', quality: path.endsWith('.jpg') ? 82 : undefined, clip, captureBeyondViewport: false });
    writeFileSync(path, Buffer.from(r.data, 'base64'));
    return path;
  }
  async scroll(y, wait = 150) { await this.eval(`window.scrollTo(0, ${y}); true`); await sleep(wait); }
  async close() { try { this.ws.close(); } catch {} }
}

// CLI: node cdp.mjs shot <url> <out> <w> <h> [waitMs]
if (process.argv[1] && process.argv[1].endsWith('cdp.mjs') && process.argv[2] === 'shot') {
  const [, , , url, out, w = '1440', h = '900', wait = '1500'] = process.argv;
  const chrome = await launch(9341);
  try {
    const p = await Page.open(9341);
    await p.viewport(+w, +h);
    await p.go(url, +wait);
    await p.shot(out);
    console.log('wrote', out, 'errors', JSON.stringify(p.errors), JSON.stringify(p.console));
    await p.close();
  } finally { chrome.kill('SIGKILL'); }
}
