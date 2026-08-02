# DungeonLite v0.5.3

## Neu

- Alle Aktionen finden direkt auf dem Dungeon-Raster statt.
- Felder können frei ausgewählt werden.
- Grüne Erkundungsfelder benötigen mehrere Klicks bis 100 %.
- Jede Aktion verbraucht Ausdauer.
- Ausdauer regeneriert in Echtzeit.
- Gegner werden direkt durch Klicks angegriffen.
- Gegner greifen bei jedem Klick zurück.
- Gegner regenerieren Leben, wenn längere Zeit nicht angegriffen wird.
- Gegnerfarbe funktioniert als Lebensanzeige und leert sich von rechts nach links.
- Vasen und Kisten können direkt zerstört werden.
- Zerstörbare Objekte können Gold oder Heiltränke enthalten.

## GitHub Pages

- Branch: main
- Ordner: / (root)


## Korrekturen in v0.5.1

- Robuste Klick- und Touchsteuerung über Event-Delegation
- Grafische Ebenen blockieren keine Mausklicks mehr
- Leeres Inventar beim Spielstart
- Keine Startausrüstung
- 0 Gold
- 0 Diamanten
- 0 silberne Schlüssel
- 0 goldene Schlüssel


## Korrekturen in v0.5.2

- Alle sichtbaren Dungeonfelder sind jederzeit frei anklickbar.
- Keine separaten Kampf- oder Ereignisfenster.
- Gegner zeigen direkt auf der Kachel:
  - Gegnertyp
  - aktuelle und maximale HP
  - Stärke
- Neuer Speicherstandsschlüssel verhindert das Laden alter Startitems und Ressourcen.
- Startzustand:
  - 0 Gold
  - 0 Diamanten
  - 0 silberne Schlüssel
  - 0 goldene Schlüssel
  - leeres Inventar
  - keine Ausrüstung


## Änderungen in v0.5.3

- Heiligtümer können nur einmal benutzt werden.
- Zu Beginn sind nur drei oder vier Dungeonfelder sichtbar.
- Nach Abschluss verschwindet ein Feld vollständig.
- Für jedes entfernte Feld wird ein neues zufälliges Feld sichtbar.
- Dadurch bleibt der Dungeon übersichtlich und nie komplett gefüllt.
