import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLabels, rankVisible } from '../../js/core/labels.js';

const rect = (l, items) => {
  const it = items.find(i => i.id === l.id);
  const g = 8; // Abstand Marker–Label
  const x = l.anchor === 'right' ? l.x + g : l.anchor === 'left' ? l.x - g - it.w : l.x - it.w / 2;
  const y = l.anchor === 'top' ? l.y - g - it.h : l.anchor === 'bottom' ? l.y + g : l.y - it.h / 2;
  return { x, y, w: it.w, h: it.h };
};
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const opts = { width: 800, height: 600 };

test('labels at the same spot are both placed without overlap', () => {
  const items = [
    { id: 'a', x: 400, y: 300, w: 60, h: 14, priority: 1, visible: true },
    { id: 'b', x: 400, y: 300, w: 60, h: 14, priority: 2, visible: true },
  ];
  const out = layoutLabels(items, opts);
  assert.equal(out.length, 2);
  assert.ok(!overlaps(rect(out[0], items), rect(out[1], items)));
});

test('many labels never overlap pairwise', () => {
  let s = 42; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const items = Array.from({ length: 30 }, (_, i) => ({ id: 'l' + i, x: 100 + rnd() * 600, y: 100 + rnd() * 400, w: 40 + rnd() * 60, h: 14, priority: 1 + (i % 4), visible: true }));
  const out = layoutLabels(items, opts);
  const rs = out.map(l => rect(l, items));
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) assert.ok(!overlaps(rs[i], rs[j]), `${out[i].id} vs ${out[j].id}`);
});

test('offscreen and invisible labels are dropped', () => {
  const out = layoutLabels([
    { id: 'off', x: 900, y: 300, w: 50, h: 14, priority: 1, visible: true },
    { id: 'hid', x: 300, y: 300, w: 50, h: 14, priority: 1, visible: false },
  ], opts);
  assert.deepEqual(out, []);
});

test('top-priority label always survives when on screen', () => {
  const items = [
    { id: 'low', x: 400, y: 300, w: 300, h: 60, priority: 3, visible: true },
    { id: 'top', x: 410, y: 300, w: 300, h: 60, priority: 1, visible: true },
  ];
  assert.ok(layoutLabels(items, opts).some(l => l.id === 'top'));
});

test('rankVisible thresholds by camera distance', () => {
  assert.equal(rankVisible(1, 1e9), true);
  assert.equal(rankVisible(4, 5000), false);
  assert.equal(rankVisible(4, 2000), true);
  assert.equal(rankVisible(3, 11000), true);
  assert.equal(rankVisible(2, 70000), false);
});

test('labels avoid blocker rectangles (e.g. region names)', () => {
  const items = [{ id: 'a', x: 400, y: 300, w: 60, h: 14, priority: 1, visible: true }];
  const blockers = [{ x: 380, y: 280, w: 200, h: 40 }];
  const out = layoutLabels(items, { ...opts, blockers });
  for (const l of out) assert.ok(!overlaps(rect(l, items), blockers[0]));
});

test('rank 5 is only visible very close', () => {
  assert.equal(rankVisible(5, 400), false);
  assert.equal(rankVisible(5, 200), true);
});
