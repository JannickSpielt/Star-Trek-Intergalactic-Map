/** Prozedurale Spiralgalaxie: Sterne, Staub, Nebelleuchten, Kern und Himmelskugel. */
import * as THREE from 'three';

const COUNTS = { low: 60000, medium: 150000, high: 300000 };

/** Deterministischer Zufall (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

const PITCH = 0.23;          // tan(Steigungswinkel ~13°)
const ARMS = [               // Winkelversatz, Stärke
  { off: 0.0, w: 1.0 }, { off: Math.PI, w: 1.0 },
  { off: Math.PI / 2, w: 0.55 }, { off: (3 * Math.PI) / 2, w: 0.55 },
];
const R0 = 3200;

/** Position auf einem Spiralarm für Radius r. Kartenkoordinate [x, y]. */
export function armPoint(arm, r, along = 0) {
  const th = Math.log(r / R0) / PITCH + arm.off + along;
  return [Math.cos(th) * r, Math.sin(th) * r];
}

function glowTexture(inner = 'rgba(255,255,255,1)', soft = 0.5) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(soft * 0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const starVertex = /* glsl */`
  attribute float size; attribute float phase; attribute vec3 color;
  uniform float uScale; uniform float uTime; uniform float uMaxPx;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float px = size * uScale / -mv.z;
    float tw = 0.82 + 0.18 * sin(uTime * 1.7 + phase * 40.0);
    vAlpha = clamp(px * 1.6, 0.42, 1.0) * tw;
    vColor = color;
    gl_PointSize = clamp(px, 1.0, uMaxPx);
    gl_Position = projectionMatrix * mv;
  }`;
const starFragment = /* glsl */`
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec2 d = gl_PointCoord - 0.5; float r = length(d);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vColor * a * vAlpha, a * vAlpha);
  }`;

const glowVertex = /* glsl */`
  attribute float size; attribute vec3 color; attribute float alpha;
  uniform float uScale; uniform float uFadeNear;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float px = size * uScale / -mv.z;
    vAlpha = alpha * smoothstep(0.0, uFadeNear, -mv.z);
    vColor = color;
    gl_PointSize = clamp(px, 0.0, 900.0);
    gl_Position = projectionMatrix * mv;
  }`;
const glowFragment = /* glsl */`
  uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
  void main(){
    float a = texture2D(uTex, gl_PointCoord).a * vAlpha;
    gl_FragColor = vec4(vColor * a, a);
  }`;

function starMaterial(maxPx) {
  return new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 400 }, uTime: { value: 0 }, uMaxPx: { value: maxPx } },
    vertexShader: starVertex, fragmentShader: starFragment,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

/** Erzeugt alle Galaxie-Schichten. */
export function createGalaxy(quality = 'high') {
  const N = COUNTS[quality] ?? COUNTS.high;
  const r = rng(2375);
  const group = new THREE.Group();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), phase = new Float32Array(N);
  const cCore = new THREE.Color('#ffd9a0'), cArm = new THREE.Color('#a9c4ff'), cHII = new THREE.Color('#ff6fae'),
    cOld = new THREE.Color('#ffeacc'), cBlue = new THREE.Color('#7fa8ff'), tmp = new THREE.Color();

  for (let i = 0; i < N; i++) {
    const kind = r();
    let x, y, h;
    if (kind < 0.11) {                       // Bulge
      const rr = Math.abs(gauss(r)) * 3200;
      const a = r() * Math.PI * 2;
      x = Math.cos(a) * rr; y = Math.sin(a) * rr * 0.85; h = gauss(r) * 900 * Math.exp(-rr / 4000);
      tmp.copy(cCore).lerp(cOld, r() * 0.5);
      size[i] = 70 + r() * 90;
    } else if (kind < 0.26) {                // Balken
      const t = gauss(r) * 4200, w = gauss(r) * 900;
      const ang = 0.45;
      x = t * Math.cos(ang) - w * Math.sin(ang); y = t * Math.sin(ang) + w * Math.cos(ang); h = gauss(r) * 350;
      tmp.copy(cCore).lerp(cOld, 0.3 + r() * 0.4);
      size[i] = 60 + r() * 70;
    } else if (kind < 0.88) {                // Spiralarme
      let arm = ARMS[Math.floor(r() * ARMS.length)];
      if (arm.w < 1 && r() > arm.w) arm = ARMS[Math.floor(r() * 2)];
      const rr = R0 + -Math.log(1 - r() * 0.985) * 12500;
      if (rr > 52000) { i--; continue; }
      const spread = 320 + rr * 0.05 * (0.6 + r() * 0.8);
      const [ax, ay] = armPoint(arm, rr);
      x = ax + gauss(r) * spread; y = ay + gauss(r) * spread; h = gauss(r) * (180 + rr * 0.004);
      const hii = r() < 0.035;
      tmp.copy(cArm).lerp(cBlue, r() * 0.6).lerp(cOld, Math.max(0, 1 - rr / 14000) * 0.8);
      if (hii) tmp.copy(cHII);
      size[i] = hii ? 150 + r() * 120 : 45 + r() * 80;
    } else {                                 // diffuse Scheibe
      const rr = -Math.log(1 - r() * 0.98) * 14000;
      if (rr > 54000) { i--; continue; }
      const a = r() * Math.PI * 2;
      x = Math.cos(a) * rr; y = Math.sin(a) * rr; h = gauss(r) * 400;
      tmp.copy(cOld).lerp(cArm, Math.min(1, rr / 20000));
      size[i] = 40 + r() * 50;
    }
    pos[i * 3] = x; pos[i * 3 + 1] = h; pos[i * 3 + 2] = y;
    const br = (kind >= 0.26 && kind < 0.88 ? 0.9 : 0.6) + r() * 0.6;
    col[i * 3] = tmp.r * br; col[i * 3 + 1] = tmp.g * br; col[i * 3 + 2] = tmp.b * br;
    phase[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const stars = new THREE.Points(geo, starMaterial(quality === 'low' ? 2.5 : 3.2));
  stars.frustumCulled = false;
  group.add(stars);

  // Nebelleuchten & Staub entlang der Arme (große, weiche Sprites)
  const glowTex = glowTexture();
  const G = quality === 'low' ? 500 : 1400;
  const gp = new Float32Array(G * 3), gc = new Float32Array(G * 3), gs = new Float32Array(G), ga = new Float32Array(G);
  const dp = [], dc = [], ds = [], da = [];
  const nebulaCols = ['#5a7dff', '#7c5cff', '#ff5fa0', '#3fb0ff', '#ffb070'].map(c => new THREE.Color(c));
  for (let i = 0; i < G; i++) {
    const arm = ARMS[i % 4];
    const rr = R0 + r() * 42000;
    const [ax, ay] = armPoint(arm, rr);
    const spread = 600 + rr * 0.06;
    gp[i * 3] = ax + gauss(r) * spread; gp[i * 3 + 1] = gauss(r) * 120; gp[i * 3 + 2] = ay + gauss(r) * spread;
    const c = nebulaCols[Math.floor(r() * nebulaCols.length)];
    gc[i * 3] = c.r; gc[i * 3 + 1] = c.g; gc[i * 3 + 2] = c.b;
    gs[i] = 3000 + r() * 6000; ga[i] = (0.10 + r() * 0.14) * arm.w;
    // Staub: auf der Innenseite des Arms
    const [ix, iy] = armPoint(arm, rr, -0.16);
    dp.push(ix + gauss(r) * spread * 0.5, gauss(r) * 60, iy + gauss(r) * spread * 0.5);
    dc.push(0.02, 0.015, 0.01); ds.push(2200 + r() * 3000); da.push(0.35 + r() * 0.3);
  }
  const glowMat = (blending, fadeNear) => new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 400 }, uTex: { value: glowTex }, uFadeNear: { value: fadeNear } },
    vertexShader: glowVertex, fragmentShader: glowFragment, transparent: true, depthWrite: false, blending,
  });
  const mk = (p, c, s, a, mat) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p instanceof Float32Array ? p : new Float32Array(p), 3));
    g.setAttribute('color', new THREE.BufferAttribute(c instanceof Float32Array ? c : new Float32Array(c), 3));
    g.setAttribute('size', new THREE.BufferAttribute(s instanceof Float32Array ? s : new Float32Array(s), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(a instanceof Float32Array ? a : new Float32Array(a), 1));
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; return pts;
  };
  const dustMat = glowMat(THREE.NormalBlending, 9000);
  dustMat.fragmentShader = /* glsl */`
    uniform sampler2D uTex; varying vec3 vColor; varying float vAlpha;
    void main(){ float a = texture2D(uTex, gl_PointCoord).a * vAlpha; gl_FragColor = vec4(vColor, a); }`;
  const nebula = mk(gp, gc, gs, ga, glowMat(THREE.AdditiveBlending, 6000));
  const dust = mk(dp, dc, ds, da, dustMat);
  dust.renderOrder = 1; nebula.renderOrder = 2;
  group.add(dust, nebula);

  // Kernleuchten
  const coreTex = glowTexture('rgba(255,240,215,1)', 0.35);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, color: 0xffd6a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
  core.scale.set(15000, 15000, 1);
  const core2 = core.clone(); core2.material = core.material.clone(); core2.material.opacity = 0.16; core2.scale.set(42000, 42000, 1);
  core.renderOrder = core2.renderOrder = 3;
  group.add(core, core2);

  // Himmelskugel (ferne Sterne)
  const S = quality === 'low' ? 2000 : 5000;
  const sp = new Float32Array(S * 3), sc = new Float32Array(S * 3);
  for (let i = 0; i < S; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 900000;
    sp[i * 3] = Math.cos(a) * s * R; sp[i * 3 + 1] = u * R; sp[i * 3 + 2] = Math.sin(a) * s * R;
    const b = 0.12 + Math.pow(r(), 3) * 0.7; sc[i * 3] = b; sc[i * 3 + 1] = b * (0.9 + r() * 0.1); sc[i * 3 + 2] = b * (0.95 + r() * 0.15);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const sky = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.1, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false }));
  sky.frustumCulled = false;
  group.add(sky);

  const materials = [stars.material, nebula.material, dust.material];
  return {
    group,
    sky,
    /** Pro Frame: Projektionsskala (px pro Welteinheit bei Distanz 1) + Zeit. */
    update(viewportH, fovDeg, time) {
      const scale = viewportH / (2 * Math.tan((fovDeg * Math.PI) / 360));
      for (const m of materials) m.uniforms.uScale.value = scale;
      stars.material.uniforms.uTime.value = time;
    },
  };
}
