import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS, FACTION_INFO } from '../../js/data/factions.js';
import { TERRITORIES } from '../../js/data/shapes.js';
import { PLACES } from '../../js/data/places.js';
import { territoryAt } from '../../js/core/territory.js';

const ids = new Set(PLACES.map(p => p.id));

test('every power drawn on the map has an info entry', () => {
  for (const t of TERRITORIES) {
    const i = FACTION_INFO[t.faction];
    assert.ok(i, t.faction);
    assert.ok(i.desc.length >= 80, `${t.faction}: desc`);
    assert.ok(i.government && i.species.length >= 1 && i.series.length >= 1, t.faction);
    if (i.capital) assert.ok(ids.has(i.capital), `${t.faction}: capital ${i.capital}`);
  }
});

test('territoryAt finds the power at a map position', () => {
  assert.equal(territoryAt([0, 26000], TERRITORIES), 'fed');
  assert.equal(territoryAt(PLACES.find(p => p.id === 'qonos').pos, TERRITORIES), 'kli');
  assert.equal(territoryAt([-45000, 20000], TERRITORIES), null);
});

test('the smallest territory wins where shapes overlap', () => {
  assert.equal(territoryAt(PLACES.find(p => p.id === 'bajor').pos, TERRITORIES), 'baj');
  assert.equal(territoryAt(PLACES.find(p => p.id === 'talax').pos, TERRITORIES), 'tal');
});

test('FACTIONS keeps name and colour for every info entry', () => {
  for (const k of Object.keys(FACTION_INFO)) assert.ok(FACTIONS[k]?.color, k);
});
