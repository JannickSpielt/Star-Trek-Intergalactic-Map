/** Einstiegspunkt: verdrahtet Daten, Logik, Rendering und Oberfläche. */
import * as THREE from 'three';
import { hasWebGL, pickQuality, createScene, FOV } from './render/scene.js';
import { createGalaxy } from './render/galaxy.js';
import { createCameraState, cameraPosition, screenAxes } from './core/camera.js';

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

  const map = {
    ready: false,
    quality,
    layers: {},
    state: () => ({ ...cam, flying: false }),
  };
  window.__map = map;

  const clock = new THREE.Clock();
  function frame() {
    applyCamera();
    galaxy.update(window.innerHeight, FOV, clock.getElapsedTime());
    ctx.render();
    if (!map.ready) map.ready = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
