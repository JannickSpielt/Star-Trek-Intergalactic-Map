# Nutzertest 19.11.2026: Fehlerliste

Getestet wurde die Live-Seite (Stand Commit `1f5d106`) von vier Test-Agenten, die jeweils einen anderen Nutzertyp gespielt haben:

| Agent | Schwerpunkt | Umgebung |
|---|---|---|
| Desktop-Fan | Stöbern, Suche, Orte, Mächte, Ebenen | 1440×900, `?q=medium` |
| Handy-Nutzer | Touch-Gesten, Menü, Bottom-Sheet, Querformat | iPhone 13, Pixel 7, 844×390 quer, iPad |
| Voyager & Grafik | Reise-Abspieler, Intro, 3D-Objekte, Darstellungsfehler | 1440×900, `?q=high` und `?q=low` |
| Kritischer Tester | Grenzfälle, Tastatur, offline, Links, PWA, Barrierefreiheit | verschiedene Größen, CDN gesperrt, ohne WebGL |

Alle Tests liefen in Chromium mit Software-WebGL. Echtes iOS Safari und echte Handy-Grafikkarten wurden nicht getestet. Mehrfach gemeldete Fehler sind zusammengeführt; die Zahl in Klammern nennt, wie viele Agenten ihn gefunden haben.

Schweregrade: **kritisch** = Seite unbenutzbar · **hoch** = Funktion kaputt oder sachlich falsch · **mittel** = stört deutlich · **niedrig** = Schönheitsfehler.

---

## Kritisch

1. **Am Ende der Voyager-Reise friert die ganze Karte ein** (2)
   Abspielen bis zum Ende: `showStop(14)` wird aufgerufen, es gibt aber nur die Stationen 0–13 → `TypeError … reading 'year'` im Frame-Hook, danach rendert die Seite nicht mehr. Zoomen und Ziehen reagieren nicht, nur Neuladen hilft. Ursache: `js/ui/journey.js`, `setT()` bei `t = 1`.

## Hoch

2. **„▶“ bzw. Regler auf 100 % zur letzten Station wirft denselben Fehler** (2). Die Ankunft erscheint erst beim zweiten Klick.
3. **Erde steht im „Beta-Quadranten“** (1). `quadrant()` zählt x = 0 als Beta. Folgen: Mars Beta, Jupiter Alpha, Vulcan und Andoria Beta; in der Mächte-Liste steht die Föderation dagegen als Alpha. Im Canon zählen Erde, Vulcan und Andoria zum Alpha-Quadranten.
4. **Sachfehler Deneva** (2): „Spocks Halbbruder Sam Kirk“. Sam ist Kirks Bruder, Spocks Halbbruder ist Sybok.
5. **Handy: Bottom-Sheet lässt sich kaum wegwischen** (2). Nur der 46×5 px große Griffstrich reagiert, das Sheet folgt dem Finger nicht.
6. **Handy: Scrollen in der Suchtrefferliste wählt sofort einen Treffer** (1). Einträge reagieren auf `pointerdown`.
7. **Handy: offenes Infofenster liegt über dem Menü** (1). z-index 7 gegen 5, 8 von 9 Zielen nicht antippbar.
8. **Handy quer bekommt das Desktop-Layout** (2). Breakpoint 760 px: Minimap verdeckt Zoom-Knöpfe, Seitenleiste 168 px breit, Statusleiste abgeschnitten. Gleiches bei 568×320.

## Mittel

9. **Voyager-Abspieler und Infofenster überlappen** (3). Player legt sich über Orts-/Mächte-Infos und umgekehrt; auf dem Handy fast vollständig.
10. **Laufende Wiedergabe übersteuert die Navigation** (1). Während „Abspielen“ zu einem Ort springen: Infofenster öffnet, aber `follow()` bricht den Kameraflug ab.
11. **Letzte Etappe Hub → Erde zu kurz** (1). ~28.000 LJ in 4,3 % der Zeitleiste; Kamera kommt nicht hinterher, Schiff verlässt den Bildschirm.
12. **Schiff fliegt bei Sprüngen unter dem gezeichneten Bogen** (1). Bogen bis ~1.000 LJ über der Ebene, Schiff auf y = 0.
13. **Startansicht der Reise**: Player verdeckt die zweite Routenhälfte, Schiffs-Halo liegt auf dem Label „Phalanx des Fürsorgers“ (1).
14. **Bloom schaltet sprunghaft ab** (1). Die automatische Qualitätsanpassung schaltete bei `q=high` nach kurzem Verschieben den Glow ab; Helligkeit fällt sichtbar. (Unter Software-GL erwartbar, wirkt aber wie ein Fehler: Übergang weicher machen.)
15. **`q=low` deutlich dunkler und dünner als `high`** (1). Helligkeit 25 statt 51, Spiralarme kaum sichtbar.
16. **Bajor-Region bei 3.000 LJ überladen** (1). DS9-Modell, Wurmloch-Trichter, Labels und Auswahlring liegen übereinander.
17. **Suche findet keine Mächte, Regionen und Tippfehler** (3). Ohne Treffer: „Klingonen“, „Föderation“, „Neutrale Zone“, „Badlands“, „Mutara“, „Voyager“, „wormhole“, „Spezies 8472“, „Kronoss“, „Vulcn“, „Grunder“, „Kardassia“. Keine „Keine Treffer“-Meldung.
18. **17 Memory-Alpha-Links landen auf der Suchseite** statt im Artikel (1), weil die deutschen Seitennamen abweichen: Vulcan → Vulkan, Utopia-Planitia-Flottenwerft, Ba'ku (Planet), Idran-System, Teplan-System, Sherman-Planet, Mokra-Orden, Nekrit-Ausdehnung, Transwarp-Hub, Tzenkethi-Koalition, Kazon-Sekten, Vidiianische Sodalität, Hirogen-Jagdgründe, Malon-Export-Territorium u. a.
19. **Tastatur: versteckte Panels sind per Tab erreichbar** (1). 6 Bedienelemente in `aria-hidden`-Containern bekommen Fokus. Abhilfe: `inert`/`hidden`.
20. **Tastatur: Fokusführung fehlt** (1). Nach Enter in der Suche landet der Fokus auf `body`, nach ✕ auf dem versteckten Button.
21. **Teilen-Vorschau unvollständig** (1). `og:image` relativ, `og:url`/`og:type` fehlen.
22. **Handy: angetippter Planet bleibt hinter dem Bottom-Sheet** (1). Über die Suche klappt das Nachrücken, beim direkten Antippen nicht.
23. **Handy: Mächte-Liste ohne Scroll-Hinweis** (1). 6 von 20 Einträgen nur durch Scrollen erreichbar.
24. **Handy: Tap-Ziele zu klein** (2). Reiter 30 px, Ziele 34 px, Mächte 30 px, Player-Knöpfe 36 px, Regler 26 px (empfohlen ≥ 44 px).
25. **Handy: Safe Area fehlt** (1). Kein `env(safe-area-inset-*)` trotz `viewport-fit=cover`; Titel bei −5 px, quer unter der Notch.
26. **iPad/Querformat zeigen Maus-Hinweise**, Gesten werden nirgends erklärt (1).
27. **Mars als „nach Canon“ markiert** (1), obwohl die Lage im Sonnensystem nur zur Lesbarkeit gestreckt ist; „Entfernung Sol 1 LJ“.

### Sachfehler in den Reise-Texten (mittel)

28. Vidiianer: „Phage“ spielt 2371, nicht 2372; Neelix verliert beide Lungen dauerhaft und bekommt einen Lungenflügel von Kes.
29. Devore („Counterpoint“) spielt 2375, nicht 2376.
30. Slipstream („Timeless“) spielt 2375 und kommt vor den Devore; Reihenfolge der Stationen vertauscht.
31. Hirogen: Das Relaisnetz ist uralt und wird von den Hirogen nur genutzt, nicht gebaut.
32. Holpriger Satz: „von einer Flotte der Sternenflotte“.

## Niedrig

33. Esc schließt den Reise-Player nicht (3).
34. Zurück-Taste des Browsers verlässt die Seite, statt das Infofenster zu schließen (1).
35. Beschriftungen überlappen weiterhin an einigen Stellen (4): Qo'noS/Sol/Cardassia in der Übersicht, „Entmilitarisierte Zone“ auf Bajor/DS9, Vulcan klebt an Sol (Marker nicht klickbar), Stationsnamen der Route stapeln sich, Labels der 3D-Objekte über dem eigenen Modell, Hinweiszeile über Sol.
36. Labels laufen unter Seitenleiste, Suchfeld, Zoom-Knöpfe und Minimap (3); in der Seitenleiste werden Reichsnamen angeschnitten.
37. Kartenbeschriftungen scheinen durch die Titelleiste und die Lücken der Seitenleiste (1).
38. Über die Suche angesteuert, landen Idran, Hub, Unikomplex und Hirogen bei 10.000–17.500 LJ, die 3D-Objekte erscheinen erst unter 3.500 LJ (1).
39. 3D-Objekte bei 1440 px mit 56 px sehr klein, bei `q=low` gezackt (1).
40. Bloom des Galaxiekerns überstrahlt bei `q=high` „Große Barriere“, „Sha Ka Ree“, „Transwarp-Hub“ (1).
41. Beim Ankommen springt das Schiff auf Kurs 0 und verdeckt den Sol-Marker (1).
42. Abspieltempo und Einblendungen hängen an der Bildrate (bei sehr langsamen Geräten dauert die Reise viel länger) (1).
43. Player-Titel mobil abgeschnitten („2371–23…“), Player-Höhe springt je Station (2).
44. Im Hochformat verdeckt der Player die Minimap (1).
45. Territorien überlappen (Klingonen über Föderation/Romulanern), klingonisch-föderale Grenze verläuft im Klingonengebiet (1).
46. Mächte-Panel: alle heißen „Großmacht“, auch Bajor und Talaxianer; „Hauptwelt“ Kazon-Raum, Hirogen-Relaisnetz, Malon-Raum sind keine Welten (1).
47. „-0“ in Koordinaten (Statusleiste, Mars) (1).
48. Galaxie-Gesamtansicht zeigt oben „Beta-Quadrant“ (1).
49. Tippfehler/Uneinheitlichkeit (2): „Telariten“ → „Tellariten“; „Vulcan“/„Vulkan“; „Starfleet“/„Sternenflotte“; Apostroph bei „Jem'Hadar“.
50. Kes-Sprung: Text sagt 9.500 LJ, gezeichnet ~8.460 LJ (1).
51. „/“ öffnet die Suche mit altem Text; Hover-Tooltip bleibt nach Mausrad-Zoom stehen (2).
52. Zoom bis 8 LJ in leeren Raum ohne Orientierung (1).
53. Erde sieht im Planetenbild grau-weiß aus wie ein Eismond (1).
54. Handy: nach schnellem Wisch kein Ausrollen; Doppeltippen zoomt nicht (1).
55. Handy: Tipp in leeres Reichsgebiet öffnet das große Mächte-Fenster (oft ungewollt) (1).
56. Handy: Minimap-Beschriftung ~5 px, weitere Texte 10–11 px; Quadrant-Anzeige außerhalb des Bildschirms; Reset-Knopf überlappt Sheet um 4 px (1).
57. Suche ohne Treffer gibt kein Feedback (3).
58. Tastatur: Reiter nicht mit Pfeiltasten wechselbar, Karte/Marker/Minimap nicht fokussierbar, Fokusrahmen in der Seitenleiste abgeschnitten (1).
59. Mobiles Menü: `aria-expanded` bleibt nach Auswahl einer Macht auf `true` (1).
60. Kontrast Hinweiszeile/Minimap-Beschriftung ~3,9:1 (Ziel 4,5:1) (1).
61. `aria-live` am ganzen Infofenster lässt Screenreader alles vorlesen (1).
62. Offline nach einem Besuch fehlt die LCARS-Schrift (woff2 nicht vorgeladen) (1).
63. Offline liefert jede unbekannte URL mit Status 200 (Soft-404); kein robots.txt, keine 404-Seite (1).
64. Manifest: Mobil-Screenshot als 1170×2532 angegeben, Datei hat 1170×1992 (1).
65. README veraltet: „70 Orte“ statt 94, Voyager noch unter „Was noch kommt“, Mächte-Reiter fehlen in der Bedienung (1).
66. Ladeleistung: 84 Requests, davon 59 einzelne Module; Service Worker lädt beim Erstbesuch alles ein zweites Mal (1).

---

## Was gut funktioniert hat

- Keine schwarzen Quadrate und kein Flackern auf über 100 Screenshots und Einzelbildern (Intro, alle Zoomstufen, beide Qualitätsstufen).
- Touch-Gesten folgen dem Finger pixelgenau; Pinch ist exakt umkehrbar, Drehen läuft in Fingerrichtung.
- Fehlerbildschirme: CDN gesperrt → nach 0,5 s klare Meldung mit „Neu laden“; ohne WebGL sauberer Hinweis.
- Offline-Neuladen aus dem Service Worker in 1,1 s.
- Kamera unter Stress (Klick-Spam, Zoom an die Grenzen, 40 schnelle Größenwechsel) ohne Fehler.
- Suche robust gegen `<script>`, Emoji und 5.000 Zeichen; Aliasse wie „Kronos“, „Terok Nor“, „earth“ funktionieren.
- Alle 17 Icons vorhanden, installierbar, README rendert auf GitHub mit allen Bildern.
- Intro, LCARS-Design, Ziele, Mächte, Ebenen-Schalter, Minimap und Meilensteine der Reise funktionieren zuverlässig.
