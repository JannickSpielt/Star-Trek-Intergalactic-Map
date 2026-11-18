/** Reine Kameralogik (ohne three.js): Orbit um einen Zielpunkt auf der Galaxie-Ebene. */
export const MIN_DIST = 8;
export const MAX_DIST = 160000;
export const MAX_TILT = 1.1;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const createCameraState = ({ target, distance, azimuth = 0, tilt = 0.8 }) =>
  ({ target: [target[0], target[1]], distance: clamp(distance, MIN_DIST, MAX_DIST), azimuth, tilt: clamp(tilt, 0, MAX_TILT) });

/** Nah heran wird die Ansicht zur Draufsicht, damit Beschriftungen lesbar bleiben. */
export const effectiveTilt = s => s.tilt * smoothstep(400, 8000, s.distance);

/** Bildschirm-Richtungen in Kartenkoordinaten. */
export const screenAxes = az => ({ right: [Math.cos(az), -Math.sin(az)], up: [-Math.sin(az), -Math.cos(az)] });

export function cameraPosition(s) {
  const t = effectiveTilt(s);
  const h = s.distance * Math.sin(t);
  return { x: s.target[0] + h * Math.sin(s.azimuth), y: s.distance * Math.cos(t), z: s.target[1] + h * Math.cos(s.azimuth) };
}

export function applyZoom(s, factor, anchor) {
  const d = clamp(s.distance * factor, MIN_DIST, MAX_DIST);
  const f = d / s.distance;
  const target = anchor ? [anchor[0] + (s.target[0] - anchor[0]) * f, anchor[1] + (s.target[1] - anchor[1]) * f] : s.target;
  return { ...s, distance: d, target };
}

export function applyPan(s, dxPx, dyPx, viewportH, fov) {
  const k = (2 * s.distance * Math.tan(((fov * Math.PI) / 180) / 2)) / viewportH;
  const { right, up } = screenAxes(s.azimuth);
  const ky = k / Math.max(0.35, Math.cos(effectiveTilt(s)));
  return { ...s, target: [s.target[0] - right[0] * dxPx * k + up[0] * dyPx * ky, s.target[1] - right[1] * dxPx * k + up[1] * dyPx * ky] };
}

export const applyRotate = (s, dAz, dTilt) => ({ ...s, azimuth: s.azimuth + dAz, tilt: clamp(s.tilt + dTilt, 0, MAX_TILT) });

export function pinch(prev, next) {
  const len = p => Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]);
  const ang = p => Math.atan2(p.b[1] - p.a[1], p.b[0] - p.a[0]);
  let rotate = ang(next) - ang(prev);
  rotate = Math.atan2(Math.sin(rotate), Math.cos(rotate));
  const mid = p => [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2];
  const m0 = mid(prev), m1 = mid(next);
  return { zoom: len(prev) / Math.max(1, len(next)), rotate, panPx: [m1[0] - m0[0], m1[1] - m0[1]] };
}

/** Kamerafahrt mit Ausholbogen: bei weiten Strecken erst raus, dann rein. */
export function flyPath(from, to) {
  const D = Math.hypot(to.target[0] - from.target[0], to.target[1] - from.target[1]);
  const l0 = Math.log(from.distance), l1 = Math.log(to.distance);
  const bump = Math.max(0, Math.log(Math.min(MAX_DIST, 0.85 * D) || 1) - (l0 + l1) / 2);
  let dAz = to.azimuth - from.azimuth;
  dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
  return t => {
    const e = ease(clamp(t, 0, 1));
    return {
      target: [lerp(from.target[0], to.target[0], e), lerp(from.target[1], to.target[1], e)],
      distance: clamp(Math.exp(lerp(l0, l1, e) + bump * Math.sin(Math.PI * e)), MIN_DIST, MAX_DIST),
      azimuth: from.azimuth + dAz * e,
      tilt: lerp(from.tilt, to.tilt, e),
    };
  };
}

export const isClick = (down, up, ms) => Math.hypot(up[0] - down[0], up[1] - down[1]) < 6 && ms < 400;
