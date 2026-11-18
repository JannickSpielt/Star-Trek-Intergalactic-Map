import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const pngSize = f => { const b = readFileSync(new URL(f, root)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

// Icons pro Gerät: Browser-Tab, iPhone/iPad, Android, Windows, Social-Vorschau
const REQUIRED = {
  'icons/favicon-16.png': [16, 16], 'icons/favicon-32.png': [32, 32], 'icons/favicon-48.png': [48, 48],
  'icons/apple-touch-icon.png': [180, 180], 'icons/apple-touch-icon-167.png': [167, 167], 'icons/apple-touch-icon-152.png': [152, 152],
  'icons/icon-192.png': [192, 192], 'icons/icon-512.png': [512, 512],
  'icons/icon-maskable-192.png': [192, 192], 'icons/icon-maskable-512.png': [512, 512],
  'icons/mstile-150.png': [150, 150], 'icons/mstile-310.png': [310, 310],
  'icons/og-image.png': [1200, 630],
};

test('every device icon exists with its exact pixel size', () => {
  for (const [f, size] of Object.entries(REQUIRED)) {
    assert.ok(existsSync(new URL(f, root)), `missing ${f}`);
    assert.deepEqual(pngSize(f), size, f);
  }
});

test('favicon.ico, Safari mask icon and Windows config exist', () => {
  for (const f of ['favicon.ico', 'icons/safari-pinned-tab.svg', 'browserconfig.xml']) assert.ok(existsSync(new URL(f, root)), f);
});

test('manifest lists any and maskable icons in both Android sizes', () => {
  const m = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));
  for (const size of ['192x192', '512x512']) for (const purpose of ['any', 'maskable'])
    assert.ok(m.icons.some(i => i.sizes === size && i.purpose === purpose), `${size} ${purpose}`);
});

test('index.html links the device icons', () => {
  const h = readFileSync(new URL('index.html', root), 'utf8');
  for (const s of ['favicon-16.png', 'favicon-48.png', 'apple-touch-icon-167.png', 'apple-touch-icon-152.png', 'safari-pinned-tab.svg', 'msapplication-TileImage', 'og-image.png'])
    assert.ok(h.includes(s), s);
});
