# Changelog

## v4.0.5 (Fix: Sound- und Partikeleffekte)

### Behoben
- **Soundeffekte:** `audio.play(...)` wurde im gesamten Spiel nur an einer
  einzigen Stelle aufgerufen (Fehlerton bei fehlendem Schlüssel), obwohl
  `audio.js` bereits 20 vollständig fertige Soundeffekte enthielt (Angriff,
  Gegner-/Boss-Tod, Level-Up, Ausrüsten, Verkaufen, Speichern, Falle,
  Truhe, Vase, Schrein, Etage gesichert, neue Etage, ...) – sie waren
  schlicht nirgendwo verdrahtet. Jetzt zentral in `playTileActionEffect()`
  zugeordnet plus gezielte Aufrufe bei Gegenschlag, Level-Up, Etage
  gesichert/gewechselt, Ausrüsten, Verkaufen, Heiltrank benutzen,
  Speichern und Talentpunkt ausgeben.
- Dabei aufgedeckt: `finishTile()` enthielt eine Schutzklausel gegen
  doppelte Kachel-Animationen auf derselben Kachel innerhalb einer Aktion
  (z. B. Treffer- gefolgt von Tod-Effekt). Diese hat unbeabsichtigt auch
  den zugehörigen Sound unterdrückt. Die Schutzklausel wirkt jetzt nur
  noch auf die visuelle Animation, der Sound spielt immer.
- **Partikeleffekte:** `render()` hat bei jedem einzelnen Zustandswechsel
  den kompletten Canvas-Renderer verworfen und neu aufgebaut (da der
  Canvas über `innerHTML` neu erzeugt wird). Da Partikelsystem,
  Schadenszahlen und Kachel-Animationen bisher direkt im Canvas-Renderer
  lebten, wurden sie dabei sofort wieder verworfen – bevor sie je sichtbar
  wurden. Diese drei Systeme leben jetzt dauerhaft im `Game`-Objekt und
  werden bei jeder Neuerstellung des Renderers wiederverwendet statt neu
  erzeugt.
- Regressionstests ergänzt (`tests/sound-wiring.test.mjs`,
  `tests/particle-persistence.test.mjs`).
- `tests/inventory-selection.test.mjs` auf das gemeinsame
  Test-Helper-Modul umgestellt (fehlender `window`-Stub kam durch die
  neuen Soundaufrufe ans Licht) sowie `requestAnimationFrame` im
  Test-Helper ergänzt.

## v4.0.5 (Balance-Fix: Boss-Skalierung)

### Behoben
- Bosse erhielten fälschlicherweise sowohl ihren eigenen Boss-Bonus (bisher
  +300 % HP, +60 % Angriff) als auch den "Meilenstein"-Schwierigkeits-
  aufschlag (+20 %), der eigentlich für normale/Elite-Gegner auf jeder
  5. Etage gedacht war. Da Bosse ausschließlich auf Meilenstein-Etagen
  erscheinen, hat sich das bei jedem einzigen Bosskampf im Spiel
  unbeabsichtigt aufsummiert.
- Beispiel Etage 5 (erster Bosskampf im Spiel): HP sank von 1175 auf 539,
  Angriff von 44 auf 31 — bei einem normalen Gegner zum Vergleich mit 62 HP
  und 14 Angriff. Der Boss bleibt spürbar stärker (~8,7x HP eines normalen
  Gegners statt zuvor ~19x), ist aber mit realistischer Spielerstärke auf
  dieser Etage wieder besiegbar.
- Boss-eigene Multiplikatoren dafür moderat angepasst: HP-Bonus von 4,00x
  auf 2,20x, Angriffs-Bonus von 1,60x auf 1,35x, um den Wegfall des
  doppelten Meilenstein-Bonus als reine Entschärfung wirken zu lassen statt
  Bosse insgesamt zu schwach zu machen.
- Regressionstest ergänzt (`tests/boss-scaling.test.mjs`).

### Unverändert
- Skalierung normaler und Elite-Gegner (erhalten den Meilenstein-Bonus
  weiterhin wie bisher).

## v4.0.5 (Versionsanzeige + Abstiegs-Button-Fix)

### Behoben
- Der Abstieg war eine feste Canvas-Kachel in der unteren rechten Ecke
  (Spalte 7–8, Zeile 7–8). In manchen Raumvorlagen (z. B.
  `explore-mine-collapse`) liegen Erkundungsfelder an genau dieser Position;
  sobald der Abstieg freigeschaltet wurde, hat dessen Klick-Trefferfläche
  Vorrang vor der darunterliegenden Kachel erhalten, wodurch diese
  Erkundungsfelder nicht mehr anklickbar waren und der Raum nicht
  abgeschlossen werden konnte.
- Der Abstieg ist jetzt ein eigenständiger HTML-Button unterhalb des
  Dungeon-Canvas (`#stairsBtn`) und blockiert dadurch grundsätzlich keine
  Canvas-Kacheln mehr, unabhängig von der Raumvorlage.
- Die zugehörige Canvas-Darstellung des Abstiegs (`buildExit()` in
  `CanvasRenderer.js`) sowie die veraltete `exit`-Trefferbehandlung in
  `RenderEngine.js` und die bereits leere `renderExitTile()` in `game.js`
  wurden entfernt.

### Neu
- Die aktuell gestartete Spielversion wird im Topbar angezeigt (`v4.0.5`),
  damit beim Testen eindeutig erkennbar ist, welcher Stand geladen ist.
- Regressionstest ergänzt (`tests/version-and-descend-button.test.mjs`).

## v4.0.5 (Hotfix: fehlende equipmentSlotLabel())

### Behoben
- `renderEquipmentComparison()` rief `this.equipmentSlotLabel(...)` auf, obwohl
  diese Methode nirgendwo im Code definiert war. Sobald ein Ausrüstungs-
  gegenstand ausgewählt wurde, warf `render()` deshalb bei jedem Aufruf einen
  Fehler, bevor die Seite aktualisiert wurde. Dadurch blieb die alte Seite
  unverändert stehen (u. a. mit deaktiviertem „Ausrüsten"-Button), und jede
  weitere Aktion (Angriff, Raumwechsel) ließ `render()` am selben Fehler
  scheitern — das Spiel wirkte vollständig eingefroren.
- `equipmentSlotLabel(slotId)` ergänzt, die den Slot-Namen aus den bereits
  vorhandenen `equipmentSlots()` nachschlägt.
- Regressionstest ergänzt (`tests/equipment-selection-render.test.mjs`), der
  gezielt die Auswahl eines Ausrüstungsgegenstands prüft.

## v4.0.5

### Technisch
- Automatisierte Tests für Raumabschluss und Freischaltung des
  Etagenabstiegs ergänzt (`tests/room-completion.test.mjs`).
- Automatisierte Tests für Raum- und Etagenwechsel sowie den Schutz vor
  Mehrfachklicks während laufender Übergänge ergänzt
  (`tests/floor-transition.test.mjs`). Dabei aufgedeckt und korrigiert:
  `descendFloor()` verwendete das globale `setTimeout` statt konsistent
  `window.setTimeout` wie an anderen Stellen im Code — funktional
  gleichwertig im Browser, aber uneinheitlich; in Tests ohne echten
  Zeitgeber ersetzt beides eine steuerbare Warteschlange.
- Automatisierte Tests für Speichern/Laden, Migration älterer Spielstände
  über `LEGACY_SAVE_KEYS` und den Umgang mit beschädigten Spielständen
  ergänzt (`tests/save-load.test.mjs`).
- Automatisierter Test für Inventarveränderungen nach Kauf, Verkauf und
  Zerlegen ergänzt (`tests/inventory-economy.test.mjs`).
- Gemeinsames Test-Helper-Modul `tests/helpers/test-env.mjs` für
  Fake-localStorage und eine steuerbare Zeitgeber-Warteschlange ergänzt.
- `dungeonlite.v404` als Legacy-Save-Key aufgenommen.

### Unverändert
- Gameplay, Balance, Inhalte und Bedienung. Browserkonsole und
  Smartphone-Querformat bleiben wie bisher manuelle Prüfpunkte vor jeder
  Veröffentlichung (siehe README) und sind nicht Teil dieser
  automatisierten Tests.

## v4.0.4 (Hotfix: reset())

### Behoben
- `reset()` löschte über `localStorage.clear()` den gesamten localStorage der
  Domain statt nur der DungeonLite-eigenen Speicherstände. Jetzt werden
  gezielt nur `SAVE_KEY`, alle `LEGACY_SAVE_KEYS` sowie `dungeonlite.seed`
  entfernt.

## v4.0.4

### Behoben
- Ausrüstung konnte durch eine veraltete numerische Inventarposition falsch
  oder gar nicht ausgewählt werden.
- Sortieren und Filtern konnten Auswahl und dargestellten Gegenstand
  auseinanderlaufen lassen.
- Nach dem Benutzen eines Heiltranks sprang die Auswahl automatisch auf den
  nächsten Inventargegenstand, wodurch der Verbrauch verzögert wirkte.

### Technisch
- Inventarauswahl auf stabile Gegenstands-IDs umgestellt.
- Vorhandene Spielstände erhalten fehlende IDs beim Laden automatisch.
- Automatisierter Test für Ausrüsten und den Verbrauch identischer Heiltränke
  ergänzt.

## v4.0.3

### Behoben
- Der freigeschaltete Etagenabstieg fehlte im Canvas-Aufbau und war dadurch
  weder sichtbar noch anklickbar.
- Veraltete Canvas-Treffer konnten nach einem Raumwechsel auf eine gleich
  nummerierte Kachel des neuen Raums angewendet werden.
- Zusätzliche Eingaben während eines laufenden Raum- oder Etagenübergangs
  konnten unerwartete Aktionen auslösen.
- Die Karte erlaubte Wechsel zu bereits sichtbaren, aber nicht direkt
  benachbarten Räumen.

### Unverändert
- Kampfwerte, Loot, Gegnerwerte und übrige Spielregeln.

## v4.0.2

### Technisch
- Statische Importprüfung für fehlende lokale Imports und nicht erreichbare
  JavaScript-Module ergänzt.
- Speicherschlüssel wird aus der zentralen Spielversion abgeleitet.
- Migration des v4.0.1-Spielstands auf den aktuellen Schlüssel ergänzt.
- Wirkungslose Methoden und Zustände der früheren Renderer-Umschaltung sowie
  eine tote DOM-Renderer-CSS-Regel entfernt.
- Bestätigt, dass die bereits entfernten Altmodule `save.js`, `player.js`,
  `items.js` und `dungeon.js` nicht Teil des aktiven Modulbaums sind.

### Unverändert
- Gameplay, Balance, Inhalte und Bedienung.

## v3.0.2

### Neu
- Canvas-basierter Dungeon-Renderer
- RenderEngine mit eigenem `requestAnimationFrame`-Loop
- Delta-Time- und FPS-Messung
- feste Render-Layer:
  - Boden
  - Wände
  - Dekoration
  - Objekte
  - Gegner
  - Effekte
  - Schadenszahlen
  - Overlay
- AssetManager für Bilder und JSON
- Camera-Klasse
- CanvasLayer-Abstraktion
- Debug-Umschaltung zwischen DOM und Canvas
- Debug-Anzeige für FPS, Framezeit, Draw Calls, Canvas-Größe und Raumvorlage

### Unverändert
- Kampfsystem
- Loot
- Balance
- Speicherstände
- Dungeonlogik


## v3.0.3

### Neu
- Canvas-Kacheln sind anklickbar und auf Touchgeräten bedienbar.
- AnimationController für `idle`, `hit`, `destroy`, `open` und `explore`.
- Generisches Partikelsystem für:
  - Blut
  - Scherben
  - Staub
  - Gold
  - Wasser
  - Licht
  - Fehlschläge
- Canvas-Schadenszahlen und `MISS`-Anzeige.
- Einfache dynamische Beleuchtung für Fackeln, Kristalle, Lava, Brunnen,
  Heiligtümer und Bosse.
- Debug-Anzeige für aktive Partikel, Schadenszahlen und Animationen.

### Behoben
- Der Canvas-Renderer blockiert die Bedienung des Dungeons nicht mehr.


## v3.0.4

### Neu
- Canvas ist jetzt der einzige Dungeon-Renderer.
- Der alte HTML-Kachelrenderer wurde aus der sichtbaren Dungeonansicht entfernt.
- Hover- und Touch-Hit-Tests laufen vollständig über Canvas.
- Der Abstieg wird als anklickbare Canvas-Kachel gerendert.
- Erste einheitliche Pixel-Platzhalter ersetzen Emojis im Dungeon:
  - Gegner
  - Bosse
  - Vasen
  - Kisten
  - Truhen
  - Brunnen
  - Heiligtümer
  - Händler
  - Fallen
  - Erkundung
  - Dekoration
- Hover-Rahmen markieren die aktuell auswählbare Kachel.
- Canvas-Dekoration wird nun geometrisch statt als Emoji gezeichnet.

### Entfernt
- Umschaltung auf den alten DOM-Dungeonrenderer.
- Sichtbare HTML-Kacheln im Dungeonbereich.


## v4.0.0

### Verlassene Mine
- Zehn Minengegner statt drei.
- Etagenabhängige Freischaltung der Gegner.
- Eigene Pixel-Silhouetten für Ratte, Fledermaus, Schleim, Spinne,
  Bergmann, Käfer, Kristallwesen, Bandit, Steinwesen und Tiefenwurm.
- Eigene Boss-Silhouette für den Tiefenbohrer.
- Neun zusätzliche Minenraumvorlagen.
- Minenboden, Loren-Schienen und braun-goldene UI-Akzente.
- Zonenname und aktuelle Etage im Canvas.


## v4.0.1

### Behoben
- Das F2-Debugpanel greift nicht mehr auf den entfernten
  `#debugRenderer`-Button zu.
- Alle Debugpanel-Schaltflächen werden defensiv gebunden.
- Der F2-Listener wird nur einmal beim Spielstart registriert.
- Im Smartphone-Querformat belegt das Inventar wieder die dritte Spalte,
  statt Dungeon und Sidebar nach unten zu drücken.

### Technisch
- Zentrale Versionsdefinition in `js/config/version.js`.
- Automatische Migration vorhandener Spielstände aus v4.0.0 und 3.0.x.
- README, Architekturübersicht und Debugpanel auf v4.0.1 vereinheitlicht.
- Tote CSS-Regeln für den entfernten Renderer-Schalter entfernt.
