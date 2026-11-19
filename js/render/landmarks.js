/**
 * Stilisierte 3D-Wahrzeichen. Alle Formen sind frei gestaltet und bewusst
 * keine Nachbauten von Bauwerken aus den Serien.
 */
import * as THREE from 'three';
import { FACTIONS } from '../data/factions.js';
import { landmarkKind } from '../core/landmarks.js';

const SHOW_BELOW = 3500;   // Kameradistanz (LJ), ab der Wahrzeichen erscheinen
const SCREEN_PX = 56;      // ungefähre Bildschirmgröße

const metal = c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.35, transparent: true });
const glow = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });

/** Raumstation: zylindrischer Kern, flacher Ring, gerade Speichen, Antennenmast. */
function station(color) {
  const g = new THREE.Group();
  const hull = metal(0xc9d1dc), dark = metal(0x5c6675), light = glow(color);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.7, 16), hull); g.add(core);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), dark); cap.position.y = 0.35; g.add(cap);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), dark); mast.position.y = 0.6; g.add(mast);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 10, 48), hull); ring.rotation.x = Math.PI / 2; g.add(ring);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.075, 6, 48, Math.PI * 2), light); band.rotation.x = Math.PI / 2; band.scale.z = 0.25; g.add(band);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.035, 0.06), dark);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    s.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); s.rotation.y = -a; g.add(s);
  }
  for (let i = 0; i < 12; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), glow(0xffe2a8));
    const a = (i / 12) * Math.PI * 2; l.position.set(Math.cos(a) * 0.85, 0.08, Math.sin(a) * 0.85); g.add(l);
  }
  g.userData.spin = 0.25;
  return g;
}

/** Wurmloch: rotierender Lichttrichter. */
function funnel(color) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.08 + Math.pow(t, 2.2) * 0.95, -0.6 + t * 0.9)); }
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uFade: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uFade; varying vec2 vUv;
      void main(){
        float sw = 0.5 + 0.5 * sin(vUv.x * 6.2831 * 4.0 + vUv.y * 14.0 - uTime * 2.0);
        float a = (0.25 + 0.75 * pow(clamp(sw, 0.0, 1.0), 3.0)) * (1.0 - vUv.y * 0.6) * uFade;
        vec3 c = mix(vec3(1.0, 0.95, 0.8), uColor, vUv.y);
        gl_FragColor = vec4(c * a, a);
      }`,
  });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), mat));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), glow(0xffffff)); core.position.y = -0.6; g.add(core);
  g.rotation.x = -0.5;
  g.userData.spin = 0.6; g.userData.shader = mat;
  return g;
}

/** Hub/Relais: Gitterkörper mit pulsierendem Kern und Umlaufring. */
function lattice(color) {
  const g = new THREE.Group();
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.75, 1)), new THREE.LineBasicMaterial({ color, transparent: true }));
  g.add(wire);
  const inner = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.42, 0)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
  g.add(inner);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), glow(color)); g.add(core);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.012, 6, 64), glow(color)); orbit.rotation.x = 1.2; g.add(orbit);
  g.userData.spin = 0.35; g.userData.pulse = core; g.userData.inner = inner;
  return g;
}

/** Modulgebilde: frei angeordnete Oktaeder, Zylinder und Spitzen mit Leuchtkanten. */
function cluster(color) {
  const g = new THREE.Group();
  const hull = metal(0x3b4140), lines = new THREE.LineBasicMaterial({ color, transparent: true });
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const shapes = [() => new THREE.OctahedronGeometry(0.22, 0), () => new THREE.CylinderGeometry(0.1, 0.14, 0.5, 6), () => new THREE.ConeGeometry(0.12, 0.6, 5), () => new THREE.DodecahedronGeometry(0.18, 0)];
  for (let i = 0; i < 26; i++) {
    const geo = shapes[i % shapes.length]();
    const m = new THREE.Mesh(geo, hull);
    const r = 0.25 + rnd() * 0.75, a = rnd() * Math.PI * 2, y = (rnd() - 0.5) * 0.7;
    m.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    m.scale.setScalar(0.6 + rnd() * 0.9);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lines));
    g.add(m);
  }
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), glow(color)));
  g.userData.spin = 0.12;
  return g;
}

const BUILD = { station, funnel, lattice, cluster };

export function createLandmarks(places) {
  const group = new THREE.Group();
  group.renderOrder = 18;
  const sun = new THREE.DirectionalLight(0xfff3e0, 2.2); sun.position.set(0.5, 1, 0.4);
  group.add(sun, new THREE.AmbientLight(0x8090c0, 0.6));
  const items = [];
  for (const p of places) {
    const kind = landmarkKind(p);
    if (!kind) continue;
    const color = new THREE.Color(FACTIONS[p.faction].color).getHex();
    const obj = BUILD[kind](kind === 'funnel' ? 0x8ac8ff : color);
    obj.position.set(p.pos[0], 0, p.pos[1]);
    obj.visible = false;
    obj.traverse(o => { if (o.material) o.material.userData.baseOpacity = o.material.opacity ?? 1; });
    group.add(obj);
    items.push({ id: p.id, obj, fade: 0 });
  }
  return {
    group,
    count: items.length,
    visible: id => { const it = items.find(i => i.id === id); return !!it && it.obj.visible && it.fade > 0.5; },
    update(camera, camState, h, time) {
      const k = (2 * Math.tan((camera.fov * Math.PI) / 360)) / h;
      const want = camState.distance < SHOW_BELOW ? 1 : 0;
      for (const it of items) {
        it.fade += (want - it.fade) * 0.12;
        it.obj.visible = it.fade > 0.02;
        if (!it.obj.visible) continue;
        const d = camera.position.distanceTo(it.obj.position);
        it.obj.scale.setScalar((SCREEN_PX * k * d) / 2 * (0.7 + 0.3 * it.fade));
        it.obj.rotation.y = time * it.obj.userData.spin;
        it.obj.traverse(o => { if (o.material) o.material.opacity = o.material.userData.baseOpacity * it.fade; });
        if (it.obj.userData.shader) { it.obj.userData.shader.uniforms.uTime.value = time; it.obj.userData.shader.uniforms.uFade.value = it.fade; }
        if (it.obj.userData.pulse) it.obj.userData.pulse.scale.setScalar(1 + Math.sin(time * 3) * 0.25);
        if (it.obj.userData.inner) it.obj.userData.inner.rotation.x = time * 0.8;
      }
    },
  };
}
