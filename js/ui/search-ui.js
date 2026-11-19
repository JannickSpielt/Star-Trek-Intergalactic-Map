/** Suchfeld mit Vorschlagsliste (Tastatur & Maus). */
import { search } from '../core/search.js';
import { FACTIONS } from '../data/factions.js';
import { quadrant } from '../core/coords.js';

const KIND_LABEL = { place: null, power: 'Macht', region: 'Region', border: 'Grenze', journey: 'Reise' };

/** items: Suchindex (buildIndex); onPick(item) bekommt den gewählten Eintrag. */
export function createSearchUI(input, list, items, onPick) {
  let hits = [], active = -1;
  const close = () => { list.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); active = -1; };
  const render = () => {
    list.innerHTML = '';
    if (!hits.length && input.value.trim()) {
      const li = document.createElement('li');
      li.className = 'empty'; li.setAttribute('role', 'option'); li.setAttribute('aria-disabled', 'true');
      li.textContent = 'Keine Treffer';
      list.appendChild(li);
    }
    hits.forEach((p, i) => {
      const li = document.createElement('li');
      li.id = 'res-' + p.id; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      li.style.setProperty('--c', p.color || FACTIONS[p.faction].color);
      li.innerHTML = `<span class="dot"></span><span></span><small>${KIND_LABEL[p.kind] ? KIND_LABEL[p.kind] + ' · ' : ''}${quadrant(p.pos)}</small>`;
      li.children[1].textContent = p.name;
      // Fokus im Suchfeld halten, aber erst beim Loslassen ohne Wischbewegung auswählen
      let down = null;
      li.addEventListener('pointerdown', e => { e.preventDefault(); down = [e.clientX, e.clientY]; });
      li.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 8) pick(p); down = null; });
      li.addEventListener('pointercancel', () => { down = null; });
      li.addEventListener('pointerleave', () => { down = null; });
      list.appendChild(li);
    });
    const open = hits.length > 0 || !!input.value.trim();
    list.classList.toggle('open', open);
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', 'res-' + hits[active].id); else input.removeAttribute('aria-activedescendant');
  };
  const pick = p => { input.value = p.name; close(); input.blur(); onPick(p); };

  input.addEventListener('input', () => { hits = search(input.value, items); active = hits.length ? 0 : -1; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && hits.length) { active = (active + 1) % hits.length; render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' && hits.length) { active = (active - 1 + hits.length) % hits.length; render(); e.preventDefault(); }
    else if (e.key === 'Enter') { const p = hits[Math.max(0, active)]; if (p) pick(p); e.preventDefault(); }
    else if (e.key === 'Escape') { input.value = ''; hits = []; close(); input.blur(); }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('focus', () => { input.select(); if (hits.length) render(); });
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  });
}
