import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, search } from '../../js/core/search.js';
import { PLACES } from '../../js/data/places.js';

const first = q => search(q, PLACES)[0]?.id;

test('normalize folds umlauts, apostrophes and case', () => {
  assert.equal(normalize("Qo'noS"), 'qonos');
  assert.equal(normalize('Fürsorger'), 'fuersorger');
  assert.equal(normalize('  Terok-Nor '), 'teroknor');
});

test('finds by name and alias', () => {
  assert.equal(first('qonos'), 'qonos');
  assert.equal(first('kronos'), 'qonos');
  assert.equal(first('terok'), 'ds9');
});

test('umlaut and transliteration match the same place', () => {
  assert.equal(first('fürsorger'), first('fuersorger'));
  assert.ok(first('fürsorger'));
});

test('important places rank first on equal match', () => {
  const ids = search('ro', PLACES).map(p => p.id);
  assert.equal(ids[0], 'romulus');
});

test('empty or unknown queries return nothing', () => {
  assert.deepEqual(search('   ', PLACES), []);
  assert.deepEqual(search('xyzzy', PLACES), []);
});
