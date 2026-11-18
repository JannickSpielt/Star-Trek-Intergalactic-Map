/** Welche Orte bekommen ein 3D-Wahrzeichen, und welche (frei gestaltete) Form? */
const OVERRIDES = { unikomplex: 'cluster', unimatrix: null, transwarp: 'lattice', hirogen: 'lattice' };

export function landmarkKind(place) {
  if (place.id in OVERRIDES) return OVERRIDES[place.id];
  if (place.type === 'wormhole') return 'funnel';
  if (place.type === 'station' && place.art === 'station') return 'station';
  return null;
}
