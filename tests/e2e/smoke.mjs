// Playwright-Smoke-Test: startet einen lokalen Server und prüft die Karte im Browser.
// Aufruf: npm run e2e   (optional: SHOTS=dir für Screenshots)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL = `http://127.0.0.1:${PORT}/index.html`;
const SHOTS = process.env.SHOTS;

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message.split('\n')[0]}`); }
}

async function openPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL + '?nointro=1');
  return { page, errors, ctx };
}
const ready = page => page.waitForFunction(() => window.__map && window.__map.ready, null, { timeout: 20000 });
const settle = page => page.waitForFunction(() => !window.__map.state().flying, null, { timeout: 15000 });
async function brightness(page, x, y, r = 40) {
  const buf = await page.screenshot({ clip: { x: x - r, y: y - r, width: 2 * r, height: 2 * r } });
  return page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0, r = 0, gg = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4; return { lum: s / n, r: r / n, g: gg / n, b: b / n };
  }, buf.toString('base64'));
}
const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png') }); };

await sleep(600);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  const { page, errors } = await openPage(browser);

  // ── Task 6: Szene & Galaxie ──
  await check('map becomes ready', () => ready(page));
  await check('galaxy is rendered (center not black)', async () => {
    await sleep(1500);
    const b = await brightness(page, 640, 400);
    assert.ok(b.lum > 30, `lum ${b.lum.toFixed(1)}`);
  });
  await shot(page, '01-galaxie');

  // ── weitere Tasks hängen hier ihre Prüfungen an ──
  await import('./checks.mjs').then(m => m.default({ page, check, assert, sleep, settle, brightness, shot, browser, openPage, ready, devices })).catch(e => {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  });

  await check('no console errors', () => assert.deepEqual(errors, []));

  // ── Kein WebGL ──
  const nogl = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'] });
  const ctx = await nogl.newContext();
  const p2 = await ctx.newPage();
  const errs2 = [];
  p2.on('pageerror', e => errs2.push(e.message));
  await p2.goto(URL);
  await check('no-webgl fallback is shown', async () => {
    await p2.waitForSelector('.no-webgl', { state: 'visible', timeout: 10000 });
    assert.deepEqual(errs2, []);
  });
  await nogl.close();

  // ── Final-Review #2: three.js nicht ladbar -> sichtbare Meldung statt endlosem Intro ──
  const ctx3 = await browser.newContext();
  await ctx3.route(/cdn\.jsdelivr\.net/, r => r.abort());
  const p3 = await ctx3.newPage();
  await p3.goto(URL);
  await check('load failure shows an error instead of a stuck intro', async () => {
    await p3.waitForSelector('.no-webgl', { state: 'visible', timeout: 15000 });
    assert.match(await p3.textContent('.no-webgl'), /laden/i);
  });
  await ctx3.close();

  // ── Final-Review #3: nach dem ersten Besuch offline nutzbar ──
  const ctx4 = await browser.newContext();
  const p4 = await ctx4.newPage();
  await p4.goto(URL + '?nointro=1');
  await ready(p4);
  await p4.evaluate(() => navigator.serviceWorker.ready);
  await p4.waitForFunction(() => window.__offlineReady === true, null, { timeout: 20000 }).catch(() => {});
  await ctx4.setOffline(true);
  await check('works offline after the first visit', async () => {
    await p4.reload();
    await ready(p4);
    assert.equal(await p4.$('.no-webgl'), null);
  });
  await ctx4.close();
} finally {
  await browser.close();
  server.kill();
}
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
