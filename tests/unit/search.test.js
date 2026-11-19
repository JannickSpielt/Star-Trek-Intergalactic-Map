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

import { buildIndex } from '../../js/core/search.js';
const idx = buildIndex();
const top = q => search(q, idx)[0];

test('index covers places, powers, regions and journeys', () => {
  assert.equal(top('Klingonen').kind, 'power');
  assert.equal(top('Klingonen').id, 'kli');
  assert.equal(top('Föderation').id, 'fed');
  assert.equal(top('Badlands').kind, 'region');
  assert.equal(top('Neutrale Zone').kind, 'border');
  assert.equal(top('Voyager').kind, 'journey');
  assert.equal(top('qonos').id, 'qonos');
});

test('tolerates small typos and plain-vowel umlauts', () => {
  assert.equal(top('Kronoss').id, 'qonos');
  assert.equal(top('Vulcn').id, 'vulcan');
  assert.equal(top('Kardassia').id, 'cardassia');
  assert.equal(top('Grunder').id, 'gruender');
  assert.equal(top('fursorger').id, 'caretaker');
});

test('exact and prefix matches still beat fuzzy ones', () => {
  assert.equal(top('Bajor').id, 'bajor');
  assert.equal(top('Romulus').id, 'romulus');
});

test('wormhole finds the Bajoran wormhole first', () => {
  assert.equal(top('wormhole').id, 'wurmloch-bajor');
  assert.equal(top('Wurmloch').id, 'wurmloch-bajor');
});
