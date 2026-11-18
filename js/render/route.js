/** Darstellung einer Reiseroute: leuchtende Strecke, gestrichelte Sprünge, Stationen und Schiffssymbol. */
import * as THREE from 'three';
import { buildPath } from '../core/route.js';

const common = { transparent: true, depthWrite: false, depthTest: false };

/** Eigenes, abstraktes Schiffssymbol: leuchtender Pfeil mit Schweif (kein Nachbau eines Schiffs). */
function shipTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,230,170,.9)'); glow.addColorStop(.3, 'rgba(255,200,110,.25)'); glow.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = glow; g.fillRect(0, 0, 128, 128);
  g.translate(64, 64);
  g.fillStyle = '#fff4dc';
  g.beginPath(); g.moveTo(0, -30); g.lineTo(17, 22); g.lineTo(0, 12); g.lineTo(-17, 22); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const lineMat = (color, dashed) => new THREE.ShaderMaterial({
  ...common, blending: THREE.AdditiveBlending,
  uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uDashed: { value: dashed ? 1 : 0 }, uProgress: { value: 1 } },
  vertexShader: `attribute float along; attribute float tpos; varying float vA; varying float vT;
    void main(){ vA = along; vT = tpos; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 uColor; uniform float uTime; uniform float uDashed; uniform float uProgress; varying float vA; varying float vT;
    void main(){
      float a = 0.9;
      if (uDashed > 0.5) a *= step(0.5, fract(vA / 260.0));
      else a *= 0.65 + 0.35 * pow(fract(vA / 1800.0 - uTime * 0.25), 4.0);
      if (vT > uProgress + 0.0005) a *= 0.28;   // noch nicht geflogener Teil blasser
      gl_FragColor = vec4(uColor * a, a);
    }`,
});

export function createRoute(route) {
  const group = new THREE.Group();
  group.renderOrder = 15;
  const path = buildPath(route.stops);
  const mats = [];

  for (const leg of path.legs) {
    const N = leg.jump ? 2 : Math.max(2, Math.ceil(leg.len / 200));
    const pos = [], along = [], tpos = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const x = leg.a[0] + (leg.b[0] - leg.a[0]) * f, z = leg.a[1] + (leg.b[1] - leg.a[1]) * f;
      // Sprünge als flacher Bogen über der Ebene
      const y = leg.jump ? Math.sin(Math.PI * f) * leg.len * 0.12 : 0;
      pos.push(x, y, z); along.push(f * leg.len); tpos.push(leg.t0 + (leg.t1 - leg.t0) * f);
    }
    if (leg.jump) {
      // Bogen fein auflösen
      pos.length = 0; along.length = 0; tpos.length = 0;
      const M = 80;
      for (let i = 0; i <= M; i++) {
        const f = i / M;
        pos.push(leg.a[0] + (leg.b[0] - leg.a[0]) * f, Math.sin(Math.PI * f) * leg.len * 0.12, leg.a[1] + (leg.b[1] - leg.a[1]) * f);
        along.push(f * leg.len); tpos.push(leg.t0 + (leg.t1 - leg.t0) * f);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('along', new THREE.Float32BufferAttribute(along, 1));
    g.setAttribute('tpos', new THREE.Float32BufferAttribute(tpos, 1));
    const m = lineMat(route.color, leg.jump);
    mats.push(m);
    group.add(new THREE.Line(g, m));
  }

  // Stationen als kleine Ringe
  const ring = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(32, 32, 22, 0, Math.PI * 2); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const stopSprites = route.stops.map(s => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ring, color: new THREE.Color(route.color), sizeAttenuation: false, ...common }));
    sp.position.set(s.pos[0], 0, s.pos[1]); sp.renderOrder = 16; group.add(sp); return sp;
  });

  const ship = new THREE.Sprite(new THREE.SpriteMaterial({ map: shipTexture(), sizeAttenuation: false, ...common }));
  ship.renderOrder = 22; ship.visible = false; group.add(ship);

  let progress = 1;
  return {
    group, path, route,
    /** Ankerpunkte für HTML-Beschriftungen der Stationen. */
    anchors: route.stops.map((s, i) => ({ kind: 'route', text: `${s.title} · ${s.year}`, pos: s.pos, color: route.color, size: 2500, index: i })),
    setProgress(t, showShip) {
      progress = t;
      for (const m of mats) m.uniforms.uProgress.value = t;
      ship.visible = !!showShip;
      const p = path.at(t);
      ship.position.set(p.pos[0], 0, p.pos[1]);
      return p;
    },
    update(camera, h, time) {
      const k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / h;
      for (const m of mats) m.uniforms.uTime.value = time;
      for (const sp of stopSprites) sp.scale.set(12 * k, 12 * k, 1);
      ship.scale.set(34 * k, 34 * k, 1);
      // Spitze des Pfeils in Flugrichtung drehen (Bildschirmwinkel aus zwei projizierten Punkten)
      if (ship.visible) {
        const p = path.at(Math.min(1, progress)), q = path.at(Math.min(1, progress + 0.002));
        const a = new THREE.Vector3(p.pos[0], 0, p.pos[1]).project(camera), b = new THREE.Vector3(q.pos[0], 0, q.pos[1]).project(camera);
        if (Math.hypot(b.x - a.x, b.y - a.y) > 1e-6) ship.material.rotation = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
      }
    },
  };
}
