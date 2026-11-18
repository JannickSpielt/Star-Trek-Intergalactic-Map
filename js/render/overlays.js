/** Reiche, Grenzen, Anomalien, Orientierungsraster und Wurmloch auf der Galaxie-Ebene. */
import * as THREE from 'three';
import { blobPoints } from '../core/blob.js';
import { FACTIONS } from '../data/factions.js';
import { PLACES } from '../data/places.js';
import { TERRITORIES, REGIONS, BORDERS, WORMHOLE, GALAXY_RADIUS } from '../data/shapes.js';

const byId = Object.fromEntries(PLACES.map(p => [p.id, p]));
const common = { transparent: true, depthWrite: false, depthTest: false };

/* ── Territorium: Fläche mit feinem Raster + leuchtender Randsaum ── */
const fillMat = color => new THREE.ShaderMaterial({
  ...common, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uCell: { value: 1 }, uOpacity: { value: 1 } },
  vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uColor; uniform float uCell; uniform float uTime; uniform float uOpacity; varying vec2 vW;
    void main(){
      vec2 g = abs(fract(vW / uCell) - 0.5);
      float grid = smoothstep(0.47, 0.5, max(g.x, g.y));
      float scan = 0.5 + 0.5 * sin((vW.y / uCell) * 0.6 - uTime * 0.8);
      float a = (0.075 + grid * 0.06 + scan * 0.015) * uOpacity;
      gl_FragColor = vec4(uColor * a, a);
    }`,
});

const ribbonMat = (color, opts = {}) => new THREE.ShaderMaterial({
  ...common, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uHatch: { value: opts.hatch ? 1 : 0 }, uOpacity: { value: opts.opacity ?? 1 } },
  vertexShader: `attribute vec2 rib; varying vec2 vR; void main(){ vR = rib; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 uColor; uniform float uHatch; uniform float uTime; uniform float uOpacity; varying vec2 vR;
    void main(){
      float edge = pow(1.0 - vR.y, 2.2);
      float a = edge * 0.85;
      if (uHatch > 0.5) { float h = step(0.5, fract(vR.x * 0.02 + vR.y * 0.6 - uTime * 0.05)); a = 0.18 + h * 0.22 + smoothstep(0.85, 1.0, 1.0 - abs(vR.y * 2.0 - 1.0)) * 0.0; }
      a *= uOpacity;
      gl_FragColor = vec4(uColor * a, a);
    }`,
});

/** Band entlang einer Punktliste. inward=true: Saum nach innen (geschlossene Form), sonst symmetrisch. */
function ribbon(pts, width, { closed = false, inward = false } = {}) {
  const n = pts.length, pos = [], rib = [], idx = [];
  let along = 0;
  // Umlaufsinn bestimmen, damit „innen“ stimmt
  let area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sgn = area > 0 ? 1 : -1;
  const count = closed ? n + 1 : n;
  for (let k = 0; k < count; k++) {
    const i = k % n;
    const p = pts[i];
    const prev = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const next = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = next[0] - prev[0], ty = next[1] - prev[1];
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty * sgn, ny = tx * sgn; // zeigt nach innen bei geschlossenen Formen
    if (k > 0) { const q = pts[(k - 1) % n]; along += Math.hypot(p[0] - q[0], p[1] - q[1]); }
    if (inward) {
      pos.push(p[0], 0, p[1], p[0] + nx * width, 0, p[1] + ny * width);
      rib.push(along, 0, along, 1);
    } else {
      pos.push(p[0] - nx * width / 2, 0, p[1] - ny * width / 2, p[0] + nx * width / 2, 0, p[1] + ny * width / 2);
      rib.push(along, 0, along, 1);
    }
    if (k > 0) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('rib', new THREE.Float32BufferAttribute(rib, 2));
  g.setIndex(idx);
  return g;
}

const lineOf = (pts, color, opacity, closed = false) => {
  const arr = pts.map(p => new THREE.Vector3(p[0], 0, p[1]));
  if (closed) arr.push(arr[0].clone());
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(arr), new THREE.LineBasicMaterial({ ...common, color, opacity, blending: THREE.AdditiveBlending }));
};

/* ── Anomalie-Wolke ── */
const cloudMat = color => new THREE.ShaderMaterial({
  ...common, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uSeed: { value: Math.random() * 10 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 uColor; uniform float uTime; uniform float uSeed; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
    void main(){
      vec2 c = vUv - 0.5; float r = length(c) * 2.0;
      float t = uTime * 0.05;
      float f = fbm(c * 4.0 + uSeed + vec2(t, -t)) * 0.65 + fbm(c * 9.0 - uSeed + t) * 0.35;
      float a = smoothstep(1.0, 0.15, r) * smoothstep(0.25, 0.75, f) * 0.55;
      gl_FragColor = vec4(uColor * a, a);
    }`,
});

export function createOverlays() {
  const group = new THREE.Group();
  group.renderOrder = 10;
  const layers = {};
  const mk = name => { const g = new THREE.Group(); g.name = name; group.add(g); layers[name] = g; return g; };
  const territories = mk('territories'), borders = mk('borders'), regions = mk('regions'), grid = mk('grid'), wormhole = mk('wormhole');
  const timed = [];
  const anchors = [];  // für HTML-Beschriftungen

  // Raster: Quadrantenachsen + Entfernungsringe
  const R = GALAXY_RADIUS * 1.04;
  grid.add(lineOf([[-R, 0], [R, 0]], 0xffcc99, 0.22), lineOf([[0, -R], [0, R]], 0xffcc99, 0.22));
  for (let rr = 10000; rr <= 50000; rr += 10000) {
    const pts = Array.from({ length: 160 }, (_, i) => [Math.cos(i / 160 * Math.PI * 2) * rr, Math.sin(i / 160 * Math.PI * 2) * rr]);
    grid.add(lineOf(pts, 0x99ccff, 0.07, true));
  }
  const q = 36000;
  anchors.push(
    { kind: 'quadrant', text: 'Alpha-Quadrant', pos: [-q, q] }, { kind: 'quadrant', text: 'Beta-Quadrant', pos: [q, q] },
    { kind: 'quadrant', text: 'Gamma-Quadrant', pos: [-q, -q] }, { kind: 'quadrant', text: 'Delta-Quadrant', pos: [q, -q] },
  );

  // Reiche
  for (const t of TERRITORIES) {
    const f = FACTIONS[t.faction];
    const pts = blobPoints(t, 72);
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ShapeGeometry(shape, 4); geo.rotateX(Math.PI / 2);
    const fm = fillMat(f.color); fm.uniforms.uCell.value = Math.max(t.rx, t.ry) / 9;
    const fill = new THREE.Mesh(geo, fm);
    const edge = new THREE.Mesh(ribbon(pts, Math.min(t.rx, t.ry) * 0.12, { closed: true, inward: true }), ribbonMat(f.color, { opacity: 0.55 }));
    const outline = lineOf(pts, new THREE.Color(f.color), 0.9, true);
    territories.add(fill, edge, outline);
    timed.push(fm);
    anchors.push({ kind: 'territory', faction: t.faction, text: f.name, pos: t.center, size: Math.max(t.rx, t.ry) });
  }

  // Grenzbänder
  for (const b of BORDERS) {
    const m = ribbonMat(b.color, { hatch: true });
    borders.add(new THREE.Mesh(ribbon(b.pts, b.width), m));
    borders.add(lineOf(b.pts, new THREE.Color(b.color), 0.5));
    timed.push(m);
    anchors.push({ kind: 'border', text: b.name, pos: b.pts[Math.floor(b.pts.length / 2)], color: b.color, size: 1200 });
  }

  // Anomalien
  for (const r of REGIONS) {
    if (r.ring) {
      const w = r.r > 20000 ? 700 : 260;
      const pts = Array.from({ length: 220 }, (_, i) => [r.center[0] + Math.cos(i / 220 * Math.PI * 2) * r.r, r.center[1] + Math.sin(i / 220 * Math.PI * 2) * r.r]);
      const m = ribbonMat(r.color, { opacity: 0.7 });
      regions.add(new THREE.Mesh(ribbon(pts, w, { closed: true }), m));
      regions.add(lineOf(pts, new THREE.Color(r.color), 0.35, true));
    } else {
      const geo = new THREE.PlaneGeometry(r.r * 2.4, r.r * 2.4); geo.rotateX(-Math.PI / 2);
      const m = cloudMat(r.color);
      const mesh = new THREE.Mesh(geo, m); mesh.position.set(r.center[0], 0, r.center[1]);
      regions.add(mesh); timed.push(m);
    }
    anchors.push({ kind: 'region', id: r.id, text: r.name, pos: r.ring ? [r.center[0] + r.r * 0.71, r.center[1] - r.r * 0.71] : r.center, color: r.color, size: r.r });
  }

  // Bajoranisches Wurmloch: leuchtender Bogen über der Ebene
  const A = byId[WORMHOLE.from].pos, Bp = byId[WORMHOLE.to].pos;
  const len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(A[0], 0, A[1]), new THREE.Vector3((A[0] + Bp[0]) / 2, len * 0.22, (A[1] + Bp[1]) / 2), new THREE.Vector3(Bp[0], 0, Bp[1]));
  const N = 600, cp = curve.getPoints(N);
  const wg = new THREE.BufferGeometry().setFromPoints(cp);
  wg.setAttribute('t', new THREE.Float32BufferAttribute(cp.map((_, i) => i / N), 1));
  const wm = new THREE.ShaderMaterial({
    ...common, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float t; varying float vT; void main(){ vT = t; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_PointSize = 3.0; }`,
    fragmentShader: `uniform float uTime; varying float vT;
      void main(){ float p = fract(vT * 6.0 - uTime * 0.25); float a = 0.25 + 0.75 * pow(p, 6.0);
        vec3 c = mix(vec3(0.45,0.7,1.0), vec3(1.0,0.85,0.55), p); gl_FragColor = vec4(c * a, a); }`,
  });
  wormhole.add(new THREE.Line(wg, wm), new THREE.Points(wg, wm));
  timed.push(wm);

  return {
    group, layers, anchors,
    update(time, camDistance = 1e5) {
      for (const m of timed) m.uniforms.uTime.value = time;
      const fade = Math.min(1, Math.max(0.15, (camDistance - 1500) / 25000));
      grid.children.forEach((l, i) => { l.material.opacity = (i < 2 ? 0.22 : 0.07) * fade; });
    },
  };
}
