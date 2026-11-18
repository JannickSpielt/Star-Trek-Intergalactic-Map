/** Infofenster (Desktop: Seitenpanel, Handy: Bottom-Sheet). */
import { FACTIONS, FACTION_INFO } from '../data/factions.js';
import { SOL, TERRITORIES } from '../data/shapes.js';
import { PLACES } from '../data/places.js';
import { blobPoints } from '../core/blob.js';
import { quadrant, distance, formatLy } from '../core/coords.js';
import { artParams, renderPlanet } from '../render/planet-art.js';

const TYPE = { capital: 'Hauptwelt', planet: 'Planet', station: 'Station / Basis', anomaly: 'Anomalie', wormhole: 'Wurmloch', battle: 'Schlachtfeld / Ereignis' };
const SERIES = { TOS: 'Raumschiff Enterprise', TNG: 'Das nächste Jahrhundert', DS9: 'Deep Space Nine', VOY: 'Voyager', ENT: 'Enterprise', DIS: 'Discovery', PIC: 'Picard', SNW: 'Strange New Worlds', LD: 'Lower Decks', PRO: 'Prodigy', Filme: 'Kinofilme' };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createInfo({ onClose, onCenter, onFocusPower = () => {} }) {
  const el = document.getElementById('info');
  const title = document.getElementById('info-title');
  const body = document.getElementById('info-body');
  let stop = null, current = null;

  document.getElementById('info-close').addEventListener('click', () => onClose());
  // Bottom-Sheet nach unten wischen
  let sy = null;
  el.querySelector('.info-grip').addEventListener('pointerdown', e => { sy = e.clientY; e.target.setPointerCapture(e.pointerId); });
  el.querySelector('.info-grip').addEventListener('pointerup', e => { if (sy !== null && e.clientY - sy > 50) onClose(); sy = null; });

  function hide() {
    el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    stop?.(); stop = null; current = null;
  }

  function show(p) {
    if (!p) return hide();
    if (current === p.id) return;
    current = p.id;
    stop?.();
    const f = FACTIONS[p.faction];
    el.style.setProperty('--c', f.color);
    title.textContent = p.name;
    title.classList.toggle('long', p.name.length > 16);
    const rel = [Math.round(p.pos[0] - SOL[0]), Math.round(SOL[1] - p.pos[1])];
    // Suche mit Direktsprung: öffnet die Seite, falls vorhanden, sonst die Trefferliste
    const ma = `https://memory-alpha.fandom.com/de/wiki/Spezial:Suche?search=${encodeURIComponent(p.ma.replace(/_/g, ' '))}&go=Go`;
    body.innerHTML = `
      <div class="info-art"><div class="ring"></div><canvas width="400" height="400" aria-label="Darstellung von ${esc(p.name)}"></canvas></div>
      <span class="chip" style="--c:${f.color}">${esc(f.name)}</span>
      <dl class="facts">
        <dt>Typ</dt><dd>${TYPE[p.type] ?? p.type}</dd>
        <dt>Quadrant</dt><dd>${quadrant(p.pos)}-Quadrant</dd>
        <dt>Entfernung Sol</dt><dd>${p.id === 'sol' ? '—' : formatLy(distance(p.pos, SOL))}</dd>
        <dt>Koordinaten</dt><dd>X ${rel[0].toLocaleString('de-DE')} · Y ${rel[1].toLocaleString('de-DE')}</dd>
        <dt>Position</dt><dd>${p.approx ? '<span class="approx">angenähert, nicht genau bekannt</span>' : 'nach Canon-Angaben'}</dd>
      </dl>
      <p class="desc">${esc(p.desc)}</p>
      <div class="badges">${p.series.map(s => `<span class="badge" title="${SERIES[s] ?? s}">${s}</span>`).join('')}</div>
      <div class="actions">
        <button type="button" class="center-btn">Zentrieren</button>
        <a class="ma-link" href="${ma}" target="_blank" rel="noopener">Memory Alpha ↗</a>
      </div>
      <p class="info-note">Bild: eigene, computergenerierte Darstellung.${p.approx ? ' Der genaue Standort ist im Canon nicht festgelegt, die Karte zeigt eine plausible Lage.' : ''}</p>`;
    body.querySelector('.center-btn').addEventListener('click', () => onCenter(p.id));
    body.scrollTop = 0;
    el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    const canvas = body.querySelector('canvas');
    stop = renderPlanet(canvas, artParams(p));
  }
  /** Umriss des Reichs als leuchtendes Emblem (eigene Darstellung). */
  function drawEmblem(canvas, fid, color) {
    const t = TERRITORIES.find(x => x.faction === fid);
    const g = canvas.getContext('2d'); const S = canvas.width;
    g.clearRect(0, 0, S, S);
    if (!t) return;
    const pts = blobPoints({ ...t, center: [0, 0] }, 72);
    const m = Math.max(...pts.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    const k = (S * 0.4) / m;
    g.save(); g.translate(S / 2, S / 2);
    for (let r = 3; r >= 0; r--) {
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath();
      g.strokeStyle = color; g.globalAlpha = r ? 0.12 : 1; g.lineWidth = r ? r * 8 : 3; g.stroke();
    }
    g.globalAlpha = 0.14; g.fillStyle = color; g.fill();
    g.globalAlpha = 1;
    const cap = PLACES.find(p => p.id === FACTION_INFO[fid]?.capital);
    if (cap) {
      const cx = (cap.pos[0] - t.center[0]) * k, cy = (cap.pos[1] - t.center[1]) * k;
      g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      g.beginPath(); g.arc(cx, cy, 13, 0, Math.PI * 2); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
    }
    g.restore();
  }

  function showFaction(fid) {
    const f = FACTIONS[fid], i = FACTION_INFO[fid];
    if (!f || !i) return hide();
    stop?.(); stop = null;
    current = 'f:' + fid;
    el.style.setProperty('--c', f.color);
    title.textContent = f.name;
    title.classList.toggle('long', f.name.length > 16);
    const t = TERRITORIES.find(x => x.faction === fid);
    const cap = PLACES.find(p => p.id === i.capital);
    const ma = `https://memory-alpha.fandom.com/de/wiki/Spezial:Suche?search=${encodeURIComponent(f.name)}&go=Go`;
    body.innerHTML = `
      <div class="info-art"><div class="ring"></div><canvas width="400" height="400" aria-label="Umriss des Gebiets"></canvas></div>
      <span class="chip" style="--c:${f.color}">Großmacht · Stand 2375</span>
      <dl class="facts">
        <dt>Hauptwelt</dt><dd>${cap ? esc(cap.name) : '—'}</dd>
        <dt>Regierung</dt><dd>${esc(i.government)}</dd>
        <dt>Quadrant</dt><dd>${t ? quadrant(t.center) + '-Quadrant' : '—'}</dd>
        <dt>Völker</dt><dd>${i.species.map(esc).join(', ')}</dd>
        ${i.founded ? `<dt>Gegründet</dt><dd>${esc(i.founded)}</dd>` : ''}
        <dt>Grenzen</dt><dd><span class="approx">angenähert</span></dd>
      </dl>
      <p class="desc">${esc(i.desc)}</p>
      <div class="badges">${i.series.map(s => `<span class="badge" title="${esc(SERIES[s] ?? s)}">${esc(s)}</span>`).join('')}</div>
      <div class="actions">
        <button type="button" class="center-btn">${cap ? 'Zur Hauptwelt' : 'Zentrieren'}</button>
        <a class="ma-link" href="${ma}" target="_blank" rel="noopener">Memory Alpha ↗</a>
      </div>
      <p class="info-note">Emblem: Umriss des Gebiets auf dieser Karte, der Punkt markiert die Hauptwelt.</p>`;
    body.querySelector('.center-btn').addEventListener('click', () => (cap ? onCenter(cap.id) : onFocusPower(fid)));
    body.scrollTop = 0;
    el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    const c = body.querySelector('canvas');
    drawEmblem(c, fid, f.color);
  }

  return { show, hide, showFaction };
}
