/** Infofenster (Desktop: Seitenpanel, Handy: Bottom-Sheet). */
import { FACTIONS } from '../data/factions.js';
import { SOL } from '../data/shapes.js';
import { quadrant, distance, formatLy } from '../core/coords.js';
import { artParams, renderPlanet } from '../render/planet-art.js';

const TYPE = { capital: 'Hauptwelt', planet: 'Planet', station: 'Station / Basis', anomaly: 'Anomalie', wormhole: 'Wurmloch', battle: 'Schlachtfeld / Ereignis' };
const SERIES = { TOS: 'Raumschiff Enterprise', TNG: 'Das nächste Jahrhundert', DS9: 'Deep Space Nine', VOY: 'Voyager', ENT: 'Enterprise', DIS: 'Discovery', PIC: 'Picard', SNW: 'Strange New Worlds', LD: 'Lower Decks', PRO: 'Prodigy', Filme: 'Kinofilme' };
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createInfo({ onClose, onCenter }) {
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
      </dl>
      <p class="desc">${esc(p.desc)}</p>
      <div class="badges">${p.series.map(s => `<span class="badge" title="${SERIES[s] ?? s}">${s}</span>`).join('')}</div>
      <div class="actions">
        <button type="button" class="center-btn">Zentrieren</button>
        <a class="ma-link" href="${ma}" target="_blank" rel="noopener">Memory Alpha ↗</a>
      </div>
      <p class="info-note">Bild: eigene, computergenerierte Darstellung. Position auf der Karte angenähert.</p>`;
    body.querySelector('.center-btn').addEventListener('click', () => onCenter(p.id));
    body.scrollTop = 0;
    el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    const canvas = body.querySelector('canvas');
    stop = renderPlanet(canvas, artParams(p));
  }
  return { show, hide };
}
