/** Suche über Namen und Aliasse, tolerant gegenüber Umlauten und Schreibweisen. */
export function normalize(s) {
  return s.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Bewertung: 0 = Präfix, 1 = Wortanfang, 2 = Teilstring, null = kein Treffer. */
function score(q, text) {
  const n = normalize(text);
  if (n.startsWith(q)) return 0;
  const words = text.split(/[\s\-–()·]+/).map(normalize);
  if (words.some(w => w.startsWith(q))) return 1;
  return n.includes(q) ? 2 : null;
}

export function search(query, places, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const hits = [];
  for (const p of places) {
    let best = null;
    for (const t of [p.name, ...(p.aliases || [])]) {
      const s = score(q, t);
      if (s !== null && (best === null || s < best)) best = s;
    }
    if (best !== null) hits.push({ p, s: best });
  }
  hits.sort((a, b) => a.s - b.s || a.p.rank - b.p.rank || a.p.name.localeCompare(b.p.name, 'de'));
  return hits.slice(0, limit).map(h => h.p);
}
