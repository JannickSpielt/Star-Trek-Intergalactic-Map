/** Einstiegspunkt: verdrahtet Daten, Logik, Rendering und Oberfläche. */
import * as THREE from 'three';
import { hasWebGL, pickQuality, createScene, FOV } from './render/scene.js';
import { createGalaxy } from './render/galaxy.js';
import { createOverlays } from './render/overlays.js';
import { createMarkers } from './render/markers.js';
import { createLabelLayer } from './ui/labels-dom.js';
import { createFrame } from './ui/frame.js';
import { createInfo } from './ui/info.js';
import { createSearchUI } from './ui/search-ui.js';
import { createMinimap } from './ui/minimap.js';
import { runIntro } from './ui/intro.js';
import { BOOKMARKS } from './data/shapes.js';
import { createCameraState, cameraPosition, screenAxes, flyPath, applyZoom, applyRotate, applyPan, pinch, isClick } from './core/camera.js';
import { distance as dist } from './core/coords.js';
import { PLACES } from './data/places.js';
import { FACTIONS } from './data/factions.js';

const PLACE = Object.fromEntries(PLACES.map(p => [p.id, p]));
const canvas = document.getElementById('map');
const params = new URLSearchParams(location.search);

/** Sinnvolle Zoomstufe für einen Ort: abhängig vom Abstand zum nächsten Nachbarn. */
function focusDistance(p) {
  let nn = Infinity;
  for (const q of PLACES) if (q !== p) nn = Math.min(nn, dist(p.pos, q.pos));
  return Math.min(20000, Math.max(450, nn * 7));
}

function showNoWebGL() {
  const d = document.createElement('div');
  d.className = 'no-webgl';
  d.innerHTML = '<strong>3D-Darstellung nicht verfügbar</strong><p>Dein Browser oder Gerät unterstützt kein WebGL, oder es ist deaktiviert. Bitte aktiviere die Hardwarebeschleunigung oder öffne die Karte in einem aktuellen Browser (Chrome, Firefox, Safari, Edge).</p>';
  document.body.appendChild(d);
  document.getElementById('intro')?.remove();
}

window.__booted = true;
clearTimeout(window.__bootTimer);
if (!hasWebGL()) showNoWebGL();
else {
  try { start(); }
  catch (err) { window.showLoadError?.(err); }
}

// Offline-Unterstützung / installierbare Web-App
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

function start() {
  if (params.has('nointro')) document.getElementById('intro')?.classList.add('done');
  const quality = pickQuality();
  const ctx = createScene(canvas, quality);
  const galaxy = createGalaxy(quality);
  const overlays = createOverlays();
  const markers = createMarkers(PLACES);
  ctx.scene.add(galaxy.group, overlays.group, markers.group);
  const labels = createLabelLayer(document.getElementById('labels'), markers, overlays.anchors);

  let cam = createCameraState({ target: [0, 4000], distance: 125000, azimuth: 0, tilt: 0.78 });
  let W = 1, H = 1;
  const tmpV = new THREE.Vector3(), tmpUp = new THREE.Vector3();

  function applyCamera() {
    const p = cameraPosition(cam);
    const c = ctx.camera;
    c.position.set(p.x, p.y, p.z);
    const { up } = screenAxes(cam.azimuth);
    c.up.copy(tmpUp.set(up[0], 0, up[1]));
    c.near = Math.max(1, cam.distance * 0.005);
    c.updateProjectionMatrix();
    c.lookAt(cam.target[0], 0, cam.target[1]);
    c.updateMatrixWorld();
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    ctx.resize(W, H);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Kamerafahrten ── */
  let flight = null;
  function flyTo(where, opts = {}) {
    const p = typeof where === 'string' ? PLACE[where] : null;
    const target = p ? p.pos : where;
    if (!target) return false;
    const to = { ...cam, target: [...target], distance: opts.distance ?? (p ? focusDistance(p) : cam.distance), tilt: opts.tilt ?? cam.tilt, azimuth: opts.azimuth ?? cam.azimuth };
    const span = Math.log(Math.max(1, dist(cam.target, to.target)) + 1) + Math.abs(Math.log(to.distance / cam.distance));
    flight = { path: flyPath(cam, to), t0: performance.now(), dur: opts.duration ?? Math.min(3200, 900 + span * 160) };
    return true;
  }

  /* ── Auswahl ── */
  let selected = null;
  const listeners = { select: [] };
  function select(id) {
    selected = id && PLACE[id] ? id : null;
    markers.setSelected(selected);
    labels.setSelected(selected);
    for (const fn of listeners.select) fn(selected ? PLACE[selected] : null);
  }

  /* ── Geometrie-Helfer ── */
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2(), hitP = new THREE.Vector3();
  function groundAt(x, y) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, ctx.camera);
    return ray.ray.intersectPlane(plane, hitP) ? [hitP.x, hitP.z] : null;
  }
  const pxPerLy = pos => {
    tmpV.set(pos[0], 0, pos[1]);
    const d = tmpV.distanceTo(ctx.camera.position);
    return H / (2 * Math.tan((FOV * Math.PI) / 360) * Math.max(1, d));
  };

  /* ── Eingabe: Maus, Touch, Tastatur ── */
  const pointers = new Map();
  let drag = null, gesture = null;
  const tooltip = document.getElementById('tooltip');
  const hint = document.getElementById('hint');
  const dismissHint = () => hint?.classList.add('gone');

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    flight = null;
    if (pointers.size === 1) {
      const rotate = e.button === 2 || e.ctrlKey || e.shiftKey;
      drag = { start: [e.clientX, e.clientY], last: [e.clientX, e.clientY], t0: performance.now(), rotate, anchor: groundAt(e.clientX, e.clientY), moved: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      gesture = { a: [...a], b: [...b] };
      drag = null;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (gesture && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const g = pinch(gesture, { a, b });
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const vertical = Math.abs(g.panPx[1]) > Math.abs(g.panPx[0]) * 1.5 && Math.abs(g.zoom - 1) < 0.02;
      cam = applyZoom(cam, g.zoom, groundAt(mid[0], mid[1]));
      cam = applyRotate(cam, -g.rotate, vertical ? -g.panPx[1] * 0.004 : 0);
      if (!vertical) cam = applyPan(cam, g.panPx[0], g.panPx[1], H, FOV);
      gesture = { a: [...a], b: [...b] };
      dismissHint();
      return;
    }
    if (drag) {
      const dx = e.clientX - drag.last[0], dy = e.clientY - drag.last[1];
      drag.last = [e.clientX, e.clientY];
      if (Math.hypot(e.clientX - drag.start[0], e.clientY - drag.start[1]) > 4) { drag.moved = true; canvas.classList.add('dragging'); dismissHint(); }
      if (!drag.moved) return;
      if (drag.rotate) cam = applyRotate(cam, dx * 0.005, -dy * 0.004);
      else {
        const now = groundAt(e.clientX, e.clientY);
        if (drag.anchor && now) cam = { ...cam, target: [cam.target[0] + drag.anchor[0] - now[0], cam.target[1] + drag.anchor[1] - now[1]] };
        else cam = applyPan(cam, dx, dy, H, FOV);
      }
      return;
    }
    // Hover
    const id = markers.pick(e.clientX, e.clientY);
    markers.setHover(id);
    canvas.classList.toggle('hovering', !!id);
    if (id) {
      const p = PLACE[id];
      tooltip.innerHTML = `${p.name}<small>${FACTIONS[p.faction].short}</small>`;
      tooltip.style.left = e.clientX + 14 + 'px'; tooltip.style.top = e.clientY + 14 + 'px';
      tooltip.classList.add('show');
    } else tooltip.classList.remove('show');
  });
  const endPointer = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) gesture = null;
    if (drag && pointers.size === 0) {
      if (!drag.moved && e.type === 'pointerup' && isClick(drag.start, [e.clientX, e.clientY], performance.now() - drag.t0)) {
        select(markers.pick(e.clientX, e.clientY, e.pointerType === 'touch' ? 24 : 14));
      }
      drag = null;
      canvas.classList.remove('dragging');
    }
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', () => { tooltip.classList.remove('show'); markers.setHover(null); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    flight = null;
    const f = Math.exp(e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
    cam = applyZoom(cam, f, groundAt(e.clientX, e.clientY));
    dismissHint();
  }, { passive: false });
  canvas.addEventListener('dblclick', e => { const a = groundAt(e.clientX, e.clientY); if (a) flyTo(a, { distance: cam.distance * 0.35 }); });

  const zoomBy = f => flyTo(cam.target, { distance: cam.distance * f });
  document.getElementById('zoom-in')?.addEventListener('click', () => zoomBy(0.45));
  document.getElementById('zoom-out')?.addEventListener('click', () => zoomBy(2.2));
  document.getElementById('reset-view')?.addEventListener('click', () => flyTo(cam.target, { azimuth: 0, tilt: 0.78 }));
  window.addEventListener('keydown', e => {
    if (e.target.closest?.('input')) return;
    if (e.key === '+' || e.key === '=') zoomBy(0.6);
    else if (e.key === '-') zoomBy(1.7);
    else if (e.key === 'Escape') select(null);
  });

  /* ── Öffentliche Schnittstelle ── */
  const frameHooks = [];
  const map = {
    ready: false,
    quality,
    layers: overlays.layers,
    flyTo, select,
    focus(id) {
      select(id);
      const p = PLACE[id]; if (!p) return;
      const d = focusDistance(p);
      // Bei offenem Infofenster (Desktop) das Ziel nach links aus dem Fenster schieben
      // Desktop: Fenster rechts -> Ziel nach links; Handy: Bottom-Sheet -> Ziel nach oben
      const perPx = (2 * Math.tan((FOV * Math.PI) / 360) * d) / H;
      const { right, up } = screenAxes(cam.azimuth);
      const [sx, sy] = W > 760 ? [Math.min(230, W * 0.18), 0] : [0, -H * 0.27];
      flyTo([p.pos[0] + (right[0] * sx + up[0] * sy) * perPx, p.pos[1] + (right[1] * sx + up[1] * sy) * perPx], { distance: d });
    },
    on(ev, fn) { listeners[ev]?.push(fn); },
    onFrame(fn) { frameHooks.push(fn); },
    screenOf: id => markers.screenOf(id),
    groundAt,
    state: () => ({ ...cam, flying: !!flight, selected }),
    place: id => PLACE[id],
    setCamera(c) { cam = createCameraState(c); flight = null; },
  };
  window.__map = map;

  const frameUi = createFrame({
    bookmarks: BOOKMARKS,
    layers: overlays.layers,
    onBookmark: b => flyTo(b.target, { distance: b.distance === 'fit' ? 125000 : b.distance, tilt: b.distance === 'fit' ? 0.78 : cam.tilt }),
  });
  const info = createInfo({ onClose: () => select(null), onCenter: id => map.focus(id) });
  map.on('select', p => { info.show(p); document.body.classList.toggle('info-open', !!p); });
  createSearchUI(document.getElementById('search'), document.getElementById('results'), PLACES, id => map.focus(id));
  const minimap = createMinimap(document.getElementById('minimap'), { onJump: pos => flyTo(pos, { distance: Math.min(cam.distance, 30000) }) });
  map.onFrame(c => minimap.update(c, c.distance * Math.tan((FOV * Math.PI) / 360) * (W / H)));
  runIntro(map, { target: [0, 4000], distance: 125000, azimuth: 0, tilt: 0.78 });
  map.onFrame(c => frameUi.setStatus({ target: c.target, pxPerLy: pxPerLy(c.target), distance: c.distance }));

  /* ── Render-Schleife ── */
  const clock = new THREE.Clock();
  function frame() {
    const time = clock.getElapsedTime();
    if (flight) {
      const t = Math.min(1, (performance.now() - flight.t0) / flight.dur);
      cam = { ...cam, ...flight.path(t) };
      if (t >= 1) flight = null;
    }
    applyCamera();
    galaxy.update(H, FOV, time);
    overlays.update(time, cam.distance);
    markers.update(ctx.camera, cam, W, H, time);
    labels.update(ctx.camera, cam, W, H, pxPerLy, tmpV);
    for (const fn of frameHooks) fn(cam, time);
    ctx.render();
    if (!map.ready) map.ready = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
