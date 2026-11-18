// Prüft, dass die Karte nach dem ersten Besuch offline startet (nur Service-Worker-Cache).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8000 + Math.floor(Math.random() * 900);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(500);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let ok = false, why = '';
try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/index.html?nointro=1&q=low`);
  await page.waitForFunction(() => window.__map?.ready, null, { timeout: 30000 });
  await page.waitForFunction(() => window.__offlineReady === true, null, { timeout: 20000 }).catch(() => {});
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.clearBrowserCache');
  await ctx.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForFunction(() => window.__map?.ready || document.querySelector('.no-webgl'), null, { timeout: 25000 });
  ok = await page.evaluate(() => !!window.__map?.ready && !document.querySelector('.no-webgl'));
  if (!ok) why = 'error screen shown offline';
} catch (e) { why = e.message.split('\n')[0]; }
finally { await browser.close(); server.kill(); }
console.log(ok ? 'ok   works offline after the first visit' : `FAIL works offline after the first visit\n     ${why}`);
process.exit(ok ? 0 : 1);
