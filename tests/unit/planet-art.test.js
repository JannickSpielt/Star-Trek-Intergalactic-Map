import { test } from 'node:test';
import assert from 'node:assert/strict';
import { artParams } from '../../js/render/planet-art.js';
import { PLACES } from '../../js/data/places.js';

const P = id => PLACES.find(p => p.id === id);

test('artParams is deterministic per place', () => {
  assert.deepEqual(artParams(P('vulcan')), artParams(P('vulcan')));
});

test('different places get different seeds', () => {
  assert.notEqual(artParams(P('vulcan')).seed, artParams(P('andoria')).seed);
});

test('style follows the place art field and palettes are filled', () => {
  for (const p of PLACES) {
    const a = artParams(p);
    assert.equal(a.style, p.art);
    assert.ok(a.palette.length >= 3, p.id);
  }
});

import { createPainter } from '../../js/render/planet-art.js';

test('a rotating planet frame is cheap enough for phones (< 4 ms at 300 px)', () => {
  const p = createPainter(artParams(P('vulcan')), 300);
  const data = new Uint8ClampedArray(300 * 300 * 4);
  p.frame(0, data); // Aufwärmen
  const t0 = performance.now();
  for (let i = 1; i <= 20; i++) p.frame(i * 0.05, data);
  const ms = (performance.now() - t0) / 20;
  assert.ok(ms < 4, `${ms.toFixed(2)} ms per frame`);
});

test('painter draws an opaque disc and a transparent corner', () => {
  const p = createPainter(artParams(P('bajor')), 100);
  const data = new Uint8ClampedArray(100 * 100 * 4);
  p.frame(0.3, data);
  assert.equal(data[(50 * 100 + 50) * 4 + 3], 255);
  assert.equal(data[3], 0);
});
