/** Pfad entlang einer Reiseroute. Sprünge zählen in der Zeitleiste nur kurz. */
export const JUMP_WEIGHT = 1500;

export function buildPath(stops) {
  const legs = [];
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].pos, b = stops[i].pos;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const jump = !!stops[i].jump;
    const w = jump ? Math.min(len, JUMP_WEIGHT) : len;
    legs.push({ from: i - 1, a, b, len, jump, t0: total, w });
    total += w;
  }
  for (const l of legs) { l.t0 /= total; l.t1 = l.t0 + l.w / total; }
  const tOfStop = i => (i <= 0 ? 0 : i >= stops.length - 1 ? 1 : legs[i].t0);
  return {
    legs,
    tOfStop,
    /** Position, aktuelle Station (Startpunkt der Etappe) und Sprung-Flag bei t ∈ [0,1]. */
    at(t) {
      t = Math.min(1, Math.max(0, t));
      if (t >= 1) return { pos: [...stops[stops.length - 1].pos], stop: stops.length - 1, jump: false, heading: 0 };
      const l = legs.find(x => t < x.t1) ?? legs[legs.length - 1];
      const f = (t - l.t0) / (l.t1 - l.t0);
      const pos = f <= 0 ? [...l.a] : [l.a[0] + (l.b[0] - l.a[0]) * f, l.a[1] + (l.b[1] - l.a[1]) * f];
      return { pos, stop: l.from, jump: l.jump && f > 0, heading: Math.atan2(l.b[1] - l.a[1], l.b[0] - l.a[0]) };
    },
  };
}
