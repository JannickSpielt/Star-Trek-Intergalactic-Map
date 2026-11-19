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

// Große Punkt-Sprites dürfen ihre Transparenz nicht aus einer Textur lesen: Wird die nicht
// korrekt gelesen (z. B. Safari/Metal), entsteht ein hartes Quadrat. Rund wird es nur analytisch.
test('glow and dust point sprites use an analytic round falloff, not a texture', () => {
  const src = readFileSync(new URL('../../js/render/galaxy.js', import.meta.url), 'utf8');
  assert.ok(!/texture2D\(\s*uTex\s*,\s*gl_PointCoord\s*\)/.test(src), 'samples uTex with gl_PointCoord');
});

test('point sprites stay below the portable size limit', () => {
  const src = readFileSync(new URL('../../js/render/galaxy.js', import.meta.url), 'utf8');
  for (const m of src.matchAll(/gl_PointSize\s*=\s*clamp\([^,]+,\s*[\d.]+\s*,\s*([\w.]+)\s*\)/g)) {
    const v = parseFloat(m[1]);
    if (!Number.isNaN(v)) assert.ok(v <= 256, `max point size ${v}`);
  }
});

// pow(x, y) ist in GLSL für x < 0 undefiniert (Apple-GPUs liefern NaN). Basis immer absichern.
test('GLSL pow() never gets an unguarded base', () => {
  const dir = new URL('../../js/render/', import.meta.url);
  const bad = [];
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/(?<!Math\.)\bpow\(\s*([^,]+),/g)) {
      if (!/^(max|clamp|abs|fract)\(/.test(m[1].trim())) bad.push(`${f}: pow(${m[1]}, …)`);
    }
  }
  assert.deepEqual(bad, []);
});

// Sicherheitsnetz: vor dem Glow-Effekt werden NaN/Inf-Pixel auf 0 gesetzt.
test('the bloom pipeline sanitizes NaN and Inf pixels', () => {
  const src = readFileSync(new URL('../../js/render/scene.js', import.meta.url), 'utf8');
  assert.match(src, /isnan/); assert.match(src, /isinf/);
});
