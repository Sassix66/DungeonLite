# DungeonLite 4.0.4 – Architektur

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
Verwaltet Render-Loop, FPS, Delta-Time, Größenanpassung und den
Canvas-only-Dungeonrenderer.

### `renderer/CanvasRenderer.js`
Zeichnet den aktuellen Raum in acht festen Ebenen.

### `renderer/CanvasLayer.js`
Kapselt Zeichenbefehle je Ebene.

### `renderer/Camera.js`
Vorbereitung für spätere Kamerabewegung und Zoom.

### `assets/AssetManager.js`
Zentrale Lade- und Cache-Schicht für Bilder und JSON-Daten.

Der sichtbare Dungeon wird ausschließlich über Canvas gerendert.
HUD, Inventar, Karte und Dialoge bleiben DOM-basiert.


## Visuelle Systeme 3.0.3

### `animation/AnimationController.js`
Verwaltet zeitlich begrenzte Zustände für Kacheln.

### `particles/ParticleSystem.js`
Ein gemeinsames Partikelsystem für alle lokalen Effekte.

### `particles/DamageNumberSystem.js`
Zeichnet schwebende Schadenszahlen und Fehlschläge auf Canvas.

### `lighting/LightingSystem.js`
Legt eine dunkle Umgebungsmaske über den Raum und schneidet Lichtquellen aus.

### Canvas-Eingabe
`RenderEngine` führt Hit-Tests gegen die gezeichneten Kachelrechtecke aus und
ruft anschließend `actOnTile()` als gemeinsame Spiellogik auf.


## Canvas-only Renderer 3.0.4

Der DOM-Dungeonrenderer ist nicht mehr Teil der sichtbaren Spielfläche.
`CanvasRenderer` übernimmt:

- Kacheldarstellung
- Hover-Erkennung
- Klick- und Touch-Hit-Tests
- Abstiegskachel
- Pixel-Platzhalter
- Dekoration
- Partikel
- Schadenszahlen
- Beleuchtung

Das restliche HUD bleibt bewusst DOM-basiert.

Canvas-Trefferregionen tragen die ID ihres Ursprungsraums. Die RenderEngine
verwirft einen Treffer, wenn inzwischen ein anderer Raum aktiv ist. Der
Abstieg wird nach der Freischaltung als eigene, raumgebundene Trefferregion
auf dem Canvas aufgebaut.


## Version und Persistenz 4.0.2

`config/version.js` enthält die zentrale Spielversion und die unterstützten
Legacy-Schlüssel. Der aktuelle Speicherschlüssel wird aus der Spielversion
abgeleitet. Beim Laden wird
der erste gültige ältere Spielstand automatisch auf den aktuellen Schlüssel
kopiert.

## Globale Eingaben

Der F2-Listener wird einmalig beim Spielstart registriert. Normale
UI-Handler werden nach einem DOM-Render weiterhin an die neu erzeugten
Elemente gebunden.

## Statische Importprüfung

`scripts/check-imports.mjs` verfolgt alle lokalen ES-Modul-Imports ab
`js/main.js`. Die Prüfung schlägt bei fehlenden Importzielen und bei
nicht erreichbaren JavaScript-Modulen fehl. Damit bleiben versehentlich
wieder eingeführte Altmodule und unvollständige Modulverschiebungen sichtbar.

## Inventarauswahl

Inventargegenstände erhalten eine stabile `uid`. Die aktuelle UI-Auswahl wird
über diese ID aufgelöst und nicht über eine Array-Position. Dadurch bleibt die
Zuordnung bei Sortierung stabil; nach einer Mutation wird die Auswahl bewusst
geleert.
