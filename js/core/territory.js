/** Welches Reich liegt an einer Kartenposition? Bei Überlappung gewinnt das kleinste Gebiet. */
import { blobPoints } from './blob.js';

const cache = new WeakMap();
const polyOf = t => { if (!cache.has(t)) cache.set(t, blobPoints(t, 72)); return cache.get(t); };

function inside([x, y], pts) {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function territoryAt(pos, territories) {
  let best = null, bestArea = Infinity;
  for (const t of territories) {
    const area = t.rx * t.ry;
    if (area < bestArea && inside(pos, polyOf(t))) { best = t.faction; bestArea = area; }
  }
  return best;
}
