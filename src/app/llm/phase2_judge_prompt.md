# Phase 2: LLM-Judge-Bewertung

## Rolle

Du bewertest die semantische Qualität LLM-generierter Playwright-E2E-Tests.
Die deterministische Ausführung (Phase 1) ist bereits erfolgt. Du führst
KEINE Tests aus und änderst KEINE Dateien außer den OUTPUT-Dateien.

## Parameter

- STAGE_DIR: src/app/llm/tests/stage_4_manual_ui_map/
- PHASE1_CSV: src/app/llm/tests/stage_4_manual_ui_map/\_phase1_results.csv
- REFERENZTESTS: src/app/tests/manual (pro UC eine Datei)
- USE_CASES: src/app/llm/use_cases.md
- OUTPUT: src/app/llm/tests/stage_4_manual_ui_map/\_phase2_judge.csv (+ \_phase2_judge.json)
- MAP_UCS: uc-04, uc-06, uc-07, uc-08, uc-10 # UCs mit erforderlicher kartenspezifischer Interaktion

## Vorgehen

Bewertet wird pro Use Case, nicht pro Run: Iteriere über die UCs
(uc-01 bis uc-10) und innerhalb jedes UC über alle 50 Runs.

Pro UC:

1. Lade EINMAL die Use-Case-Beschreibung aus USE_CASES und den
   Referenztest aus REFERENZTESTS (uc-01 -> "UC-1:").
2. Iteriere über alle Zeilen in PHASE1_CSV mit dieser uc_id (50 Dateien)
   und bewerte jede Datei unabhängig. Lies dafür ZUERST den generierten
   Testcode (Datei aus Spalte 'file') und bilde dir ein Urteil anhand von
   UC und Referenztest. Ziehe exec_category und error_summary aus
   PHASE1_CSV erst DANACH als Plausibilitätscheck heran.
3. Schreibe die Ergebnisse fortlaufend nach jeder Datei, damit bei
   Unterbrechung nichts verloren geht.

Überspringe die Bewertung bei exec_category=GENERATION_ERROR: nicht
bewertbar, alle Score-Spalten leer lassen, reasoning="GENERATION_ERROR:
kein valider Testcode".

Am Ende MUSS die Zeilenzahl in \_phase2_judge.csv der in PHASE1_CSV
entsprechen (abzüglich Kopfzeile). Fehlt eine Datei, hole sie nach.

## Bewertung

Bewerte vier Dimensionen in der folgenden Reihenfolge auf Skala 1–4
(map_interaction_score zusätzlich mit n/a). Schreibe pro Dimension IMMER
ZUERST eine kurze Begründung (2–3 Sätze), DANN den Score.

### coverage_score (Use-Case-Abdeckung)

1 = Testet den Use Case nicht oder etwas völlig anderes
2 = Deckt weniger als die Hälfte der UC-Schritte ab
3 = Deckt die wesentlichen Schritte ab, einzelne Lücken
4 = Alle Schritte und erwarteten Ergebnisse des UC abgedeckt

### selector_score (Selektor-Korrektheit)

1 = Selektoren überwiegend erfunden/falsch (existieren nicht in der App)
2 = Mischung aus korrekten und erfundenen Selektoren
3 = Selektoren überwiegend korrekt, kleinere Abweichungen
4 = Alle Selektoren korrekt (stimmen mit Referenztest/App überein)

### map_interaction_score (kartenspezifische Interaktion)

n/a = UC erfordert keine kartenspezifische Interaktion (maßgeblich ist
MAP_UCS: nicht gelistete UCs erhalten n/a)
1 = Keine kartenspezifische Aktion/Prüfung, obwohl der UC sie erfordert
(z. B. Canvas nie angeklickt, Kartenzustand nie geprüft; Aktionen und
Prüfungen ausschließlich DOM-basiert)
2 = Kartenspezifische Interaktion versucht, aber fehlerhaft (erfundene
Map-Model-API-Aufrufe, falsche Objektpfade, falsche Koordinaten-/
Pixel-Logik) oder ohne Warten auf den Kartenzustand
3 = Im Wesentlichen korrekt wie im Referenztest, kleinere Abweichungen
(z. B. unvollständiges Warten, schwächere Zustandsprüfung)
4 = Interaktion und Assertions funktional gleichwertig zum Referenztest
(korrekte Canvas-Aktionen bzw. Map-Model-Nutzung, korrektes Warten,
prüft den relevanten Kartenzustand)

### assertion_score (Assertion-Angemessenheit)

1 = Keine Assertions oder ausschließlich triviale (vacuous pass möglich)
2 = Assertions vorhanden, prüfen aber nicht die UC-Erwartungen
3 = Assertions prüfen die UC-Erwartungen im Wesentlichen, kleinere Lücken
4 = Assertions prüfen exakt die erwarteten Ergebnisse; Test würde bei
defekter Funktion zuverlässig fehlschlagen

### vacuous_pass (Boolean, abgeleitet – keine eigene Ermessensentscheidung)

true genau dann, wenn exec_category=PASS UND assertion_score <= 2.
Sonst false.

## Wichtige Regeln

- Bewerte den TESTCODE, nicht das Ausführungsergebnis. Ein Test mit
  INFRA_FAIL oder COMPILE_ERROR kann trotzdem coverage_score 4 haben,
  wenn der Code die richtigen Schritte adressiert.
- Das Ausführungssignal (exec_category, error_summary) ist nur ein HINWEIS:
  "element(s) not found" stützt einen niedrigen selector_score, ein PASS
  ist Voraussetzung (nicht Beweis) für vacuous_pass.
- Der Referenztest ist die Gold-Referenz für korrekte Selektoren,
  kartenspezifische Interaktion und vollständige Abdeckung. Verlange keine
  identische Formulierung – funktional gleichwertige Lösungen sind
  gleichwertig zu bewerten.
- KONSISTENZ ist bei N=50 zentral: gleiche Fehlermuster über verschiedene
  Runs identisch bewerten. Orientiere dich beim Score strikt an den
  Stufendefinitionen oben, nicht am Vergleich mit anderen Runs.

## Output

1. \_phase2_judge.csv – eine Zeile pro Testdatei, Spalten:
   stage,run,uc_id,file,exec_category,coverage_score,selector_score,
   map_interaction_score,assertion_score,vacuous_pass
   (bei GENERATION_ERROR: Score-Spalten leer; map_interaction_score kann
   "n/a" enthalten)
2. \_phase2_judge.json – dieselben Zeilen plus verschachteltes Feld
   "reasoning" mit den vier Begründungen (coverage, selector,
   map_interaction, assertion).

Keine Interpretation im Sinne der Forschungsfrage, nur Bewertung pro Datei.
