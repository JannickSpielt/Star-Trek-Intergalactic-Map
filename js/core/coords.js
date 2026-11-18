/** Koordinaten-Hilfen. Karte: [x, y] in LJ, Kern = (0,0). Szene: x/z-Ebene. */
export const quadrant = ([x, y]) =>
  y >= 0 ? (x < 0 ? 'Alpha' : 'Beta') : (x < 0 ? 'Gamma' : 'Delta');

export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const nf = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
export const formatLy = n => `${nf.format(Math.round(n))} LJ`;

export const toScene = ([x, y]) => ({ x, y: 0, z: y });
