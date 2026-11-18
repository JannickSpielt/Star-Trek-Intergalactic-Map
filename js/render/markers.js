/** Ortsmarker als Sprites mit konstanter Bildschirmgröße + Picking. */
import * as THREE from 'three';
import { FACTIONS } from '../data/factions.js';
import { rankVisible } from '../core/labels.js';

const ICON_PX = 64;

/** Zeichnet das Symbol je Ortstyp (weiß; eingefärbt über das Material). */
function iconTexture(type) {
  const c = document.createElement('canvas'); c.width = c.height = ICON_PX;
  const g = c.getContext('2d'); const m = ICON_PX / 2;
  g.strokeStyle = g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  const glow = g.createRadialGradient(m, m, 0, m, m, m);
  glow.addColorStop(0, 'rgba(255,255,255,.55)'); glow.addColorStop(.35, 'rgba(255,255,255,.12)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glow; g.fillRect(0, 0, ICON_PX, ICON_PX); g.fillStyle = '#fff';
  switch (type) {
    case 'capital':
      g.lineWidth = 3.5; g.beginPath(); g.arc(m, m, 13, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(m, m, 6, 0, Math.PI * 2); g.fill(); break;
    case 'station':
      g.lineWidth = 3; g.beginPath(); g.moveTo(m, m - 12); g.lineTo(m + 12, m); g.lineTo(m, m + 12); g.lineTo(m - 12, m); g.closePath(); g.stroke();
      g.beginPath(); g.arc(m, m, 3.5, 0, Math.PI * 2); g.fill(); break;
    case 'battle':
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(m - 10, m - 10); g.lineTo(m + 10, m + 10); g.moveTo(m + 10, m - 10); g.lineTo(m - 10, m + 10); g.stroke(); break;
    case 'wormhole':
      g.lineWidth = 3; g.beginPath();
      for (let t = 0; t < 4 * Math.PI; t += 0.1) { const r = 2 + t * 1.05; g.lineTo(m + Math.cos(t) * r, m + Math.sin(t) * r); }
      g.stroke(); break;
    case 'anomaly':
      g.lineWidth = 2.5; g.setLineDash([4, 4]); g.beginPath(); g.arc(m, m, 12, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]); g.beginPath(); g.arc(m, m, 4, 0, Math.PI * 2); g.fill(); break;
    default:
      g.beginPath(); g.arc(m, m, 7, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function selectTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 3;
  g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 5;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.arc(64, 64, 60, a - 0.25, a + 0.25); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const SIZE = { capital: 30, planet: 18, station: 22, battle: 20, wormhole: 28, anomaly: 24 };

export function createMarkers(places) {
  const group = new THREE.Group();
  const textures = {};
  const items = places.map(p => {
    textures[p.type] ??= iconTexture(p.type);
    const mat = new THREE.SpriteMaterial({ map: textures[p.type], color: new THREE.Color(FACTIONS[p.faction].color), sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true });
    const s = new THREE.Sprite(mat);
    s.position.set(p.pos[0], 0, p.pos[1]);
    s.renderOrder = 20;
    group.add(s);
    return { p, s, vis: 0, sx: 0, sy: 0, onScreen: false };
  });
  const sel = new THREE.Sprite(new THREE.SpriteMaterial({ map: selectTexture(), color: 0xffcc99, sizeAttenuation: false, depthTest: false, depthWrite: false, transparent: true }));
  sel.visible = false; sel.renderOrder = 21; group.add(sel);

  let selected = null, hover = null;
  const v = new THREE.Vector3();

  return {
    group,
    items,
    /** Pro Frame: Sichtbarkeit, Größe und Bildschirmposition aktualisieren. */
    update(camera, camState, w, h, time) {
      const k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / h; // px -> Sprite-Skala
      for (const it of items) {
        const want = rankVisible(it.p.rank, camState.distance) || it.p.id === selected ? 1 : 0;
        it.vis += (want - it.vis) * 0.18;
        v.copy(it.s.position).project(camera);
        it.sx = (v.x * 0.5 + 0.5) * w; it.sy = (-v.y * 0.5 + 0.5) * h;
        it.onScreen = v.z < 1 && it.sx > -40 && it.sx < w + 40 && it.sy > -40 && it.sy < h + 40;
        const base = SIZE[it.p.type] ?? 18;
        const boost = it.p.id === hover ? 1.35 : it.p.id === selected ? 1.25 : 1;
        const px = base * boost * (0.6 + 0.4 * it.vis);
        it.s.scale.set(px * k, px * k, 1);
        it.s.material.opacity = it.vis;
        it.s.visible = it.vis > 0.02;
      }
      if (selected) {
        const it = items.find(i => i.p.id === selected);
        sel.visible = true; sel.position.copy(it.s.position);
        const px = 46 + Math.sin(time * 3) * 4;
        sel.scale.set(px * k, px * k, 1); sel.material.rotation = time * 0.6;
      } else sel.visible = false;
    },
    screenOf(id) { const it = items.find(i => i.p.id === id); return it ? { x: it.sx, y: it.sy, visible: it.onScreen && it.vis > 0.5 } : null; },
    pick(x, y, radius = 14) {
      let best = null, bd = radius;
      for (const it of items) {
        if (!it.onScreen || it.vis < 0.5) continue;
        const d = Math.hypot(it.sx - x, it.sy - y);
        if (d < bd || (best && d === bd && it.p.rank < best.p.rank)) { bd = d; best = it; }
      }
      return best ? best.p.id : null;
    },
    setSelected(id) { selected = id; },
    setHover(id) { hover = id; },
  };
}
