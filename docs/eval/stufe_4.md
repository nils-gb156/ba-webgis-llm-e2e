# Stufe 4 – manuelle UI-Map + Map-Model-Helfer

Datenverzeichnis: `src/app/llm/tests/stage_4_manual_ui_map/`  
Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/stage_reports.py`.

## 1 Bestandsaufnahme

| Datei                    | Format      | kB      | Inhalt                                                                                                                                                                 |
| ------------------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv     | CSV         | 192.00  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, duration_s, error_summary, needs_review                                                              |
| \_phase2_judge.csv       | CSV         | 104.80  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass                 |
| \_phase2_judge.json      | JSON        | 900.90  | Liste, 500 Objekte; Schlüssel: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass, reasoning |
| \_playwright_report.json | JSON        | 1642.10 | Objekt; Schlüssel: config, suites, errors, stats                                                                                                                       |
| \_stage_4_context.txt    | TXT         | 17.00   | 400 Zeilen                                                                                                                                                             |
| run_01 … run_50/         | Verzeichnis | –       | 50 Lauf-Verzeichnisse, insgesamt 500 \*.spec.ts-Dateien                                                                                                                |

## 2 Grundmenge

| Kennzahl                          | Wert                             |
| --------------------------------- | -------------------------------- |
| Läufe (run-Verzeichnisse)         | 50                               |
| Läufe in \_phase1_results.csv     | 50                               |
| Use Cases in \_phase1_results.csv | 10                               |
| Zeilen \_phase1_results.csv       | 500                              |
| Soll (50 Läufe × 10 UC)           | 500                              |
| fehlende Lauf/UC-Kombinationen    | 0                                |
| unerwartete Kombinationen         | 0                                |
| Spec-Dateien auf der Platte       | 500 _.spec.ts-Dateien in run\__/ |
| Zeilen \_phase2_judge.csv         | 500                              |
| in Phase 2 bewertet (Lauf/UC)     | 500                              |
| in Phase 2 ausgelassen            | 0                                |
| in Phase 2, aber nicht in Phase 1 | 0                                |

- fehlende Kombinationen: keine
- in Phase 2 ausgelassen: keine

## 3 Phase 1

### Verteilung `exec_category`

Quelle: `_phase1_results.csv`, Spalte `exec_category`, alle Zeilen.

| exec_category  | n   | % der Stufengrundmenge |
| -------------- | --- | ---------------------- |
| PASS           | 322 | 64.4%                  |
| ASSERTION_FAIL | 81  | 16.2%                  |
| INFRA_FAIL     | 97  | 19.4%                  |
| GESAMT         | 500 | 100.0%                 |

### PASS-Rate je Use Case

Quelle: `_phase1_results.csv`; je UC `sum(exec_category=='PASS') / count()`, n = 50 Läufe.

| uc_id | n   | PASS | PASS-Rate | ASSERTION_FAIL | INFRA_FAIL |
| ----- | --- | ---- | --------- | -------------- | ---------- |
| uc-01 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-02 | 50  | 19   | 38.0%     | 30             | 1          |
| uc-03 | 50  | 49   | 98.0%     | 1              | 0          |
| uc-04 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-05 | 50  | 12   | 24.0%     | 0              | 38         |
| uc-06 | 50  | 29   | 58.0%     | 0              | 21         |
| uc-07 | 50  | 39   | 78.0%     | 2              | 9          |
| uc-08 | 50  | 0    | 0.0%      | 48             | 2          |
| uc-09 | 50  | 46   | 92.0%     | 0              | 4          |
| uc-10 | 50  | 28   | 56.0%     | 0              | 22         |

### Streuung der PASS-Rate über die 50 Läufe

Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, dann Kennzahlen über die 50 Läufe. Standardabweichung: Populations-SD (`ddof=0`).

| Kennzahl                    | Wert                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| Min PASS-Rate (Lauf)        | 30.0% (run_46)                                                                 |
| Max PASS-Rate (Lauf)        | 80.0% (run_09, run_10, run_11, run_13, run_14, run_15, run_17, run_27, run_28) |
| Mittelwert                  | 64.4%                                                                          |
| Median                      | 70.0%                                                                          |
| Standardabweichung (ddof=0) | 0.1219                                                                         |

- Use Cases, die zwischen PASS und Fehlschlag springen (0 < PASS < 50): **7** – uc-02, uc-03, uc-05, uc-06, uc-07, uc-09, uc-10
- immer PASS (50/50): uc-01, uc-04
- nie PASS (0/50): uc-08

### `duration_s`

Quelle: `_phase1_results.csv`, Spalte `duration_s` (Sekunden, Playwright-Ergebnis). Ausreißer: Tukey-Zaun `> Q3 + 1.5·IQR`.

| Kennzahl                 | Wert    |
| ------------------------ | ------- |
| n (nicht leer)           | 500     |
| Median                   | 2.98 s  |
| Mittelwert               | 3.86 s  |
| Min                      | 1.17 s  |
| Q1                       | 1.67 s  |
| Q3                       | 6.33 s  |
| Max                      | 30.05 s |
| Ausreißerzaun Q3+1.5·IQR | 13.33 s |
| Anzahl über dem Zaun     | 1       |

Median je `exec_category`:

| exec_category  | n   | Median s | Mittelwert s | Max s |
| -------------- | --- | -------- | ------------ | ----- |
| ASSERTION_FAIL | 81  | 6.78     | 5.04         | 11.89 |
| INFRA_FAIL     | 97  | 7.35     | 7.46         | 30.05 |
| PASS           | 322 | 2.56     | 2.49         | 4.80  |

10 längste Läufe:

| run    | uc_id | exec_category  | duration_s |
| ------ | ----- | -------------- | ---------- |
| run_34 | uc-05 | INFRA_FAIL     | 30.05      |
| run_33 | uc-10 | INFRA_FAIL     | 12.76      |
| run_23 | uc-08 | ASSERTION_FAIL | 11.89      |
| run_46 | uc-07 | INFRA_FAIL     | 8.90       |
| run_44 | uc-07 | INFRA_FAIL     | 8.85       |
| run_44 | uc-10 | INFRA_FAIL     | 8.81       |
| run_35 | uc-10 | INFRA_FAIL     | 8.78       |
| run_46 | uc-10 | INFRA_FAIL     | 8.72       |
| run_49 | uc-07 | INFRA_FAIL     | 8.49       |
| run_35 | uc-07 | INFRA_FAIL     | 8.43       |

### Gruppierte `error_summary`

Quelle: `_phase1_results.csv`, Zeilen mit `exec_category != 'PASS'` (n = 178). Gruppierung regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` (erste passende Regel gewinnt).

| Gruppe                                | n   | % der Fehlschläge | % der Stufe | betroffene UC                            |
| ------------------------------------- | --- | ----------------- | ----------- | ---------------------------------------- |
| D_element_not_found                   | 95  | 53.4%             | 19.0%       | uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| J_konkreter_received_wert             | 49  | 27.5%             | 9.8%        | uc-07, uc-08                             |
| K_locator_aufgeloest_aktion_scheitert | 30  | 16.9%             | 6.0%        | uc-02                                    |
| L_predicate_timeout                   | 2   | 1.1%              | 0.4%        | uc-03, uc-08                             |
| E_js_laufzeitfehler                   | 1   | 0.6%              | 0.2%        | uc-02                                    |
| N_generischer_test_timeout            | 1   | 0.6%              | 0.2%        | uc-05                                    |

Gruppe × `exec_category` (Kontrolle, ob die Gruppierung zur Klassifikation aus `run_phase1_eval.py` passt):

| grp                                   | ASSERTION_FAIL | INFRA_FAIL |
| ------------------------------------- | -------------- | ---------- |
| D_element_not_found                   | 0              | 95         |
| E_js_laufzeitfehler                   | 0              | 1          |
| J_konkreter_received_wert             | 49             | 0          |
| K_locator_aufgeloest_aktion_scheitert | 30             | 0          |
| L_predicate_timeout                   | 2              | 0          |
| N_generischer_test_timeout            | 0              | 1          |

Häufigste normalisierte Fehlerköpfe (erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):

| normalisierter Fehlerkopf                                                                            | n   | % der Fehlschläge | UC                                       |
| ---------------------------------------------------------------------------------------------------- | --- | ----------------- | ---------------------------------------- |
| `Error: expect(locator).toBeVisible() failed`                                                        | 95  | 53.4%             | uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| `Error: expect(locator).toContainText(expected) failed`                                              | 32  | 18.0%             | uc-08                                    |
| `Error: locator.selectOption: Error: Element is not a <select> element`                              | 30  | 16.9%             | uc-02                                    |
| `Error: expect(received).toMatch(expected)`                                                          | 12  | 6.7%              | uc-08                                    |
| `Error: expect(received).toBeGreaterThan(expected)`                                                  | 3   | 1.7%              | uc-03, uc-08                             |
| `Error: expect(received).toBe(expected) // Object.is equality`                                       | 2   | 1.1%              | uc-07, uc-08                             |
| `Error: locator.evaluate: TypeError: Cannot read properties of undefined (reading <s>)`              | 1   | 0.6%              | uc-02                                    |
| `Error: expect(received).not.toBe(expected) // Object.is equality`                                   | 1   | 0.6%              | uc-08                                    |
| `Test timeout of <n>ms exceeded. \|\| Error: page.waitForLoadState: Test timeout of <n>ms exceeded.` | 1   | 0.6%              | uc-05                                    |
| `Error: expect(received).toBeTruthy()`                                                               | 1   | 0.6%              | uc-07                                    |

## 4 Phase 2

### Verteilung je Bewertungsdimension

Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = nicht-numerischer Zellwert. Median/Mittelwert nur über die numerischen Werte.

| Dimension       | 1   | 2   | 3   | 4   | n/a | n numerisch | Median | Mittelwert | SD (ddof=0) |
| --------------- | --- | --- | --- | --- | --- | ----------- | ------ | ---------- | ----------- |
| coverage        | 0   | 2   | 145 | 353 | 0   | 500         | 4.0    | 3.70       | 0.47        |
| selector        | 0   | 41  | 81  | 378 | 0   | 500         | 4.0    | 3.67       | 0.62        |
| map_interaction | 0   | 2   | 51  | 197 | 250 | 250         | 4.0    | 3.78       | 0.43        |
| assertion       | 0   | 0   | 52  | 448 | 0   | 500         | 4.0    | 3.90       | 0.31        |

### `map_interaction`: tatsächliche Anwendung

| uc_id | n   | numerisch bewertet | n/a | Mittelwert |
| ----- | --- | ------------------ | --- | ---------- |
| uc-01 | 50  | 0                  | 50  | –          |
| uc-02 | 50  | 0                  | 50  | –          |
| uc-03 | 50  | 0                  | 50  | –          |
| uc-04 | 50  | 50                 | 0   | 4.00       |
| uc-05 | 50  | 0                  | 50  | –          |
| uc-06 | 50  | 50                 | 0   | 3.98       |
| uc-07 | 50  | 50                 | 0   | 3.92       |
| uc-08 | 50  | 50                 | 0   | 3.00       |
| uc-09 | 50  | 0                  | 50  | –          |
| uc-10 | 50  | 50                 | 0   | 4.00       |

- numerisch bewertet in: uc-04, uc-06, uc-07, uc-08, uc-10
- durchgehend `n/a` in: uc-01, uc-02, uc-03, uc-05, uc-09
- uneinheitlich (teils Score, teils `n/a`): –

### Scores je Use Case und Dimension

Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über die 50 Läufe, nur numerische Werte.

| uc_id | n   | coverage Ø | coverage Md | selector Ø | selector Md | map_interaction Ø | map_interaction Md | assertion Ø | assertion Md |
| ----- | --- | ---------- | ----------- | ---------- | ----------- | ----------------- | ------------------ | ----------- | ------------ |
| uc-01 | 50  | 3.58       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-02 | 50  | 3.52       | 4.0         | 3.38       | 3.0         | n/a               | n/a                | 3.98        | 4.0          |
| uc-03 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 3.98        | 4.0          |
| uc-04 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 4.00              | 4.0                | 4.00        | 4.0          |
| uc-05 | 50  | 4.00       | 4.0         | 2.52       | 2.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-06 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 3.98              | 4.0                | 4.00        | 4.0          |
| uc-07 | 50  | 3.92       | 4.0         | 4.00       | 4.0         | 3.92              | 4.0                | 4.00        | 4.0          |
| uc-08 | 50  | 3.00       | 3.0         | 3.00       | 3.0         | 3.00              | 3.0                | 3.00        | 3.0          |
| uc-09 | 50  | 3.00       | 3.0         | 3.84       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-10 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 4.00              | 4.0                | 4.00        | 4.0          |

### `vacuous_pass`

Definition laut Aufgabenstellung: Phase 1 = `PASS` **und** `assertion_score ≤ 2`. Quelle: `_phase1_results.csv` (`exec_category`) ⋈ `_phase2_judge.csv` (`assertion_score`, `vacuous_pass`) über `stage, run, uc_id, file`.

| Kennzahl                                          | Wert |
| ------------------------------------------------- | ---- |
| `vacuous_pass == true` (Judge)                    | 0    |
| Anteil an der Stufe                               | 0.0% |
| Anteil an den PASS-Fällen                         | 0.0% |
| eigene Nachrechnung: PASS und assertion_score ≤ 2 | 0    |
| markiert, aber Definition nicht erfüllt           | 0    |
| Definition erfüllt, aber nicht markiert           | 0    |

- keine Abweichung zwischen Judge-Flag und Definition.

### Muster in den Begründungstexten

Quelle: `_phase2_judge.json`, Feld `reasoning` (alle vier Teiltexte zusammengefasst). Regeltabelle: `eval_extract/stage_reports.py:REASON_PATTERNS`. Ein Treffer gilt als _negiert_, wenn im selben Satz ein Negationswort steht (`kein`, `nicht`, `ohne`, `statt`, `weder`).

| Muster                     | Bedeutung                                    | Dateien gesamt | davon nicht negiert | davon negiert | % der Stufe (nicht negiert) |
| -------------------------- | -------------------------------------------- | -------------- | ------------------- | ------------- | --------------------------- |
| helper_erwaehnt            | Map-Model-Helfer erwähnt                     | 498            | 498                 | 0             | 99.6%                       |
| nicht_zustandstragend      | Zustandstragendes Element (Regel 13)         | 449            | 249                 | 200           | 49.8%                       |
| canvas_statt_modell        | Canvas/map-container statt Kartenmodell      | 236            | 236                 | 0             | 47.2%                       |
| force_klick                | force:true beim Klick                        | 150            | 150                 | 0             | 30.0%                       |
| verdeckt_ueberdeckt        | Element verdeckt / Pointer-Events abgefangen | 92             | 92                  | 0             | 18.4%                       |
| importpfad                 | Importpfad der Helferdatei                   | 60             | 60                  | 0             | 12.0%                       |
| assertion_falsches_element | Assertion prüft falsches Element             | 50             | 50                  | 0             | 10.0%                       |
| map_model_zugriff          | Zugriff auf das Kartenmodell                 | 50             | 50                  | 0             | 10.0%                       |
| selektor_erfunden          | Selektor erfunden / nicht real               | 402            | 41                  | 361           | 8.2%                        |
| selektor_existiert_nicht   | Element existiert nicht                      | 23             | 0                   | 23            | 0.0%                        |
| wartebedingung             | Wartebedingung                               | 0              | 0                   | 0             | 0.0%                        |
| vacuous_tautologisch       | vacuous / tautologische Assertion            | 50             | 0                   | 50            | 0.0%                        |
| strict_mode                | mehrdeutiger Selektor                        | 100            | 0                   | 100           | 0.0%                        |

Je ein Beispielsatz (nicht negierter Treffer):

| Muster                     | Datei                                                                                                                 | Beispielsatz                                                                                                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selektor_erfunden          | `tests/stage_4_manual_ui_map/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`   | `Erfundenes Zielelement neben korrektem Trigger -> Mischung, selector 2.`                                                                                                                                    |
| importpfad                 | `tests/stage_4_manual_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             | `Verwendet die realen Test-IDs 'zoom-in-button', 'zoom-out-button' und 'map-container' sowie den korrekt aus '../../../map-model-helpers' importierten getMapZoomLevel-Helper - genau der Weg des Referen …` |
| map_model_zugriff          | `tests/stage_4_manual_ui_map/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               | `Die Zielkoordinate wird korrekt ueber globalThis.__openPioneerMap.olMap.getPixelFromCoordinate in eine Pixelposition umgerechnet und als elementrelative position an den Klick auf den realen 'map-conta …` |
| helper_erwaehnt            | `tests/stage_4_manual_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`            | `Ein etwaiger Helper-Poll dient nur als Ladevorbedingung.`                                                                                                                                                   |
| assertion_falsches_element | `tests/stage_4_manual_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                    | `Der Laengenwert wird jedoch im Panel gesucht, waehrend er in dieser App im OL-Overlay (div.measurement-tooltip > span) **im map-container** rendert - reales, aber falsches Element (Regel 24).`            |
| canvas_statt_modell        | `tests/stage_4_manual_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`            | `Verwendet ausschliesslich die realen Test-IDs 'layer-switcher-toggle' und 'layer-switcher' wie der Referenztest, teils zusaetzlich 'map-container'/'map-toolbar' als Ladevorbedingung.`                     |
| nicht_zustandstragend      | `tests/stage_4_manual_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`            | `Nach dem ersten Klick wird toBeHidden()/not.toBeVisible() am Panel geprueft, nach dem zweiten toBeVisible() - genau die beiden UC-Erwartungen, jeweils zustandstragend und unbedingt.`                      |
| force_klick                | `tests/stage_4_manual_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `getByRole('checkbox', { name: 'UV-Index', exact: true }) im realen Container 'layer-switcher' - das exact schliesst die im DOM davor stehende Ebene 'UV-Index Stations' korrekt aus - plus click({force: …` |
| verdeckt_ueberdeckt        | `tests/stage_4_manual_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `getByRole('checkbox', { name: 'UV-Index', exact: true }) im realen Container 'layer-switcher' - das exact schliesst die im DOM davor stehende Ebene 'UV-Index Stations' korrekt aus - plus click({force: …` |

### Auffälligkeiten in der Bewertung selbst

**Identische Begründungen** (exakter Textvergleich je Teiltext, Quelle `_phase2_judge.json` → `reasoning.<dim>`):

| Teiltext        | Dateien | verschiedene Texte | Texte, die mehrfach vorkommen | Dateien mit einem mehrfach vorkommenden Text | häufigster Text – Anzahl |
| --------------- | ------- | ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| coverage        | 500     | 16                 | 15                            | 499                                          | 50                       |
| selector        | 500     | 18                 | 17                            | 499                                          | 50                       |
| map_interaction | 500     | 12                 | 11                            | 499                                          | 50                       |
| assertion       | 500     | 12                 | 10                            | 498                                          | 50                       |

Die je Teiltext häufigsten identischen Texte (mit UC):

| Teiltext        | uc_id | n Dateien | Text                                                                                                                                   |
| --------------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | uc-03 | 50        | `Beide UC-Schritte (Klick auf 'Zoom in', Klick auf 'Zoom out') stehen unbedingt im Code, der Ausgangszoom wird vorher erfasst und n …` |
| coverage        | uc-04 | 50        | `Beide UC-Schritte stehen unbedingt im Code: der Sichtbarkeits-Toggle der UV-Index-Ebene wird geklickt, und auf das Laden der Kache …` |
| coverage        | uc-05 | 50        | `Der UC-Schritt (Klick auf den Sichtbarkeits-Toggle der Precipitation-Ebene) steht unbedingt im Code, danach wird die Legende betra …` |
| selector        | uc-03 | 50        | `Verwendet die realen Test-IDs 'zoom-in-button', 'zoom-out-button' und 'map-container' sowie den korrekt aus '../../../map-model-he …` |
| selector        | uc-06 | 50        | `Ausschliesslich reale Test-IDs: 'map-container', 'info-panel', 'weather-forecast-section', 'weather-forecast' und 'weather-forecas …` |
| selector        | uc-07 | 50        | `Ausschliesslich reale Test-IDs: 'map-container', 'info-panel', 'uvi-station-section', 'uvi-station-info', 'eucos-station-section', …` |
| map_interaction | uc-01 | 50        | `uc-01 ist nicht in MAP_UCS gelistet und erfordert keine kartenspezifische Interaktion; der Panel-Zustand ist vollstaendig im DOM b …` |
| map_interaction | uc-02 | 50        | `uc-02 ist nicht in MAP_UCS gelistet; der Basiskartenwechsel erfordert keine kartenspezifische Interaktion, auch wenn getActiveBase …` |
| map_interaction | uc-03 | 50        | `uc-03 ist nicht in MAP_UCS gelistet und erfordert keine kartenspezifische Interaktion im Sinne der Definition (Canvas-Aktion bzw.  …` |
| assertion       | uc-01 | 50        | `Nach dem ersten Klick wird toBeHidden()/not.toBeVisible() am Panel geprueft, nach dem zweiten toBeVisible() - genau die beiden UC- …` |
| assertion       | uc-04 | 50        | `Beide erwarteten Ergebnisse werden zustandstragend und unbedingt geprueft: toBeChecked() am Toggle und der wartende, layerspezifis …` |
| assertion       | uc-05 | 50        | `Beide UC-Erwartungen werden unbedingt und zustandstragend geprueft: toBeChecked() am Toggle und eine Pruefung des Legendeneintrags …` |

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
| uc-01  | 50      | 50         | 50         | 50            | 3.58             | 3.58           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-02  | 50      | 50         | 19         | 19            | 3.52             | 3.52           | 3.38             | 3.38           | –                       | –                     | 3.98              | 3.98            | 0             | 0           |
| uc-03  | 50      | 50         | 49         | 49            | 4.00             | 4.00           | 4.00             | 4.00           | –                       | –                     | 3.98              | 3.98            | 0             | 0           |
| uc-04  | 50      | 50         | 50         | 50            | 4.00             | 4.00           | 4.00             | 4.00           | 4.00                    | 4.00                  | 4.00              | 4.00            | 0             | 0           |
| uc-05  | 50      | 50         | 12         | 12            | 4.00             | 4.00           | 2.52             | 2.52           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-06  | 50      | 50         | 29         | 29            | 4.00             | 4.00           | 4.00             | 4.00           | 3.98                    | 3.98                  | 4.00              | 4.00            | 0             | 0           |
| uc-07  | 50      | 50         | 39         | 39            | 3.92             | 3.92           | 4.00             | 4.00           | 3.92                    | 3.92                  | 4.00              | 4.00            | 0             | 0           |
| uc-08  | 50      | 50         | 0          | 0             | 3.00             | 3.00           | 3.00             | 3.00           | 3.00                    | 3.00                  | 3.00              | 3.00            | 0             | 0           |
| uc-09  | 50      | 50         | 46         | 46            | 3.00             | 3.00           | 3.84             | 3.84           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-10  | 50      | 50         | 28         | 28            | 4.00             | 4.00           | 4.00             | 4.00           | 4.00                    | 4.00                  | 4.00              | 4.00            | 0             | 0           |
| GESAMT | 500     | 500        | 322        | 322           | 3.70             | 3.70           | 3.67             | 3.67           | 3.78                    | 3.78                  | 3.90              | 3.90            | 0             | 0           |

- **keine Abweichung** zwischen eigener Rechnung und `plot_stage.write_aggregates()`.
