// Erzeugt die Screenshots für README und Vorschau (docs/media). Aufruf: node scripts/screenshots.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || path.join(root, 'docs/media');
const PORT = 8700 + Math.floor(Math.random() * 200);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(600);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const settle = p => p.waitForFunction(() => !window.__map.state().flying, null, { timeout: 20000 });
async function page(opts) {
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${PORT}/index.html?nointro=1&q=high`);
  await p.waitForFunction(() => window.__map?.ready, null, { timeout: 30000 });
  await sleep(1500);
  return p;
}
try {
  const d = await page({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await d.screenshot({ path: `${out}/preview-galaxy.png` });
  await d.evaluate(() => window.__map.flyTo([-300, 25800], { distance: 9500, tilt: 0.55 })); await settle(d); await sleep(800);
  await d.screenshot({ path: `${out}/preview-alpha-beta.png` });
  await d.evaluate(() => window.__map.focus('ds9')); await settle(d); await sleep(1200);
  await d.screenshot({ path: `${out}/preview-ds9.png` });
  await d.evaluate(() => { window.__map.select(null); window.__map.flyTo([24000, -16000], { distance: 52000, tilt: 0.7, azimuth: -0.5 }); }); await settle(d); await sleep(800);
  await d.screenshot({ path: `${out}/preview-delta.png` });
  const m = await page({ ...devices['iPhone 13'] });
  await m.evaluate(() => window.__map.focus('qonos')); await settle(m); await sleep(1200);
  await m.screenshot({ path: `${out}/preview-mobile.png` });
} finally { await browser.close(); server.kill(); }
console.log('screenshots written to', out);
