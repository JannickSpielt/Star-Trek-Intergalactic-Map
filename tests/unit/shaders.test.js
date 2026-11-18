import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// GLSL: smoothstep(edge0, edge1, x) ist für edge0 >= edge1 undefiniert. Manche GPUs liefern dann
// NaN, was der Bloom-Effekt zu flackernden schwarzen Quadraten verschmiert.
test('no shader calls smoothstep with reversed literal edges', () => {
  const dir = new URL('../../js/render/', import.meta.url);
  const bad = [];
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/smoothstep\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,/g)) {
      if (parseFloat(m[1]) >= parseFloat(m[2])) bad.push(`${f}: ${m[0]}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('point-size shaders guard against division by a zero depth', () => {
  const src = readFileSync(new URL('../../js/render/galaxy.js', import.meta.url), 'utf8');
  assert.ok(!/\/\s*-mv\.z/.test(src), 'divides by -mv.z without max()');
});
