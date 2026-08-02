# DungeonLite v1.5

## Neue Etagenkarte

- Räume werden durch sichtbare Korridore verbunden.
- Der aktuelle Raum pulsiert.
- Noch nicht entdeckte Räume bleiben verborgen.
- Beim Betreten eines Raums werden seine Nachbarräume aufgedeckt.
- Raumtypen besitzen eigene Symbole:
  - Kampf
  - Erkundung
  - Elite
  - Boss
  - Schatz
  - Händler
  - Brunnen
  - Heiligtum
  - Ereignis
- Die Karte bleibt direkt anklickbar.

## Neue Raumtypen

- Normalraum
- Erkundungsraum
- Eliteraum
- Bossraum
- Schatzraum
- Händlerraum
- Brunnenraum
- Heiligtumraum
- Ereignisraum

Normale Räume enthalten immer mindestens einen Gegner. Nur Gegner und Bosse
sind für den Raumabschluss verpflichtend.

## AP-Regel

Nur diese Aktionen verbrauchen AP:

- Erkundungskachel anklicken
- normalen Gegner angreifen
- Elitegegner angreifen
- Boss angreifen

Kein AP verbrauchen:

- Vasen und Kisten
- Heiligtümer
- Brunnen
- Schatztruhen
- Fallen
- Raumwechsel
- Etagenwechsel
- Inventar, Ausrüstung und Talentpunkte

## Skalierung

- Spätere Etagen können mehr Räume enthalten.
- Spätere Räume können mehr Aktionskacheln enthalten.
- Elite- und Bossräume werden erst schrittweise häufiger.


## Inventar und Schatztruhen in v1.2

- Inventargegenstände sind kompakter und passen sich der verfügbaren Breite an.
- Lange Gegenstandsnamen werden gekürzt dargestellt und verursachen kein horizontales Überlaufen.
- Heiltränke können über den neuen Button `BENUTZEN` verwendet werden.
- Ausrüstung kann weiterhin ausgerüstet und verkauft werden.
- Schatztruhen benötigen immer einen silbernen Schlüssel.
- Beim Öffnen wird genau ein silberner Schlüssel verbraucht.
- Schatztruhen können enthalten:
  - zufällige Ausrüstung
  - Gold
  - Heiltränke
- Ausrüstung aus Schatztruhen skaliert mit der aktuellen Etage und kann gewöhnlich, selten oder episch sein.
- Silberne Schlüssel können von Gegnern, Elitegegnern, Bossen sowie aus Vasen und Kisten stammen.


## Ausrüstungsvergleich in v1.3

- Automatischer Vergleich mit dem aktuell ausgerüsteten Gegenstand desselben Slots.
- Anzeige von Angriff, Verteidigung und HP.
- Alte Werte, neue Werte und genaue Differenz werden nebeneinander gezeigt.
- Verbesserungen erscheinen grün.
- Verschlechterungen erscheinen rot.
- Gleichbleibende Werte erscheinen neutral.
- Der momentan ausgerüstete Gegenstand wird mit Name und Kurzfassung angezeigt.
- Leere Ausrüstungsslots werden eindeutig markiert.
- Verbrauchsgegenstände besitzen eine separate Detailansicht.


## Neu in v1.4

- Optimiertes Smartphone-Layout für Querformat.
- Auf kleinen Displays bleibt das Spiel innerhalb eines Bildschirms.
- Im Hochformat erscheint ein Hinweis zum Drehen des Geräts.
- HP regeneriert während Meditation normal weiter.
- AP regeneriert während Meditation normal weiter.
- Der Erfahrungsbalken aktualisiert sich sichtbar während Meditation.
- Neue XP-Animation:
  - Weißer Balken zeigt sofort den gewonnenen Erfahrungsbetrag.
  - Blauer Balken holt anschließend weich auf.
- Kritische Trefferchance hinzugefügt.
- Startwert: 5 %.
- Kritische Treffer verursachen doppelten Schaden.
- Krit-Chance kann mit Talentpunkten erhöht werden.
- Obergrenze: 50 %.


## Neu in v1.5

- Höhere Etagen erzeugen mehr Kacheln pro Raum.
- Etwa alle zwei Etagen steigt die Mindestzahl der Zusatzkacheln.
- Räume können bis zu 18 Kacheln enthalten.
- Elite-, Boss- und Schatzräume erhalten zusätzliche Kacheln.
- Heiligtumräume erscheinen nur noch ungefähr in 1,5 % der Fälle.
- Brunnenräume erscheinen nur noch ungefähr in 2 % der Fälle.
- Elitegegner lassen garantiert Ausrüstung fallen.
- Bosse lassen garantiert Ausrüstung fallen.
- Normale Gegner besitzen eine kleine, mit der Etage steigende Ausrüstungschance.
- Legendäre Ausrüstung und zufällige Affixe wurden ergänzt.


## Dungeonraster und Darstellung in v2.1

- Jeder Raum verwendet ein festes 8×8-Raster.
- Kacheln werden zufällig und ohne Überlappung auf dem Raster verteilt.
- Die Raumgröße ist nicht mehr von der Anzahl vorhandener Kacheln abhängig.
- Normale und Elitegegner belegen zwei horizontale Rasterplätze.
- Vasen, Kisten, Schatztruhen und Brunnen belegen einen Rasterplatz.
- Heiligtümer und Bosse belegen ein 2×2-Quadrat.
- Das Layout wurde mit Steinboden, dunklen Mauern, stärkeren Rahmen und Lichtakzenten grafisch aufgewertet.

## Wertebalken

- Angriff, Verteidigung und Erholung besitzen kein Maximum.
- Ihre Balken werden daher immer vollständig gefüllt angezeigt.
- HP, AP und Krit-Chance behalten ihre tatsächliche prozentuale Darstellung.

## Mehrschichtige Gegner-HP

- Elite- und Bossgegner erhalten eine Lebensleiste pro 100 HP.
- Ein Gegner mit 500 maximalen HP zeigt fünf übereinanderliegende Leisten.
- Die Leisten werden nacheinander geleert.
- Mit sinkender Anzahl verbleibender Leisten wird die aktive Farbe dunkler.
- Normale Gegner behalten eine einzelne Lebensleiste.


## Lebensleistenkorrektur in v2.1.1

- Die Farbskala wurde umgedreht.
- Viele verbleibende Lebensleisten werden dunkel dargestellt.
- Mit jeder verlorenen Lebensleiste wird die aktive Farbe heller.
- Die letzte verbleibende Lebensleiste ist am hellsten.
- Die aktuell Schaden erhaltende Lebensleiste besitzt einen dezenten Glanzeffekt.


## Niederlagenmalus in v2.1.2

- Nach einer Niederlage beginnt der Malus, sobald der Spieler vollständig geheilt ist.
- Angriff wird für drei Minuten um 30 % reduziert.
- Verteidigung wird für drei Minuten um 30 % reduziert.
- Der Malus verhindert, dass der Spieler direkt nach der Genesung wieder ohne Risiko angreift.
- Die verbleibende Zeit wird in der linken Seitenleiste angezeigt.
- Ein Heiligtum entfernt den Malus sofort.
- Nach Ablauf der Zeit werden die normalen Werte automatisch wiederhergestellt.
- Ausrüstung und Grundwerte selbst werden nicht dauerhaft verändert.
