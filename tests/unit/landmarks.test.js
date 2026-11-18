import { test } from 'node:test';
import assert from 'node:assert/strict';
import { landmarkKind } from '../../js/core/landmarks.js';
import { PLACES } from '../../js/data/places.js';

const P = id => PLACES.find(p => p.id === id);

test('stations, wormholes, hubs and the Unikomplex get a 3D landmark', () => {
  assert.equal(landmarkKind(P('ds9')), 'station');
  assert.equal(landmarkKind(P('sb375')), 'station');
  assert.equal(landmarkKind(P('wurmloch-bajor')), 'funnel');
  assert.equal(landmarkKind(P('idran')), 'funnel');
  assert.equal(landmarkKind(P('transwarp')), 'lattice');
  assert.equal(landmarkKind(P('hirogen')), 'lattice');
  assert.equal(landmarkKind(P('unikomplex')), 'cluster');
});

test('ordinary planets keep their simple marker', () => {
  for (const id of ['sol', 'vulcan', 'qonos', 'bajor']) assert.equal(landmarkKind(P(id)), null, id);
});

import { readFileSync } from 'node:fs';
test('landmarks stay modest on screen (≤ 60 px)', () => {
  const src = readFileSync(new URL('../../js/render/landmarks.js', import.meta.url), 'utf8');
  const px = Number(src.match(/const SCREEN_PX = (\d+)/)[1]);
  assert.ok(px <= 60, `${px} px`);
});
