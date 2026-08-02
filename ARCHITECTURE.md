# DungeonLite 3.0.1 – Architektur

## Kernmodule

### `core/EventBus.js`
Lose Kopplung zwischen Spielsystemen. Systeme reagieren auf Ereignisse, ohne
die internen Implementierungen anderer Systeme zu kennen.

Aktive Ereignisse:

- `enemy:defeated`
- `chest:opened`
- `tile:explored`
- `item:found`

### `core/Registry.js`
Generische Registry für Gegner, Bosse, Items, Räume und Zonen.

### `core/SeedManager.js`
Deterministischer Zufallszahlengenerator. Dungeons und Loot können mit
demselben Seed reproduziert werden.

### `engine/RuntimeContext.js`
Gemeinsamer Laufzeitkontext für EventBus, Seed und Registries.

### `engine/registries.js`
Baut Registries aus den vorhandenen datengetriebenen Inhalten auf.

### `config/balance.js`
Zentrale globale und zonenspezifische Balancewerte.

### `systems/StatisticsSystem.js`
Erstes vollständig ereignisgesteuertes System. Aktualisiert Statistiken
über den EventBus.

## Debug-Menü

Mit `F2` öffnen.

Enthalten:

- Seed anzeigen
- Registrierungszahlen anzeigen
- Gold hinzufügen
- Erfahrung hinzufügen
- Etage überspringen
- Raum neu generieren


## Renderer 3.0.2

### `renderer/RenderEngine.js`
Verwaltet Render-Loop, FPS, Delta-Time, Größenanpassung und Umschaltung
zwischen DOM- und Canvas-Renderer.

### `renderer/CanvasRenderer.js`
Zeichnet den aktuellen Raum in acht festen Ebenen.

### `renderer/CanvasLayer.js`
Kapselt Zeichenbefehle je Ebene.

### `renderer/Camera.js`
Vorbereitung für spätere Kamerabewegung und Zoom.

### `assets/AssetManager.js`
Zentrale Lade- und Cache-Schicht für Bilder und JSON-Daten.

Der DOM-Renderer bleibt vorerst als Rückfalloption erhalten. Der aktive
Renderer kann im F2-Debug-Menü gewechselt werden.
