# Changelog

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
