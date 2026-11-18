import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quadrant, distance, formatLy, toScene } from '../../js/core/coords.js';
import { blobPoints } from '../../js/core/blob.js';

test('quadrant follows the core-Sol convention', () => {
  assert.equal(quadrant([-1, 1]), 'Alpha');
  assert.equal(quadrant([1, 1]), 'Beta');
  assert.equal(quadrant([-1, -1]), 'Gamma');
  assert.equal(quadrant([1, -1]), 'Delta');
  assert.equal(quadrant([0, 26000]), 'Beta');
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
