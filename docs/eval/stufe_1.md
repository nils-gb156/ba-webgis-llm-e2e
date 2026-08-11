# Stufe 1 – Baseline (kein UI-Kontext)

Datenverzeichnis: `src/app/llm/tests/stage_1_baseline/`  
Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/stage_reports.py`.

## 1 Bestandsaufnahme

| Datei                    | Format      | kB      | Inhalt                                                                                                                                                                 |
| ------------------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv     | CSV         | 296.20  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, duration_s, error_summary, needs_review                                                              |
| \_phase2_judge.csv       | CSV         | 101.50  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass                 |
| \_phase2_judge.json      | JSON        | 850.20  | Liste, 500 Objekte; Schlüssel: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass, reasoning |
| \_playwright_report.json | JSON        | 2611.10 | Objekt; Schlüssel: config, suites, errors, stats                                                                                                                       |
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

| exec_category    | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 102 | 20.4%                  |
| ASSERTION_FAIL   | 138 | 27.6%                  |
| INFRA_FAIL       | 259 | 51.8%                  |
| GENERATION_ERROR | 1   | 0.2%                   |
| GESAMT           | 500 | 100.0%                 |

### PASS-Rate je Use Case

Quelle: `_phase1_results.csv`; je UC `sum(exec_category=='PASS') / count()`, n = 50 Läufe.

| uc_id | n   | PASS | PASS-Rate | ASSERTION_FAIL | INFRA_FAIL | GENERATION_ERROR |
| ----- | --- | ---- | --------- | -------------- | ---------- | ---------------- |
| uc-01 | 50  | 47   | 94.0%     | 0              | 3          | 0                |
| uc-02 | 50  | 0    | 0.0%      | 6              | 44         | 0                |
| uc-03 | 50  | 0    | 0.0%      | 1              | 48         | 1                |
| uc-04 | 50  | 39   | 78.0%     | 0              | 11         | 0                |
| uc-05 | 50  | 2    | 4.0%      | 32             | 16         | 0                |
| uc-06 | 50  | 5    | 10.0%     | 12             | 33         | 0                |
| uc-07 | 50  | 1    | 2.0%      | 21             | 28         | 0                |
| uc-08 | 50  | 3    | 6.0%      | 41             | 6          | 0                |
| uc-09 | 50  | 4    | 8.0%      | 3              | 43         | 0                |
| uc-10 | 50  | 1    | 2.0%      | 22             | 27         | 0                |

### Streuung der PASS-Rate über die 50 Läufe

Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, dann Kennzahlen über die 50 Läufe. Standardabweichung: Populations-SD (`ddof=0`).

| Kennzahl                    | Wert                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Min PASS-Rate (Lauf)        | 10.0% (run_04, run_05, run_07, run_08, run_26, run_31, run_39, run_46, run_47, run_48) |
| Max PASS-Rate (Lauf)        | 40.0% (run_32)                                                                         |
| Mittelwert                  | 20.4%                                                                                  |
| Median                      | 20.0%                                                                                  |
| Standardabweichung (ddof=0) | 0.0692                                                                                 |

- Use Cases, die zwischen PASS und Fehlschlag springen (0 < PASS < 50): **8** – uc-01, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10
- immer PASS (50/50): –
- nie PASS (0/50): uc-02, uc-03

### `duration_s`

Quelle: `_phase1_results.csv`, Spalte `duration_s` (Sekunden, Playwright-Ergebnis). Ausreißer: Tukey-Zaun `> Q3 + 1.5·IQR`.

| Kennzahl                 | Wert    |
| ------------------------ | ------- |
| n (nicht leer)           | 500     |
| Median                   | 7.01 s  |
| Mittelwert               | 8.69 s  |
| Min                      | 0.00 s  |
| Q1                       | 3.85 s  |
| Q3                       | 7.49 s  |
| Max                      | 67.89 s |
| Ausreißerzaun Q3+1.5·IQR | 12.94 s |
| Anzahl über dem Zaun     | 63      |

Median je `exec_category`:

| exec_category    | n   | Median s | Mittelwert s | Max s |
| ---------------- | --- | -------- | ------------ | ----- |
| ASSERTION_FAIL   | 138 | 7.50     | 15.60        | 67.89 |
| GENERATION_ERROR | 1   | 0.00     | 0.00         | 0.00  |
| INFRA_FAIL       | 259 | 7.08     | 7.19         | 30.04 |
| PASS             | 102 | 2.62     | 3.20         | 13.33 |

10 längste Läufe:

| run    | uc_id | exec_category  | duration_s |
| ------ | ----- | -------------- | ---------- |
| run_17 | uc-07 | ASSERTION_FAIL | 67.89      |
| run_06 | uc-06 | ASSERTION_FAIL | 30.04      |
| run_06 | uc-07 | ASSERTION_FAIL | 30.04      |
| run_06 | uc-08 | ASSERTION_FAIL | 30.04      |
| run_14 | uc-08 | ASSERTION_FAIL | 30.04      |
| run_15 | uc-08 | ASSERTION_FAIL | 30.04      |
| run_16 | uc-08 | ASSERTION_FAIL | 30.04      |
| run_19 | uc-07 | ASSERTION_FAIL | 30.04      |
| run_19 | uc-08 | ASSERTION_FAIL | 30.04      |
| run_23 | uc-08 | ASSERTION_FAIL | 30.04      |

### Gruppierte `error_summary`

Quelle: `_phase1_results.csv`, Zeilen mit `exec_category != 'PASS'` (n = 398). Gruppierung regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` (erste passende Regel gewinnt).

| Gruppe                                | n   | % der Fehlschläge | % der Stufe | betroffene UC                                                        |
| ------------------------------------- | --- | ----------------- | ----------- | -------------------------------------------------------------------- |
| D_element_not_found                   | 226 | 56.8%             | 45.2%       | uc-01, uc-02, uc-03, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| J_konkreter_received_wert             | 70  | 17.6%             | 14.0%       | uc-02, uc-03, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10               |
| K_locator_aufgeloest_aktion_scheitert | 65  | 16.3%             | 13.0%       | uc-06, uc-07, uc-08, uc-10                                           |
| Y_sonstige                            | 16  | 4.0%              | 3.2%        | uc-06, uc-07, uc-09, uc-10                                           |
| C_strict_mode_violation               | 14  | 3.5%              | 2.8%        | uc-04, uc-05, uc-08, uc-10                                           |
| N_generischer_test_timeout            | 5   | 1.3%              | 1.0%        | uc-06, uc-07                                                         |
| A_generierung_abgeschnitten           | 1   | 0.3%              | 0.2%        | uc-03                                                                |
| E_js_laufzeitfehler                   | 1   | 0.3%              | 0.2%        | uc-02                                                                |

Gruppe × `exec_category` (Kontrolle, ob die Gruppierung zur Klassifikation aus `run_phase1_eval.py` passt):

| grp                                   | ASSERTION_FAIL | GENERATION_ERROR | INFRA_FAIL |
| ------------------------------------- | -------------- | ---------------- | ---------- |
| A_generierung_abgeschnitten           | 0              | 1                | 0          |
| C_strict_mode_violation               | 0              | 0                | 14         |
| D_element_not_found                   | 0              | 0                | 226        |
| E_js_laufzeitfehler                   | 0              | 0                | 1          |
| J_konkreter_received_wert             | 69             | 0                | 1          |
| K_locator_aufgeloest_aktion_scheitert | 64             | 0                | 1          |
| N_generischer_test_timeout            | 0              | 0                | 5          |
| Y_sonstige                            | 5              | 0                | 11         |

Häufigste normalisierte Fehlerköpfe (erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):

| normalisierter Fehlerkopf                                                                                          | n   | % der Fehlschläge | UC                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | --- | ----------------- | -------------------------------------------------------------------- |
| `Error: expect(locator).toBeVisible() failed`                                                                      | 230 | 57.8%             | uc-01, uc-02, uc-03, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| `Test timeout of <n>ms exceeded. \|\| Error: locator.click: Test timeout of <n>ms exceeded.`                       | 52  | 13.1%             | uc-06, uc-07, uc-08                                                  |
| `Error: expect(locator).toHaveCount(expected) failed`                                                              | 20  | 5.0%              | uc-02, uc-05                                                         |
| `Error: expect(received).toBeGreaterThan(expected)`                                                                | 17  | 4.3%              | uc-05, uc-07, uc-08, uc-09, uc-10                                    |
| `Error: expect(received).toBe(expected) // Object.is equality`                                                     | 17  | 4.3%              | uc-02, uc-03, uc-05, uc-06, uc-07, uc-10                             |
| `Error: locator.fill: Error: Element is not an <input>, <textarea> or [contenteditable] element`                   | 13  | 3.3%              | uc-10                                                                |
| `Error: response.json: Protocol error (Network.getResponseBody): No data found for resource with given identifier` | 5   | 1.3%              | uc-06, uc-10                                                         |
| `Error: expect(received).toBeTruthy()`                                                                             | 4   | 1.0%              | uc-02, uc-07, uc-09                                                  |
| `Error: expect(received).not.toBeNull()`                                                                           | 4   | 1.0%              | uc-07                                                                |
| `Test timeout of <n>ms exceeded. \|\| Error: page.waitForResponse: Test timeout of <n>ms exceeded.`                | 4   | 1.0%              | uc-06, uc-07                                                         |
| `Error: expect(locator).toBeAttached() failed`                                                                     | 3   | 0.8%              | uc-02                                                                |
| `Error: expect(locator).not.toBeChecked() failed`                                                                  | 3   | 0.8%              | uc-04                                                                |

## 4 Phase 2

### Verteilung je Bewertungsdimension

Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = nicht-numerischer Zellwert. Median/Mittelwert nur über die numerischen Werte.

| Dimension       | 1   | 2   | 3   | 4   | n/a | n numerisch | Median | Mittelwert | SD (ddof=0) |
| --------------- | --- | --- | --- | --- | --- | ----------- | ------ | ---------- | ----------- |
| coverage        | 0   | 0   | 221 | 278 | 1   | 499         | 4.0    | 3.56       | 0.50        |
| selector        | 44  | 270 | 53  | 132 | 1   | 499         | 2.0    | 2.55       | 0.98        |
| map_interaction | 138 | 19  | 93  | 0   | 250 | 250         | 1.0    | 1.82       | 0.94        |
| assertion       | 1   | 24  | 94  | 380 | 1   | 499         | 4.0    | 3.71       | 0.56        |

### `map_interaction`: tatsächliche Anwendung

| uc_id | n   | numerisch bewertet | n/a | Mittelwert |
| ----- | --- | ------------------ | --- | ---------- |
| uc-01 | 50  | 0                  | 50  | –          |
| uc-02 | 50  | 0                  | 50  | –          |
| uc-03 | 50  | 0                  | 50  | –          |
| uc-04 | 50  | 50                 | 0   | 1.00       |
| uc-05 | 50  | 0                  | 50  | –          |
| uc-06 | 50  | 50                 | 0   | 2.96       |
| uc-07 | 50  | 50                 | 0   | 1.24       |
| uc-08 | 50  | 50                 | 0   | 2.90       |
| uc-09 | 50  | 0                  | 50  | –          |
| uc-10 | 50  | 50                 | 0   | 1.00       |

- numerisch bewertet in: uc-04, uc-06, uc-07, uc-08, uc-10
- durchgehend `n/a` in: uc-01, uc-02, uc-03, uc-05, uc-09
- uneinheitlich (teils Score, teils `n/a`): –

### Scores je Use Case und Dimension

Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über die 50 Läufe, nur numerische Werte.

| uc_id | n   | coverage Ø | coverage Md | selector Ø | selector Md | map_interaction Ø | map_interaction Md | assertion Ø | assertion Md |
| ----- | --- | ---------- | ----------- | ---------- | ----------- | ----------------- | ------------------ | ----------- | ------------ |
| uc-01 | 50  | 3.76       | 4.0         | 3.88       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-02 | 50  | 3.00       | 3.0         | 1.20       | 1.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-03 | 50  | 3.78       | 4.0         | 2.02       | 2.0         | n/a               | n/a                | 3.67        | 4.0          |
| uc-04 | 50  | 4.00       | 4.0         | 3.68       | 4.0         | 1.00              | 1.0                | 3.96        | 4.0          |
| uc-05 | 50  | 3.98       | 4.0         | 2.04       | 2.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-06 | 50  | 3.38       | 3.0         | 2.00       | 2.0         | 2.96              | 3.0                | 2.60        | 3.0          |
| uc-07 | 50  | 4.00       | 4.0         | 3.86       | 4.0         | 1.24              | 1.0                | 3.96        | 4.0          |
| uc-08 | 50  | 3.00       | 3.0         | 2.78       | 3.0         | 2.90              | 3.0                | 3.00        | 3.0          |
| uc-09 | 50  | 3.00       | 3.0         | 2.00       | 2.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-10 | 50  | 3.68       | 4.0         | 2.00       | 2.0         | 1.00              | 1.0                | 3.90        | 4.0          |

### `vacuous_pass`

Definition laut Aufgabenstellung: Phase 1 = `PASS` **und** `assertion_score ≤ 2`. Quelle: `_phase1_results.csv` (`exec_category`) ⋈ `_phase2_judge.csv` (`assertion_score`, `vacuous_pass`) über `stage, run, uc_id, file`.

| Kennzahl                                          | Wert |
| ------------------------------------------------- | ---- |
| `vacuous_pass == true` (Judge)                    | 1    |
| Anteil an der Stufe                               | 0.2% |
| Anteil an den PASS-Fällen                         | 1.0% |
| eigene Nachrechnung: PASS und assertion_score ≤ 2 | 1    |
| markiert, aber Definition nicht erfüllt           | 0    |
| Definition erfüllt, aber nicht markiert           | 0    |

- keine Abweichung zwischen Judge-Flag und Definition.

### Muster in den Begründungstexten

Quelle: `_phase2_judge.json`, Feld `reasoning` (alle vier Teiltexte zusammengefasst). Regeltabelle: `eval_extract/stage_reports.py:REASON_PATTERNS`. Ein Treffer gilt als _negiert_, wenn im selben Satz ein Negationswort steht (`kein`, `nicht`, `ohne`, `statt`, `weder`).

| Muster                     | Bedeutung                                    | Dateien gesamt | davon nicht negiert | davon negiert | % der Stufe (nicht negiert) |
| -------------------------- | -------------------------------------------- | -------------- | ------------------- | ------------- | --------------------------- |
| nicht_zustandstragend      | Zustandstragendes Element (Regel 13)         | 346            | 294                 | 52            | 58.8%                       |
| selektor_erfunden          | Selektor erfunden / nicht real               | 401            | 268                 | 133           | 53.6%                       |
| canvas_statt_modell        | Canvas/map-container statt Kartenmodell      | 213            | 189                 | 24            | 37.8%                       |
| force_klick                | force:true beim Klick                        | 86             | 86                  | 0             | 17.2%                       |
| assertion_falsches_element | Assertion prüft falsches Element             | 39             | 39                  | 0             | 7.8%                        |
| verdeckt_ueberdeckt        | Element verdeckt / Pointer-Events abgefangen | 38             | 38                  | 0             | 7.6%                        |
| map_model_zugriff          | Zugriff auf das Kartenmodell                 | 113            | 12                  | 101           | 2.4%                        |
| strict_mode                | mehrdeutiger Selektor                        | 51             | 8                   | 43            | 1.6%                        |
| selektor_existiert_nicht   | Element existiert nicht                      | 3              | 0                   | 3             | 0.0%                        |
| helper_erwaehnt            | Map-Model-Helfer erwähnt                     | 0              | 0                   | 0             | 0.0%                        |
| importpfad                 | Importpfad der Helferdatei                   | 0              | 0                   | 0             | 0.0%                        |
| wartebedingung             | Wartebedingung                               | 5              | 0                   | 5             | 0.0%                        |
| vacuous_tautologisch       | vacuous / tautologische Assertion            | 51             | 0                   | 51            | 0.0%                        |

Je ein Beispielsatz (nicht negierter Treffer):

| Muster                     | Datei                                                                                                            | Beispielsatz                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selektor_erfunden          | `tests/stage_1_baseline/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             | `Der tragende Trigger ist erfunden: 'Zoom in'/'Zoom out' mit exact:true bzw.`                                                                                                                                |
| map_model_zugriff          | `tests/stage_1_baseline/run_06/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               | `grep-verifiziert kommt __openPioneerMap in keinem uc-07-Lauf vor) bzw.`                                                                                                                                     |
| assertion_falsches_element | `tests/stage_1_baseline/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                    | `Reales, aber falsches Element -> Score 3 nach Regel 24.`                                                                                                                                                    |
| canvas_statt_modell        | `tests/stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `'.ol-viewport'/'canvas'/'.ol-layers' und die benutzten URL-Praedikate treffen reale Elemente bzw.`                                                                                                          |
| nicht_zustandstragend      | `tests/stage_1_baseline/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`            | `die Ueberschrift rendert nur bei aktivem TOC und ist damit zustandstragend (panel-internes Element, Regel 13).`                                                                                             |
| force_klick                | `tests/stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `getByRole('checkbox', {name:'UV-Index', exact:true}) trifft genau die UV-Index-Zeile der TOC (exact schliesst 'UV-Index Stations' aus) und wird mit {force:true} geklickt, wie es die visuell verdeckte  …` |
| verdeckt_ueberdeckt        | `tests/stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `getByRole('checkbox', {name:'UV-Index', exact:true}) trifft genau die UV-Index-Zeile der TOC (exact schliesst 'UV-Index Stations' aus) und wird mit {force:true} geklickt, wie es die visuell verdeckte  …` |
| strict_mode                | `tests/stage_1_baseline/run_05/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `Reale Elemente, aber Mehrdeutigkeit = kleinere Abweichung nach der uc-04-Staffel.`                                                                                                                          |

### Auffälligkeiten in der Bewertung selbst

**Identische Begründungen** (exakter Textvergleich je Teiltext, Quelle `_phase2_judge.json` → `reasoning.<dim>`):

| Teiltext        | Dateien | verschiedene Texte | Texte, die mehrfach vorkommen | Dateien mit einem mehrfach vorkommenden Text | häufigster Text – Anzahl |
| --------------- | ------- | ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| coverage        | 500     | 29                 | 15                            | 486                                          | 50                       |
| selector        | 500     | 37                 | 19                            | 482                                          | 50                       |
| map_interaction | 500     | 14                 | 13                            | 499                                          | 50                       |
| assertion       | 500     | 36                 | 17                            | 481                                          | 50                       |

Die je Teiltext häufigsten identischen Texte (mit UC):

| Teiltext        | uc_id | n Dateien | Text                                                                                                                                   |
| --------------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | uc-02 | 50        | `Der UC-Schritt 'Basemap-Selektor oeffnen' steht durchgaengig in einem Guard (isVisible/count/aria-expanded) ohne else-Zweig und ka …` |
| coverage        | uc-04 | 50        | `Der Sichtbarkeits-Toggle der UV-Index-Ebene wird unbedingt geklickt und auf das Laden der Tiles gewartet; beide erwarteten Ergebni …` |
| coverage        | uc-07 | 50        | `Der Kartenklick wird unbedingt ausgefuehrt und beide erwarteten Ergebnisse - die 'UV-Index Station'- und die 'EUCOS Ground Station …` |
| selector        | uc-06 | 50        | `Der Klick trifft ein reales Kartenelement (canvas.first() bzw. map-container/.ol-viewport), fuer Info-Panel und Forecast werden ab …` |
| selector        | uc-09 | 50        | `Trigger und Formularfelder sind korrekt (ToolButton 'Print Map', getByLabel/getByRole textbox 'Title', getByRole('combobox', {name …` |
| selector        | uc-10 | 50        | `Reale Locator sind vorhanden und werden benutzt (getByRole('checkbox', {name:/Temperature\|Precipitation/}) fuer die TOC-Zeilen, g …` |
| map_interaction | uc-01 | 50        | `uc-01 ist nicht in MAP_UCS gelistet, daher n/a (Regel 1).`                                                                            |
| map_interaction | uc-02 | 50        | `uc-02 ist nicht in MAP_UCS gelistet, daher n/a (Regel 1).`                                                                            |
| map_interaction | uc-04 | 50        | `uc-04 ist ein MAP_UC, aber kein Lauf fasst den Kartenzustand an: grep-verifiziert gibt es weder page.evaluate noch __openPioneerMa …` |
| assertion       | uc-02 | 50        | `Beide erwarteten Ergebnisse werden unbedingt und zustandstragend geprueft: OpenStreetMap ausgewaehlt (toBeChecked/aria-checked/Sel …` |
| assertion       | uc-05 | 50        | `Ergebnis A wird mit toBeChecked geprueft, Ergebnis B durch eine unbedingte bzw. in allen Zweigen vorhandene, wartende Pruefung auf …` |
| assertion       | uc-08 | 50        | `Ergebnis A ist zustandstragend geprueft - das Messpanel bzw. seine Ueberschrift existiert nur bei aktivem Werkzeug. Ergebnis B (La …` |

**Vollständigkeit:**

| Prüfung                                                          | Wert                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Datensätze in `_phase2_judge.json`                               | 500                                                                              |
| Datensätze ohne `reasoning`-Objekt                               | 0                                                                                |
| fehlende Teiltexte (coverage/selector/map_interaction/assertion) | keine                                                                            |
| leere Score-Zellen in der CSV                                    | coverage_score=1, selector_score=1, map_interaction_score=250, assertion_score=1 |
| Score-Werte außerhalb 1–4 oder 'n/a'                             | keine                                                                            |
| CSV/JSON identisch besetzt (gleiche Anzahl Zeilen)               | ja                                                                               |

**Widersprüche zwischen Score und Begründung** (regelbasiert, eigene Prüfregeln):

| Prüfregel                                                                                 | n   | % der Stufe | Beispiel                                                                                              |
| ----------------------------------------------------------------------------------------- | --- | ----------- | ----------------------------------------------------------------------------------------------------- |
| selector ≥ 3, aber Begründung nennt einen erfundenen Selektor (nicht negiert)             | 1   | 0.2%        | `tests/stage_1_baseline/run_08/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts` |
| assertion ≥ 3, aber Begründung nennt eine vacuous/tautologische Assertion (nicht negiert) | 0   | 0.0%        | `–`                                                                                                   |
| coverage = 4, aber Begründung nennt eine Lücke                                            | 0   | 0.0%        | `–`                                                                                                   |

- Zeilen aus Phase 1 ohne jeden Judge-Score nach dem Join: **1** – run_44/uc-03

## 5 Abgleich mit der Referenzaggregation

`plots/aggregates.csv` existiert im Repository nicht (kein `plots/`-Verzeichnis in keiner Stufe, keine Datei `aggregates.csv` im Arbeitsbaum). Als Ersatz wird die Referenzfunktion `plot_stage.write_aggregates()` auf denselben Rohdaten ausgeführt und Zelle für Zelle mit der eigenen Rechnung verglichen.

| uc_id  | n eigen | n Referenz | PASS eigen | PASS Referenz | coverage Ø eigen | coverage Ø Ref | selector Ø eigen | selector Ø Ref | map_interaction Ø eigen | map_interaction Ø Ref | assertion Ø eigen | assertion Ø Ref | vacuous eigen | vacuous Ref |
| ------ | ------- | ---------- | ---------- | ------------- | ---------------- | -------------- | ---------------- | -------------- | ----------------------- | --------------------- | ----------------- | --------------- | ------------- | ----------- |
| uc-01  | 50      | 50         | 47         | 47            | 3.76             | 3.76           | 3.88             | 3.88           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-02  | 50      | 50         | 0          | 0             | 3.00             | 3.00           | 1.20             | 1.20           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-03  | 50      | 50         | 0          | 0             | 3.78             | 3.78           | 2.02             | 2.02           | –                       | –                     | 3.67              | 3.67            | 0             | 0           |
| uc-04  | 50      | 50         | 39         | 39            | 4.00             | 4.00           | 3.68             | 3.68           | 1.00                    | 1.00                  | 3.96              | 3.96            | 0             | 0           |
| uc-05  | 50      | 50         | 2          | 2             | 3.98             | 3.98           | 2.04             | 2.04           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-06  | 50      | 50         | 5          | 5             | 3.38             | 3.38           | 2.00             | 2.00           | 2.96                    | 2.96                  | 2.60              | 2.60            | 0             | 0           |
| uc-07  | 50      | 50         | 1          | 1             | 4.00             | 4.00           | 3.86             | 3.86           | 1.24                    | 1.24                  | 3.96              | 3.96            | 1             | 1           |
| uc-08  | 50      | 50         | 3          | 3             | 3.00             | 3.00           | 2.78             | 2.78           | 2.90                    | 2.90                  | 3.00              | 3.00            | 0             | 0           |
| uc-09  | 50      | 50         | 4          | 4             | 3.00             | 3.00           | 2.00             | 2.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-10  | 50      | 50         | 1          | 1             | 3.68             | 3.68           | 2.00             | 2.00           | 1.00                    | 1.00                  | 3.90              | 3.90            | 0             | 0           |
| GESAMT | 500     | 500        | 102        | 102           | 3.56             | 3.56           | 2.55             | 2.55           | 1.82                    | 1.82                  | 3.71              | 3.71            | 1             | 1           |

- **keine Abweichung** zwischen eigener Rechnung und `plot_stage.write_aggregates()`.
