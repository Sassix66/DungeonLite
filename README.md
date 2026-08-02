# DungeonLite v1.0.5

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


## Änderungen in v1.0.1

Nur noch diese Aktionen verbrauchen Ausdauer:

- Erkundung: 4 AP pro Klick
- Angriff auf normale Gegner: 4 AP pro Angriff
- Angriff auf Bosse: 6 AP pro Angriff

Keine Ausdauer verbrauchen:

- Türen und Raumwechsel
- Vasen und Kisten
- Schatztruhen
- Heiligtümer
- Fallen
- leere Felder
- Treppenabgänge
- Inventar und Ausrüstung


## Änderungen in v1.0.2

Alle Aktionen verbrauchen jetzt denselben Ausdauerwert: **4 AP pro Aktion**.


## Niederlagensystem in v1.0.3

- Bei 0 HP wird der Spieler besiegt.
- Während der Niederlage sind sämtliche Spielaktionen gesperrt.
- Der Spieler muss warten, bis seine HP wieder vollständig gefüllt sind.
- Währenddessen ist die HP-Regeneration stark erhöht:
  - Erholung × 6
  - zusätzlich 4 HP pro Sekunde
- AP regeneriert auch während der Niederlage normal weiter.
- Alle noch lebenden und bereits verletzten Gegner der aktuellen Etage werden bei einer Niederlage vollständig geheilt.
- Meditation wird bei einer Niederlage sofort beendet.
- Meditation bleibt gesperrt, bis der Spieler wieder vollständig geheilt ist.
- Während einer normalen Meditation regenerieren HP und AP weiterhin.


## Fehlerkorrektur in v1.0.4

- Der Abschlusscheck wird jetzt fest an den Raum gebunden, in dem die letzte Kachel erledigt wurde.
- Das Wechseln durch eine Tür während der Abschlussanimation kann den Raumstatus nicht mehr verhindern.
- Beim Betreten eines Raumes wird zusätzlich geprüft, ob bereits alle Kacheln abgeschlossen sind.
- Dadurch werden auch fehlerhafte oder verzögerte Raumzustände automatisch repariert.
- Türen zählen weiterhin nicht als Aktionskacheln und beeinflussen den Raumabschluss nicht.


## Navigation in v1.0.5

- Türkacheln wurden vollständig aus den Räumen entfernt.
- Die Etagenkarte ist jetzt direkt anklickbar.
- Jeder Raumblock auf der Karte führt in den entsprechenden Raum.
- Der aktuell geöffnete Raum ist deaktiviert und gelb markiert.
- Abgeschlossene Räume bleiben grün markiert.
- Alle Räume der Etage müssen weiterhin abgeschlossen werden.
- Erst danach erscheint im Raum der Treppenabgang zur nächsten Etage.
