# Galaktische Sternenkarte – Design

Stand: 2026-11-18

## Absicht & Warum

Eine Fan-Webseite: eine interaktive 3D-Karte der Milchstraße im Star-Trek-Universum.
Sie soll **zum Hinschauen begeistern** („soll richtig teuer aussehen, wie mit ~1.000 € Budget gebaut“)
und gleichzeitig **Nachschlagewerk** sein: Wo liegt was, wo spielte welche Folge / welcher Film,
was ist dort passiert. Später sollen weitere Funktionen dazukommen – der Aufbau muss erweiterbar sein.

Zielgruppe: Star-Trek-Fans, am PC und am Handy. Sprache der Oberfläche und Texte: **Deutsch**.

## Ziele

- Visuell hochwertig: filmischer 3D-Look, flüssige Kamerafahrten, durchgestaltete Oberfläche.
- Inhaltlich am Canon orientiert: Quadranten, Großmächte, Grenzen, Schauplätze an plausiblen,
  an Serien/Filmen angelehnten Positionen.
- Jeder Ort ist anklickbar und liefert Infos (Text, Bild, Serien/Filme, weiterführender Link).
- Erweiterbar: Daten (Orte, Reiche, Routen, Epochen) liegen getrennt vom Code.

## Nicht-Ziele

- Keine 100 % exakte, „offizielle“ Kartografie (die existiert im Canon nicht widerspruchsfrei).
  Positionen sind approximiert; die Seite sagt das offen.
- Kein Backend, keine Konten, kein Build-Prozess.
- Keine vollständige Enzyklopädie – kurze Texte + Link zu Memory Alpha für die Tiefe.

## Anti-Ziele (wäre ein Misserfolg, auch wenn es funktioniert)

- Wirkt wie ein generisches Bastel-/Template-Projekt oder „KI-Standard-Look“.
- Ruckelig oder unbedienbar am Handy.
- Beschriftungs-Chaos: überlappende, unlesbare Labels.
- Urheberrechtlich geschütztes Material übernommen (siehe Rahmenbedingungen).

## Rahmenbedingungen

- **Keine kopierten Bilder** aus Filmen/Serien, keine offiziellen Kartengrafiken, keine Logos/Insignien.
  Planetenbilder werden **selbst erzeugt** (prozedural im Browser gerendert). Für echte Bilder und
  Details verlinkt jeder Ort auf seine Memory-Alpha-Seite.
- **Alle Beschreibungstexte selbst formuliert** (kurz, eigene Worte), keine übernommenen Wiki-Texte.
- **Oberfläche LCARS-inspiriert**, aber eigene Gestaltung (abgerundete Balken/„Elbows“, typische
  Pastell-Orange/Lila/Blau-Palette, schmale Grotesk-Schrift wie „Antonio“ von Google Fonts) –
  keine Nachbildung konkreter Bildschirme aus der Serie.
- **Schiffssymbol** für Routen ist ein eigenes, abstraktes Icon (z. B. leuchtender Pfeil/Komet),
  keine Nachbildung des Schiffsdesigns.
- Statische Seite: läuft direkt über GitHub Pages; externe Bibliotheken nur per CDN mit fester Version.
- Muss auf aktuellen Handys (Touch: ziehen, Pinch-Zoom, Zwei-Finger-Drehen) flüssig laufen.

## Ansätze

| Ansatz | Vorteile | Nachteile |
|---|---|---|
| **A) Three.js (WebGL) + HTML-Overlay, ohne Build** ✅ gewählt | Echter 3D-Look, Partikel-Galaxie, drehen/kippen; einfache Dateien, direkt auf GitHub Pages | Auf sehr alten Handys weniger flüssig (→ Qualitätsstufen) |
| B) 2D-Canvas mit Schein-Neigung | Einfach, läuft überall | Kein echtes Drehen; verfehlt den 3D-Wunsch |
| C) React/Vite + three | Strukturiert bei sehr großem Projekt | Build-Schritt, mehr Technik-Aufwand, optisch kein Gewinn |

Gewählt wurde **A**, weil es den gewünschten aufwendigen 3D-Effekt liefert und trotzdem ohne Build auskommt
(Wahl von Claude, vom Nutzer durch „soll richtig teuer aussehen“ bestätigt).

## Vom Nutzer entschieden

- Zweck: schöne Fan-Karte + Nachschlagewerk für Schauplätze.
- Bilder: selbst erzeugte Planetenbilder + Link zu Memory Alpha.
- 3D-Karte, ziehen/zoomen/drehen.
- Alle 20 gesammelten Ideen sind gewünscht, gebaut in drei Etappen (unten).
- Hoher optischer Anspruch, „gib dir Mühe“.
- **Standard-Zeitpunkt der Karte: ca. 2375** (TNG/DS9/VOY-Ära, Ende des Dominion-Kriegs): Bajor frei,
  Romulus existiert, Dominion zieht sich in den Gamma-Quadranten zurück, Voyager ist unterwegs.
  Das Datenmodell bekommt schon in Etappe 1 ein optionales Epochen-Feld, genutzt wird es erst in Etappe 3.

## Funktionsumfang nach Etappen

### Etappe 1 – Die Karte (erstes Ziel)

1. **3D-Galaxie**: Spiralgalaxie aus vielen Partikeln (Sterne, Staub, Nebel-Glow, heller Kern mit Balken),
   Bloom/Glow-Nachbearbeitung, Hintergrund-Sternenhimmel. Kamera: Orbit (drehen, kippen, zoomen) um
   einen Zielpunkt; Zoom von ganzer Galaxie (~100.000 LJ) bis in den Nahbereich (~20 LJ zwischen Sol und Nachbarn).
   Beim starken Hineinzoomen flacht die Neigung sanft ab (Draufsicht), damit Labels lesbar bleiben.
2. **Flug-Animation**: Klick auf Ort / Suchtreffer / Lesezeichen → sanfte Kamerafahrt (bei weiten Strecken
   erst raus, dann rein).
3. **Reiche & Grenzen**: Territorien als leuchtende, halbtransparente Flächen mit weichem Rand auf der
   Galaxie-Ebene; Neutrale Zonen / Entmilitarisierte Zone als markierte Bänder; Quadrantenlinien
   (Alpha/Beta/Gamma/Delta) mit Beschriftung; Entfernungsringe vom Kern.
4. **Anomalien**: Badlands, Mutara-Nebel, Delphische Ausdehnung, Briar Patch, Nekrit-Weite,
   Große Barriere (Kern), Galaktische Barriere (Rand), Riss zum Fluidraum u. a. als Wolken-/Leuchteffekte.
5. **LCARS-inspirierte Oberfläche**: Rahmen mit Elbows, Seitenleiste mit Navigation (Lesezeichen) und
   Ebenen-Schaltern, Statuszeile (Koordinaten, Quadrant, Maßstab), dezente Animationen/Übergänge.
10. **Bajoranisches Wurmloch**: leuchtender Bogen DS9 ↔ Idran (Gamma-Quadrant).
11. **Infofenster pro Ort**: Name, Typ, Zugehörigkeit (Farbchip), Quadrant, Entfernung zu Sol,
    Kurztext, Serien/Filme-Kürzel (TOS, TNG, DS9, VOY, ENT, DIS, PIC, SNW, LD, PRO, Filme),
    **prozedural gerendertes Planetenbild** (passend zum Typ: Wüste, Ozean, Eis, Gas, Stadtwelt,
    Station, Wurmloch …), Link „Mehr bei Memory Alpha“.
12. **Suche** mit Vorschlagsliste.
15. **Schlachten & Ereignisse** als eigener Markertyp (Wolf 359, Chin'toka, Khitomer …).
17. **Übersichtskarte** (Mini-Map) mit Sichtbereich, anklickbar.
20. **Handy & PC**: Touch-Gesten, responsives Layout (Infofenster als Bottom-Sheet am Handy),
    Qualitätsstufen je nach Gerät.

Zusätzlich in Etappe 1: **Ladebildschirm** (stilvoller Intro mit kurzer Kamerafahrt in die Galaxie)
und **Label-Kollisionsvermeidung** (wichtigere Labels zuerst, Detailstufen je Zoom).

### Etappe 2 – Reisen & Filter

7. **Voyagers Heimreise**: Route mit Stationen + Jahreszahlen; Sprünge (Kes' Schub, Slipstream,
   Transwarp-Hub) gestrichelt.
8. **Abspielmodus**: abstraktes Schiffssymbol fliegt die Route ab, Zeitleiste mit Stationen, Kamera folgt.
13. **Filter nach Serie/Film**: nur Schauplätze der gewählten Serie(n) hervorheben.
16. **Entfernung messen**: zwei Orte wählen → Distanz in LJ + Reisezeit bei Warp 5 / 8 / 9 / 9,975 (TNG-Skala).
19. **Teilbare Links**: URL-Hash merkt ausgewählten Ort / Kameraposition.

### Etappe 3 – Extras

6. **Ambient-Sound**: selbst synthetisiert (Web Audio), leises Brücken-Summen + UI-Klicks, standardmäßig aus, abschaltbar.
9. **Weitere Reisen**: z. B. Enterprise-Missionen, Discovery, Picard (Datenformat wie Voyager-Route).
14. **Zeitepochen**: Reichsgrenzen je Jahrhundert (22./23./24./25.) umschaltbar, Schieberegler.
18. **Favoriten**: per localStorage gemerkt.

## Datenmodell (Grundsatz)

Daten in eigenen Dateien, getrennt vom Rendering:
- **Orte**: Name, Position (LJ, galaktisches Zentrum = Ursprung), Typ, Zugehörigkeit, Wichtigkeit
  (steuert Sichtbarkeit je Zoom), Kurztext, Serien-Kürzel, Memory-Alpha-Slug, Planeten-Bildstil.
- **Reiche**: Farbe, Name, Form (Zentrum/Halbachsen/Rotation oder Polygon), optional je Epoche.
- **Grenzlinien, Anomalien, Routen, Lesezeichen**.

Koordinaten-Konvention: Sol ~26.000 LJ vom Kern; Linie Kern–Sol trennt Alpha (links) und Beta (rechts),
die Senkrechte durch den Kern trennt diese von Gamma (hinter Alpha) und Delta (hinter Beta).
Es existiert bereits ein Daten-Entwurf mit ~60 Orten, 19 Reichen, Anomalien, Grenzen und der Voyager-Route
(liegt aktuell im Scratchpad und kann als Startpunkt dienen).

## Entscheidungen von Claude (zur Prüfung)

- **Leistungsziel**: flüssig (stabil ~30 fps) auf einem Mittelklasse-Android von ca. 2022, 60 fps am Desktop.
  2–3 Qualitätsstufen (Partikelzahl, Bloom echt/vereinfacht), automatisch gewählt, manuell umschaltbar.
- **Daten-Entwurf** aus dem Scratchpad wird als Startpunkt ins Repo übernommen und um Serien-Kürzel,
  Memory-Alpha-Slug und Planeten-Bildstil ergänzt; der alte 2D-Seitenentwurf wird verworfen.
- **Suche** findet deutsche und englische Schreibweisen (z. B. „Kronos“ / „Qo'noS“).

## Dem Builder überlassen

- Konkrete Dateistruktur, Shader-Details, Partikelzahlen, Farbwerte im Detail.
- Exakte Koordinaten einzelner Orte (Canon-orientiert, plausibel, lesbar).
- Wahl der Three.js-Version (fest gepinnt, per CDN/Import-Map) und der Post-Processing-Technik.
- Algorithmus für Label-Kollision und prozedurale Planetenbilder.
- Umfang der Ortsliste über den Entwurf hinaus (mehr ist besser, Qualität vor Menge).
