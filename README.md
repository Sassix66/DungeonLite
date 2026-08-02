# DungeonLite v1.2

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
