# Stufe 3 – generierte UI-Map + Map-Model-Helfer

Datenverzeichnis: `src/app/llm/tests/stage_3_generated_ui_map/`  
Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/stage_reports.py`.

## 1 Bestandsaufnahme

| Datei                    | Format      | kB      | Inhalt                                                                                                                                                                 |
| ------------------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv     | CSV         | 174.40  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, duration_s, error_summary, needs_review                                                              |
| \_phase2_judge.csv       | CSV         | 107.50  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass                 |
| \_phase2_judge.json      | JSON        | 963.60  | Liste, 500 Objekte; Schlüssel: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass, reasoning |
| \_playwright_report.json | JSON        | 1447.00 | Objekt; Schlüssel: config, suites, errors, stats                                                                                                                       |
| \_stage_3_context.txt    | TXT         | 11.70   | 204 Zeilen                                                                                                                                                             |
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
| PASS           | 362 | 72.4%                  |
| ASSERTION_FAIL | 61  | 12.2%                  |
| INFRA_FAIL     | 77  | 15.4%                  |
| GESAMT         | 500 | 100.0%                 |

### PASS-Rate je Use Case

Quelle: `_phase1_results.csv`; je UC `sum(exec_category=='PASS') / count()`, n = 50 Läufe.

| uc_id | n   | PASS | PASS-Rate | ASSERTION_FAIL | INFRA_FAIL |
| ----- | --- | ---- | --------- | -------------- | ---------- |
| uc-01 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-02 | 50  | 0    | 0.0%      | 5              | 45         |
| uc-03 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-04 | 50  | 49   | 98.0%     | 1              | 0          |
| uc-05 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-06 | 50  | 47   | 94.0%     | 2              | 1          |
| uc-07 | 50  | 28   | 56.0%     | 3              | 19         |
| uc-08 | 50  | 0    | 0.0%      | 50             | 0          |
| uc-09 | 50  | 47   | 94.0%     | 0              | 3          |
| uc-10 | 50  | 41   | 82.0%     | 0              | 9          |

### Streuung der PASS-Rate über die 50 Läufe

Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, dann Kennzahlen über die 50 Läufe. Standardabweichung: Populations-SD (`ddof=0`).

| Kennzahl                    | Wert                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Min PASS-Rate (Lauf)        | 60.0% (run_04, run_06, run_19, run_24, run_29, run_39, run_46)                                                                                                 |
| Max PASS-Rate (Lauf)        | 80.0% (run_01, run_03, run_11, run_12, run_14, run_15, run_18, run_20, run_21, run_23, run_25, run_26, run_31, run_32, run_35, run_36, run_37, run_42, run_45) |
| Mittelwert                  | 72.4%                                                                                                                                                          |
| Median                      | 70.0%                                                                                                                                                          |
| Standardabweichung (ddof=0) | 0.0680                                                                                                                                                         |

- Use Cases, die zwischen PASS und Fehlschlag springen (0 < PASS < 50): **5** – uc-04, uc-06, uc-07, uc-09, uc-10
- immer PASS (50/50): uc-01, uc-03, uc-05
- nie PASS (0/50): uc-02, uc-08

### `duration_s`

Quelle: `_phase1_results.csv`, Spalte `duration_s` (Sekunden, Playwright-Ergebnis). Ausreißer: Tukey-Zaun `> Q3 + 1.5·IQR`.

| Kennzahl                 | Wert    |
| ------------------------ | ------- |
| n (nicht leer)           | 500     |
| Median                   | 3.63 s  |
| Mittelwert               | 4.33 s  |
| Min                      | 1.16 s  |
| Q1                       | 2.30 s  |
| Q3                       | 6.02 s  |
| Max                      | 30.06 s |
| Ausreißerzaun Q3+1.5·IQR | 11.59 s |
| Anzahl über dem Zaun     | 3       |

Median je `exec_category`:

| exec_category  | n   | Median s | Mittelwert s | Max s |
| -------------- | --- | -------- | ------------ | ----- |
| ASSERTION_FAIL | 61  | 7.78     | 7.71         | 9.66  |
| INFRA_FAIL     | 77  | 6.94     | 7.28         | 30.06 |
| PASS           | 362 | 2.96     | 3.14         | 6.47  |

10 längste Läufe:

| run    | uc_id | exec_category  | duration_s |
| ------ | ----- | -------------- | ---------- |
| run_39 | uc-02 | INFRA_FAIL     | 30.06      |
| run_20 | uc-02 | INFRA_FAIL     | 30.05      |
| run_46 | uc-02 | INFRA_FAIL     | 30.02      |
| run_16 | uc-08 | ASSERTION_FAIL | 9.66       |
| run_07 | uc-08 | ASSERTION_FAIL | 9.59       |
| run_19 | uc-08 | ASSERTION_FAIL | 9.58       |
| run_39 | uc-07 | ASSERTION_FAIL | 9.54       |
| run_04 | uc-08 | ASSERTION_FAIL | 9.48       |
| run_13 | uc-08 | ASSERTION_FAIL | 9.38       |
| run_40 | uc-08 | ASSERTION_FAIL | 9.37       |

### Gruppierte `error_summary`

Quelle: `_phase1_results.csv`, Zeilen mit `exec_category != 'PASS'` (n = 138). Gruppierung regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` (erste passende Regel gewinnt).

| Gruppe                                | n   | % der Fehlschläge | % der Stufe | betroffene UC                     |
| ------------------------------------- | --- | ----------------- | ----------- | --------------------------------- |
| D_element_not_found                   | 62  | 44.9%             | 12.4%       | uc-02, uc-07, uc-09, uc-10        |
| J_konkreter_received_wert             | 57  | 41.3%             | 11.4%       | uc-02, uc-04, uc-06, uc-07, uc-08 |
| C_strict_mode_violation               | 8   | 5.8%              | 1.6%        | uc-10                             |
| M_timeout_beim_warten_auf_locator     | 3   | 2.2%              | 0.6%        | uc-02                             |
| E_js_laufzeitfehler                   | 2   | 1.4%              | 0.4%        | uc-07                             |
| K_locator_aufgeloest_aktion_scheitert | 2   | 1.4%              | 0.4%        | uc-02                             |
| L_predicate_timeout                   | 2   | 1.4%              | 0.4%        | uc-08                             |
| Y_sonstige                            | 2   | 1.4%              | 0.4%        | uc-02, uc-06                      |

Gruppe × `exec_category` (Kontrolle, ob die Gruppierung zur Klassifikation aus `run_phase1_eval.py` passt):

| grp                                   | ASSERTION_FAIL | INFRA_FAIL |
| ------------------------------------- | -------------- | ---------- |
| C_strict_mode_violation               | 0              | 8          |
| D_element_not_found                   | 0              | 62         |
| E_js_laufzeitfehler                   | 0              | 2          |
| J_konkreter_received_wert             | 57             | 0          |
| K_locator_aufgeloest_aktion_scheitert | 2              | 0          |
| L_predicate_timeout                   | 2              | 0          |
| M_timeout_beim_warten_auf_locator     | 0              | 3          |
| Y_sonstige                            | 0              | 2          |

Häufigste normalisierte Fehlerköpfe (erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):

| normalisierter Fehlerkopf                                                                    | n   | % der Fehlschläge | UC                         |
| -------------------------------------------------------------------------------------------- | --- | ----------------- | -------------------------- |
| `Error: expect(locator).toBeVisible() failed`                                                | 52  | 37.7%             | uc-02, uc-07, uc-09, uc-10 |
| `Error: expect(locator).toContainText(expected) failed`                                      | 38  | 27.5%             | uc-08                      |
| `Error: expect(locator).toBeChecked() failed`                                                | 16  | 11.6%             | uc-02, uc-10               |
| `Error: expect(received).toMatch(expected)`                                                  | 12  | 8.7%              | uc-07, uc-08               |
| `Error: expect(received).toBe(expected) // Object.is equality`                               | 5   | 3.6%              | uc-02, uc-04, uc-06        |
| `Test timeout of <n>ms exceeded. \|\| Error: locator.click: Test timeout of <n>ms exceeded.` | 3   | 2.2%              | uc-02                      |
| `Error: expect(locator).toBeAttached() failed`                                               | 2   | 1.4%              | uc-02                      |
| `Error: locator.selectOption: Error: Element is not a <select> element`                      | 2   | 1.4%              | uc-02                      |
| `ReferenceError: coordinate is not defined`                                                  | 2   | 1.4%              | uc-07                      |
| `Error: expect(received).not.toBe(expected) // Object.is equality`                           | 2   | 1.4%              | uc-08                      |
| `Error: expect(locator).toHaveCount(expected) failed`                                        | 1   | 0.7%              | uc-02                      |
| `Error: expect(received).toBeGreaterThan(expected)`                                          | 1   | 0.7%              | uc-08                      |

## 4 Phase 2

### Verteilung je Bewertungsdimension

Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = nicht-numerischer Zellwert. Median/Mittelwert nur über die numerischen Werte.

| Dimension       | 1   | 2   | 3   | 4   | n/a | n numerisch | Median | Mittelwert | SD (ddof=0) |
| --------------- | --- | --- | --- | --- | --- | ----------- | ------ | ---------- | ----------- |
| coverage        | 0   | 2   | 170 | 328 | 0   | 500         | 4.0    | 3.65       | 0.48        |
| selector        | 46  | 6   | 61  | 387 | 0   | 500         | 4.0    | 3.58       | 0.91        |
| map_interaction | 0   | 7   | 49  | 194 | 250 | 250         | 4.0    | 3.75       | 0.49        |
| assertion       | 0   | 0   | 104 | 396 | 0   | 500         | 4.0    | 3.79       | 0.41        |

### `map_interaction`: tatsächliche Anwendung

| uc_id | n   | numerisch bewertet | n/a | Mittelwert |
| ----- | --- | ------------------ | --- | ---------- |
| uc-01 | 50  | 0                  | 50  | –          |
| uc-02 | 50  | 0                  | 50  | –          |
| uc-03 | 50  | 0                  | 50  | –          |
| uc-04 | 50  | 50                 | 0   | 4.00       |
| uc-05 | 50  | 0                  | 50  | –          |
| uc-06 | 50  | 50                 | 0   | 3.94       |
| uc-07 | 50  | 50                 | 0   | 3.90       |
| uc-08 | 50  | 50                 | 0   | 2.90       |
| uc-09 | 50  | 0                  | 50  | –          |
| uc-10 | 50  | 50                 | 0   | 4.00       |

- numerisch bewertet in: uc-04, uc-06, uc-07, uc-08, uc-10
- durchgehend `n/a` in: uc-01, uc-02, uc-03, uc-05, uc-09
- uneinheitlich (teils Score, teils `n/a`): –

### Scores je Use Case und Dimension

Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über die 50 Läufe, nur numerische Werte.

| uc_id | n   | coverage Ø | coverage Md | selector Ø | selector Md | map_interaction Ø | map_interaction Md | assertion Ø | assertion Md |
| ----- | --- | ---------- | ----------- | ---------- | ----------- | ----------------- | ------------------ | ----------- | ------------ |
| uc-01 | 50  | 3.66       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-02 | 50  | 3.00       | 3.0         | 1.12       | 1.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-03 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-04 | 50  | 4.00       | 4.0         | 3.98       | 4.0         | 4.00              | 4.0                | 3.98        | 4.0          |
| uc-05 | 50  | 3.98       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-06 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 3.94              | 4.0                | 3.00        | 3.0          |
| uc-07 | 50  | 3.92       | 4.0         | 4.00       | 4.0         | 3.90              | 4.0                | 3.94        | 4.0          |
| uc-08 | 50  | 3.00       | 3.0         | 3.00       | 3.0         | 2.90              | 3.0                | 3.00        | 3.0          |
| uc-09 | 50  | 3.00       | 3.0         | 3.88       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-10 | 50  | 3.96       | 4.0         | 3.80       | 4.0         | 4.00              | 4.0                | 4.00        | 4.0          |

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
| nicht_zustandstragend      | Zustandstragendes Element (Regel 13)         | 449            | 399                 | 50            | 79.8%                       |
| helper_erwaehnt            | Map-Model-Helfer erwähnt                     | 398            | 397                 | 1             | 79.4%                       |
| canvas_statt_modell        | Canvas/map-container statt Kartenmodell      | 204            | 204                 | 0             | 40.8%                       |
| force_klick                | force:true beim Klick                        | 141            | 141                 | 0             | 28.2%                       |
| verdeckt_ueberdeckt        | Element verdeckt / Pointer-Events abgefangen | 97             | 97                  | 0             | 19.4%                       |
| importpfad                 | Importpfad der Helferdatei                   | 86             | 86                  | 0             | 17.2%                       |
| assertion_falsches_element | Assertion prüft falsches Element             | 50             | 50                  | 0             | 10.0%                       |
| selektor_erfunden          | Selektor erfunden / nicht real               | 302            | 49                  | 253           | 9.8%                        |
| map_model_zugriff          | Zugriff auf das Kartenmodell                 | 49             | 49                  | 0             | 9.8%                        |
| strict_mode                | mehrdeutiger Selektor                        | 54             | 8                   | 46            | 1.6%                        |
| selektor_existiert_nicht   | Element existiert nicht                      | 1              | 0                   | 1             | 0.0%                        |
| wartebedingung             | Wartebedingung                               | 0              | 0                   | 0             | 0.0%                        |
| vacuous_tautologisch       | vacuous / tautologische Assertion            | 0              | 0                   | 0             | 0.0%                        |

Je ein Beispielsatz (nicht negierter Treffer):

| Muster                     | Datei                                                                                                                      | Beispielsatz                                                                                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selektor_erfunden          | `tests/stage_3_generated_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`                | `Nur der Container 'layer-switcher' stimmt - nach Regel 4 damit ueberwiegend erfundene Selektoren.`                                                                                                          |
| importpfad                 | `tests/stage_3_generated_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                               | `Benutzt die realen Test-IDs 'zoom-in-button' und 'zoom-out-button' (teils zusaetzlich 'map-container') und liest den Zoomstand ueber den bereitgestellten Helper getMapZoomLevel aus dem korrekten Impor …` |
| map_model_zugriff          | `tests/stage_3_generated_ui_map/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`                 | `Die Zielkoordinate wird ueber den realen Zugriffspfad globalThis.__openPioneerMap.olMap.getPixelFromCoordinate in eine Pixelposition umgerechnet, auf deren Verfuegbarkeit gewartet wird, und der Klick  …` |
| helper_erwaehnt            | `tests/stage_3_generated_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`              | `Ein etwaiger getActiveBaseLayerTitle-Poll dient nur als Ladevorbedingung.`                                                                                                                                  |
| assertion_falsches_element | `tests/stage_3_generated_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                      | `im 'measurement'-Widget - reales, aber falsches Element (Regel 24).`                                                                                                                                        |
| canvas_statt_modell        | `tests/stage_3_generated_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`              | `'map-container' als Vorbedingung.`                                                                                                                                                                          |
| nicht_zustandstragend      | `tests/stage_3_generated_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`              | `Nach dem ersten Klick wird toBeHidden()/not.toBeVisible() auf dem Panel geprueft, nach dem zweiten toBeVisible() - genau die beiden UC-Erwartungen, jeweils zustandstragend und unbedingt.`                 |
| force_klick                | `tests/stage_3_generated_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`   | `layerSwitcher.getByRole('checkbox', {name:'UV-Index', exact:true}) ist der korrekte Locator: 'exact' schliesst die zuvor gerenderte Zeile 'UV-Index Stations' aus, und {force:true} umgeht die visuell v …` |
| verdeckt_ueberdeckt        | `tests/stage_3_generated_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`   | `layerSwitcher.getByRole('checkbox', {name:'UV-Index', exact:true}) ist der korrekte Locator: 'exact' schliesst die zuvor gerenderte Zeile 'UV-Index Stations' aus, und {force:true} umgeht die visuell v …` |
| strict_mode                | `tests/stage_3_generated_ui_map/run_04/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts` | `Reale, aber mehrdeutige Locator: kleinere Abweichung (uc-04-Praezedenz).`                                                                                                                                   |

### Auffälligkeiten in der Bewertung selbst

**Identische Begründungen** (exakter Textvergleich je Teiltext, Quelle `_phase2_judge.json` → `reasoning.<dim>`):

| Teiltext        | Dateien | verschiedene Texte | Texte, die mehrfach vorkommen | Dateien mit einem mehrfach vorkommenden Text | häufigster Text – Anzahl |
| --------------- | ------- | ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| coverage        | 500     | 15                 | 14                            | 499                                          | 50                       |
| selector        | 500     | 22                 | 16                            | 494                                          | 50                       |
| map_interaction | 500     | 16                 | 12                            | 496                                          | 50                       |
| assertion       | 500     | 14                 | 13                            | 499                                          | 50                       |

Die je Teiltext häufigsten identischen Texte (mit UC):

| Teiltext        | uc_id | n Dateien | Text                                                                                                                                   |
| --------------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | uc-03 | 50        | `Der Ausgangszoom wird vor dem ersten Klick erfasst, danach werden beide UC-Schritte (Zoom-in-Klick, Zoom-out-Klick) unbedingt ausg …` |
| coverage        | uc-04 | 50        | `Der Sichtbarkeits-Toggle des UV-Index-Overlays wird unbedingt geklickt und auf das Laden der Kacheln wird ueber einen gepollten Ma …` |
| coverage        | uc-06 | 50        | `Der Klick auf die Karte wird unbedingt ausgefuehrt und auf das Laden des Forecasts wird ueber wartende Assertions gewartet. Alle d …` |
| selector        | uc-03 | 50        | `Benutzt die realen Test-IDs 'zoom-in-button' und 'zoom-out-button' (teils zusaetzlich 'map-container') und liest den Zoomstand ueb …` |
| selector        | uc-06 | 50        | `Benutzt ausschliesslich reale Test-IDs - 'map-container' als Klickziel, 'info-panel', 'weather-forecast-section' und 'weather-fore …` |
| selector        | uc-07 | 50        | `Benutzt ausschliesslich reale Test-IDs: 'map-container' als Klickziel, 'info-panel', 'uvi-station-section' und 'eucos-station-sect …` |
| map_interaction | uc-01 | 50        | `uc-01 ist nicht in MAP_UCS gelistet und erfordert keine kartenspezifische Interaktion; der Panel-Zustand ist vollstaendig im DOM b …` |
| map_interaction | uc-02 | 50        | `uc-02 ist nicht in MAP_UCS gelistet; der Basiskartenwechsel erfordert keine kartenspezifische Interaktion, auch wenn der Referenzt …` |
| map_interaction | uc-03 | 50        | `uc-03 ist nicht in MAP_UCS gelistet; die Zoomstufe wird ueber die Toolbar-Buttons geaendert, eine kartenspezifische Interaktion is …` |
| assertion       | uc-02 | 50        | `Der Ausgangszustand wird per expect.poll(getActiveBaseLayerTitle).toBe('Carto Light') und der Endzustand per Poll auf 'OpenStreetM …` |
| assertion       | uc-05 | 50        | `Beide UC-Erwartungen werden zustandstragend und unbedingt geprueft: toBeChecked() am Toggle und toBeVisible() auf 'precipitation-l …` |
| assertion       | uc-06 | 50        | `Zustandstragend sind der wartende Highlight-Poll auf dem Map-Model und der Zaehler auf 'weather-forecast-entry' mit toHaveCount(24 …` |

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
| uc-01  | 50      | 50         | 50         | 50            | 3.66             | 3.66           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-02  | 50      | 50         | 0          | 0             | 3.00             | 3.00           | 1.12             | 1.12           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-03  | 50      | 50         | 50         | 50            | 4.00             | 4.00           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-04  | 50      | 50         | 49         | 49            | 4.00             | 4.00           | 3.98             | 3.98           | 4.00                    | 4.00                  | 3.98              | 3.98            | 0             | 0           |
| uc-05  | 50      | 50         | 50         | 50            | 3.98             | 3.98           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-06  | 50      | 50         | 47         | 47            | 4.00             | 4.00           | 4.00             | 4.00           | 3.94                    | 3.94                  | 3.00              | 3.00            | 0             | 0           |
| uc-07  | 50      | 50         | 28         | 28            | 3.92             | 3.92           | 4.00             | 4.00           | 3.90                    | 3.90                  | 3.94              | 3.94            | 0             | 0           |
| uc-08  | 50      | 50         | 0          | 0             | 3.00             | 3.00           | 3.00             | 3.00           | 2.90                    | 2.90                  | 3.00              | 3.00            | 0             | 0           |
| uc-09  | 50      | 50         | 47         | 47            | 3.00             | 3.00           | 3.88             | 3.88           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-10  | 50      | 50         | 41         | 41            | 3.96             | 3.96           | 3.80             | 3.80           | 4.00                    | 4.00                  | 4.00              | 4.00            | 0             | 0           |
| GESAMT | 500     | 500        | 362        | 362           | 3.65             | 3.65           | 3.58             | 3.58           | 3.75                    | 3.75                  | 3.79              | 3.79            | 0             | 0           |

- **keine Abweichung** zwischen eigener Rechnung und `plot_stage.write_aggregates()`.
