# Aufgabe

Extrahiere aus den vorliegenden Evaluationsdaten alle Informationen, die ich für das
Ergebniskapitel meiner Bachelorarbeit brauche. Du wertest aus und dokumentierst,
du interpretierst nicht.

## Datenquellen

- `src/app/llm/tests/stage_<n>/` – Ergebnisdateien der Judge-Bewertung (Phase 2)
  und die Phase-1-CSV
- `src/app/llm/tests/stage_<n>/plots/` – Diagramme und `aggregates.csv`
- Stufen 1 bis 5

## Arbeitsweise (verbindlich)

1. Verschaffe dir zuerst einen Überblick über alle Dateien pro Stufe: Namen,
   Formate, Spalten bzw. Schlüssel, Zeilenzahl. Schreibe diese Bestandsaufnahme
   in den Bericht, bevor du rechnest.
2. Rechne alle Kennzahlen selbst aus den Rohdaten (CSV/JSON/JSONL) mit Python/pandas.
   Übernimm keine Zahl aus `aggregates.csv` oder aus einem Plot ungeprüft.
   Vergleiche dein Ergebnis anschließend mit `aggregates.csv` und melde jede
   Abweichung explizit.
3. Für die Klassifikationslogik (Fehlerkategorien, Musterzuordnung) die vorhandenen
   Funktionen aus `run_stage_eval.py` importieren und wiederverwenden, nicht neu
   nachbauen. Wenn das nicht möglich ist, begründen, warum, und die eigene Logik
   explizit als solche kennzeichnen.
4. Lies die generierten Testdateien nicht pauschal einzeln in den Kontext. Aggregiere
   per Skript. Einzelne Dateien öffnest du gezielt dort, wo unten explizit danach
   gefragt wird.
5. Für jede Zahl im Bericht: Quelle angeben (Datei, Spalte, Filterbedingung) und wie
   sie berechnet wurde. Ich muss jede Zahl nachrechnen können.
6. Verändere keine Datendatei. Schreibe nur die Berichtsdateien und die
   Aggregationsskripte.
7. Wenn eine Information fehlt oder eine Datei nicht das enthält, was ich annehme,
   schreibe das hin. Rate nicht, rechne nichts hoch, erfinde nichts.

## Pro Stufe zu extrahieren (Stufen 1 bis 5)

**Grundmenge**

- Anzahl Dateien, Anzahl Läufe, Anzahl Use Cases; Soll ist 50 × 10 = 500
- fehlende Kombinationen Lauf/UC namentlich (in Stufe 3 fehlt bekannt run_20/uc-02)
- Anzahl Dateien, die in Phase 2 bewertet wurden, und Anzahl der ausgelassenen

**Phase 1**

- Verteilung über `exec_category`, absolut und in Prozent der Stufengrundmenge
- PASS-Rate je Use Case
- Streuung der PASS-Rate über die 50 Läufe (Min, Max, Standardabweichung), und ob
  es Use Cases gibt, die zwischen PASS und Fehlschlag springen
- `duration_s`: Median und auffällige Ausreißer
- `error_summary` regelbasiert gruppieren (identische oder nahezu identische
  Meldungen zusammenfassen) und die häufigsten Gruppen mit Häufigkeit auflisten;
  nenne pro Gruppe die betroffenen Use Cases

**Phase 2**

- je Bewertungsdimension (`coverage`, `selector`, `map_interaction`, `assertion`):
  Häufigkeit der Werte 1 bis 4, Median, Mittelwert, Anzahl `n/a`
- bei `map_interaction`: prüfe, auf welche Use Cases sie tatsächlich angewandt wurde
- Scores je Use Case und Dimension
- Anzahl und Anteil `vacuous_pass`; prüfe zusätzlich selbst, ob die Definition
  eingehalten ist (Phase 1 = PASS und `assertion` ≤ 2), und melde Abweichungen
- Begründungstexte des Judge: wiederkehrende Muster über Textsuche zählen
  (z. B. Selektor falsch/erfunden, Importpfad, kein Zugriff auf das Kartenmodell,
  fehlende Wartebedingung, Assertion prüft das falsche Element). Gib je Muster die
  Häufigkeit an und maximal ein kurzes Beispiel mit Dateipfad.
- Auffälligkeiten in der Bewertung selbst: identische Begründungen über viele
  Dateien, Dateien ohne Bewertung, unvollständige Datensätze, Widersprüche zwischen
  Score und Begründung

## Stufe 5 zusätzlich

Die Phase-1-CSV enthält für Stufe 5 nur das Endergebnis (`passed`, `iterations_used`).
Die Daten pro Iteration liegen im Loop-Protokoll (JSONL). Beschreibe zuerst dessen
Struktur: welche Felder pro Iteration vorliegen, ob Fehlermeldung, Snapshot und
Screenshot in jeder Iteration vorhanden sind, und ob Datensätze unvollständig sind.

**Ergebnis**

- Endergebnis in den Phase-1-Kategorien
- Verteilung `iterations_used`; Anteil, der in Iteration 1 besteht; Anteil, der nach
  10 Iterationen ohne PASS abbricht
- `max_iterations` in den Daten (Soll ist 10)
- Grenznutzen: wie viele Läufe kommen je zusätzlicher Iteration neu hinzu, und ab
  welcher Iteration kommt nichts mehr dazu

**Fehlerklassen im Verlauf**

- Fehlerklasse je Iteration klassifizieren, mit derselben Logik wie in Phase 1
  (siehe Arbeitsweise Punkt 3)
- pro Lauf die Sequenz der Fehlerklassen bilden und die häufigsten Sequenzmuster mit
  Häufigkeit auflisten
- Anteil aufeinanderfolgender Iterationen mit identischer Fehlerklasse
- Übergangsmatrix: von welcher Klasse geht es in welche über, inklusive Übergang nach
  PASS. Daraus je Klasse eine Behebungsquote ableiten.
- Rückschritte: Läufe, in denen sich die Klasse verschlechtert (z. B. von
  ASSERTION_FAIL zurück zu COMPILE_ERROR oder INFRA_FAIL)
- terminale Fehlerklasse der abgebrochenen Läufe, aufgeschlüsselt nach Use Case.
  Das ist die zentrale Tabelle dieses Abschnitts.

**Was nicht behoben wird**

- Läufe, die über alle 10 Iterationen dieselbe Fehlermeldung tragen: Anzahl,
  betroffene Use Cases, wörtliche Fehlermeldung (gekürzt)
- Fehlermeldungen gruppieren und kennzeichnen, welche Gruppen ausschließlich in
  abgebrochenen Läufen auftreten
- gesondert prüfen und zählen: Fehler mit Bezug auf das Karten-Canvas (abgefangene
  Pointer-Events, Element überdeckt) und auf abweichende Accessible Names von
  Chakra-UI-Elementen

**Entwicklung des Codes**

- ändert sich der Testcode zwischen den Iterationen substanziell oder wiederholt das
  Modell dieselbe Lösung: Anteil aufeinanderfolgender Iterationen mit nahezu
  identischem Code (z. B. über Zeilendifferenz oder Ähnlichkeitsmaß)
- Länge des Tests über die Iterationen: nimmt der Code zu, werden Assertions entfernt
  statt korrigiert

**Aufwand**

- soweit protokolliert: Laufzeit und Token pro Lauf, im Verhältnis zu einem einzelnen
  Generierungsdurchlauf der Stufen 1 bis 4

## Stufenvergleich

Eine eigene Berichtsdatei mit:

- Tabelle Stufe × `exec_category` in Prozent
- Tabelle Stufe × Dimension mit Median und Mittelwert
- PASS-Rate Matrix Use Case × Stufe
- `vacuous_pass` je Stufe
- Wanderung der Fehlerklassen zwischen den Stufen: welche Kategorie nimmt zu, welche
  ab, insbesondere ob INFRA_FAIL zu ASSERTION_FAIL wird und wie sich COMPILE_ERROR
  mit Einführung der Map-Model-Helfer ab Stufe 3 verändert
- Use Cases, die sich über die Stufen gegen den Gesamttrend verhalten
- Stufe 5 gegen Stufe 2: Stufe 5 startet mit dem Kontext von Stufe 2. Vergleiche das
  Ergebnis der ersten Iteration mit Stufe 2 und das Endergebnis mit den Stufen 2 bis 4,
  jeweils in Phase-1-Kategorien und in den Judge-Dimensionen.
- Nutzung der Map-Model-Helfer: Anteil der Tests je Stufe, die `__openPioneerMap` oder
  eine der Helferfunktionen verwenden

## Zusätzlich: Auffälligkeiten mit Beleg (nicht nur Zahlen)

Ziel dieses Abschnitts ist es, mir Ansatzpunkte zu liefern, an denen ich selbst mit
dem Code weiterarbeiten kann. Reine Kennzahlen reichen dafür nicht.

**Schritt A – auffällige Zellen finden.** Bestimme aus der PASS-Raten-Matrix
UC × Stufe die Zellen, die auffallen: Use Cases, die trotz mehr Kontext nicht besser
werden, ungewöhnlich gute oder schlechte Einzelwerte, Sprünge zwischen benachbarten
Stufen. Liste die fünf bis zehn auffälligsten Zellen mit Begründung, warum sie
auffallen (Zahl, Abweichung vom Stufentrend).

**Schritt B – Fehlermeldungen dieser Zellen gruppieren.** Für jede in Schritt A
gefundene Zelle: `error_summary` gruppieren, häufigste Gruppe benennen, Anteil an
der Zelle angeben.

**Schritt C – Stichprobe lesen.** Für jede Zelle aus Schritt A fünf Testdateien
öffnen (bevorzugt aus der größten Fehlermeldungsgruppe aus Schritt B) und
festhalten, was der generierte Code konkret tut, bevor er scheitert. Kein Kommentar
zur Qualität, nur Beschreibung: welcher Selektor, welche Assertion, welche
Interaktion.

**Schritt D – Muster in zählbare Regeln übersetzen.** Aus den in Schritt C
beobachteten Mustern ein Suchmuster (Substring oder Regex) ableiten und über ALLE
Dateien der betroffenen Stufe(n) auszählen – nicht nur über die Stichprobe. Mindestens
diese Muster prüfen, unabhängig davon, ob sie in Schritt A/C aufgefallen sind:

- Verwendung von `getByTestId` vs. `getByRole`/`getByText`/`getByLabel`
- Verwendung von `__openPioneerMap` oder einer der Helferfunktionen
  (`getActiveBaseLayerTitle`, `isLayerRendered`, `getMapZoomLevel`, `getMapCenter`,
  `getHighlightedCoordinate`)
- Importpfad der Helferdatei und dessen Varianten
- verwendete testids im Code gegen die Liste der 39 real existierenden testids
  abgleichen; Anzahl und Liste der halluzinierten testids je Stufe
- `waitForTimeout` als Wartestrategie vs. `expect.poll`/`waitFor`
- `force: true` bei Klicks
- Assertions direkt auf `map-container` (Canvas) statt auf Helferfunktionen
  Gib je Muster und Stufe die Häufigkeit (absolut und Prozent der Dateien) an.

**Schritt E – Ergebnis dieses Abschnitts.** Pro auffälliger Zelle einen kurzen
Steckbrief: betroffene Stufe/UC, Häufigkeit des Problems, zugehöriges Zählmuster aus
Schritt D mit Wert, ein Dateipfad als Beispiel. Keine Erklärung, warum es passiert,
nur was passiert und wie oft.

## Ausgabe

Schreibe nach `docs/eval/`:

- `stufe_1.md` bis `stufe_5.md`
- `vergleich.md`
- `auffaelligkeiten.md` (Ergebnis von Schritt A bis E)
- `pruefprotokoll.md` mit allen Abweichungen zwischen deiner Rechnung und
  `aggregates.csv`, allen fehlenden oder unerwarteten Daten und allen Stellen, an
  denen du unsicher warst

Format: Tabellen mit exakten Werten, darunter knappe Stichpunkte zu Auffälligkeiten.
Keine Fließtextabschnitte, keine Deutung, kein Fazit. Falls du eine Erklärung für ein
Muster vermutest, schreibe sie in einen separat gekennzeichneten Abschnitt
"Hypothesen (unbelegt)". Alles andere muss aus den Daten belegbar sein.

Lege die Aggregationsskripte unter `src/app/llm/eval_extract/` ab, damit ich sie
nachvollziehen und erneut ausführen kann.
