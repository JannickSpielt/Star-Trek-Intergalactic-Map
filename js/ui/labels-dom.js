/** HTML-Beschriftungen über der 3D-Szene: Orte, Reiche, Anomalien, Quadranten. */
import { layoutLabels, LABEL_GAP } from '../core/labels.js';
import { FACTIONS } from '../data/factions.js';

export function createLabelLayer(container, markers, anchors) {
  const placeEls = new Map();
  for (const it of markers.items) {
    const el = document.createElement('div');
    el.className = `label r${it.p.rank}`;
    el.dataset.id = it.p.id;
    el.textContent = it.p.name;
    el.style.setProperty('--c', FACTIONS[it.p.faction].color);
    el.style.opacity = '0';
    container.appendChild(el);
    placeEls.set(it.p.id, { el, w: 0, h: 0 });
  }
  const anchorEls = anchors.map(a => {
    const el = document.createElement('div');
    el.className = a.kind === 'territory' ? 'tlabel' : a.kind === 'quadrant' ? 'qlabel' : 'rlabel';
    if (a.kind === 'territory') {
      const f = FACTIONS[a.faction];
      el.style.setProperty('--c', f.color);
      el.textContent = f.short;
    } else {
      el.textContent = a.text;
      if (a.color) el.style.setProperty('--c', a.color);
    }
    el.style.opacity = '0';
    container.appendChild(el);
    return { a, el };
  });

  const measure = () => {
    for (const v of placeEls.values()) { v.w = v.el.offsetWidth; v.h = v.el.offsetHeight; }
    for (const { el } of anchorEls) el._w = undefined; // nach Schriftladen neu messen
  };
  measure();
  document.fonts?.ready.then(measure);

  let selected = null;
  /** Stil nur schreiben, wenn er sich ändert (spart Layout-Arbeit). */
  const set = (el, prop, val) => { if (el.style[prop] !== val) el.style[prop] = val; };
  const showAt = (el, show, s) => {
    set(el, 'opacity', show ? '' : '0');
    if (show) set(el, 'transform', `translate(${Math.round(s.x)}px, ${Math.round(s.y)}px) translate(-50%, -50%)`);
  };
  const project = (camera, pos, w, h, v) => {
    v.set(pos[0], 0, pos[1]).project(camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, ok: v.z < 1 };
  };

  return {
    setSelected(id) {
      if (selected) placeEls.get(selected)?.el.classList.remove('sel');
      selected = id;
      if (id) placeEls.get(id)?.el.classList.add('sel');
    },
    /** pxPerLy(pos) liefert die Bildschirmskala an einer Kartenposition. */
    update(camera, camState, w, h, pxPerLy, v) {
      const overlaps = (r, list) => list.some(b => r.x < b.x + b.w && b.x < r.x + r.w && r.y < b.y + b.h && b.y < r.y + r.h);
      const rectOf = (el, s) => { const bw = el._w, bh = el._h; return { x: s.x - bw / 2, y: s.y - bh / 2, w: bw, h: bh }; };
      const sizeOf = (el, fs) => {
        if (fs && el._fs !== fs) { set(el, 'fontSize', fs + 'px'); el._fs = fs; el._w = undefined; }
        if (el._w === undefined || el._w === 0) { el._w = el.offsetWidth; el._h = el.offsetHeight; }
      };
      // 1) Quadranten, Grenzen, Anomalien – untereinander kollisionsfrei
      const blockers = [], terr = [];
      for (const { a, el } of anchorEls) {
        const s = project(camera, a.pos, w, h, v);
        let show = false, fs = 0;
        if (s.ok && (!a.layer || a.layer.visible)) {
          const span = (a.size || 0) * 2 * pxPerLy(a.pos);
          if (a.kind === 'quadrant') { show = camState.distance > 40000; fs = 22; }
          else if (a.kind === 'territory') { show = span > 90 && span < 2200; fs = Math.round(Math.max(13, Math.min(44, span / 9))); }
          else if (a.kind === 'border') { show = span > 160 && span < 6000; }
          else { show = span > 50 && span < 3000; }
        }
        if (show && a.kind === 'territory') { terr.push({ el, s, fs }); continue; }
        if (show) {
          sizeOf(el, fs);
          const r = rectOf(el, s);
          if (overlaps(r, blockers)) show = false; else blockers.push(r);
        }
        showAt(el, show, s);
      }
      // 2) Ortsnamen – weichen den obigen aus
      const items = [];
      for (const it of markers.items) {
        const m = placeEls.get(it.p.id);
        items.push({ id: it.p.id, x: it.sx, y: it.sy, w: m.w, h: m.h, priority: it.p.id === selected ? 0 : it.p.rank, visible: it.onScreen && it.vis > 0.6 });
      }
      const placed = layoutLabels(items, { width: w, height: h, pad: 3, blockers });
      const shown = new Set(), occupied = [...blockers];
      for (const l of placed) {
        const m = placeEls.get(l.id);
        const g = LABEL_GAP;
        const x = l.anchor === 'right' ? l.x + g : l.anchor === 'left' ? l.x - g - m.w : l.x - m.w / 2;
        const y = l.anchor === 'top' ? l.y - g - m.h : l.anchor === 'bottom' ? l.y + g : l.y - m.h / 2;
        set(m.el, 'transform', `translate(${Math.round(x)}px, ${Math.round(y)}px)`);
        set(m.el, 'opacity', '');
        occupied.push({ x, y, w: m.w, h: m.h });
        shown.add(l.id);
      }
      for (const [id, m] of placeEls) if (!shown.has(id)) set(m.el, 'opacity', '0');
      // 3) Reichsnamen nur dort, wo noch Platz ist (größte zuerst)
      terr.sort((p, q) => q.fs - p.fs);
      for (const t of terr) {
        sizeOf(t.el, t.fs);
        const r = rectOf(t.el, t.s);
        const free = !overlaps(r, occupied);
        if (free) occupied.push(r);
        showAt(t.el, free, t.s);
      }
      for (const { a, el } of anchorEls) if (a.kind === 'territory' && !terr.some(t => t.el === el)) set(el, 'opacity', '0');
    },
  };
}
