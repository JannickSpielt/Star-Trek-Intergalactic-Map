/**
 * Reiserouten. Koordinaten in LJ (Kern = 0,0). Die Route ist angenähert: Canon-Angaben
 * zu Distanzen in Voyager widersprechen sich teilweise.
 * jump: true = Abkürzung (gestrichelt), die Strecke wurde übersprungen statt geflogen.
 */
import { SOL } from './shapes.js';

export const VOYAGER = {
  id: 'voyager',
  name: 'Voyagers Heimreise',
  ship: 'USS Voyager',
  years: '2371–2378',
  color: '#ffcc66',
  stops: [
    { pos: [34800, -30600], year: 2371, title: 'Phalanx des Fürsorgers', text: 'Der Fürsorger reißt Voyager aus den Badlands in den Delta-Quadranten. Janeway zerstört die Phalanx, um die Ocampa zu schützen, und sitzt damit fest.' },
    { pos: [32300, -27600], year: 2371, title: 'Kazon-Raum', text: 'Die zerstrittenen Kazon-Sekten wollen Voyagers Technik und machen der Crew die ersten zwei Jahre schwer.' },
    { pos: [29600, -23900], year: 2371, title: 'Vidiianisches Gebiet', text: 'Die von der Phage gezeichneten Vidiianer jagen fremde Organe. Neelix verliert dabei beide Lungen und lebt fortan mit einem Lungenflügel, den Kes ihm spendet.' },
    { pos: [27000, -19200], year: 2373, title: 'Nekrit-Weite', text: 'Ein riesiger, kaum erforschter Nebel. Voyager durchquert ihn, statt ihn zu umfliegen.' },
    { pos: [24000, -14500], year: 2374, title: 'Borg-Raum', text: 'Voyager schließt ein Zweckbündnis mit den Borg gegen Spezies 8472. Seven of Nine bleibt danach an Bord.' },
    { pos: [20069, -5851], year: 2374, title: 'Kes’ Abschiedsgeschenk', jump: true, text: 'Kes entwickelt sich zu einem reinen Energiewesen und schiebt Voyager beim Abschied rund 9.500 Lichtjahre weiter, aus dem Borg-Raum heraus.' },
    { pos: [19300, -5600], year: 2374, title: 'Krenim: Ein Jahr Hölle', text: 'Ein Zeitwaffenschiff der Krenim verändert immer wieder die Geschichte. Voyager wird fast zerstört, bis die Zeitlinie zurückgesetzt wird.' },
    { pos: [17300, -4300], year: 2374, title: 'Hirogen-Relaisnetz', text: 'Über ein uraltes Relaisnetz, das die Hirogen nutzen, spricht Voyager zum ersten Mal mit der Sternenflotte. Die Hirogen selbst sehen in der Crew Beute.' },
    { pos: [15500, -3300], year: 2375, title: 'Malon-Raum', text: 'Die Malon kippen strahlenden Industriemüll in fremde Regionen. Voyager verhindert, dass ein Frachter einen ganzen Raumabschnitt verseucht.' },
    { pos: [12000, -2100], year: 2375, title: 'Quanten-Slipstream', jump: true, text: 'Ein Testflug mit Slipstream-Antrieb bringt Voyager ein großes Stück voran, bevor das Experiment abgebrochen werden muss.' },
    { pos: [10000, -1750], year: 2375, title: 'Devore-Imperium', text: 'Die Devore durchsuchen das Schiff ständig nach Telepathen. Janeway versteckt geflüchtete Briori-Telepathen an Bord.' },
    { pos: [8600, -1450], year: 2377, title: 'Quarra', text: 'Auf der Arbeitswelt der Quarra wird der Crew das Gedächtnis gelöscht und sie arbeitet ahnungslos in Fabriken, bis der Doktor sie befreit.' },
    { pos: [7200, -1200], year: 2378, title: 'Borg-Transwarp-Hub', text: 'Mit Technik aus der Zukunft fliegt Voyager in einen Transwarp-Knoten der Borg, nutzt ihn für die Heimreise und zerstört ihn.' },
    { pos: [...SOL], year: 2378, title: 'Ankunft im Alpha-Quadranten', jump: true, text: 'Voyager kommt durch einen Transwarp-Kanal nahe der Erde heraus und wird von Schiffen der Sternenflotte nach Hause begleitet.' },
  ],
};

export const ROUTES = [VOYAGER];
