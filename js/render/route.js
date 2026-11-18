/** Darstellung einer Reiseroute: leuchtende Strecke, gestrichelte Sprünge, Stationen und Schiffssymbol. */
import * as THREE from 'three';
import { buildPath } from '../core/route.js';

const common = { transparent: true, depthWrite: false, depthTest: false };

/** Weicher Lichthof um das Schiff, damit es auch aus der Ferne gut sichtbar ist. */
function shipTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const glow = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,230,170,.9)'); glow.addColorStop(.3, 'rgba(255,200,110,.25)'); glow.addColorStop(1, 'rgba(255,200,110,0)');
  g.fillStyle = glow; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Eigenes, frei erfundenes Schiffsmodell (Keilrumpf, zwei Antriebsgondeln, Leuchtantrieb).
 * Bewusst kein Nachbau eines Schiffs aus den Serien. Nase zeigt entlang -Z.
 */
function buildShip() {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e2, metalness: 0.55, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x5a6476, metalness: 0.6, roughness: 0.5 });
  const glowBlue = new THREE.MeshBasicMaterial({ color: 0x7fd0ff });
  const glowAmber = new THREE.MeshBasicMaterial({ color: 0xffb35a });
  // Keilrumpf: flache, vierseitige Pyramide, nach vorn spitz
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 4, 1), hullMat);
  hull.rotation.x = -Math.PI / 2; hull.rotation.y = Math.PI / 4; hull.scale.set(1, 1, 0.32);
  g.add(hull);
  // Rückensegment
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 1.1), darkMat);
  spine.position.set(0, 0.16, 0.35); g.add(spine);
  // zwei Antriebsgondeln auf kurzen Stützen
  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.25, 10), hullMat);
    pod.rotation.x = Math.PI / 2; pod.position.set(side * 0.62, 0.05, 0.55); g.add(pod);
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.3), darkMat);
    strut.position.set(side * 0.36, 0.03, 0.6); g.add(strut);
    const jet = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), glowBlue);
    jet.position.set(side * 0.62, 0.05, 1.18); g.add(jet);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.9), glowBlue);
    stripe.position.set(side * 0.62 + side * 0.12, 0.05, 0.5); g.add(stripe);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glowAmber);
  nose.position.set(0, 0.06, -0.9); g.add(nose);
  g.renderOrder = 23;
  return g;
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
  const flare = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,220,150,.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const stopSprites = route.stops.map(s => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ring, color: new THREE.Color(route.color), sizeAttenuation: false, ...common }));
    sp.position.set(s.pos[0], 0, s.pos[1]); sp.renderOrder = 16; group.add(sp);
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flare, color: new THREE.Color(route.color), sizeAttenuation: false, ...common, blending: THREE.AdditiveBlending, opacity: 0 }));
    fl.position.copy(sp.position); fl.renderOrder = 17; group.add(fl);
    return { sp, fl, lit: false, litAt: -1 };
  });
  let lit = 1, clock = 0;

  const ship = buildShip();
  ship.visible = false; group.add(ship);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: shipTexture(), sizeAttenuation: false, ...common, opacity: 0.55 }));
  glow.renderOrder = 21; glow.visible = false; group.add(glow);
  // Licht nur für das Schiffsmodell
  const light = new THREE.DirectionalLight(0xfff1dc, 2.4); light.position.set(0.4, 1, 0.3);
  const fill = new THREE.AmbientLight(0x8899ff, 0.55);
  ship.add(light, fill);

  let progress = 1;
  return {
    group, path, route,
    /** Ankerpunkte für HTML-Beschriftungen der Stationen. */
    anchors: route.stops.map((s, i) => ({ kind: 'route', text: `${s.title} · ${s.year}`, pos: s.pos, color: route.color, size: 2500, index: i })),
    setProgress(t, showShip) {
      progress = t;
      for (const m of mats) m.uniforms.uProgress.value = t;
      ship.visible = glow.visible = !!showShip;
      const p = path.at(t);
      ship.position.set(p.pos[0], 0, p.pos[1]);
      glow.position.copy(ship.position);
      // Meilensteine: neu erreichte Stationen leuchten kurz auf und bleiben danach hell
      const n = showShip ? path.reachedStops(t) : route.stops.length;
      stopSprites.forEach((st, i) => {
        const on = i < n;
        if (on && !st.lit && showShip) st.litAt = clock;
        st.lit = on;
      });
      lit = n;
      return p;
    },
    get lit() { return lit; },
    ship3d: true,
    update(camera, h, time) {
      const k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / h;
      for (const m of mats) m.uniforms.uTime.value = time;
      clock = time;
      for (const st of stopSprites) {
        const age = st.litAt >= 0 ? time - st.litAt : 99;
        const pulse = age < 1.6 ? Math.sin((age / 1.6) * Math.PI) : 0;
        const base = st.lit ? 14 : 10;
        st.sp.scale.set((base + pulse * 10) * k, (base + pulse * 10) * k, 1);
        st.sp.material.opacity = st.lit ? 1 : 0.45;
        st.fl.material.opacity = st.lit ? 0.35 + pulse * 0.65 : 0;
        const fs = (st.lit ? 30 : 0) + pulse * 90;
        st.fl.scale.set(fs * k, fs * k, 1);
      }
      glow.scale.set(46 * k, 46 * k, 1);
      // Schiff: konstante Bildschirmgröße (~38 px), Nase in Flugrichtung
      const d = camera.position.distanceTo(ship.position);
      const sz = 38 * k * d / 2.2;
      ship.scale.setScalar(sz);
      const ph = path.at(Math.min(1, progress));
      ship.rotation.set(0, -ph.heading - Math.PI / 2, 0);
    },
  };
}
