/** Übersichtskarte: schematische Draufsicht mit Sichtbereich; Klick springt dorthin. */
import { armPoint, rng } from '../render/galaxy.js';
import { blobPoints } from '../core/blob.js';
import { TERRITORIES, GALAXY_RADIUS } from '../data/shapes.js';
import { FACTIONS } from '../data/factions.js';

const SPAN = GALAXY_RADIUS * 1.1;
const ARMS = [0, Math.PI, Math.PI / 2, 1.5 * Math.PI];

export function createMinimap(canvas, { onJump }) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = canvas.width;
  canvas.width = canvas.height = size * dpr;
  const g = canvas.getContext('2d');
  const S = size * dpr, s = S / (2 * SPAN), c = S / 2;
  const toPx = ([x, y]) => [c + x * s, c + y * s];

  // Hintergrund einmal vorrendern
  const bg = document.createElement('canvas'); bg.width = bg.height = S;
  const b = bg.getContext('2d');
  const core = b.createRadialGradient(c, c, 0, c, c, S * 0.22);
  core.addColorStop(0, 'rgba(255,225,180,.9)'); core.addColorStop(1, 'rgba(255,200,150,0)');
  b.fillStyle = core; b.fillRect(0, 0, S, S);
  const r = rng(7);
  b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2600; i++) {
    const arm = { off: ARMS[i % 4] };
    const rr = 3200 + -Math.log(1 - r() * 0.98) * 12000;
    if (rr > 50000) continue;
    const [x, y] = armPoint(arm, rr);
    const j = 400 + rr * 0.07;
    const [px, py] = toPx([x + (r() - 0.5) * j * 2, y + (r() - 0.5) * j * 2]);
    b.fillStyle = `rgba(170,195,255,${0.25 + r() * 0.35})`;
    b.fillRect(px, py, dpr, dpr);
  }
  b.globalCompositeOperation = 'source-over';
  for (const t of TERRITORIES) {
    const pts = blobPoints(t, 24).map(toPx);
    b.beginPath(); pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y))); b.closePath();
    b.fillStyle = FACTIONS[t.faction].color + '66'; b.fill();
    b.strokeStyle = FACTIONS[t.faction].color; b.lineWidth = 0.8 * dpr; b.stroke();
  }
  b.strokeStyle = 'rgba(255,204,153,.35)'; b.lineWidth = dpr;
  b.beginPath(); b.moveTo(c, 0); b.lineTo(c, S); b.moveTo(0, c); b.lineTo(S, c); b.stroke();
  b.font = `${9 * dpr}px Antonio, sans-serif`; b.fillStyle = 'rgba(255,204,153,.7)'; b.textAlign = 'center';
  [['ALPHA', -1, 1], ['BETA', 1, 1], ['GAMMA', -1, -1], ['DELTA', 1, -1]].forEach(([n, sx, sy]) => b.fillText(n, c + sx * S * 0.27, c + sy * S * 0.3));

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * S, y = ((e.clientY - rect.top) / rect.height) * S;
    onJump([(x - c) / s, (y - c) / s]);
  });

  return {
    update(cam, halfWidthLy) {
      g.clearRect(0, 0, S, S);
      g.drawImage(bg, 0, 0);
      const [px, py] = toPx(cam.target);
      const rad = Math.max(3 * dpr, halfWidthLy * s);
      g.strokeStyle = '#ff9c3a'; g.lineWidth = 1.5 * dpr;
      g.beginPath(); g.arc(px, py, rad, 0, Math.PI * 2); g.stroke();
      // Blickrichtung
      const a = -cam.azimuth - Math.PI / 2;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * (rad + 8 * dpr), py + Math.sin(a) * (rad + 8 * dpr)); g.stroke();
      g.fillStyle = '#ffcc99'; g.beginPath(); g.arc(px, py, 2 * dpr, 0, Math.PI * 2); g.fill();
    },
  };
}
