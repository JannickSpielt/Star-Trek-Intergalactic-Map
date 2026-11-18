/**
 * Formen auf der Karte. Koordinaten in Lichtjahren, galaktisches Zentrum = (0,0).
 * +y zeigt vom Kern Richtung Sol. Quadrantengrenzen: x = 0 und y = 0.
 */
export const SOL = [0, 26000];
export const GALAXY_RADIUS = 50000;
const L = (x, y) => [SOL[0] + x, SOL[1] + y];

export const TERRITORIES = [
  { faction: 'fed', center: L(-350, 50), rx: 2300, ry: 1700, rot: -0.1, seed: 1 },
  { faction: 'kli', center: L(2650, -550), rx: 1350, ry: 1150, rot: 0.3, seed: 2 },
  { faction: 'rom', center: L(950, -2450), rx: 1450, ry: 900, rot: 0.15, seed: 3 },
  { faction: 'car', center: L(-2850, -1450), rx: 850, ry: 700, rot: 0.4, seed: 4 },
  { faction: 'baj', center: L(-2200, -1100), rx: 170, ry: 150, rot: 0, seed: 15 },
  { faction: 'fer', center: L(-3500, -150), rx: 520, ry: 460, rot: 0, seed: 5 },
  { faction: 'bre', center: L(-3250, 1700), rx: 750, ry: 600, rot: -0.3, seed: 6 },
  { faction: 'tho', center: L(1850, -1650), rx: 380, ry: 300, rot: 0.2, seed: 7 },
  { faction: 'gor', center: L(-1700, 2050), rx: 560, ry: 420, rot: 0.1, seed: 8 },
  { faction: 'tze', center: L(-3800, 850), rx: 430, ry: 380, rot: 0, seed: 9 },
  { faction: 'she', center: L(1350, 1900), rx: 420, ry: 330, rot: 0.2, seed: 10 },
  { faction: 'dom', center: [-34500, -21000], rx: 7200, ry: 5600, rot: 0.35, seed: 11 },
  { faction: 'bor', center: [18500, -16500], rx: 11500, ry: 8500, rot: -0.5, seed: 12 },
  { faction: 'kaz', center: [32000, -27500], rx: 2400, ry: 1900, rot: 0.6, seed: 13 },
  { faction: 'vid', center: [29300, -23300], rx: 2100, ry: 1600, rot: 0.6, seed: 14 },
  { faction: 'kre', center: [21000, -7600], rx: 2000, ry: 1400, rot: 0.2, seed: 16 },
  { faction: 'hir', center: [17800, -4600], rx: 3600, ry: 1600, rot: 0.1, seed: 17 },
  { faction: 'mal', center: [15000, -3000], rx: 1500, ry: 900, rot: 0, seed: 18 },
  { faction: 'dev', center: [12500, -2100], rx: 1300, ry: 750, rot: 0, seed: 19 },
  { faction: 'tal', center: [33300, -28900], rx: 600, ry: 500, rot: 0, seed: 20 },
];

export const REGIONS = [
  { id: 'badlands', name: 'Badlands', center: L(-2450, -650), r: 260, color: '#ff6a3d', series: ['DS9', 'VOY'], ma: 'Badlands', desc: 'Gefährliches Gebiet voller Plasmastürme nahe der cardassianischen Grenze – Rückzugsort des Maquis und Ort, an dem Voyager verschwand.' },
  { id: 'delphi', name: 'Delphische Ausdehnung', center: L(850, 650), r: 330, color: '#c05bff', series: ['ENT'], ma: 'Delphische_Ausdehnung', desc: 'Von künstlichen Sphären verzerrte, physikalisch instabile Region. Heimat der Xindi, die im 22. Jahrhundert die Erde angriffen.' },
  { id: 'mutara', name: 'Mutara-Nebel', center: L(-420, 520), r: 120, color: '#ff4fa3', series: ['Filme'], ma: 'Mutara-Nebel', desc: 'Ionisierter Nebel, in dem Kirk und Khan ihr Duell austrugen. Hier entstand der Genesis-Planet.' },
  { id: 'briar', name: 'Briar Patch', center: L(2050, 1450), r: 220, color: '#ffb347', series: ['Filme'], ma: 'Briar_Patch', desc: 'Schwer navigierbarer Nebel um die Heimat der Ba\'ku, deren Ringe eine verjüngende Strahlung aussenden.' },
  { id: 'nekrit', name: 'Nekrit-Weite', center: [27000, -19000], r: 1500, color: '#ff9e5e', series: ['VOY'], ma: 'Nekrit-Weite', desc: 'Ausgedehnter, kaum kartierter Nebel im Delta-Quadranten, den Voyager in ihrem dritten Jahr durchquerte.' },
  { id: 'omarion', name: 'Omarion-Nebel', center: [-35500, -19800], r: 900, color: '#ff8fd6', series: ['DS9'], ma: 'Omarion-Nebel', desc: 'Dichter Nebel, in dem die Gründer ihre neue Heimatwelt vor Feinden verbergen.' },
  { id: 'fluid', name: 'Riss zum Fluidraum', center: [22500, -12500], r: 700, color: '#ffd84f', series: ['VOY'], ma: 'Fluidraum', desc: 'Durch Borg-Experimente geöffneter Riss, durch den Spezies 8472 aus ihrem eigenen Raum eindrang.' },
  { id: 'barriere-gross', name: 'Große Barriere', center: [0, 0], r: 2600, color: '#ffe7a8', ring: true, series: ['Filme'], ma: 'Große_Barriere', desc: 'Energiewall um den galaktischen Kern. Lange galt sie als undurchdringlich; dahinter liegt der Planet Sha Ka Ree.' },
  { id: 'barriere-galaktisch', name: 'Galaktische Barriere', center: [0, 0], r: 50000, color: '#d7b5ff', ring: true, series: ['TOS', 'DIS'], ma: 'Galaktische_Barriere', desc: 'Energiefeld am Rand der Milchstraße. Wer es durchquert, riskiert Schäden an Schiff und Verstand.' },
];

export const BORDERS = [
  { name: 'Romulanische Neutrale Zone', color: '#3fd17a', width: 70, pts: [L(-750, -1350), L(-100, -1650), L(600, -1650), L(1300, -1500), L(1750, -1250), L(2150, -1300)] },
  { name: 'Klingonisch-föderale Grenze', color: '#ff4b3e', width: 30, pts: [L(1650, -900), L(1800, -400), L(1850, 200), L(1700, 700)] },
  { name: 'Entmilitarisierte Zone', color: '#e0a03c', width: 90, pts: [L(-2050, -400), L(-1950, -750), L(-1700, -1100), L(-1450, -1350)] },
];

export const WORMHOLE = { from: 'wurmloch-bajor', to: 'idran' };

export const BOOKMARKS = [
  { name: 'Galaxie', target: [0, 4000], distance: 'fit', color: '#ff9c3a' },
  { name: 'Föderation', target: L(-300, -200), distance: 9000, color: '#99ccff' },
  { name: 'Erde', target: L(0, 0), distance: 650, color: '#9999ff' },
  { name: 'Bajor · DS9', target: L(-2200, -1100), distance: 1600, color: '#ffcc99' },
  { name: 'Neutrale Zone', target: L(800, -1800), distance: 4200, color: '#cc99cc' },
  { name: 'Klingonen', target: L(2600, -600), distance: 4500, color: '#cc6666' },
  { name: 'Dominion', target: [-34500, -21000], distance: 30000, color: '#b98cff' },
  { name: 'Borg-Raum', target: [19000, -15000], distance: 42000, color: '#ffaa66' },
];
