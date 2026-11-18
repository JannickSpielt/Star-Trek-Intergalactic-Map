import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCameraState, applyZoom, applyRotate, applyPan, effectiveTilt, cameraPosition, pinch, flyPath, isClick, MIN_DIST, MAX_DIST, MAX_TILT } from '../../js/core/camera.js';

const base = () => createCameraState({ target: [0, 0], distance: 1000, azimuth: 0, tilt: 0.8 });
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('zoom is clamped', () => {
  near(applyZoom(base(), 1e-9).distance, MIN_DIST);
  near(applyZoom(base(), 1e9).distance, MAX_DIST);
});

test('zoom toward an anchor keeps the anchor fixed under the cursor', () => {
  const s = applyZoom(base(), 0.5, [100, 0]);
  near(s.target[0], 50); near(s.target[1], 0);
});

test('tilt is clamped', () => {
  near(applyRotate(base(), 0, 10).tilt, MAX_TILT);
  near(applyRotate(base(), 0, -10).tilt, 0);
});

test('tilt flattens close-up and is full far away', () => {
  near(effectiveTilt({ ...base(), distance: 100 }), 0, 1e-3);
  near(effectiveTilt({ ...base(), distance: 100000 }), 0.8);
});

test('camera sits above the plane', () => {
  const p = cameraPosition(base());
  assert.ok(p.y > 0);
});

test('pan moves the target', () => {
  const s = applyPan(base(), 100, 0, 800, 50);
  assert.ok(s.target[0] !== 0 || s.target[1] !== 0);
});

test('pinch: spreading fingers halves distance, twisting rotates', () => {
  const r = pinch({ a: [0, 0], b: [100, 0] }, { a: [-50, 0], b: [150, 0] });
  near(r.zoom, 0.5);
  const t = pinch({ a: [0, 0], b: [100, 0] }, { a: [50, -50], b: [50, 50] });
  near(Math.abs(t.rotate), Math.PI / 2, 1e-9);
});

test('flyPath interpolates endpoints and arcs out on long trips', () => {
  const a = createCameraState({ target: [0, 26000], distance: 500, azimuth: 0, tilt: 0.5 });
  const b = createCameraState({ target: [0, -34000], distance: 800, azimuth: 1, tilt: 0.7 });
  const f = flyPath(a, b);
  near(f(0).distance, 500, 1e-6); near(f(1).distance, 800, 1e-6);
  near(f(1).target[1], -34000, 1e-6);
  assert.ok(f(0.5).distance >= 48000, `mid ${f(0.5).distance}`);
});

test('isClick distinguishes clicks from drags', () => {
  assert.equal(isClick([0, 0], [3, 3], 100), true);
  assert.equal(isClick([0, 0], [20, 0], 100), false);
  assert.equal(isClick([0, 0], [1, 0], 900), false);
});

test('flyPath lands exactly on the target (no float drift across the quadrant line)', () => {
  const a = createCameraState({ target: [-2200, 24900], distance: 1600, azimuth: 0, tilt: 0.78 });
  const b = createCameraState({ target: [0, 26000], distance: 450, azimuth: 0, tilt: 0.78 });
  assert.deepEqual(flyPath(a, b)(1).target, [0, 26000]);
});
