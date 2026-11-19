// Handy im Querformat: kompaktes Layout, nichts überlappt (eigener Prozess, spart Speicher).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 8000 + Math.floor(Math.random() * 900);
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 500));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let ok = true, why = '';
try {
  for (const vp of [{ width: 844, height: 390 }, { width: 568, height: 320 }]) {
    const ctx = await browser.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html?nointro=1&q=low`);
    await page.waitForFunction(() => window.__map?.ready, null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const box = s => document.querySelector(s).getBoundingClientRect();
      const o = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return { menu: getComputedStyle(document.getElementById('menu-toggle')).display, zoomMini: o(box('.zoom'), box('.minimap-wrap')), sw: document.documentElement.scrollWidth, w: innerWidth };
    });
    if (r.menu === 'none') { ok = false; why += `${vp.width}×${vp.height}: menu button hidden; `; }
    if (r.zoomMini) { ok = false; why += `${vp.width}×${vp.height}: zoom overlaps minimap; `; }
    if (r.sw > r.w) { ok = false; why += `${vp.width}×${vp.height}: horizontal scroll; `; }
    await ctx.close();
  }
} catch (e) { ok = false; why = e.message.split('\n')[0]; }
finally { await browser.close(); server.kill(); }
console.log(ok ? 'ok   phone landscape uses the compact layout' : `FAIL phone landscape uses the compact layout\n     ${why}`);
process.exit(ok ? 0 : 1);
