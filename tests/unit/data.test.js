import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS } from '../../js/data/factions.js';
import { PLACES } from '../../js/data/places.js';
import { TERRITORIES, REGIONS, BORDERS, WORMHOLE, BOOKMARKS, SOL, GALAXY_RADIUS } from '../../js/data/shapes.js';

const ART = ['desert','ocean','ice','gas','city','jungle','lava','barren','storm','station','wormhole','nebula','debris'];
const byId = Object.fromEntries(PLACES.map(p => [p.id, p]));

test('place ids are unique', () => {
  assert.equal(new Set(PLACES.map(p => p.id)).size, PLACES.length);
});

test('every place is well formed', () => {
  for (const p of PLACES) {
    assert.ok(FACTIONS[p.faction], `${p.id}: faction ${p.faction}`);
    assert.ok([1,2,3,4,5].includes(p.rank), `${p.id}: rank`);
    assert.ok(p.series.length >= 1, `${p.id}: series`);
    assert.ok(p.desc.length >= 40, `${p.id}: desc too short`);
    assert.ok(p.ma, `${p.id}: ma`);
    assert.ok(ART.includes(p.art), `${p.id}: art ${p.art}`);
    assert.ok(Array.isArray(p.aliases), `${p.id}: aliases`);
    assert.ok(Math.hypot(...p.pos) <= GALAXY_RADIUS, `${p.id}: outside galaxy`);
  }
});

test('at least 60 places including the key ones', () => {
  assert.ok(PLACES.length >= 60, `only ${PLACES.length}`);
  for (const id of ['sol','vulcan','qonos','romulus','cardassia','bajor','ds9','wurmloch-bajor','idran','gruender','ocampa','unikomplex','wolf359'])
    assert.ok(byId[id], `missing ${id}`);
});

test('sol sits at the canonical position', () => {
  assert.deepEqual(byId.sol.pos, [0, 26000]);
  assert.deepEqual(SOL, [0, 26000]);
});

test('aliases cover alternative spellings', () => {
  assert.ok(byId.qonos.aliases.includes('Kronos'));
  assert.ok(byId.ds9.aliases.includes('Terok Nor'));
});

test('shapes reference valid data', () => {
  assert.ok(byId[WORMHOLE.from] && byId[WORMHOLE.to]);
  for (const t of TERRITORIES) assert.ok(FACTIONS[t.faction], t.faction);
  assert.ok(REGIONS.length >= 6 && BORDERS.length >= 3 && BOOKMARKS.length >= 6);
});

test('neighbours of Sol sit at their canon distances (light years)', () => {
  const d = id => Math.hypot(byId[id].pos[0] - SOL[0], byId[id].pos[1] - SOL[1]);
  const near = (id, ly, tol = 0.6) => assert.ok(Math.abs(d(id) - ly) <= tol, `${id}: ${d(id).toFixed(1)} LJ, erwartet ${ly}`);
  near('alphacen', 4.4);
  near('wolf359', 7.9);
  near('tellar', 11.4);
  near('vulcan', 16.5);
});

test('Sol-system places only appear when zoomed right in (rank 5)', () => {
  for (const id of ['mars', 'jupiter', 'alphacen', 'wolf359']) assert.equal(byId[id].rank, 5, id);
});

test('more places, each marked whether its position is canon-exact', () => {
  assert.ok(PLACES.length >= 85, `only ${PLACES.length}`);
  for (const p of PLACES) assert.equal(typeof p.approx, 'boolean', p.id);
  for (const id of ['sol', 'alphacen', 'wolf359', 'tellar', 'vulcan']) assert.equal(byId[id].approx, false, id);
  for (const id of ['qonos', 'romulus', 'ocampa', 'deneva']) assert.equal(byId[id].approx, true, id);
});

test('known content errors stay fixed', () => {
  assert.ok(!/Spocks Halbbruder Sam/.test(byId.deneva.desc), 'Deneva: Sam ist Kirks Bruder');
  assert.ok(/Kirk/.test(byId.deneva.desc));
  const all = JSON.stringify(PLACES);
  assert.ok(!/Telariten/.test(all), 'Tellariten mit Doppel-l');
  assert.equal(byId.mars.approx, true, 'Mars-Lage ist nur angenähert');
});

test('Memory Alpha titles match the German wiki (checked via its API)', async () => {
  const { FACTION_INFO } = await import('../../js/data/factions.js');
  const want = { mars: 'Utopia-Planitia-Flottenwerft', vulcan: 'Vulkan', bakuplanet: "Ba'ku (Planet)", idran: 'Idran-System',
    teplan: 'Teplan-System', sherman: 'Sherman-Planet', mokra: 'Mokra-Orden', nekritstation: 'Nekrit-Ausdehnung', transwarp: 'Transwarpzentrum' };
  for (const [id, t] of Object.entries(want)) assert.equal(byId[id].ma.replace(/_/g, ' '), t, id);
  const powers = { tze: 'Tzenkethi', kaz: 'Kazon', vid: 'Vidiianer', hir: 'Hirogen', mal: 'Malon' };
  for (const [id, t] of Object.entries(powers)) assert.equal(FACTION_INFO[id].ma, t, id);
});
