/** Einstiegspunkt: verdrahtet Daten, Logik, Rendering und Oberfläche. */
import * as THREE from 'three';
import { hasWebGL, pickQuality, createScene, FOV } from './render/scene.js';
import { createGalaxy } from './render/galaxy.js';
import { createOverlays } from './render/overlays.js';
import { createCameraState, cameraPosition, screenAxes, flyPath } from './core/camera.js';
import { distance as dist } from './core/coords.js';
import { PLACES } from './data/places.js';

const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
/** Sinnvolle Zoomstufe für einen Ort: abhängig vom Abstand zum nächsten Nachbarn. */
function focusDistance(p) {
  let nn = Infinity;
  for (const q of PLACES) if (q !== p) nn = Math.min(nn, dist(p.pos, q.pos));
  return Math.min(20000, Math.max(450, nn * 7));
}

const canvas = document.getElementById('map');

function showNoWebGL() {
  const d = document.createElement('div');
  d.className = 'no-webgl';
  d.innerHTML = '<strong>3D-Darstellung nicht verfügbar</strong><p>Dein Browser oder Gerät unterstützt kein WebGL, oder es ist deaktiviert. Bitte aktiviere die Hardwarebeschleunigung oder öffne die Karte in einem aktuellen Browser (Chrome, Firefox, Safari, Edge).</p>';
  document.body.appendChild(d);
  document.getElementById('intro')?.remove();
}

if (!hasWebGL()) {
  showNoWebGL();
} else {
  start();
}

function start() {
  if (new URLSearchParams(location.search).has('nointro')) document.getElementById('intro')?.classList.add('done');
  const quality = pickQuality();
  const ctx = createScene(canvas, quality);
  const galaxy = createGalaxy(quality);
  ctx.scene.add(galaxy.group);
  const overlays = createOverlays();
  ctx.scene.add(overlays.group);

  let cam = createCameraState({ target: [0, 4000], distance: 125000, azimuth: 0, tilt: 0.78 });
  const tmpUp = new THREE.Vector3();

  function applyCamera() {
    const p = cameraPosition(cam);
    const c = ctx.camera;
    c.position.set(p.x, p.y, p.z);
    const { up } = screenAxes(cam.azimuth);
    c.up.copy(tmpUp.set(up[0], 0, up[1]));
    c.near = Math.max(1, cam.distance * 0.005);
    c.far = 2e6;
    c.updateProjectionMatrix();
    c.lookAt(cam.target[0], 0, cam.target[1]);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.resize(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  let flight = null;
  /** Kamerafahrt zu einem Ort (id) oder einer Kartenkoordinate. */
  function flyTo(where, opts = {}) {
    const p = typeof where === 'string' ? PLACE[where] : null;
    const target = p ? p.pos : where;
    if (!target) return false;
    const to = { ...cam, target: [...target], distance: opts.distance ?? (p ? focusDistance(p) : cam.distance), tilt: opts.tilt ?? cam.tilt, azimuth: opts.azimuth ?? cam.azimuth };
    const span = Math.log(Math.max(1, dist(cam.target, to.target)) + 1) + Math.abs(Math.log(to.distance / cam.distance));
    flight = { path: flyPath(cam, to), t0: performance.now(), dur: Math.min(3200, 900 + span * 160) };
    return true;
  }

  const map = {
    ready: false,
    quality,
    layers: overlays.layers,
    flyTo,
    state: () => ({ ...cam, flying: !!flight }),
  };
  window.__map = map;

  const clock = new THREE.Clock();
  function frame() {
    if (flight) {
      const t = Math.min(1, (performance.now() - flight.t0) / flight.dur);
      cam = { ...cam, ...flight.path(t) };
      if (t >= 1) flight = null;
    }
    applyCamera();
    overlays.update(clock.elapsedTime);
    galaxy.update(window.innerHeight, FOV, clock.getElapsedTime());
    ctx.render();
    if (!map.ready) map.ready = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
