/** Suche über Orte, Mächte, Regionen, Grenzen und Reisen – tolerant gegenüber Umlauten und Tippfehlern. */
import { PLACES } from '../data/places.js';
import { FACTIONS } from '../data/factions.js';
import { TERRITORIES, REGIONS, BORDERS } from '../data/shapes.js';
import { ROUTES } from '../data/routes.js';

const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
export function normalize(s) {
  return strip(s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'));
}
/** Variante mit einfachem Vokal (ü → u), weil viele Nutzer so tippen. */
const normalizePlain = s => strip(s.toLowerCase().replace(/ß/g, 'ss'));

/** Levenshtein-Distanz mit frühem Abbruch. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Bewertung: 0 = Präfix, 1 = Wortanfang, 2 = Teilstring, 3 = Tippfehler, null = kein Treffer. */
function score(q, text) {
  const variants = [normalize(text), normalizePlain(text)];
  const words = text.split(/[\s\-–()·,]+/).filter(Boolean).flatMap(w => [normalize(w), normalizePlain(w)]);
  if (variants.some(n => n.startsWith(q))) return 0;
  if (words.some(w => w.startsWith(q))) return 1;
  if (variants.some(n => n.includes(q))) return 2;
  const max = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (max && [...variants, ...words].some(n => editDistance(q, n.slice(0, q.length), max) <= max || editDistance(q, n, max) <= max)) return 3;
  return null;
}

/** Gemeinsamer Suchindex. Jeder Eintrag: { kind, id, name, aliases, rank, … }. */
export function buildIndex() {
  const items = PLACES.map(p => ({ ...p, kind: 'place' }));
  for (const t of TERRITORIES) {
    const f = FACTIONS[t.faction];
    items.push({ kind: 'power', id: t.faction, name: f.name, aliases: [f.short], rank: 1, faction: t.faction, pos: t.center });
  }
  for (const r of REGIONS) items.push({ kind: 'region', id: r.id, name: r.name, aliases: [], rank: 2, pos: r.center, faction: 'ind', color: r.color });
  BORDERS.forEach((b, i) => items.push({ kind: 'border', id: 'border-' + i, name: b.name, aliases: [], rank: 2, pos: b.pts[Math.floor(b.pts.length / 2)], faction: 'ind', color: b.color }));
  for (const r of ROUTES) items.push({ kind: 'journey', id: r.id, name: r.name, aliases: [r.ship, 'Voyager'], rank: 1, pos: r.stops[0].pos, faction: 'ind', color: r.color });
  return items;
}

export function search(query, items, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const hits = [];
  for (const p of items) {
    let best = null;
    for (const t of [p.name, ...(p.aliases || [])]) {
      const s = score(q, t);
      if (s !== null && (best === null || s < best)) best = s;
    }
    if (best !== null) {
      const exact = [p.name, ...(p.aliases || [])].some(t => normalize(t) === q) ? 0 : 1;
      hits.push({ p, s: best, exact });
    }
  }
  // gleich gute Treffer: exakter Name zuerst, dann Orte vor Mächten, Reisen, Regionen und Grenzen
  const KIND = { place: 0, power: 1, journey: 2, region: 3, border: 4 };
  hits.sort((a, b) => a.s - b.s || a.exact - b.exact || (KIND[a.p.kind] ?? 0) - (KIND[b.p.kind] ?? 0) || a.p.rank - b.p.rank || a.p.name.localeCompare(b.p.name, 'de'));
  return hits.slice(0, limit).map(h => h.p);
}
