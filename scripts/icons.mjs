// Rendert alle Geräte-Icons scharf: 4-fach überabgetastet, dann hochwertig verkleinert.
// Aufruf: node scripts/icons.mjs   (benötigt Python mit Pillow für das Verkleinern und favicon.ico)
import { createRequire } from 'node:module';
import { readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'icons');
const tmp = mkdtempSync(path.join(tmpdir(), 'icons-'));

// [Quelle, Ziel, Größe] – kleine Größen nutzen die vereinfachte Variante
const JOBS = [
  ['icon-small.svg', 'favicon-16.png', 16], ['icon-small.svg', 'favicon-32.png', 32], ['icon-small.svg', 'favicon-48.png', 48],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180], ['icon-maskable.svg', 'apple-touch-icon-167.png', 167], ['icon-maskable.svg', 'apple-touch-icon-152.png', 152],
  ['icon.svg', 'icon-192.png', 192], ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-192.png', 192], ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon.svg', 'mstile-150.png', 150], ['icon.svg', 'mstile-310.png', 310],
];
const SS = 4;
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [src, out, size] of JOBS) {
  const big = Math.min(2048, size * SS);
  const svg = readFileSync(path.join(dir, src), 'utf8').replace(/width="512" height="512"/, `width="${big}" height="${big}"`);
  await page.setViewportSize({ width: big, height: big });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: path.join(tmp, out), omitBackground: true });
}
// Social-Vorschau 1200×630
await page.setViewportSize({ width: 1200, height: 630 });
const logo = readFileSync(path.join(dir, 'icon.svg'), 'utf8').replace(/width="512" height="512"/, 'width="300" height="300"');
await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Antonio:wght@700&display=swap" rel="stylesheet"></head>
<body style="margin:0;width:1200px;height:630px;background:radial-gradient(ellipse at 30% 50%,#151a2e,#000 70%);display:flex;align-items:center;gap:56px;padding:0 90px;box-sizing:border-box;font-family:Antonio,sans-serif">
${logo}<div><div style="color:#ffcc99;letter-spacing:.45em;font-size:24px;text-transform:uppercase">Stellare Kartografie</div>
<div style="color:#ff9c3a;font-size:92px;line-height:.95;font-weight:700;text-transform:uppercase;margin:14px 0 22px">Galaktische<br>Sternenkarte</div>
<div style="height:14px;width:520px;background:linear-gradient(90deg,#ff9c3a 0 40%,#000 40% 42%,#cc99cc 42% 70%,#000 70% 72%,#99ccff 72%);border-radius:7px"></div></div></body></html>`);
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(dir, 'og-image.png') });
await browser.close();

// Hochwertig verkleinern (Lanczos) und favicon.ico mit 16/32/48 bauen
execFileSync('python3', ['-c', `
import sys, os
from PIL import Image
tmp, out = sys.argv[1], sys.argv[2]
jobs = ${JSON.stringify(JOBS.map(([, o, s]) => [o, s]))}
for name, size in jobs:
    im = Image.open(os.path.join(tmp, name)).convert('RGBA')
    im = im.resize((size, size), Image.LANCZOS)
    im.save(os.path.join(out, name), optimize=True)
ico = Image.open(os.path.join(out, 'favicon-48.png'))
ico.save(os.path.join(out, '..', 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)])
`, tmp, dir], { stdio: 'inherit' });
console.log('icons written');
