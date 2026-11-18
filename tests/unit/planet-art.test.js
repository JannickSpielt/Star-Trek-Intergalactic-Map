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
