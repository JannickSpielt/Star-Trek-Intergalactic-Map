# Galaktische Sternenkarte – Etappe 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine statische, hochwertig gestaltete 3D-Karte der Star-Trek-Milchstraße (Ära ~2375) mit Reichen, Grenzen, Anomalien, anklickbaren Orten, Infofenster, Suche, Mini-Map und Touch-Bedienung.

**Architecture:** Reine ES-Module ohne Build. Daten (`js/data/`) und reine Logik (`js/core/`, ohne DOM/three) sind mit `node --test` getestet; Rendering (`js/render/`, Three.js per Import-Map) und Oberfläche (`js/ui/`) werden per Playwright-Smoke-Test geprüft. `js/main.js` verdrahtet alles.

**Tech Stack:** HTML/CSS/JS (ES2022-Module), Three.js `0.170.0` (+ `examples/jsm` EffectComposer/UnrealBloomPass) über `https://cdn.jsdelivr.net/npm/three@0.170.0/`, Google Font „Antonio“, Node ≥ 18 `node:test`, vorinstalliertes Playwright (`require('playwright')`).

**Spec:** `docs/superpowers/specs/2026-11-18-galaxy-map-design.md`

## Global Constraints

- Oberflächen- und Inhaltssprache: Deutsch.
- Keine kopierten Bilder, Logos, Insignien oder Wiki-Texte; alle Beschreibungen selbst formuliert; Planetenbilder prozedural.
- LCARS-inspiriert, aber eigene Gestaltung; Schrift „Antonio“; kein nachgebautes Schiffsdesign.
- Kein Backend, kein Build-Schritt; läuft direkt über GitHub Pages aus dem Repo-Root.
- Externe Skripte nur mit fester Version (`three@0.170.0`).
- Koordinaten in Lichtjahren, galaktisches Zentrum = (0,0), Galaxie-Ebene = x/z in der Szene; Sol bei (0, 26000) in Kartenkoordinaten (x, y). Alpha: x<0,y>0 · Beta: x≥0,y>0 · Gamma: x<0,y<0 · Delta: x≥0,y<0.
- Standard-Ära 2375; Datenobjekte dürfen ein optionales `era`-Feld tragen (noch ungenutzt).
- Leistungsziel: ~30 fps auf Mittelklasse-Android (2022), 60 fps Desktop; Qualitätsstufen `low|medium|high`.
- Jeder Ort hat einen Link „Mehr bei Memory Alpha“ (`https://memory-alpha.fandom.com/de/wiki/<slug>`).

## Review Focus

1. **Beschriftungs-Chaos bei mittlerem Zoom** (Sol/Vulcan/Andoria, Romulus/Remus, Bajor/DS9/Wurmloch): Labels dürfen sich nie überlappen; wichtigere gewinnen → Test in Task 4.
2. **Touch-Bedienung** (Pinch-Zoom, Zwei-Finger-Drehen, Ziehen ohne versehentliches Auswählen): muss am Handy funktionieren → Test in Task 5 (Gestenlogik) und Task 11 (E2E mit Touch-Emulation).
3. **Kein WebGL verfügbar** (alte Geräte, deaktivierte GPU): Seite zeigt verständlichen Hinweis statt weißer Fläche → Test in Task 6.
4. **Suche mit Umlauten, Apostrophen, englischen Namen** („qonos“, „Kronos“, „Terok Nor“, „fürsorger“/„fuersorger“) findet den Ort → Test in Task 3.
5. **Fenstergröße/Ausrichtung ändern** (Handy drehen, Fenster verkleinern): Canvas, Labels und Mini-Map passen sich an, kein Verzerren → Test in Task 11.

---

## File Structure

```
index.html                 Gerüst, Import-Map, LCARS-Rahmen
css/style.css              gesamte Gestaltung (Tokens, Rahmen, Panels, Bottom-Sheet)
js/data/factions.js        FACTIONS
js/data/places.js          PLACES
js/data/shapes.js          TERRITORIES, REGIONS, BORDERS, WORMHOLE, BOOKMARKS
js/core/coords.js          Koordinaten, Quadrant, Distanz, Formatierung
js/core/blob.js            organische Reichsformen (Punktlisten)
js/core/search.js          Normalisierung + Suche
js/core/labels.js          Label-Kollision / Detailstufen
js/core/camera.js          Kamerazustand, Gesten, Flugbahn (rein, ohne three)
js/render/scene.js         Renderer, Bloom, Qualitätsstufen, WebGL-Check
js/render/galaxy.js        Spiralgalaxie-Partikel, Kern, Hintergrundsterne
js/render/overlays.js      Reiche, Grenzen, Anomalien, Quadranten, Ringe, Wurmloch
js/render/markers.js       Ortsmarker + Picking
js/render/planet-art.js    prozedurale Planetenbilder (2D-Canvas)
js/ui/frame.js             Seitenleiste (Lesezeichen, Ebenen), Statuszeile
js/ui/labels-dom.js        HTML-Labels über der Szene
js/ui/info.js              Infofenster / Bottom-Sheet
js/ui/search-ui.js         Suchfeld + Trefferliste
js/ui/minimap.js           Übersichtskarte
js/ui/intro.js             Ladebildschirm + Eröffnungsfahrt
js/main.js                 Verdrahtung, Render-Schleife
tests/unit/*.test.js       node:test
tests/e2e/smoke.mjs        Playwright-Smoke-Test
package.json               { "type": "module", scripts: test, e2e, serve }
README.md
```

---

### Task 1: Projektgerüst & Daten

**Files:**
- Create: `package.json`, `js/data/factions.js`, `js/data/places.js`, `js/data/shapes.js`
- Test: `tests/unit/data.test.js`

**Interfaces:**
- Produces:
  - `FACTIONS: Record<string, {name, short, color}>` (Schlüssel wie Entwurf: fed, kli, rom, car, baj, fer, bre, tho, gor, tze, she, dom, bor, kaz, vid, hir, kre, mal, dev, tal, ind)
  - `PLACES: Array<{id, name, aliases: string[], pos: [x,y], type: 'capital'|'planet'|'station'|'anomaly'|'wormhole'|'battle', faction, rank: 1|2|3|4, desc, series: string[], ma: string, art: ArtStyle, era?: string}>`
  - `ArtStyle = 'desert'|'ocean'|'ice'|'gas'|'city'|'jungle'|'lava'|'barren'|'storm'|'station'|'wormhole'|'nebula'|'debris'`
  - `TERRITORIES: Array<{faction, center:[x,y], rx, ry, rot, seed}>`, `REGIONS: Array<{id, name, center, r, color, desc, series, ma}>`, `BORDERS: Array<{name, color, pts:[x,y][], width}>`, `WORMHOLE: {from: placeId, to: placeId}`, `BOOKMARKS: Array<{name, target:[x,y], distance:number|'fit', color}>`
  - Konstanten `SOL: [0, 26000]`, `GALAXY_RADIUS = 50000`.

- [ ] **Step 1:** `package.json` mit `"type":"module"`, Scripts `test: node --test tests/unit/`, `e2e: node tests/e2e/smoke.mjs`, `serve: python3 -m http.server 8080`.
- [ ] **Step 2: Failing test** `tests/unit/data.test.js`:
  - jede `PLACE.id` eindeutig, `faction` existiert in `FACTIONS`, `rank` ∈ 1..4, `series.length ≥ 1`, `desc.length ≥ 40`, `ma` nicht leer, `art` ∈ ArtStyle.
  - `PLACES.length ≥ 60`; enthält ids `sol`, `vulcan`, `qonos`, `romulus`, `cardassia`, `bajor`, `ds9`, `wurmloch-bajor`, `idran`, `gruender`, `ocampa`, `unikomplex`, `wolf359`.
  - alle Positionen innerhalb `GALAXY_RADIUS`; `sol.pos` deepEqual `[0, 26000]`.
  - `qonos.aliases` enthält `'Kronos'`; `ds9.aliases` enthält `'Terok Nor'`.
  - `WORMHOLE.from`/`to` sind gültige Place-ids.
- [ ] **Step 3:** Run `npm test` → FAIL (Module fehlen).
- [ ] **Step 4:** Daten aus dem Entwurf (`scratchpad/draft/js/data.js`, Inhalt in diesem Repo-Commit neu anlegen) übernehmen, in drei Module aufteilen, um `id`, `aliases`, `series`, `ma`, `art` ergänzen, auf ≥ 60 Orte erweitern (z. B. Utopia Planitia, Jupiter-Station, Bolarus, Ferenginar, Kessik, Pegasus-Asteroidenfeld, Ba'ku, Veridian III, Narendra III, Archer IV, Benzar, Bolian, Andor, Meridian, Gamma-Hromi, Galorndon Core, Dorvan V, Tarkalea …). Texte selbst formulieren.
- [ ] **Step 5:** Run `npm test` → PASS.
- [ ] **Step 6:** Commit `feat: Kartendaten (Orte, Reiche, Regionen)`.

### Task 2: Koordinaten & Reichsformen

**Files:** Create `js/core/coords.js`, `js/core/blob.js` · Test `tests/unit/coords.test.js`, `tests/unit/blob.test.js`

**Interfaces:**
- Produces:
  - `quadrant([x,y]) -> 'Alpha'|'Beta'|'Gamma'|'Delta'`
  - `distance(a:[x,y], b:[x,y]) -> number` (LJ)
  - `formatLy(n) -> string` (`'16 LJ'`, `'2.550 LJ'`, `'65.500 LJ'`, de-DE, ganzzahlig)
  - `toScene([x,y]) -> {x, y:0, z}` mit `z = y` (Szenenursprung = galaktischer Kern, 1 Einheit = 1 LJ)
  - `blobPoints({center, rx, ry, rot, seed}, n=48) -> [x,y][]` – deterministisch, Radius-Modulation `1 + 0.10·sin(3θ+s) + 0.06·sin(5θ+2s) + 0.04·sin(7θ+3s)`.

- [ ] **Step 1: Failing tests:** `quadrant([-1,1])==='Alpha'`, `([1,1])==='Beta'`, `([-1,-1])==='Gamma'`, `([1,-1])==='Delta'`, `([0,26000])==='Beta'`; `distance([0,0],[3,4])===5`; `formatLy(2550)==='2.550 LJ'`; `blobPoints` liefert 48 Punkte, zweimal gleiche Eingabe → deepEqual, alle Punkte innerhalb `1.25·max(rx,ry)` vom Zentrum.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implementieren. **Step 4:** Run → PASS. **Step 5:** Commit `feat: Koordinaten- und Formlogik`.

### Task 3: Suche

**Files:** Create `js/core/search.js` · Test `tests/unit/search.test.js`

**Interfaces:**
- Produces: `normalize(s) -> string` (klein, Umlaute → ae/oe/ue/ss, Apostrophe/Bindestriche/Leerzeichen entfernt, Diakritika entfernt); `search(query, places, limit=8) -> Place[]` (Treffer auf `name` + `aliases`; Präfix vor Teilwort vor Teilstring; bei Gleichstand niedriger `rank` zuerst; leere Query → `[]`).

- [ ] **Step 1: Failing tests:** `search('qonos')[0].id==='qonos'`; `search('kronos')[0].id==='qonos'`; `search('terok')[0].id==='ds9'`; `search('fuersorger')` und `search('fürsorger')` liefern dieselbe erste id; `search('ro')` liefert `romulus` vor `remus`-Treffern niedrigerer Wichtigkeit; `search('   ')` → `[]`; `search('xyzzy')` → `[]`.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS → Commit `feat: Suche mit Normalisierung`.

### Task 4: Label-Layout

**Files:** Create `js/core/labels.js` · Test `tests/unit/labels.test.js`

**Interfaces:**
- Produces: `layoutLabels(items, opts) -> Array<{id, x, y, anchor:'right'|'left'|'top'|'bottom'}>`
  - `items: Array<{id, x, y, w, h, priority, visible}>` (Bildschirmpixel, Marker-Mittelpunkt; `priority` kleiner = wichtiger)
  - `opts: {width, height, pad=4}`; versucht pro Label die Anker rechts → links → oben → unten; verwirft, wenn alle kollidieren oder außerhalb des Viewports.
  - `rankVisible(rank, distance) -> boolean` – Detailstufen: rank 1 immer, rank 2 bei Kameradistanz < 60000, rank 3 < 12000, rank 4 < 3000.

- [ ] **Step 1: Failing tests:** zwei identische Positionen, Prioritäten 1 und 2 → Ergebnis enthält beide, keine Rechteck-Überlappung (Hilfsfunktion `overlaps` im Test); 30 zufällige Labels (fester Seed) → paarweise keine Überlappung; Label außerhalb `width/height` → nicht im Ergebnis; Priorität 1 überlebt immer, wenn im Viewport; `rankVisible(4, 5000)===false`, `rankVisible(4, 2000)===true`, `rankVisible(1, 1e9)===true`.
- [ ] **Steps 2–5:** FAIL → implementieren (gierig nach Priorität, Rechteckliste) → PASS → Commit `feat: kollisionsfreies Label-Layout`.

### Task 5: Kameralogik & Gesten

**Files:** Create `js/core/camera.js` · Test `tests/unit/camera.test.js`

**Interfaces:**
- Produces:
  - `createCameraState({target:[x,y], distance, azimuth, tilt}) -> CamState`
  - Konstanten `MIN_DIST = 25`, `MAX_DIST = 160000`, `MAX_TILT = 1.1` (rad, von senkrecht).
  - `effectiveTilt(state) -> number` – `tilt` skaliert mit `smoothstep(400, 8000, distance)` → nah = Draufsicht.
  - `cameraPosition(state) -> {x,y,z}` (Szene-Koordinaten, y = Höhe).
  - `applyZoom(state, factor, anchor?:[x,y]) -> CamState` (Distanz geklemmt; mit Anker wandert `target` so, dass der Anker unter dem Zeiger bleibt).
  - `applyPan(state, dxPx, dyPx, viewportH, fov) -> CamState` (Verschiebung relativ zu Azimut).
  - `applyRotate(state, dAzimuth, dTilt) -> CamState` (Tilt geklemmt 0..MAX_TILT).
  - `pinch(prev:{a,b}, next:{a,b}) -> {zoom, rotate, panPx:[dx,dy]}` (zwei Touchpunkte → Faktor, Winkeländerung, Mittelpunktverschiebung).
  - `flyPath(from:CamState, to:CamState) -> (t:0..1) => CamState` – Ziel interpoliert linear (easeInOutCubic), Distanz log-interpoliert mit Ausholbogen: Zwischenhöhe mindestens `0.8 · distance(from.target, to.target)`.
  - `isClick(downPos, upPos, ms) -> boolean` (< 6 px und < 400 ms).

- [ ] **Step 1: Failing tests:** `applyZoom` klemmt auf MIN/MAX; `applyRotate` klemmt Tilt; `effectiveTilt` bei distance 100 ≈ 0, bei 100000 = tilt; `pinch` mit gespreizten Fingern (Abstand ×2) → `zoom≈0.5` (Distanz halbiert), 90°-Drehung → `rotate≈π/2`; `flyPath(a,b)(0)` ≈ a, `(1)` ≈ b, bei Ziel 60000 LJ entfernt ist `distance` bei t=0.5 ≥ 48000; `isClick([0,0],[3,3],100)===true`, `([0,0],[20,0],100)===false`.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS → Commit `feat: Kamera- und Gestenlogik`.

### Task 6: Szene, Galaxie & Qualitätsstufen

**Files:** Create `index.html` (Grundgerüst + Import-Map), `css/style.css` (Basis-Tokens), `js/render/scene.js`, `js/render/galaxy.js`, `js/main.js` (Minimal-Schleife) · Test `tests/e2e/smoke.mjs`

**Interfaces:**
- Consumes: `camera.js` (`cameraPosition`, `effectiveTilt`), `coords.js`.
- Produces:
  - `hasWebGL() -> boolean`
  - `createScene(canvas, quality) -> {renderer, scene, camera, composer, resize(w,h), render()}`
  - `pickQuality() -> 'low'|'medium'|'high'` (Gerätespeicher/Kerne/`devicePixelRatio`/Bildschirmbreite; per `?q=` überschreibbar)
  - `createGalaxy(quality) -> THREE.Group` – Partikel: low 60k / medium 150k / high 300k; 2 Hauptarme + 2 Nebenarme (log. Spirale), Balken, Kern-Glow (Sprite), Staubbänder (dunklere, additive-negative Partikel oder abgedunkelte Farben), Farbverlauf Kern goldweiß → Arme blauweiß mit rosa HII-Flecken; Shader mit Größe nach Distanz, sanftem Funkeln; Hintergrund-Sternkugel.
  - Bloom: UnrealBloomPass bei medium/high, bei low ausgeschaltet (Sprites übernehmen Glow).
- In `main.js`: wenn `!hasWebGL()` → `<div class="no-webgl">` mit deutscher Erklärung, keine Exceptions.

- [ ] **Step 1: Failing e2e:** `tests/e2e/smoke.mjs` startet `python3 -m http.server` auf freiem Port, öffnet die Seite (1280×800), wartet 3 s, prüft: keine `pageerror`/`console.error`, Canvas `#map` vorhanden, Screenshot-Pixelstichprobe in der Bildmitte nicht schwarz (Helligkeit > 30). Zweiter Lauf mit `chromium.launch({args:['--disable-gpu','--disable-webgl']})` → `.no-webgl` sichtbar.
- [ ] **Step 2:** Run `npm run e2e` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** Run → PASS; Screenshot (`deviceScaleFactor: 1`) selbst ansehen und Optik beurteilen (wirkt wie echte Galaxie, kein „Punktwolken-Look“).
- [ ] **Step 5:** Commit `feat: 3D-Galaxie mit Bloom und Qualitätsstufen`.

### Task 7: Reiche, Grenzen, Anomalien, Orientierung

**Files:** Create `js/render/overlays.js`; Modify `js/main.js` · Test: `tests/e2e/smoke.mjs` erweitern

**Interfaces:**
- Consumes: `blobPoints`, `TERRITORIES`, `REGIONS`, `BORDERS`, `WORMHOLE`, `PLACES`.
- Produces: `createOverlays() -> {group, layers: {territories, borders, regions, grid, wormhole}, update(camState, time)}`
  - Reiche: gefüllte Form mit Shader (innen 10–15 % Deckkraft, zum Rand hin hellerer Leuchtsaum, feines Hex-/Scanline-Muster), Randlinie.
  - Grenzen: Bänder mit schraffierter Füllung (Breite = `width` LJ).
  - Anomalien: animierte, additive Nebel-Sprites (Noise-Shader), Große Barriere als Ring um den Kern, Galaktische Barriere als schimmernder Ring bei `GALAXY_RADIUS`.
  - Quadrantenlinien (x=0, y=0) + Ringe alle 10.000 LJ, schwach, mit Quadranten-Beschriftungen (HTML, siehe Task 8).
  - Wurmloch: leuchtender, animierter Bogen (Quadratic-Bezier, Höhe ∝ Länge) zwischen den Orten.
  - Jede Ebene per `layers.X.visible` schaltbar.
- [ ] **Step 1: Failing e2e:** `window.__map.layers` existiert mit den fünf Schlüsseln; nach `__map.flyTo('sol')` und Warten → Pixelstichprobe zeigt bläulichen Föderations-Farbton nahe Bildmitte.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS (+ Screenshot ansehen) → Commit `feat: Reiche, Grenzen, Anomalien, Wurmloch`.

### Task 8: Marker, Labels & Picking

**Files:** Create `js/render/markers.js`, `js/ui/labels-dom.js`; Modify `js/main.js` · Test: e2e erweitern

**Interfaces:**
- Consumes: `layoutLabels`, `rankVisible`, `PLACES`, `FACTIONS`.
- Produces:
  - `createMarkers(places) -> {group, screenPositions(camera, w, h) -> Array<{id,x,y,visible}>, pick(x,y) -> placeId|null, setSelected(id), setHover(id)}` – Marker als Sprites je Typ (Hauptstadt: Ring + Kern, Planet: Punkt, Station: Raute, Schlacht: Kreuz, Wurmloch: Spirale), Farbe der Fraktion, Pick-Radius 14 px, nächster sichtbarer gewinnt.
  - `createLabelLayer(container) -> {update(items)}` – HTML-Labels (Antonio, Großbuchstaben, Fraktionsfarbe), Reichsnamen groß und gesperrt im Zentrum ihres Gebiets, nur wenn Gebiet auf dem Bildschirm 80–1800 px breit.
  - `window.__map` bekommt: `flyTo(id)`, `select(id)`, `state()`.
- [ ] **Step 1: Failing e2e:** nach `__map.flyTo('romulus')` sind `.label` für Romulus und Remus sichtbar und ihre BoundingRects überlappen nicht; Klick auf Bildschirmposition von Romulus → `__map.state().selected==='romulus'`; Ziehen über 40 px löst keine Auswahl aus.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS → Commit `feat: Ortsmarker, Labels, Auswahl`.

### Task 9: LCARS-Rahmen, Navigation & Statuszeile

**Files:** Modify `index.html`, `css/style.css`; Create `js/ui/frame.js` · Test: e2e erweitern

**Interfaces:**
- Consumes: `BOOKMARKS`, `__map.flyTo`, `overlays.layers`, `quadrant`, `formatLy`.
- Produces: `createFrame({bookmarks, layers, onBookmark, onToggle}) -> {setStatus({coords, quadrant, scaleLy})}`
- Gestaltung: dunkler Grund (#000/#05060a), LCARS-Palette (Orange #ff9c3a, Pfirsich #ffcc99, Lila #cc99cc, Flieder #9999ff, Blau #99ccff, Rot #cc6666), Elbows oben links/unten links, Seitenleiste mit Pill-Buttons (Lesezeichen) und Schaltern (Ebenen), Statuszeile mit Koordinaten (rel. zu Sol), Quadrant und Maßstabsbalken; dezente Einblend-Animationen, Hover-Aufhellen, Fokus-Ringe; feine Ziffern-„Datenstreifen“ als Zierelemente.
- [ ] **Step 1: Failing e2e:** Klick auf Lesezeichen „Bajor · DS9“ → nach Fahrt `__map.state().target` innerhalb 300 LJ von Bajor; Abschalten von „Reiche“ → `__map.layers.territories.visible===false`; Statuszeile zeigt „Beta“ bei Sol.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS (+ Screenshot ansehen) → Commit `feat: LCARS-Rahmen und Navigation`.

### Task 10: Infofenster & Planetenbilder

**Files:** Create `js/ui/info.js`, `js/render/planet-art.js` · Test: `tests/unit/planet-art.test.js` (nur Parametrisierung), e2e erweitern

**Interfaces:**
- Produces:
  - `artParams(place) -> {style, seed, palette:string[], rings:boolean, clouds:number}` (rein, deterministisch aus `id` + `art`)
  - `renderPlanet(canvas, params)` – 2D-Canvas: Kugel mit Noise-Oberfläche je Stil, Terminator-Schattierung, Atmosphärenrand, ggf. Ringe/Wolken; Stationen/Wurmloch/Nebel eigene Darstellung; langsame Rotation per `requestAnimationFrame`, solange Panel offen.
  - `createInfo(el) -> {show(place|region), hide()}` – Kopf mit Name + Fraktionschip, Bild, Typ, Quadrant, Entfernung zu Sol, Text, Serien-Badges, Link „Mehr bei Memory Alpha ↗“ (`target=_blank rel=noopener`), Button „Zentrieren“; am Handy (<760 px) Bottom-Sheet mit Wischgriff.
- [ ] **Step 1: Failing tests:** `artParams` gleiches Ergebnis für gleichen Ort, unterschiedliche `seed` für `vulcan`/`andoria`; e2e: `__map.select('vulcan')` → `#info` sichtbar, enthält „Vulcan“, „Beta“, Badge „TOS“, Link-href endet auf `/Vulcan`, Canvas im Panel nicht leer.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS (+ Screenshot ansehen) → Commit `feat: Infofenster mit prozeduralen Planetenbildern`.

### Task 11: Suche-UI, Mini-Map, Intro, Mobil

**Files:** Create `js/ui/search-ui.js`, `js/ui/minimap.js`, `js/ui/intro.js`; Modify `css/style.css`, `js/main.js` · Test: e2e erweitern

**Interfaces:**
- Consumes: `search`, `flyTo`, `select`, `pinch`, `isClick`, Galaxie-Daten.
- Produces:
  - `createSearchUI(input, list, onPick)` – Pfeiltasten, Enter, Escape, Klick.
  - `createMinimap(canvas, {onJump}) -> {update(camState)}` – vorgerenderte Draufsicht + Sichtbereich-Rahmen + Quadrantenkreuz.
  - `runIntro(map) -> Promise` – Ladeschirm (Titel, Fortschrittsbalken im LCARS-Stil), danach Kamerafahrt von schräg weit außen auf die Startansicht (≈ 4 s, per Klick/Taste überspringbar).
  - Touch: 1 Finger ziehen = Pan, 2 Finger = Pinch-Zoom + Drehen, 2 Finger vertikal = Kippen.
  - Resize/Orientierungswechsel → `scene.resize`, Labels und Mini-Map neu.
- [ ] **Step 1: Failing e2e:** Tippen „kronos“ + Enter → `selected==='qonos'`; Klick in Mini-Map oben links → Ziel im Gamma-Quadranten; Viewport auf 390×844 (`devices['iPhone 13']`) → keine horizontale Scrollbar, Seitenleiste eingeklappt, nach `select('bajor')` ist `#info` als Bottom-Sheet am unteren Rand; Pinch per `page.touchscreen`-CDP (zwei Punkte auseinander) → `state().distance` kleiner; Viewport auf 800×600 ändern → Canvas-Größe = 800×600·dpr.
- [ ] **Steps 2–5:** FAIL → implementieren → PASS (+ Desktop- und Handy-Screenshot ansehen) → Commit `feat: Suche, Mini-Map, Intro, Touch`.

### Task 12: Feinschliff & Veröffentlichung

**Files:** Create `README.md`; Modify nach Bedarf

- [ ] **Step 1:** Optik-Review mit Screenshots (Galaxie, Föderation, Bajor, Dominion, Borg, Handy) gegen die Anti-Ziele des Specs; Mängel beheben.
- [ ] **Step 2:** `npm test` und `npm run e2e` → alle PASS.
- [ ] **Step 3:** README (Deutsch): Beschreibung, lokal starten (`npm run serve`), GitHub-Pages-Hinweis, Haftungsausschluss (inoffizielles Fanprojekt, Star Trek ist Marke von Paramount; Positionen approximiert), Etappen-Ausblick.
- [ ] **Step 4:** Commit `docs: README` und Push auf `claude/kind-dijkstra-ffbxcj`.
