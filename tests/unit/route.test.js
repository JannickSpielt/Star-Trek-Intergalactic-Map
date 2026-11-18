import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPath } from '../../js/core/route.js';
import { VOYAGER } from '../../js/data/routes.js';
import { SOL } from '../../js/data/shapes.js';

const path = buildPath(VOYAGER.stops);

test('path starts at the Caretaker array and ends at Earth', () => {
  assert.deepEqual(path.at(0).pos, VOYAGER.stops[0].pos);
  assert.deepEqual(path.at(1).pos, SOL);
});

test('every stop before the transwarp hub lies in the Delta quadrant', () => {
  for (const s of VOYAGER.stops.slice(0, -1)) assert.ok(s.pos[0] >= 0 && s.pos[1] < 0, s.title);
});

test('the journey brings Voyager steadily closer to Earth', () => {
  const d = s => Math.hypot(s.pos[0] - SOL[0], s.pos[1] - SOL[1]);
  for (let i = 1; i < VOYAGER.stops.length; i++) assert.ok(d(VOYAGER.stops[i]) < d(VOYAGER.stops[i - 1]), VOYAGER.stops[i].title);
});

test('at(t) reports the current leg, stop index and whether it is a jump', () => {
  const mid = path.at(path.tOfStop(3));
  assert.equal(mid.stop, 3);
  const jumpStop = VOYAGER.stops.findIndex(s => s.jump);
  assert.ok(jumpStop > 0);
  const tj = (path.tOfStop(jumpStop - 1) + path.tOfStop(jumpStop)) / 2;
  assert.equal(path.at(tj).jump, true);
  assert.equal(path.at((path.tOfStop(0) + path.tOfStop(1)) / 2).jump, false);
});

test('jumps are shortened in timeline so the flight is not dominated by them', () => {
  const kes = VOYAGER.stops.findIndex(s => s.jump);
  const dt = path.tOfStop(kes) - path.tOfStop(kes - 1);
  assert.ok(dt < 0.12, `jump takes ${dt}`);
});

test('every stop has a year and an own description', () => {
  for (const s of VOYAGER.stops) { assert.match(String(s.year), /^23\d\d/); assert.ok(s.text.length >= 30, s.title); }
});

test('reachedStops counts the milestones the ship has passed', () => {
  assert.equal(path.reachedStops(0), 1);
  assert.equal(path.reachedStops(path.tOfStop(4)), 5);
  assert.equal(path.reachedStops((path.tOfStop(4) + path.tOfStop(5)) / 2), 5);
  assert.equal(path.reachedStops(1), VOYAGER.stops.length);
});
