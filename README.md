# DungeonLite v1.0

## Raum- und Etagensystem

- Die linke Dungeonkarte zeigt Räume statt einzelner Aktionskacheln.
- Jeder Kartenblock ist ein eigener Raum.
- Räume besitzen echte Positionen auf einer zweidimensionalen Karte.
- Der aktuelle Raum ist gelb markiert.
- Besuchte Räume werden sichtbar.
- Abgeschlossene Räume werden grün markiert.
- Türen entsprechen den tatsächlichen Nachbarräumen:
  - Tür oben führt in den Raum oberhalb.
  - Tür unten führt in den Raum unterhalb.
  - Tür links führt nach links.
  - Tür rechts führt nach rechts.
- Jeder Raum besitzt einen eigenen Satz an Aktionskacheln.
- Ein Raum gilt als abgeschlossen, sobald alle seine Aktionskacheln erledigt sind.
- Erst wenn alle Räume der aktuellen Etage abgeschlossen sind, erscheint ein Treppenabgang.
- Der Treppenabgang erzeugt eine neue Etage mit einer neuen Raumkarte.

## GitHub Pages

- Branch: main
- Ordner: / (root)
