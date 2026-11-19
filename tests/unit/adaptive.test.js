import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAdaptive } from '../../js/core/adaptive.js';

const feed = (a, ms, n) => { for (let i = 0; i < n; i++) a.frame(ms); };

test('smooth frames keep full quality', () => {
  const a = createAdaptive({ maxLevel: 3 });
  feed(a, 16, 400);
  assert.equal(a.level, 0);
});

test('sustained slow frames step quality down one level at a time', () => {
  const levels = [];
  const a = createAdaptive({ maxLevel: 3, onChange: l => levels.push(l) });
  feed(a, 33, 90);
  assert.equal(a.level, 1);
  feed(a, 33, 90);
  assert.equal(a.level, 2);
  assert.deepEqual(levels, [1, 2]);
});

test('never goes below the lowest level', () => {
  const a = createAdaptive({ maxLevel: 2 });
  feed(a, 60, 2000);
  assert.equal(a.level, 2);
});

test('a single hitch (e.g. loading) does not lower quality', () => {
  const a = createAdaptive({ maxLevel: 3 });
  feed(a, 16, 100); feed(a, 300, 2); feed(a, 16, 100);
  assert.equal(a.level, 0);
});

test('frames while the tab is hidden or paused (huge gaps) are ignored', () => {
  const a = createAdaptive({ maxLevel: 3 });
  feed(a, 5000, 50);
  assert.equal(a.level, 0);
});
