/** Organische, deterministische Umrissform für ein Territorium. */
export function blobPoints({ center, rx, ry, rot = 0, seed = 0 }, n = 48) {
  const s = seed * 1.7;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const m = 1 + 0.10 * Math.sin(3 * t + s) + 0.06 * Math.sin(5 * t + 2 * s) + 0.04 * Math.sin(7 * t + 3 * s);
    const ex = Math.cos(t) * rx * m, ey = Math.sin(t) * ry * m;
    pts.push([center[0] + ex * cos - ey * sin, center[1] + ex * sin + ey * cos]);
  }
  return pts;
}
