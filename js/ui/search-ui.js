/** Suchfeld mit Vorschlagsliste (Tastatur & Maus). */
import { search } from '../core/search.js';
import { FACTIONS } from '../data/factions.js';
import { quadrant } from '../core/coords.js';

export function createSearchUI(input, list, places, onPick) {
  let hits = [], active = -1;
  const close = () => { list.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); active = -1; };
  const render = () => {
    list.innerHTML = '';
    hits.forEach((p, i) => {
      const li = document.createElement('li');
      li.id = 'res-' + p.id; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      li.style.setProperty('--c', FACTIONS[p.faction].color);
      li.innerHTML = `<span class="dot"></span><span></span><small>${quadrant(p.pos)}</small>`;
      li.children[1].textContent = p.name;
      li.addEventListener('pointerdown', e => { e.preventDefault(); pick(p); });
      list.appendChild(li);
    });
    const open = hits.length > 0;
    list.classList.toggle('open', open);
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0) input.setAttribute('aria-activedescendant', 'res-' + hits[active].id); else input.removeAttribute('aria-activedescendant');
  };
  const pick = p => { input.value = p.name; close(); input.blur(); onPick(p.id); };

  input.addEventListener('input', () => { hits = search(input.value, places); active = hits.length ? 0 : -1; render(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && hits.length) { active = (active + 1) % hits.length; render(); e.preventDefault(); }
    else if (e.key === 'ArrowUp' && hits.length) { active = (active - 1 + hits.length) % hits.length; render(); e.preventDefault(); }
    else if (e.key === 'Enter') { const p = hits[Math.max(0, active)]; if (p) pick(p); e.preventDefault(); }
    else if (e.key === 'Escape') { input.value = ''; hits = []; close(); input.blur(); }
  });
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('focus', () => { if (hits.length) render(); });
  window.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  });
}
