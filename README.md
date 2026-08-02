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


## Fehlerkorrekturen in v2.1.3

- Gegner mit maximal weniger als 100 HP zeigen bei voller Gesundheit einen vollständig gefüllten Balken.
- Auch die oberste Teilleiste eines Gegners mit beispielsweise 250 Max-HP wird bei 250 HP vollständig angezeigt.
- Gegnerregeneration verwendet nun eine stabile Echtzeitbasis.
- Meditation startet oder stoppt die Gegnerregeneration nicht.
- Gegner-HP und mehrschichtige Lebensleisten werden während der Regeneration direkt aktualisiert.
- Ein erneutes Rendern durch Meditation, Inventar oder andere Menüs verursacht keine sichtbaren HP-Sprünge mehr.
- Alte gespeicherte Trefferzeitpunkte werden automatisch auf das neue Zeitsystem migriert.


## Kampf und Effekte in v2.2

- Treffer gegen Gegner sind nicht mehr garantiert.
- Die Grundtrefferchance hängt vom Waffentyp ab:
  - Dolch: 94 %
  - Magische Waffe: 90 %
  - Schwert: 88 %
  - Fernkampfwaffe: 86 %
  - Schwere Waffe: 78 %
  - Unbewaffnet: 82 %
- Auch bei einem Fehlschlag schlägt der Gegner einmal zurück.
- Fehlschläge werden als schwebendes `MISS` angezeigt.
- Verursachter Schaden fliegt als negative Zahl aus der Gegnerkachel.
- Kritische Treffer besitzen eine größere goldene Schadensanzeige.
- Krit-Chance besitzt kein Darstellungsmaximum mehr und der Balken bleibt vollständig gefüllt.

## Partikel und Animationen

- Schläge gegen normale Gegner, Elitegegner und Bosse erzeugen lokale Trefferpartikel.
- Vasen erzeugen Scherbenpartikel.
- Kisten und andere Objekte erzeugen Splitter.
- Erkundungskacheln besitzen eine grüne Suchanimation.
- Fallen, Schatztruhen und Heiligtümer besitzen eigene Effekte.
- Effekte erscheinen direkt an der jeweiligen Kachel.

## Weitere Änderungen

- Erledigte Kacheln zeigen keinen Text und kein Symbol mehr.
- Sie werden grau und erhalten sichtbare Risse.
- Gegnertexte und Gegnersymbole wurden verkleinert.
- Fallen hinter Erkundungskacheln werden beim Aufdecken sofort ausgelöst.


## Balancing in v2.3

### Neue Verteidigungsformel

Die Schadensreduktion verwendet abnehmenden Grenznutzen:

`Reduktion = Verteidigung / (Verteidigung + 100)`

Dadurch bleibt Verteidigung wertvoll, kann den Spieler aber nicht vollständig
unverwundbar machen.

### Mindestschaden

- Jeder gegnerische Angriff verursacht mindestens 15 % seines Angriffswerts.
- Sehr hohe Verteidigung kann Schaden stark reduzieren, aber niemals vollständig verhindern.

### Gegnerskalierung

Pro Etage skalieren Gegner ungefähr mit:

- HP: +8 %
- Angriff: +6 %
- Verteidigung: +5 %
- Gold und Erfahrung: +5 %

Auf jeder fünften Etage erhalten Gegner zusätzlich 20 % auf HP, Angriff und Verteidigung.

### Elite und Bosse

- Elitegegner: +40 % HP und +20 % Angriff.
- Bosse: +300 % HP und +60 % Angriff.
- Normale Gegner: 2 % Kritchance.
- Elitegegner: 5 % Kritchance.
- Bosse: 10 % Kritchance.
- Kritische Gegenangriffe verursachen doppelten Schaden.

### Rüstungsdurchdringung

- Etage 1–20: 0 %
- Etage 21–40: 10 %
- Etage 41–60: 20 %
- Etage 61–80: 30 %
- Etage 81+: 40 %

### Lebensleisten

- Normale Gegner besitzen immer genau eine prozentuale Lebensleiste.
- Diese ist bei voller Gesundheit vollständig gefüllt, unabhängig von den maximalen HP.
- Nur Elite- und Bossgegner besitzen mehrere übereinanderliegende 100-HP-Leisten.
- Die zusätzliche Textanzeige der Leistenanzahl wurde entfernt.


## Loot-Overhaul in v2.4

- Stark vergrößerter Gegenstandspool mit mehreren Varianten pro Slot.
- Waffenfamilien: Schwert, Dolch, schwere Waffe, Fernkampf und Magie.
- Waffen speichern ihren Typ und verwenden zuverlässig ihre Trefferchance.
- Deutlich mehr Präfixe und Suffixe.
- Verbesserte Seltenheitschancen für Boss-, Elite- und Schatzbeute.
- Inventarfilter für Ausrüstung, Waffen, Rüstung, Schmuck und Tränke.
- Sortierung nach Power, Seltenheit, Wert oder Name.
- Itemlevel, Item-Power und Seltenheitsrahmen direkt im Inventar.
- Vergleichsansicht mit Power-Differenz, Waffentyp und Affixen.
- Händler führen drei Ausrüstungsangebote.
- Große Heiltränke werden ab höheren Etagen verfügbar.
- Beschädigte Kampfmethoden aus v2.3 wurden repariert.


## Dungeon Generator 2.0 in v2.5

- Räume werden jetzt aus festen 8×8-Vorlagen erzeugt.
- Gegner, Elitegegner, Bosse, Vasen, Truhen, Brunnen, Heiligtümer und Händler stehen an bewusst gestalteten Positionen.
- Zusätzliche Gegner und Objekte werden mit steigender Etage ergänzt.
- Jeder Raum speichert seine verwendete Vorlagen-ID.
- Dekoration liegt auf einer getrennten, nicht anklickbaren Ebene.
- Dekoration beeinflusst Kampf und Raumabschluss nicht.

## Raumkategorien

- Start
- Normal
- Erkundung
- Schatzkammer
- Elite
- Boss
- Händler
- Brunnen
- Heiligtum
- Ereignis

Jede Kategorie besitzt mehrere eigene Vorlagen.

## Biomdekoration

- Mine: Felsen, Werkzeuge, Spinnweben und Kristalle
- Krypta: Grabsteine, Knochen, Kerzen und Urnen
- Wald: Pilze, Wurzeln, Holz und Spinnweben
- Festung: Mauerwerk, Fässer, Waffen und Fackeln
- Eis: Eisblöcke, Schnee, Kristalle und Felsen
- Vulkan: Lava, Feuer, Basalt und Magmakristalle

## Atmosphäre

- Biomabhängige Bodenfarben
- animierte Fackeln, Kerzen und Lava
- dezent schwebende Dekoration
- besondere Lichtstimmung für Boss-, Schatz- und Heiligtumräume
- weicher Übergang beim Raumwechsel

Das einfache Kampfsystem bleibt unverändert.


## Engine-Architektur 3.0.1

Diese Version legt das technische Fundament für die weitere Entwicklung.

### Neu

- EventBus für lose gekoppelte Systeme
- Registries für:
  - Zonen
  - Gegner
  - Bosse
  - Items
  - Raumvorlagen
- deterministischer Seed-Manager
- reproduzierbare Zufallsfolgen
- zentrale globale Balance-Konfiguration
- zonenspezifische Balancewerte
- ereignisgesteuertes Statistiksystem
- strukturierte Engine-, Core-, Systems- und Config-Ordner
- Architektur-Dokumentation
- Debug-Menü mit `F2`

### Wichtig

Das eigentliche Gameplay wurde bewusst nicht verändert. Kampf, Loot,
Dungeonkarte, Meditation, Inventar und Raumvorlagen funktionieren weiterhin
wie in Version 2.5.


## Canvas-Renderer in v3.0.2

- Der Dungeon kann jetzt alternativ vollständig über Canvas dargestellt werden.
- Das HUD, Inventar und die übrige Benutzeroberfläche bleiben HTML.
- Der alte DOM-Renderer bleibt vorerst als Rückfalloption vorhanden.
- Mit `F2` kann im Debug-Menü zwischen DOM und Canvas gewechselt werden.
- Der aktive Renderer wird dauerhaft gespeichert.
- Das Debug-Menü zeigt FPS, Framezeit, Draw Calls, Canvas-Größe und Raumvorlage.


## Canvas-Interaktion und Effekte in v3.0.3

- Canvas-Kacheln lassen sich mit Maus und Touch bedienen.
- Angriffe, Fehlschläge, Erkundung und Objektzerstörung besitzen
  Canvas-Animationen.
- Partikel und Schadenszahlen werden ohne zusätzliche DOM-Elemente gerendert.
- Lichtquellen hellen ihre direkte Umgebung dynamisch auf.
- Das einfache Kampfsystem und alle bestehenden Spielregeln bleiben unverändert.


## Canvas-only in v3.0.4

Der Dungeon wird jetzt ausschließlich über Canvas dargestellt. HUD, Inventar,
Karte und Menüs bleiben weiterhin HTML, damit sie gut lesbar und bedienbar
bleiben.

Die bisherigen Emoji-Platzhalter im Dungeon wurden durch einfache,
einheitliche Pixel-Platzhalter ersetzt. Diese dienen als Grundlage für die
späteren finalen Sprites.


## Verlassene Mine – erster Vertical Slice

- Die Mine besitzt jetzt zehn unterschiedliche normale Gegnertypen.
- Neue Gegner werden schrittweise über die ersten zehn Etagen freigeschaltet.
- Jeder Minengegner besitzt eine eigene Canvas-Silhouette.
- Der Tiefenbohrer besitzt eine eigene Bossdarstellung.
- Zusätzliche Raumvorlagen für Kampf, Erkundung, Schatz, Elite und Boss.
- Minenboden mit Steinplatten und sichtbaren Loren-Schienen.
- Eigene Farbgebung und UI-Akzente für die Mine.
- Zonen- und Etagenname werden direkt im Dungeon eingeblendet.
