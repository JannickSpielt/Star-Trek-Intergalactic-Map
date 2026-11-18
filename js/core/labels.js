/** Kollisionsfreies Label-Layout (gierig nach Priorität) und Detailstufen. */
export const LABEL_GAP = 8;
const ANCHORS = ['right', 'left', 'top', 'bottom'];

function rectFor(it, anchor) {
  const g = LABEL_GAP;
  const x = anchor === 'right' ? it.x + g : anchor === 'left' ? it.x - g - it.w : it.x - it.w / 2;
  const y = anchor === 'top' ? it.y - g - it.h : anchor === 'bottom' ? it.y + g : it.y - it.h / 2;
  return { x, y, w: it.w, h: it.h };
}

const hit = (a, b, p) => a.x - p < b.x + b.w && b.x - p < a.x + a.w && a.y - p < b.y + b.h && b.y - p < a.y + a.h;

export function layoutLabels(items, { width, height, pad = 4, blockers = [] }) {
  const placed = [...blockers], out = [];
  const sorted = items.filter(i => i.visible).sort((a, b) => a.priority - b.priority);
  for (const it of sorted) {
    for (const anchor of ANCHORS) {
      const r = rectFor(it, anchor);
      if (r.x < 0 || r.y < 0 || r.x + r.w > width || r.y + r.h > height) continue;
      if (placed.some(p => hit(r, p, pad))) continue;
      placed.push(r);
      out.push({ id: it.id, x: it.x, y: it.y, anchor });
      break;
    }
  }
  return out;
}

const RANK_MAX_DIST = { 1: Infinity, 2: 60000, 3: 12000, 4: 3000 };
export const rankVisible = (rank, distance) => distance < (RANK_MAX_DIST[rank] ?? 0);
