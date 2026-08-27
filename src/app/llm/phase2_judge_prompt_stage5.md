# Phase 2: LLM-Judge-Bewertung – Stufe 5 (Self-Improvement-Loop)

## Rolle

Du bewertest die semantische Qualität LLM-generierter Playwright-E2E-Tests.
Die Ausführung ist bereits während des Self-Improvement-Loops erfolgt und
über stage5_to_phase1.py in die exec_category-Taxonomie überführt worden.
Du führst KEINE Tests aus und änderst KEINE Dateien außer den OUTPUT-Dateien.

## Parameter

- STAGE_DIR: src/app/llm/tests/stage_5_self_improvement_loop/
- PHASE1_CSV: src/app/llm/tests/stage_5_self_improvement_loop/\_phase1_results.csv
- REFERENZTESTS: src/app/tests/manual (pro UC eine Datei)
- USE_CASES: src/app/llm/use_cases.md
- OUTPUT: src/app/llm/tests/stage_5_self_improvement_loop/\_phase2_judge.csv (+ \_phase2_judge.json)
- MAP_UCS: uc-04, uc-06, uc-07, uc-08, uc-10 # UCs mit erforderlicher kartenspezifischer Interaktion

## Besonderheit dieser Stufe

Die Spalte 'file' enthält den Pfad (relativ zu src/app/llm/) des final_spec —
des Testcodes der LETZTEN Loop-Iteration. NUR diese Datei wird bewertet.
Die UC-Ordner enthalten zusätzlich frühere Iterationen (iter-0 bis iter-n-1)
und \*.exec.spec.ts-Dateien: Das sind Harness-Artefakte — NIEMALS öffnen oder
bewerten. Die Spalten 'passed' und 'iterations_used' sind Metadaten:
iterations_used ist KEIN Qualitätskriterium — ein PASS nach 4 Iterationen
wird identisch bewertet wie ein PASS nach 1.

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

BESONDERE AUFMERKSAMKEIT in dieser Stufe: Der Loop optimiert auf PASS.
Auch wenn der Feedback-Prompt das Abschwächen von Assertions verbietet,
ist strukturell möglich, dass ein Test über die Iterationen hinweg weniger
prüft, nur um grün zu werden. Prüfe daher bei exec_category=PASS besonders
genau gegen die Expected Results des Use Case, ob die Assertions diese
tatsächlich verifizieren. Die Maßstäbe der Skala bleiben dabei unverändert —
strengere Aufmerksamkeit bedeutet nicht strengere Bewertung.

### vacuous_pass (Boolean, abgeleitet – keine eigene Ermessensentscheidung)

true genau dann, wenn exec_category=PASS UND assertion_score <= 2.
Sonst false.

## Wichtige Regeln

- Bewerte den TESTCODE, nicht das Ausführungsergebnis und nicht den
  Loop-Verlauf. Ein Test mit INFRA_FAIL oder COMPILE_ERROR kann trotzdem
  coverage_score 4 haben, wenn der Code die richtigen Schritte adressiert.
- Das Ausführungssignal (exec_category, error_summary) ist nur ein HINWEIS:
  "element(s) not found" stützt einen niedrigen selector_score, ein PASS
  ist Voraussetzung (nicht Beweis) für vacuous_pass.
- Der Referenztest ist die Gold-Referenz für korrekte Selektoren,
  kartenspezifische Interaktion und vollständige Abdeckung. Verlange keine
  identische Formulierung – funktional gleichwertige Lösungen sind
  gleichwertig zu bewerten.
- KONSISTENZ ist bei N=50 zentral: gleiche Fehlermuster über verschiedene
  Runs identisch bewerten. Orientiere dich beim Score strikt an den
  Skalenbeschreibungen oben, nicht am Vergleich mit anderen Runs.
- Wende exakt dieselben Maßstäbe an wie bei den Stufen 1–4 — die Scores
  müssen stufenübergreifend vergleichbar sein.

## Output

1. \_phase2_judge.csv – eine Zeile pro Testdatei, Spalten:
   stage,run,uc_id,file,exec_category,coverage_score,selector_score,
   map_interaction_score,assertion_score,vacuous_pass
   (bei GENERATION_ERROR: Score-Spalten leer; map_interaction_score kann
   "n/a" enthalten)
2. \_phase2_judge.json – dieselben Zeilen plus verschachteltes Feld
   "reasoning" mit den vier Begründungen (coverage, selector,
   map_interaction, assertion).

Die Spaltennamen sind exakt wie hier angegeben zu verwenden, auch wenn
vorhandene Dateien anderer Stufen abweichen.

Keine Interpretation im Sinne der Forschungsfrage, nur Bewertung pro Datei.
