/** LCARS-inspirierter Rahmen: Ziele, Ebenen, Statuszeile, Datenstreifen. */
import { quadrant, formatLy } from '../core/coords.js';
import { SOL } from '../data/shapes.js';

const LAYER_DEFS = [
  { key: 'territories', name: 'Reiche', color: '#ffcc99' },
  { key: 'borders', name: 'Grenzen', color: '#cc99cc' },
  { key: 'regions', name: 'Anomalien', color: '#ff9c3a' },
  { key: 'wormhole', name: 'Wurmloch', color: '#99ccff' },
  { key: 'grid', name: 'Raster', color: '#9999ff' },
  { key: 'labels', name: 'Namen', color: '#d9a26b' },
];

const nice = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; };

export function createFrame({ bookmarks, layers, onBookmark }) {
  const side = document.getElementById('side');
  const menu = document.getElementById('menu-toggle');
  menu.addEventListener('click', () => {
    const open = side.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  const closeMenu = () => { side.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };

  const bm = document.getElementById('bookmarks');
  for (const b of bookmarks) {
    const btn = document.createElement('button');
    btn.className = 'lc-btn'; btn.textContent = b.name; btn.style.setProperty('--c', b.color);
    btn.addEventListener('click', () => {
      btn.classList.remove('active'); void btn.offsetWidth; btn.classList.add('active');
      onBookmark(b); closeMenu();
    });
    bm.appendChild(btn);
  }

  const ly = document.getElementById('layers');
  const labelsEl = document.getElementById('labels');
  for (const d of LAYER_DEFS) {
    const target = d.key === 'labels' ? { get visible() { return labelsEl.style.display !== 'none'; }, set visible(v) { labelsEl.style.display = v ? '' : 'none'; } } : layers[d.key];
    if (!target) continue;
    const btn = document.createElement('button');
    btn.className = 'lc-btn'; btn.textContent = d.name; btn.style.setProperty('--c', d.color);
    btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => {
      target.visible = !target.visible;
      btn.setAttribute('aria-pressed', String(target.visible));
    });
    ly.appendChild(btn);
  }

  // dekorativer Datenstreifen
  const ds = document.getElementById('data-stream');
  let tick = 0;
  const stream = () => {
    let s = '';
    for (let i = 0; i < 40; i++) s += (((i * 7919 + tick * 104729) % 9973) + '').padStart(4, '0') + ' ';
    ds.textContent = s; tick++;
  };
  stream(); setInterval(stream, 1400);

  const qEl = document.getElementById('readout-quadrant');
  const cEl = document.getElementById('readout-coords');
  const dEl = document.getElementById('readout-dist');
  const sLabel = document.getElementById('scale-label');
  const sc = document.getElementById('scalebar');
  const g = sc.getContext('2d');
  let last = '';

  return {
    /** target: Kartenkoordinate, pxPerLy: Bildschirmskala dort. */
    setStatus({ target, pxPerLy, distance }) {
      const rx = Math.round(target[0] - SOL[0]), ry = Math.round(SOL[1] - target[1]);
      const ly = nice(110 / pxPerLy);
      const key = `${quadrant(target)}|${rx}|${ry}|${ly}|${Math.round(distance)}`;
      if (key === last) return; last = key;
      qEl.textContent = `${quadrant(target)}-Quadrant`;
      cEl.textContent = `X ${rx.toLocaleString('de-DE')} · Y ${ry.toLocaleString('de-DE')} (Sol = 0)`;
      dEl.textContent = `Abstand Sol ${formatLy(Math.hypot(rx, ry))}`;
      const px = ly * pxPerLy;
      g.clearRect(0, 0, sc.width, sc.height);
      g.fillStyle = '#ffcc99';
      g.fillRect(2, 9, px, 3); g.fillRect(2, 4, 2, 13); g.fillRect(2 + px - 2, 4, 2, 13);
      sLabel.textContent = formatLy(ly);
    },
  };
}
