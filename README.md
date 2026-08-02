# DungeonLite v0.8

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


## Änderungen in v0.5.4

- Jeder Dungeon besitzt eine feste kleine Gruppe von drei oder vier Kacheln.
- Abgeschlossene Kacheln bleiben sichtbar und werden grau.
- Neue Kacheln erscheinen nicht während einer laufenden Etappe.
- Erst wenn alle vorhandenen Kacheln erledigt sind, startet automatisch die nächste Etappe.
- Die nächste Etappe erzeugt einen komplett neuen Dungeon.
- Der Spieler regeneriert langsam HP, wenn mindestens fünf Sekunden lang kein Kampf stattgefunden hat.


## Neu in v0.6

- Die Anzahl der Dungeonkacheln steigt mit fortschreitender Etappe wahrscheinlicher an.
- Gegner skalieren mit der Etappe:
  - mehr HP
  - mehr Angriff
  - mehr Verteidigung
  - bessere Belohnungen
- Erkundungsfelder können jetzt verbergen:
  - Gegner
  - zerstörbare Objekte
  - Schatztruhen
  - Fallen
  - Heiligtümer
  - leere Felder
- Erfahrungsbalken in der linken Seitenleiste.
- Jeder Levelaufstieg gibt einen Talentpunkt.
- Talentpunkte können frei verteilt werden auf:
  - HP
  - AP
  - Angriff
  - Verteidigung
  - Erholung
- Erholung startet bei 1.
- Erholung bestimmt pro Sekunde:
  - AP-Regeneration
  - HP-Regeneration außerhalb des Kampfes


## Neu in v0.7

- Angriffe gegen Gegner und Bosse verbrauchen keine Ausdauer mehr.
- Jede abgeschlossene Kachel besitzt eine typabhängige Animation:
  - Gegner: Blutspritzer
  - Boss: stärkere Bluteffekte
  - Vase: Scherben
  - Kiste: Holzsplitter
  - Schatz: Goldpartikel
  - Falle: Rauch
  - Heiligtum: Lichtpartikel
  - Erkundung: Funken
- Nach Abschluss aller Kacheln erscheint ein animierter Etappenübergang.
- Die nächste Etappe wird erst nach der Übergangsanimation geladen.


## Neu in v0.8

Browsergenerierte Soundeffekte für:

- Spielerangriff
- erlittenen Schaden
- Gegnerbesiegung
- Bossbesiegung
- Erkundung
- Aufdecken eines Feldes
- zerbrechende Vasen
- zerbrechende Kisten
- Schatztruhen
- Goldfunde
- Heiltränke
- Fallen
- Heiligtümer
- Levelaufstieg
- Talentverteilung
- Ausrüstung
- Verkauf
- Speichern
- Etappenabschluss
- Start der nächsten Etappe
- fehlende Ausdauer

Der Sound kann oben rechts ein- und ausgeschaltet werden. Browser erlauben Audio erst nach der ersten Benutzerinteraktion.
