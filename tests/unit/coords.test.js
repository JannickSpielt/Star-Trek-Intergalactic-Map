import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quadrant, distance, formatLy, toScene } from '../../js/core/coords.js';
import { blobPoints } from '../../js/core/blob.js';

test('quadrant follows the core-Sol convention', () => {
  assert.equal(quadrant([-1, 1]), 'Alpha');
  assert.equal(quadrant([1000, 1]), 'Beta');
  assert.equal(quadrant([-1, -1]), 'Gamma');
  assert.equal(quadrant([1, -1]), 'Delta');
  assert.equal(quadrant([0, 26000]), 'Alpha');
});

test('distance is euclidean in light years', () => {
  assert.equal(distance([0, 0], [3, 4]), 5);
});

test('formatLy uses German thousands separator', () => {
  assert.equal(formatLy(2550), '2.550 LJ');
  assert.equal(formatLy(16.4), '16 LJ');
  assert.equal(formatLy(65500), '65.500 LJ');
});

test('toScene maps map y to scene z on the galactic plane', () => {
  assert.deepEqual(toScene([10, 20]), { x: 10, y: 0, z: 20 });
});

test('blobPoints is deterministic and bounded', () => {
  const shape = { center: [100, 200], rx: 1000, ry: 600, rot: 0.3, seed: 7 };
  const a = blobPoints(shape);
  assert.equal(a.length, 48);
  assert.deepEqual(a, blobPoints(shape));
  for (const [x, y] of a) assert.ok(Math.hypot(x - 100, y - 200) <= 1250);
});

test('Earth, Vulcan and Andoria count as Alpha quadrant; Klingons and Romulans as Beta', async () => {
  const { PLACES } = await import('../../js/data/places.js');
  const q = id => quadrant(PLACES.find(p => p.id === id).pos);
  for (const id of ['sol', 'mars', 'jupiter', 'vulcan', 'andoria', 'tellar', 'alphacen']) assert.equal(q(id), 'Alpha', id);
  for (const id of ['qonos', 'romulus', 'tholia']) assert.equal(q(id), 'Beta', id);
});
