# Stufe 5 – Self-Improvement-Loop (Startkontext = Stufe 2)

Datenverzeichnis: `src/app/llm/tests/stage_5_self_improvement_loop/`  
Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/stage_reports.py`.

## 1 Bestandsaufnahme

| Datei                            | Format      | kB      | Inhalt                                                                                                                                                                 |
| -------------------------------- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv             | CSV         | 119.50  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, duration_s, error_summary, needs_review, passed, iterations_used                                     |
| \_phase2_judge.csv               | CSV         | 117.50  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass                 |
| \_phase2_judge.json              | JSON        | 721.00  | Liste, 500 Objekte; Schlüssel: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass, reasoning |
| \_stage_5_all_runs.jsonl         | JSONL       | 333.80  | 500 Objekte; Top-Level-Schlüssel: run, uc_id, complexity, passed, iterations_used, final_spec, iterations                                                              |
| \_stage_5_initial_context.txt    | TXT         | 8.40    | 234 Zeilen                                                                                                                                                             |
| \_stage_5_initial_screenshot.png | PNG         | 1478.80 | Bilddatei                                                                                                                                                              |
| \_stage_5_run_summary.json       | JSON        | 604.40  | Liste, 500 Objekte; Schlüssel: run, use_case_id, title, complexity, passed, iterations_used, max_iterations, screenshots_enabled, final_spec, history                  |
| run_01 … run_50/                 | Verzeichnis | –       | 50 Lauf-Verzeichnisse, insgesamt 1664 \*.spec.ts-Dateien                                                                                                               |

## 2 Grundmenge

| Kennzahl                          | Wert                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------- |
| Läufe (run-Verzeichnisse)         | 50                                                                                      |
| Läufe in \_phase1_results.csv     | 50                                                                                      |
| Use Cases in \_phase1_results.csv | 10                                                                                      |
| Zeilen \_phase1_results.csv       | 500                                                                                     |
| Soll (50 Läufe × 10 UC)           | 500                                                                                     |
| fehlende Lauf/UC-Kombinationen    | 0                                                                                       |
| unerwartete Kombinationen         | 0                                                                                       |
| Spec-Dateien auf der Platte       | 500 final_spec-Dateien auf der Platte auflösbar (alle Iterationsdateien zusammen: 1664) |
| Zeilen \_phase2_judge.csv         | 500                                                                                     |
| in Phase 2 bewertet (Lauf/UC)     | 500                                                                                     |
| in Phase 2 ausgelassen            | 0                                                                                       |
| in Phase 2, aber nicht in Phase 1 | 0                                                                                       |

- fehlende Kombinationen: keine
- in Phase 2 ausgelassen: keine

## 3 Phase 1

### Verteilung `exec_category`

Quelle: `_phase1_results.csv`, Spalte `exec_category`, alle Zeilen.

| exec_category  | n   | % der Stufengrundmenge |
| -------------- | --- | ---------------------- |
| PASS           | 495 | 99.0%                  |
| ASSERTION_FAIL | 4   | 0.8%                   |
| INFRA_FAIL     | 1   | 0.2%                   |
| GESAMT         | 500 | 100.0%                 |

### PASS-Rate je Use Case

Quelle: `_phase1_results.csv`; je UC `sum(exec_category=='PASS') / count()`, n = 50 Läufe.

| uc_id | n   | PASS | PASS-Rate | ASSERTION_FAIL | INFRA_FAIL |
| ----- | --- | ---- | --------- | -------------- | ---------- |
| uc-01 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-02 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-03 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-04 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-05 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-06 | 50  | 48   | 96.0%     | 1              | 1          |
| uc-07 | 50  | 49   | 98.0%     | 1              | 0          |
| uc-08 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-09 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-10 | 50  | 48   | 96.0%     | 2              | 0          |

### Streuung der PASS-Rate über die 50 Läufe

Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, dann Kennzahlen über die 50 Läufe. Standardabweichung: Populations-SD (`ddof=0`).

| Kennzahl                    | Wert                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Min PASS-Rate (Lauf)        | 80.0% (run_39)                                                                                                                                                                                                                                                                                                                                                                          |
| Max PASS-Rate (Lauf)        | 100.0% (run_01, run_02, run_03, run_05, run_06, run_07, run_08, run_09, run_10, run_11, run_12, run_13, run_14, run_15, run_16, run_17, run_18, run_19, run_20, run_21, run_22, run_23, run_24, run_25, run_26, run_27, run_28, run_29, run_30, run_31, run_32, run_33, run_34, run_35, run_36, run_37, run_41, run_42, run_43, run_44, run_45, run_46, run_47, run_48, run_49, run_50) |
| Mittelwert                  | 99.0%                                                                                                                                                                                                                                                                                                                                                                                   |
| Median                      | 100.0%                                                                                                                                                                                                                                                                                                                                                                                  |
| Standardabweichung (ddof=0) | 0.0361                                                                                                                                                                                                                                                                                                                                                                                  |

- Use Cases, die zwischen PASS und Fehlschlag springen (0 < PASS < 50): **3** – uc-06, uc-07, uc-10
- immer PASS (50/50): uc-01, uc-02, uc-03, uc-04, uc-05, uc-08, uc-09
- nie PASS (0/50): –

### `duration_s`

- `duration_s` ist in dieser Stufe für alle Zeilen leer (im Loop-Protokoll wird keine Einzelmessung geführt; siehe `map_stage5_phase1.py`, Kommentar zu `duration_s`). Keine Laufzeitkennzahl berechenbar.

### Gruppierte `error_summary`

Quelle: `_phase1_results.csv`, Zeilen mit `exec_category != 'PASS'` (n = 5). Gruppierung regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` (erste passende Regel gewinnt).

| Gruppe                     | n   | % der Fehlschläge | % der Stufe | betroffene UC |
| -------------------------- | --- | ----------------- | ----------- | ------------- |
| J_konkreter_received_wert  | 3   | 60.0%             | 0.6%        | uc-07, uc-10  |
| N_generischer_test_timeout | 1   | 20.0%             | 0.2%        | uc-06         |
| Y_sonstige                 | 1   | 20.0%             | 0.2%        | uc-06         |

Gruppe × `exec_category` (Kontrolle, ob die Gruppierung zur Klassifikation aus `run_phase1_eval.py` passt):

| grp                        | ASSERTION_FAIL | INFRA_FAIL |
| -------------------------- | -------------- | ---------- |
| J_konkreter_received_wert  | 3              | 0          |
| N_generischer_test_timeout | 0              | 1          |
| Y_sonstige                 | 1              | 0          |

Häufigste normalisierte Fehlerköpfe (erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):

| normalisierter Fehlerkopf                                      | n   | % der Fehlschläge | UC           |
| -------------------------------------------------------------- | --- | ----------------- | ------------ |
| `Error: expect(received).toBe(expected) // Object.is equality` | 3   | 60.0%             | uc-07, uc-10 |
| `Error: Test timeout of <n>ms exceeded`                        | 1   | 20.0%             | uc-06        |
| `Test run exceeded the hard timeout of <n>s.`                  | 1   | 20.0%             | uc-06        |

## 4 Phase 2

### Verteilung je Bewertungsdimension

Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = nicht-numerischer Zellwert. Median/Mittelwert nur über die numerischen Werte.

| Dimension       | 1   | 2   | 3   | 4   | n/a | n numerisch | Median | Mittelwert | SD (ddof=0) |
| --------------- | --- | --- | --- | --- | --- | ----------- | ------ | ---------- | ----------- |
| coverage        | 0   | 1   | 96  | 403 | 0   | 500         | 4.0    | 3.80       | 0.40        |
| selector        | 0   | 2   | 13  | 485 | 0   | 500         | 4.0    | 3.97       | 0.20        |
| map_interaction | 0   | 19  | 50  | 181 | 250 | 250         | 4.0    | 3.65       | 0.62        |
| assertion       | 0   | 7   | 46  | 447 | 0   | 500         | 4.0    | 3.88       | 0.37        |

### `map_interaction`: tatsächliche Anwendung

| uc_id | n   | numerisch bewertet | n/a | Mittelwert |
| ----- | --- | ------------------ | --- | ---------- |
| uc-01 | 50  | 0                  | 50  | –          |
| uc-02 | 50  | 0                  | 50  | –          |
| uc-03 | 50  | 0                  | 50  | –          |
| uc-04 | 50  | 50                 | 0   | 4.00       |
| uc-05 | 50  | 0                  | 50  | –          |
| uc-06 | 50  | 50                 | 0   | 3.80       |
| uc-07 | 50  | 50                 | 0   | 3.96       |
| uc-08 | 50  | 50                 | 0   | 2.64       |
| uc-09 | 50  | 0                  | 50  | –          |
| uc-10 | 50  | 50                 | 0   | 3.84       |

- numerisch bewertet in: uc-04, uc-06, uc-07, uc-08, uc-10
- durchgehend `n/a` in: uc-01, uc-02, uc-03, uc-05, uc-09
- uneinheitlich (teils Score, teils `n/a`): –

### Scores je Use Case und Dimension

Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über die 50 Läufe, nur numerische Werte.

| uc_id | n   | coverage Ø | coverage Md | selector Ø | selector Md | map_interaction Ø | map_interaction Md | assertion Ø | assertion Md |
| ----- | --- | ---------- | ----------- | ---------- | ----------- | ----------------- | ------------------ | ----------- | ------------ |
| uc-01 | 50  | 3.82       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-02 | 50  | 3.98       | 4.0         | 3.98       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-03 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-04 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 4.00              | 4.0                | 4.00        | 4.0          |
| uc-05 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-06 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 3.80              | 4.0                | 3.58        | 4.0          |
| uc-07 | 50  | 3.96       | 4.0         | 4.00       | 4.0         | 3.96              | 4.0                | 4.00        | 4.0          |
| uc-08 | 50  | 3.12       | 3.0         | 3.68       | 4.0         | 2.64              | 3.0                | 3.62        | 4.0          |
| uc-09 | 50  | 3.30       | 3.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-10 | 50  | 3.86       | 4.0         | 4.00       | 4.0         | 3.84              | 4.0                | 3.60        | 4.0          |

### `vacuous_pass`

Definition laut Aufgabenstellung: Phase 1 = `PASS` **und** `assertion_score ≤ 2`. Quelle: `_phase1_results.csv` (`exec_category`) ⋈ `_phase2_judge.csv` (`assertion_score`, `vacuous_pass`) über `stage, run, uc_id, file`.

| Kennzahl                                          | Wert |
| ------------------------------------------------- | ---- |
| `vacuous_pass == true` (Judge)                    | 7    |
| Anteil an der Stufe                               | 1.4% |
| Anteil an den PASS-Fällen                         | 1.4% |
| eigene Nachrechnung: PASS und assertion_score ≤ 2 | 7    |
| markiert, aber Definition nicht erfüllt           | 0    |
| Definition erfüllt, aber nicht markiert           | 0    |

- keine Abweichung zwischen Judge-Flag und Definition.

### Muster in den Begründungstexten

Quelle: `_phase2_judge.json`, Feld `reasoning` (alle vier Teiltexte zusammengefasst). Regeltabelle: `eval_extract/stage_reports.py:REASON_PATTERNS`. Ein Treffer gilt als _negiert_, wenn im selben Satz ein Negationswort steht (`kein`, `nicht`, `ohne`, `statt`, `weder`).

| Muster                     | Bedeutung                                    | Dateien gesamt | davon nicht negiert | davon negiert | % der Stufe (nicht negiert) |
| -------------------------- | -------------------------------------------- | -------------- | ------------------- | ------------- | --------------------------- |
| nicht_zustandstragend      | Zustandstragendes Element (Regel 13)         | 250            | 245                 | 5             | 49.0%                       |
| force_klick                | force:true beim Klick                        | 200            | 200                 | 0             | 40.0%                       |
| canvas_statt_modell        | Canvas/map-container statt Kartenmodell      | 150            | 136                 | 14            | 27.2%                       |
| helper_erwaehnt            | Map-Model-Helfer erwähnt                     | 230            | 130                 | 100           | 26.0%                       |
| map_model_zugriff          | Zugriff auf das Kartenmodell                 | 50             | 50                  | 0             | 10.0%                       |
| vacuous_tautologisch       | vacuous / tautologische Assertion            | 5              | 5                   | 0             | 1.0%                        |
| selektor_erfunden          | Selektor erfunden / nicht real               | 203            | 2                   | 201           | 0.4%                        |
| selektor_existiert_nicht   | Element existiert nicht                      | 0              | 0                   | 0             | 0.0%                        |
| importpfad                 | Importpfad der Helferdatei                   | 0              | 0                   | 0             | 0.0%                        |
| wartebedingung             | Wartebedingung                               | 0              | 0                   | 0             | 0.0%                        |
| assertion_falsches_element | Assertion prüft falsches Element             | 0              | 0                   | 0             | 0.0%                        |
| verdeckt_ueberdeckt        | Element verdeckt / Pointer-Events abgefangen | 0              | 0                   | 0             | 0.0%                        |
| strict_mode                | mehrdeutiger Selektor                        | 0              | 0                   | 0             | 0.0%                        |

Je ein Beispielsatz (nicht negierter Treffer):

| Muster                | Datei                                                                                                                                                                                                         | Beispielsatz                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selektor_erfunden     | `tests/stage_5_self_improvement_loop/run_02/uc-08-measure-a-distance-by-drawing-a-line-on-the-map/uc-08-iter-0-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                                       | `Der Panel-Nachweis laeuft ueber eine .or()-Kette mit erfundenem Zweig (role=region Measurement bzw.`                                                                                                        |
| map_model_zugriff     | `tests/stage_5_self_improvement_loop/run_01/uc-07-click-both-point-station-layers-to-show-feature-info/uc-07-iter-3-click-both-point-station-layers-to-show-feature-info.spec.ts`                             | `Die UC-Zielkoordinate wird korrekt ueber globalThis.__openPioneerMap.olMap.getPixelFromCoordinate in eine Pixelposition umgerechnet und als elementrelative position auf dem realen map-container geklic …` |
| helper_erwaehnt       | `tests/stage_5_self_improvement_loop/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-0-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `Der Helper wird aus dem korrekten Pfad importiert.`                                                                                                                                                         |
| canvas_statt_modell   | `tests/stage_5_self_improvement_loop/run_01/uc-06-click-a-map-position-to-show-the-weather-forecast/uc-06-iter-1-click-a-map-position-to-show-the-weather-forecast.spec.ts`                                   | `Durchgehend reale Test-IDs (map-container, info-panel, weather-forecast-section/-entry) und der Helper aus dem korrekten Pfad.`                                                                             |
| nicht_zustandstragend | `tests/stage_5_self_improvement_loop/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates/uc-05-iter-0-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`     | `der Eintrag rendert nur bei sichtbarem Layer und ist damit zustandstragend.`                                                                                                                                |
| vacuous_tautologisch  | `tests/stage_5_self_improvement_loop/run_04/uc-08-measure-a-distance-by-drawing-a-line-on-the-map/uc-08-iter-0-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                                       | `eine tautologische if-Pruefung belegt (Regel 13), und der Wert wird seiten-/app-weit gesucht, wo die ScaleBar die Einheiten-Regex ohnehin erfuellt.`                                                        |
| force_klick           | `tests/stage_5_self_improvement_loop/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-0-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `Referenzloesung: layer-switcher plus getByRole(checkbox, {name: UV-Index, exact: true}) - exact schliesst die Zeile UV-Index Stations aus - und der Klick erfolgt mit {force: true} auf die visuell vers …` |

### Auffälligkeiten in der Bewertung selbst

**Identische Begründungen** (exakter Textvergleich je Teiltext, Quelle `_phase2_judge.json` → `reasoning.<dim>`):

| Teiltext        | Dateien | verschiedene Texte | Texte, die mehrfach vorkommen | Dateien mit einem mehrfach vorkommenden Text | häufigster Text – Anzahl |
| --------------- | ------- | ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| coverage        | 500     | 16                 | 14                            | 498                                          | 50                       |
| selector        | 500     | 14                 | 12                            | 498                                          | 50                       |
| map_interaction | 500     | 14                 | 13                            | 499                                          | 50                       |
| assertion       | 500     | 17                 | 16                            | 499                                          | 50                       |

Die je Teiltext häufigsten identischen Texte (mit UC):

| Teiltext        | uc_id | n Dateien | Text                                                                                                                                   |
| --------------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | uc-03 | 50        | `Ausgangszoom wird vor den Klicks erfasst, danach werden Zoom-in- und Zoom-out-Button unbedingt geklickt und beide Richtungsergebni …` |
| coverage        | uc-04 | 50        | `Der Sichtbarkeits-Toggle des UV-Index-Overlays wird unbedingt geklickt, das Warten auf die Tiles erfolgt ueber den Poll, und beide …` |
| coverage        | uc-05 | 50        | `Der Sichtbarkeits-Toggle des Precipitation-Layers wird unbedingt geklickt und danach werden beide erwarteten Ergebnisse geprueft ( …` |
| selector        | uc-03 | 50        | `Nutzt die realen Test-IDs zoom-in-button/zoom-out-button und liest die Zoomstufe ueber den bereitgestellten Helper getMapZoomLevel …` |
| selector        | uc-04 | 50        | `Referenzloesung: layer-switcher plus getByRole(checkbox, {name: UV-Index, exact: true}) - exact schliesst die Zeile UV-Index Stati …` |
| selector        | uc-05 | 50        | `Reale Locator durchgehend: layer-switcher plus getByRole(checkbox, {name: Precipitation, exact: true}) mit {force: true} auf die v …` |
| map_interaction | uc-01 | 50        | `uc-01 ist nicht in MAP_UCS gelistet, kartenspezifische Interaktion ist nicht erforderlich.`                                           |
| map_interaction | uc-02 | 50        | `uc-02 ist nicht in MAP_UCS gelistet, kartenspezifische Interaktion ist nicht erforderlich.`                                           |
| map_interaction | uc-03 | 50        | `uc-03 ist nicht in MAP_UCS gelistet, kartenspezifische Interaktion ist nicht erforderlich.`                                           |
| assertion       | uc-02 | 50        | `Vorbedingung (aktive Basiskarte Carto Light) und Endzustand (OpenStreetMap aktiv, Carto Light nicht mehr aktiv) werden beide ueber …` |
| assertion       | uc-03 | 50        | `Der Richtungsvergleich ist der Matcher des expect.poll bzw. ein Praedikat im Poll (Regel 15/33): nach dem Zoom-in wird auf > Ausga …` |
| assertion       | uc-04 | 50        | `toBeChecked() fuer den Toggle-Zustand plus unbedingter, wartender und layerspezifischer Rendering-Poll auf isLayerRendered(UV-Inde …` |

**Vollständigkeit:**

| Prüfung                                                          | Wert                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Datensätze in `_phase2_judge.json`                               | 500                                                                              |
| Datensätze ohne `reasoning`-Objekt                               | 0                                                                                |
| fehlende Teiltexte (coverage/selector/map_interaction/assertion) | keine                                                                            |
| leere Score-Zellen in der CSV                                    | coverage_score=0, selector_score=0, map_interaction_score=250, assertion_score=0 |
| Score-Werte außerhalb 1–4 oder 'n/a'                             | keine                                                                            |
| CSV/JSON identisch besetzt (gleiche Anzahl Zeilen)               | ja                                                                               |

**Widersprüche zwischen Score und Begründung** (regelbasiert, eigene Prüfregeln):

| Prüfregel                                                                                 | n   | % der Stufe | Beispiel |
| ----------------------------------------------------------------------------------------- | --- | ----------- | -------- |
| selector ≥ 3, aber Begründung nennt einen erfundenen Selektor (nicht negiert)             | 0   | 0.0%        | `–`      |
| assertion ≥ 3, aber Begründung nennt eine vacuous/tautologische Assertion (nicht negiert) | 0   | 0.0%        | `–`      |
| coverage = 4, aber Begründung nennt eine Lücke                                            | 0   | 0.0%        | `–`      |

- Zeilen aus Phase 1 ohne jeden Judge-Score nach dem Join: **0**

## 5 Abgleich mit der Referenzaggregation

`plots/aggregates.csv` existiert im Repository nicht (kein `plots/`-Verzeichnis in keiner Stufe, keine Datei `aggregates.csv` im Arbeitsbaum). Als Ersatz wird die Referenzfunktion `plot_stage.write_aggregates()` auf denselben Rohdaten ausgeführt und Zelle für Zelle mit der eigenen Rechnung verglichen.

| uc_id  | n eigen | n Referenz | PASS eigen | PASS Referenz | coverage Ø eigen | coverage Ø Ref | selector Ø eigen | selector Ø Ref | map_interaction Ø eigen | map_interaction Ø Ref | assertion Ø eigen | assertion Ø Ref | vacuous eigen | vacuous Ref |
| ------ | ------- | ---------- | ---------- | ------------- | ---------------- | -------------- | ---------------- | -------------- | ----------------------- | --------------------- | ----------------- | --------------- | ------------- | ----------- |
| uc-01  | 50      | 50         | 50         | 50            | 3.82             | 3.82           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-02  | 50      | 50         | 50         | 50            | 3.98             | 3.98           | 3.98             | 3.98           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-03  | 50      | 50         | 50         | 50            | 4.00             | 4.00           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-04  | 50      | 50         | 50         | 50            | 4.00             | 4.00           | 4.00             | 4.00           | 4.00                    | 4.00                  | 4.00              | 4.00            | 0             | 0           |
| uc-05  | 50      | 50         | 50         | 50            | 4.00             | 4.00           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-06  | 50      | 50         | 48         | 48            | 4.00             | 4.00           | 4.00             | 4.00           | 3.80                    | 3.80                  | 3.58              | 3.58            | 2             | 2           |
| uc-07  | 50      | 50         | 49         | 49            | 3.96             | 3.96           | 4.00             | 4.00           | 3.96                    | 3.96                  | 4.00              | 4.00            | 0             | 0           |
| uc-08  | 50      | 50         | 50         | 50            | 3.12             | 3.12           | 3.68             | 3.68           | 2.64                    | 2.64                  | 3.62              | 3.62            | 5             | 5           |
| uc-09  | 50      | 50         | 50         | 50            | 3.30             | 3.30           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-10  | 50      | 50         | 48         | 48            | 3.86             | 3.86           | 4.00             | 4.00           | 3.84                    | 3.84                  | 3.60              | 3.60            | 0             | 0           |
| GESAMT | 500     | 500        | 495        | 495           | 3.80             | 3.80           | 3.97             | 3.97           | 3.65                    | 3.65                  | 3.88              | 3.88            | 7             | 7           |

- **keine Abweichung** zwischen eigener Rechnung und `plot_stage.write_aggregates()`.

## 6 Stufe 5: Loop-Protokoll

### Struktur des Loop-Protokolls

Zwei Dateien beschreiben denselben Lauf. Das JSONL ist die schmalere Fassung; `_stage_5_run_summary.json` enthält zusätzlich `spec`, `failure_snapshot_captured`, `failure_screenshot_captured`, `max_iterations` und `screenshots_enabled`.

| Datei                       | Ebene     | Felder                                                                                                                   |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `_stage_5_all_runs.jsonl`   | Lauf      | run, uc_id, complexity, passed, iterations_used, final_spec, iterations[]                                                |
| `_stage_5_all_runs.jsonl`   | Iteration | iteration, passed, error_type, error_excerpt                                                                             |
| `_stage_5_run_summary.json` | Lauf      | run, use_case_id, title, complexity, passed, iterations_used, max_iterations, screenshots_enabled, final_spec, history[] |
| `_stage_5_run_summary.json` | Iteration | iteration, spec, passed, failure_snapshot_captured, failure_screenshot_captured, error_type, error_excerpt               |

**Vollständigkeit der Iterationsdatensätze:**

| Prüfung                                                           | Wert                                     |
| ----------------------------------------------------------------- | ---------------------------------------- |
| Läufe im JSONL                                                    | 500                                      |
| Läufe in run_summary.json                                         | 500                                      |
| Läufe nur in einer der beiden Dateien                             | 0                                        |
| Iterationen insgesamt                                             | 832                                      |
| davon `passed = true`                                             | 495                                      |
| davon `passed = false`                                            | 337                                      |
| fehlgeschlagene Iterationen mit leerem `error_excerpt`            | 0                                        |
| bestandene Iterationen mit nicht-leerem `error_excerpt`           | 0                                        |
| `error_type` fehlt                                                | 0                                        |
| fehlgeschl. Iterationen mit `failure_snapshot_captured = true`    | 336                                      |
| fehlgeschl. Iterationen mit `failure_screenshot_captured = true`  | 336                                      |
| fehlgeschl. Iterationen **ohne** Snapshot **und** ohne Screenshot | run_40/uc-06 Iter. 9                     |
| `error_excerpt` auf 500 Zeichen gekappt (Länge = 500)             | 331 von 337 fehlgeschlagenen Iterationen |
| bestandene Iterationen mit Snapshot-Flag `true`                   | 0                                        |
| Iterationen ohne auflösbare Spec-Datei auf der Platte             | 0                                        |
| `iterations_used` ≠ Anzahl Einträge in `history`                  | 0                                        |
| Laufzeit je Iteration protokolliert                               | nein – kein Feld vorhanden               |
| Token-/Kostenangaben protokolliert                                | nein – kein Feld vorhanden               |

`error_type` (Feld des Loop-Harness, nicht die Phase-1-Klassifikation):

| error_type        | n Iterationen | % aller Iterationen |
| ----------------- | ------------- | ------------------- |
| none              | 495           | 59.5%               |
| assertion_fail    | 175           | 21.0%               |
| other             | 76            | 9.1%                |
| element_not_found | 55            | 6.6%                |
| timeout           | 31            | 3.7%                |

### Ergebnis

Quelle Endergebnis: `_phase1_results.csv` (aus dem Loop-Protokoll erzeugt von `map_stage5_phase1.py`). Quelle `iterations_used`: Loop-Protokoll.

| exec_category  | n   | %     |
| -------------- | --- | ----- |
| PASS           | 495 | 99.0% |
| ASSERTION_FAIL | 4   | 0.8%  |
| INFRA_FAIL     | 1   | 0.2%  |

Verteilung `iterations_used`:

| iterations_used | n Läufe | %     | kumuliert | kumuliert % |
| --------------- | ------- | ----- | --------- | ----------- |
| 1               | 299     | 59.8% | 299       | 59.8%       |
| 2               | 142     | 28.4% | 441       | 88.2%       |
| 3               | 33      | 6.6%  | 474       | 94.8%       |
| 4               | 13      | 2.6%  | 487       | 97.4%       |
| 5               | 3       | 0.6%  | 490       | 98.0%       |
| 6               | 3       | 0.6%  | 493       | 98.6%       |
| 7               | 1       | 0.2%  | 494       | 98.8%       |
| 8               | 1       | 0.2%  | 495       | 99.0%       |
| 10              | 5       | 1.0%  | 500       | 100.0%      |

- besteht in Iteration 1 (`passed = true`, `iterations_used = 1`): **299 / 500** = 59.8%
- bricht ohne PASS ab: **5 / 500** = 1.0% – run_04/uc-07, run_38/uc-10, run_39/uc-06, run_39/uc-10, run_40/uc-06
- `max_iterations` in den Daten: 10 (500 Läufe)
- Läufe mit `iterations_used > max_iterations`: 0

**Grenznutzen je zusätzlicher Iteration** (Läufe, die genau in dieser Iteration erstmals bestehen; Quelle: `history[].passed`):

| Iteration (0-basiert) | Iteration (1-basiert) | neu bestanden | Zuwachs in % der 500 | kumuliert bestanden | kumulierte PASS-Rate |
| --------------------- | --------------------- | ------------- | -------------------- | ------------------- | -------------------- |
| 0                     | 1                     | 299           | 59.8%                | 299                 | 59.8%                |
| 1                     | 2                     | 142           | 28.4%                | 441                 | 88.2%                |
| 2                     | 3                     | 33            | 6.6%                 | 474                 | 94.8%                |
| 3                     | 4                     | 13            | 2.6%                 | 487                 | 97.4%                |
| 4                     | 5                     | 3             | 0.6%                 | 490                 | 98.0%                |
| 5                     | 6                     | 3             | 0.6%                 | 493                 | 98.6%                |
| 6                     | 7                     | 1             | 0.2%                 | 494                 | 98.8%                |
| 7                     | 8                     | 1             | 0.2%                 | 495                 | 99.0%                |
| 8                     | 9                     | 0             | 0.0%                 | 495                 | 99.0%                |
| 9                     | 10                    | 0             | 0.0%                 | 495                 | 99.0%                |

- letzte Iteration mit Zuwachs: **7** (0-basiert) = Iteration 8
- ab Iteration **8** (0-basiert) kommt kein Lauf mehr hinzu

### Fehlerklassen im Verlauf

Klassifikation je Iteration mit `run_phase1_eval.classify_runtime_result("failed", error_excerpt)`; bestandene Iterationen = `PASS`. Identische Logik wie in Phase 1 bzw. `map_stage5_phase1.py`.

| Fehlerklasse   | n Iterationen | %     |
| -------------- | ------------- | ----- |
| PASS           | 495           | 59.5% |
| ASSERTION_FAIL | 230           | 27.6% |
| INFRA_FAIL     | 107           | 12.9% |

Fehlerklasse je Iterationsindex:

| Iteration | n   | PASS | ASSERTION_FAIL | INFRA_FAIL |
| --------- | --- | ---- | -------------- | ---------- |
| 0         | 500 | 299  | 121            | 80         |
| 1         | 201 | 142  | 48             | 11         |
| 2         | 59  | 33   | 21             | 5          |
| 3         | 26  | 13   | 11             | 2          |
| 4         | 13  | 3    | 8              | 2          |
| 5         | 10  | 3    | 7              | 0          |
| 6         | 7   | 1    | 4              | 2          |
| 7         | 6   | 1    | 2              | 3          |
| 8         | 5   | 0    | 4              | 1          |
| 9         | 5   | 0    | 4              | 1          |

**Sequenzmuster** (ein Zeichen je Iteration; P = PASS, A = ASSERTION_FAIL, I = INFRA_FAIL, C = COMPILE_ERROR, T = TIMEOUT, G = GENERATION_ERROR):

| Sequenz      | Länge | n Läufe | % der 500 | UC                                                            |
| ------------ | ----- | ------- | --------- | ------------------------------------------------------------- |
| `P`          | 1     | 299     | 59.8%     | uc-01, uc-03, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| `AP`         | 2     | 84      | 16.8%     | uc-02, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10        |
| `IP`         | 2     | 58      | 11.6%     | uc-02, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10               |
| `AAP`        | 3     | 19      | 3.8%      | uc-02, uc-06, uc-07, uc-08, uc-09, uc-10                      |
| `IAP`        | 3     | 9       | 1.8%      | uc-02, uc-09, uc-10                                           |
| `AAAP`       | 4     | 7       | 1.4%      | uc-07, uc-08, uc-10                                           |
| `IIP`        | 3     | 4       | 0.8%      | uc-02, uc-09                                                  |
| `AIAP`       | 4     | 2       | 0.4%      | uc-02                                                         |
| `AAIP`       | 4     | 2       | 0.4%      | uc-07                                                         |
| `IIAAIAIIAA` | 10    | 1       | 0.2%      | uc-07                                                         |
| `AIAAAP`     | 6     | 1       | 0.2%      | uc-07                                                         |
| `AAIIP`      | 5     | 1       | 0.2%      | uc-10                                                         |
| `IIAP`       | 4     | 1       | 0.2%      | uc-02                                                         |
| `AAIAP`      | 5     | 1       | 0.2%      | uc-07                                                         |
| `AIP`        | 3     | 1       | 0.2%      | uc-10                                                         |
| `IAAIIAP`    | 7     | 1       | 0.2%      | uc-02                                                         |
| `AAAAAP`     | 6     | 1       | 0.2%      | uc-06                                                         |
| `IAAAAAIIAA` | 10    | 1       | 0.2%      | uc-10                                                         |
| `AIAAAAAIII` | 10    | 1       | 0.2%      | uc-06                                                         |
| `AAAAAAAAAA` | 10    | 1       | 0.2%      | uc-10                                                         |

- verschiedene Sequenzen insgesamt: **25**
- aufeinanderfolgende Iterationspaare insgesamt: **332**
- davon mit **identischer** Fehlerklasse: **93** = 28.0%

**Übergangsmatrix** (Zeile = Klasse in Iteration _i_, Spalte = Klasse in Iteration _i+1_; nur Läufe, die eine Folgeiteration hatten):

| von \ nach     | n   | PASS | ASSERTION_FAIL | INFRA_FAIL | → PASS | Behebungsquote | bleibt gleich |
| -------------- | --- | ---- | -------------- | ---------- | ------ | -------------- | ------------- |
| ASSERTION_FAIL | 226 | 130  | 81             | 15         | 130    | 57.5%          | 35.8%         |
| INFRA_FAIL     | 106 | 66   | 28             | 12         | 66     | 62.3%          | 11.3%         |

- _Behebungsquote_ = Anteil der Übergänge aus dieser Klasse, die direkt in `PASS` führen (`trans[Klasse][PASS] / sum(trans[Klasse])`).

**Rückschritte** (Klasse verschlechtert sich nach der Ordnung GENERATION_ERROR < COMPILE_ERROR < TIMEOUT < INFRA_FAIL < ASSERTION_FAIL < PASS): **15** von 332 Übergängen = 4.5%

| von            | nach       | n   |
| -------------- | ---------- | --- |
| ASSERTION_FAIL | INFRA_FAIL | 15  |

Einzelne Rückschritte (max. 40):

| run    | uc_id | Iteration | von            | nach       |
| ------ | ----- | --------- | -------------- | ---------- |
| run_04 | uc-07 | 3 → 4     | ASSERTION_FAIL | INFRA_FAIL |
| run_04 | uc-07 | 5 → 6     | ASSERTION_FAIL | INFRA_FAIL |
| run_05 | uc-02 | 0 → 1     | ASSERTION_FAIL | INFRA_FAIL |
| run_17 | uc-07 | 0 → 1     | ASSERTION_FAIL | INFRA_FAIL |
| run_17 | uc-10 | 1 → 2     | ASSERTION_FAIL | INFRA_FAIL |
| run_23 | uc-07 | 1 → 2     | ASSERTION_FAIL | INFRA_FAIL |
| run_24 | uc-07 | 1 → 2     | ASSERTION_FAIL | INFRA_FAIL |
| run_31 | uc-10 | 0 → 1     | ASSERTION_FAIL | INFRA_FAIL |
| run_37 | uc-02 | 2 → 3     | ASSERTION_FAIL | INFRA_FAIL |
| run_38 | uc-10 | 5 → 6     | ASSERTION_FAIL | INFRA_FAIL |
| run_39 | uc-06 | 0 → 1     | ASSERTION_FAIL | INFRA_FAIL |
| run_39 | uc-06 | 6 → 7     | ASSERTION_FAIL | INFRA_FAIL |
| run_44 | uc-02 | 0 → 1     | ASSERTION_FAIL | INFRA_FAIL |
| run_45 | uc-07 | 1 → 2     | ASSERTION_FAIL | INFRA_FAIL |
| run_49 | uc-07 | 1 → 2     | ASSERTION_FAIL | INFRA_FAIL |

### Terminale Fehlerklasse der abgebrochenen Läufe

Quelle: letzte Iteration (`history[-1]`) der 5 Läufe mit `passed = false`.

| run    | uc_id | iterations_used | terminale Klasse | error_type     | Fehlermeldung (gekürzt)                                                                                                                                    |
| ------ | ----- | --------------- | ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| run_39 | uc-06 | 10              | INFRA_FAIL       | timeout        | `Error: Test timeout of 30000ms exceeded ⏎ ⏎ 276 \| await mapContainer.click({ position }); ⏎ 277 \| ⏎ > 278 \| await expect.poll(() => getHighlightedC …` |
| run_40 | uc-06 | 10              | ASSERTION_FAIL   | timeout        | `Test run exceeded the hard timeout of 180s.`                                                                                                              |
| run_04 | uc-07 | 10              | ASSERTION_FAIL   | timeout        | `Error: expect(received).toBe(expected) // Object.is equality ⏎ ⏎ Expected: true ⏎ Received: false ⏎ ⏎ Call Log: ⏎ - Test timeout of 30000ms exceeded ⏎ …` |
| run_38 | uc-10 | 10              | ASSERTION_FAIL   | assertion_fail | `Error: expect(received).toBe(expected) // Object.is equality ⏎ ⏎ Expected: 24 ⏎ Received: 1 ⏎ ⏎ Call Log: ⏎ - Timeout 60000ms exceeded while waiting o …` |
| run_39 | uc-10 | 10              | ASSERTION_FAIL   | assertion_fail | `Error: expect(received).toBe(expected) // Object.is equality ⏎ ⏎ Expected: 24 ⏎ Received: 2 ⏎ ⏎ Call Log: ⏎ - Timeout 60000ms exceeded while waiting o …` |

Aggregiert – UC × terminale Klasse:

| uc_id | ASSERTION_FAIL | INFRA_FAIL | gesamt |
| ----- | -------------- | ---------- | ------ |
| uc-06 | 1              | 1          | 2      |
| uc-07 | 1              | 0          | 1      |
| uc-10 | 2              | 0          | 2      |

### Was nicht behoben wird

Quelle: alle Iterationen eines Laufs, Feld `error_excerpt` (Whitespace normalisiert, auf 400 Zeichen gekürzt).

- Läufe mit 10 Iterationen: **5**
- davon mit **wörtlich identischer** Meldung in allen 10 Iterationen: **0**
- davon mit derselben **Fehlergruppe** in allen 10 Iterationen: **1**

Läufe mit durchgehend derselben Fehlergruppe:

| run    | uc_id | Gruppe                    | verschiedene Meldungstexte |
| ------ | ----- | ------------------------- | -------------------------- |
| run_39 | uc-10 | J_konkreter_received_wert | 10                         |

**Fehlergruppen über alle Iterationen** (Regeltabelle `common.py:ERROR_GROUP_RULES`):

| Gruppe                                | n Iterationen | n Läufe | davon abgebrochene Läufe | nur in abgebrochenen Läufen | UC                                              |
| ------------------------------------- | ------------- | ------- | ------------------------ | --------------------------- | ----------------------------------------------- |
| J_konkreter_received_wert             | 183           | 108     | 5                        | nein                        | uc-02, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| D_element_not_found                   | 56            | 53      | 2                        | nein                        | uc-02, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| E_js_laufzeitfehler                   | 36            | 35      | 1                        | nein                        | uc-02, uc-07                                    |
| K_locator_aufgeloest_aktion_scheitert | 27            | 25      | 0                        | nein                        | uc-02                                           |
| Y_sonstige                            | 13            | 10      | 3                        | nein                        | uc-06, uc-09, uc-10                             |
| N_generischer_test_timeout            | 12            | 10      | 3                        | nein                        | uc-04, uc-06, uc-09, uc-10                      |
| L_predicate_timeout                   | 8             | 8       | 1                        | nein                        | uc-06, uc-07, uc-08, uc-09, uc-10               |
| M_timeout_beim_warten_auf_locator     | 1             | 1       | 1                        | ja                          | uc-07                                           |
| G_target_closed                       | 1             | 1       | 1                        | ja                          | uc-06                                           |

**Gesondert gezählt** (Substring-Suche über `error_excerpt` aller fehlgeschlagenen Iterationen).

> Einschränkung: `error_excerpt` ist im Loop-Protokoll auf 500 Zeichen gekappt; bei den meisten Einträgen ist das Zeichenlimit erreicht. Muster, die erst im hinteren Teil des Playwright-Call-Logs stehen (u. a. `intercepts pointer events`, der `<canvas>`-Auszug), können deshalb im Protokoll fehlen, obwohl sie im vollständigen Fehlertext stünden. Die Nullwerte in dieser Tabelle sind Befunde über das Protokoll, nicht über die Testläufe.

| Muster                                                       | Regex                                                           | n Iterationen | % der fehlgeschl. Iterationen | n Läufe | davon abgebrochen |
| ------------------------------------------------------------ | --------------------------------------------------------------- | ------------- | ----------------------------- | ------- | ----------------- |
| Pointer-Events abgefangen                                    | `intercepts pointer events`                                     | 0             | 0.0%                          | 0       | 0                 |
| Element überdeckt / verdeckt (subtree)                       | `subtree intercepts\|is not visible`                            | 0             | 0.0%                          | 0       | 0                 |
| Bezug auf `map-container`                                    | `map-container`                                                 | 3             | 0.9%                          | 3       | 0                 |
| Bezug auf `<canvas>` / ol-viewport                           | `canvas\|ol-viewport`                                           | 0             | 0.0%                          | 0       | 0                 |
| Karten-Canvas gesamt (eine der drei vorigen Zeilen)          | `intercepts pointer events\|map-container\|canvas\|ol-viewport` | 3             | 0.9%                          | 3       | 0                 |
| Accessible Name in `getByRole(...{name:...})` nicht gefunden | `getByRole\([^)]*name:`                                         | 55            | 16.3%                         | 51      | 0                 |
| `getByLabel` nicht gefunden                                  | `getByLabel`                                                    | 0             | 0.0%                          | 0       | 0                 |
| Chakra-typisch: `<select>`/`<input>`-Erwartung verfehlt      | `Element is not a <select> element\|Element is not an <input>`  | 27            | 8.0%                          | 25      | 0                 |
| `aria-` erwähnt                                              | `aria-`                                                         | 47            | 13.9%                         | 40      | 0                 |

### Entwicklung des Codes

Quelle: die je Iteration erzeugte `*.spec.ts` (Pfad aus `history[].spec`). Ähnlichkeit: `difflib.SequenceMatcher.ratio()` über den Quelltext mit normalisiertem Whitespace. _nahezu identisch_ = Ratio ≥ 0.95. Zeilendifferenz: `difflib.unified_diff`, gezählt werden geänderte/hinzugefügte/entfernte Zeilen.

| Kennzahl                                        | Wert        |
| ----------------------------------------------- | ----------- |
| Iterationspaare mit Quelltext auf beiden Seiten | 332         |
| Ähnlichkeit – Median                            | 0.552       |
| Ähnlichkeit – Mittelwert                        | 0.558       |
| nahezu identisch (Ratio ≥ 0.95)                 | 1 = 0.3%    |
| Ratio ≥ 0.99                                    | 0 = 0.0%    |
| wörtlich identisch (Ratio = 1.0)                | 0 = 0.0%    |
| Ratio < 0.5 (praktisch neu geschrieben)         | 131 = 39.5% |
| geänderte Zeilen – Median                       | 61          |
| geänderte Zeilen – Mittelwert                   | 79.3        |

Ähnlichkeit je Iterationsübergang:

| von | nach | n   | ratio_median | ratio_mean | nahezu_identisch | diff_median | nahezu identisch % |
| --- | ---- | --- | ------------ | ---------- | ---------------- | ----------- | ------------------ |
| 0   | 1    | 201 | 0.542        | 0.543      | 0                | 53          | 0.0%               |
| 1   | 2    | 59  | 0.530        | 0.559      | 0                | 62          | 0.0%               |
| 2   | 3    | 26  | 0.568        | 0.597      | 1                | 74          | 3.8%               |
| 3   | 4    | 13  | 0.577        | 0.576      | 0                | 136         | 0.0%               |
| 4   | 5    | 10  | 0.665        | 0.625      | 0                | 96          | 0.0%               |
| 5   | 6    | 7   | 0.772        | 0.640      | 0                | 89          | 0.0%               |
| 6   | 7    | 6   | 0.580        | 0.592      | 0                | 113         | 0.0%               |
| 7   | 8    | 5   | 0.475        | 0.539      | 0                | 188         | 0.0%               |
| 8   | 9    | 5   | 0.677        | 0.632      | 0                | 110         | 0.0%               |

**Länge des Tests und Anzahl `expect(`-Aufrufe je Iteration** (nur Läufe, die diese Iteration erreicht haben):

| Iteration | n Dateien | Zeilen Median | Zeilen Ø | expect( Median | expect( Ø |
| --------- | --------- | ------------- | -------- | -------------- | --------- |
| 0         | 500       | 38            | 54.3     | 6              | 7.37      |
| 1         | 201       | 50            | 65.9     | 10             | 11.07     |
| 2         | 59        | 84            | 93.5     | 13             | 13.42     |
| 3         | 26        | 105           | 112.5    | 11             | 12.73     |
| 4         | 13        | 141           | 153.2    | 11             | 13.31     |
| 5         | 10        | 140           | 161.6    | 11             | 11.90     |
| 6         | 7         | 174           | 156.0    | 13             | 13.57     |
| 7         | 6         | 159           | 148.7    | 14             | 15.17     |
| 8         | 5         | 189           | 198.8    | 14             | 16.00     |
| 9         | 5         | 195           | 207.0    | 16             | 16.20     |

Richtung der Änderung über alle Iterationspaare:

| Größe            | nimmt zu | bleibt gleich | nimmt ab | zu %  | ab %  |
| ---------------- | -------- | ------------- | -------- | ----- | ----- |
| Zeilenzahl       | 176      | 8             | 148      | 53.0% | 44.6% |
| Anzahl `expect(` | 231      | 58            | 43       | 69.6% | 13.0% |

- Iterationspaare, in denen die Zahl der `expect(`-Aufrufe sinkt **und** die Folgeiteration besteht: **15** = 4.5% aller Paare

| run    | uc_id | von | nach | expect vorher | expect nachher | Zeilen vorher | Zeilen nachher | ratio |
| ------ | ----- | --- | ---- | ------------- | -------------- | ------------- | -------------- | ----- |
| run_01 | uc-09 | 1   | 2    | 19            | 18             | 147           | 58             | 0.51  |
| run_09 | uc-08 | 0   | 1    | 12            | 8              | 76            | 55             | 0.26  |
| run_09 | uc-10 | 2   | 3    | 25            | 23             | 102           | 86             | 0.35  |
| run_23 | uc-07 | 2   | 3    | 13            | 10             | 113           | 97             | 0.87  |
| run_28 | uc-08 | 0   | 1    | 11            | 7              | 95            | 51             | 0.29  |
| run_30 | uc-06 | 0   | 1    | 11            | 9              | 67            | 72             | 0.73  |
| run_31 | uc-10 | 1   | 2    | 18            | 17             | 140           | 79             | 0.50  |
| run_35 | uc-07 | 1   | 2    | 8             | 6              | 150           | 89             | 0.43  |
| run_38 | uc-06 | 4   | 5    | 18            | 17             | 120           | 128            | 0.89  |
| run_43 | uc-10 | 1   | 2    | 19            | 18             | 149           | 157            | 0.70  |
| run_45 | uc-07 | 2   | 3    | 17            | 15             | 79            | 100            | 0.46  |
| run_48 | uc-02 | 1   | 2    | 4             | 3              | 47            | 40             | 0.84  |
| run_49 | uc-02 | 1   | 2    | 3             | 2              | 43            | 46             | 0.42  |
| run_49 | uc-07 | 4   | 5    | 6             | 5              | 163           | 141            | 0.42  |
| run_50 | uc-07 | 3   | 4    | 12            | 11             | 162           | 163            | 0.49  |

Erste gegen letzte Iteration je Lauf (nur Läufe mit ≥ 2 Iterationen):

| passed         | n   | zeilen_delta_median | zeilen_delta_mean | expect_delta_median | expect_delta_mean | expect_gesunken |
| -------------- | --- | ------------------- | ----------------- | ------------------- | ----------------- | --------------- |
| nein (Abbruch) | 5   | 121.00              | 112.60            | 5.00                | 6.40              | 0               |
| ja (PASS)      | 196 | 2.00                | -3.11             | 3.00                | 3.70              | 8               |

### Aufwand

| Kennzahl                                           | Wert                                                                                                                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Laufzeit je Lauf protokolliert                     | nein – `_phase1_results.csv` führt `duration_s` für Stufe 5 leer (`map_stage5_phase1.py`: „keine Einzelmessung im Loop-Protokoll“); weder JSONL noch run_summary.json enthalten ein Zeitfeld |
| Token-/Kostenangaben protokolliert                 | nein – kein Feld in JSONL, run_summary.json, loop-summary.json oder result.json; `generate_tests_stage_5.py` setzt nur `max_tokens` und schreibt keine `usage`                               |
| ersatzweise zählbar: LLM-Generierungen gesamt      | 832                                                                                                                                                                                          |
| Generierungen je Lauf – Mittelwert                 | 1.66                                                                                                                                                                                         |
| Generierungen je Lauf – Median                     | 1                                                                                                                                                                                            |
| Vergleich Stufen 1–4: Generierungen je Lauf        | 1                                                                                                                                                                                            |
| Faktor Stufe 5 / Stufen 1–4 (Generierungen)        | 1.66×                                                                                                                                                                                        |
| Playwright-Ausführungen gesamt (eine je Iteration) | 832                                                                                                                                                                                          |
| Vergleich Stufen 1–4: Playwright-Ausführungen      | 500                                                                                                                                                                                          |
| Faktor (Ausführungen)                              | 1.66×                                                                                                                                                                                        |

- Ein direkter Laufzeit- oder Tokenvergleich zu den Stufen 1–4 ist aus den vorliegenden Dateien **nicht** möglich. Die einzige protokollierte Aufwandsgröße ist die Zahl der Iterationen (= LLM-Generierungen + Testausführungen).
- Die Stufen 1–4 protokollieren `duration_s` je Test, das ist die _Ausführungszeit_ des generierten Tests, nicht die Generierungszeit; für Stufe 5 fehlt auch diese Größe.
