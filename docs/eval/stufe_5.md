# Stufe 5 - Auswertung

Stufenverzeichnis: `src/app/llm/tests/stage_5_self_improvement_loop/`  
Bezeichnung: Stufe 5 - Self-Improvement-Loop (Kontext von Stufe 2)  
Erzeugt von: `src/app/llm/eval_extract/report_stages.py` (Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).

## 1 Bestandsaufnahme

### Dateien im Stufenverzeichnis

| Datei                            | Format       | kB   | Datensätze/Zeilen | Spalten bzw. Schlüssel                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------ | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv             | CSV          | 185  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `duration_s`, `error_summary`, `needs_review`, `passed`, `iterations_used`                                                                                                                                                                                                                                                                                                                            |
| \_phase2_judge.csv               | CSV          | 119  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `coverage_score`, `selector_score`, `map_interaction_score`, `assertion_score`, `vacuous_pass`                                                                                                                                                                                                                                                                                                        |
| \_phase2_judge.json              | JSON (Liste) | 626  | 500               | `assertion_score`, `coverage_score`, `exec_category`, `file`, `map_interaction_score`, `reasoning`, `run`, `selector_score`, `stage`, `uc_id`, `vacuous_pass`                                                                                                                                                                                                                                                                                           |
| \_stage_5_all_runs.jsonl         | JSONL        | 1188 | 500               | `complexity`, `final_spec`, `iterations`, `iterations_used`, `passed`, `run`, `uc_id`                                                                                                                                                                                                                                                                                                                                                                   |
| \_stage_5_initial_context.txt    | Text         | 8    | 234               | (Kontextdatei, kein Datensatz)                                                                                                                                                                                                                                                                                                                                                                                                                          |
| \_stage_5_initial_screenshot.png | PNG          | 1452 | -                 | (Screenshot)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| \_stage_5_run_summary.json       | JSON (Liste) | 1746 | 500               | `complexity`, `final_spec`, `history`, `iterations_used`, `max_iterations`, `passed`, `run`, `screenshots_enabled`, `title`, `use_case_id`                                                                                                                                                                                                                                                                                                              |
| plots/aggregates.csv             | CSV          | 1    | 11                | `uc_id`, `n`, `PASS`, `ASSERTION_FAIL`, `INFRA_FAIL`, `COMPILE_ERROR`, `GENERATION_ERROR`, `TIMEOUT`, `coverage_score_mean`, `coverage_score_median`, `coverage_score_std`, `selector_score_mean`, `selector_score_median`, `selector_score_std`, `map_interaction_score_mean`, `map_interaction_score_median`, `map_interaction_score_std`, `assertion_score_mean`, `assertion_score_median`, `assertion_score_std`, `vacuous_pass`, `iterations_mean` |
| plots/exec_category_by_uc.png    | PNG          | 50   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| plots/loop_convergence.png       | PNG          | 51   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| plots/loop_iterations_by_uc.png  | PNG          | 57   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| plots/score_distribution.png     | PNG          | 50   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| plots/score_heatmap.png          | PNG          | 69   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### Verzeichnisse

| Größe                                      | Wert |
| ------------------------------------------ | ---- |
| `run_*`-Verzeichnisse                      | 50   |
| `*.spec.ts`-Dateien (ohne `.exec.spec.ts`) | 2154 |

## 2 Grundmenge

| Größe                                      | Wert | Quelle / Berechnung                       |
| ------------------------------------------ | ---- | ----------------------------------------- |
| Testdateien im Verzeichnis (`*.spec.ts`)   | 2154 | `rglob('*.spec.ts')` im Stufenordner      |
| Zeilen in `_phase1_results.csv`            | 500  | eine Zeile je Testdatei                   |
| Läufe (`run`, distinct)                    | 50   | `_phase1_results.csv`, Spalte `run`       |
| Use Cases (`uc_id`, distinct)              | 10   | `_phase1_results.csv`, Spalte `uc_id`     |
| Soll (50 Läufe × 10 UC)                    | 500  | -                                         |
| fehlende Kombinationen Lauf/UC             | 0    | Sollmenge minus vorhandene `(run, uc_id)` |
| in Phase 2 bewertet (`_phase2_judge.json`) | 500  | Anzahl Einträge                           |
| Phase-1-Zeilen ohne Phase-2-Bewertung      | 0    | Mengendifferenz `(run, uc_id)`            |
| Phase-2-Einträge ohne Phase-1-Zeile        | 0    | Mengendifferenz `(run, uc_id)`            |

Fehlende Kombinationen: keine.

Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: 1 (`run_22/uc-06` (GENERATION_ERROR))

## 3 Phase 1 (Ausführung)

#### Verteilung `exec_category`

| Kategorie        | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 366 | 73.2                   |
| ASSERTION_FAIL   | 118 | 23.6                   |
| INFRA_FAIL       | 15  | 3.0                    |
| COMPILE_ERROR    | 0   | 0.0                    |
| GENERATION_ERROR | 1   | 0.2                    |
| TIMEOUT          | 0   | 0.0                    |
| **Summe**        | 500 | 100.0                  |

Quelle: `_phase1_results.csv`, Spalte `exec_category`, `value_counts()`; Prozent = n / 500.

#### PASS-Rate je Use Case

| uc_id      | n   | PASS | PASS % | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR |
| ---------- | --- | ---- | ------ | -------------- | ---------- | ------------- | ---------------- |
| uc-01      | 50  | 50   | 100.0  | 0              | 0          | 0             | 0                |
| uc-02      | 50  | 50   | 100.0  | 0              | 0          | 0             | 0                |
| uc-03      | 50  | 9    | 18.0   | 40             | 1          | 0             | 0                |
| uc-04      | 50  | 50   | 100.0  | 0              | 0          | 0             | 0                |
| uc-05      | 50  | 50   | 100.0  | 0              | 0          | 0             | 0                |
| uc-06      | 50  | 32   | 64.0   | 17             | 0          | 0             | 1                |
| uc-07      | 50  | 23   | 46.0   | 21             | 6          | 0             | 0                |
| uc-08      | 50  | 14   | 28.0   | 30             | 6          | 0             | 0                |
| uc-09      | 50  | 47   | 94.0   | 2              | 1          | 0             | 0                |
| uc-10      | 50  | 41   | 82.0   | 8              | 1          | 0             | 0                |
| **gesamt** | 500 | 366  | 73.2   | 118            | 15         | 0             | 1                |

Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, PASS % = PASS / n je UC.

#### Streuung der PASS-Rate über die Läufe

| Größe                                                      | Wert                    |
| ---------------------------------------------------------- | ----------------------- |
| Anzahl Läufe                                               | 50                      |
| PASS-Rate je Lauf: Minimum                                 | 50.0 % (run_07, run_11) |
| PASS-Rate je Lauf: Maximum                                 | 100.0 % (run_01)        |
| PASS-Rate je Lauf: Median                                  | 70.0 %                  |
| PASS-Rate je Lauf: Mittelwert                              | 73.2 %                  |
| PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1) | 10.39 Prozentpunkte     |

Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit `exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber Min/Max/Median/Mittelwert/Standardabweichung.

#### Use Cases, die zwischen PASS und Fehlschlag springen

| uc_id | PASS % | PASS | Fehlschlag | Fehlerkategorien der Fehlschläge        |
| ----- | ------ | ---- | ---------- | --------------------------------------- |
| uc-03 | 18.0   | 9    | 41         | ASSERTION_FAIL: 40, INFRA_FAIL: 1       |
| uc-06 | 64.0   | 32   | 18         | ASSERTION_FAIL: 17, GENERATION_ERROR: 1 |
| uc-07 | 46.0   | 23   | 27         | ASSERTION_FAIL: 21, INFRA_FAIL: 6       |
| uc-08 | 28.0   | 14   | 36         | ASSERTION_FAIL: 30, INFRA_FAIL: 6       |
| uc-09 | 94.0   | 47   | 3          | ASSERTION_FAIL: 2, INFRA_FAIL: 1        |
| uc-10 | 82.0   | 41   | 9          | ASSERTION_FAIL: 8, INFRA_FAIL: 1        |

Immer PASS: uc-01, uc-02, uc-04, uc-05. Nie PASS: keine.

Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.

#### `duration_s`

Spalte `duration_s` ist in dieser Stufe durchgehend leer (500 von 500 Zeilen ohne Wert) - keine Laufzeitkennzahl berechenbar.

#### Gruppierte `error_summary` (nur Zeilen ohne PASS)

Nicht-PASS-Zeilen: 134; daraus 52 Signaturgruppen. Die 15 häufigsten:

| n   | % der Fehlschläge | Signatur                                                                                                                                                  | exec_category  | Use Cases (n)                          |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------- |
| 20  | 14.9              | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has type: object \| Received ha | ASSERTION_FAIL | uc-03(20)                              |
| 11  | 8.2               | Error: expect(received).toBe(expected) // Object.is equality \| Received: false                                                                           | ASSERTION_FAIL | uc-03(1), uc-07(5), uc-08(3), uc-10(2) |
| 9   | 6.7               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                                             | ASSERTION_FAIL | uc-03(9)                               |
| 7   | 5.2               | Error: expect(received).toBe(expected) // Object.is equality \| Received: <Q>                                                                             | ASSERTION_FAIL | uc-03(6), uc-06(1)                     |
| 6   | 4.5               | Error: expect(received).toBeTruthy() \| Received: undefined                                                                                               | ASSERTION_FAIL | uc-06(6)                               |
| 6   | 4.5               | Error: expect(received).toBe(expected) // Object.is equality \| Received: <N>                                                                             | ASSERTION_FAIL | uc-06(5), uc-10(1)                     |
| 5   | 3.7               | Error: expect(received).toEqual(expected) // deep equality                                                                                                | ASSERTION_FAIL | uc-07(5)                               |
| 5   | 3.7               | Error: expect(received).toBeGreaterThan(expected) \| Received: <N>                                                                                        | ASSERTION_FAIL | uc-07(3), uc-08(2)                     |
| 5   | 3.7               | Error: expect(received).toBeDefined() \| Received: undefined                                                                                              | ASSERTION_FAIL | uc-03(1), uc-06(4)                     |
| 4   | 3.0               | Error: expect(received).toBeTruthy() \| Received: false                                                                                                   | ASSERTION_FAIL | uc-07(3), uc-08(1)                     |
| 3   | 2.2               | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                              | ASSERTION_FAIL | uc-07(1), uc-08(1), uc-09(1)           |
| 3   | 2.2               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined            | ASSERTION_FAIL | uc-03(3)                               |
| 3   | 2.2               | Error: expect(received).toBeGreaterThanOrEqual(expected) \| Received: <N>                                                                                 | ASSERTION_FAIL | uc-06(1), uc-10(2)                     |
| 3   | 2.2               | Error: Timeout 5000ms exceeded while waiting on the predicate                                                                                             | ASSERTION_FAIL | uc-08(2), uc-10(1)                     |
| 3   | 2.2               | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByRole(<Q>, { name: <Q>, exact: true }) \| Error: element(s) not found        | INFRA_FAIL     | uc-07(3)                               |

Gruppierungsregel (`common.error_signature`): ANSI entfernen; Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste Zeile plus bis zu drei ursachenkonkretisierende Zeilen (`Error:`, `Locator:`, `Matcher error`, `Received`, `Expected pattern/string/substring`, `Cannot find module`, `waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.

`needs_review = true`: 0 Zeilen

## 4 Phase 2 (Judge-Bewertung)

#### Score-Verteilung je Dimension

| Dimension       | 1   | 2   | 3   | 4   | n numerisch | Median | Mittelwert | Std (ddof=1) | `n/a` | Wert fehlt |
| --------------- | --- | --- | --- | --- | ----------- | ------ | ---------- | ------------ | ----- | ---------- |
| coverage        | 0   | 1   | 16  | 482 | 499         | 4.0    | 3.96       | 0.20         | 0     | 1          |
| selector        | 0   | 25  | 64  | 410 | 499         | 4.0    | 3.77       | 0.53         | 0     | 1          |
| map_interaction | 8   | 38  | 133 | 70  | 249         | 3.0    | 3.06       | 0.75         | 250   | 1          |
| assertion       | 0   | 19  | 154 | 326 | 499         | 4.0    | 3.62       | 0.56         | 0     | 1          |

Quelle: `_phase2_judge.json` (500 Einträge). `n/a` = literaler Wert `"n/a"`; "Wert fehlt" = Schlüssel `null`/nicht gesetzt. Median/Mittelwert nur über numerische Werte.

#### `map_interaction`: tatsächlicher Anwendungsbereich

| uc_id | in MAP_UCS (Prompt) | n   | numerisch bewertet | `n/a` | Wert fehlt | Median | Mittelwert |
| ----- | ------------------- | --- | ------------------ | ----- | ---------- | ------ | ---------- |
| uc-01 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-02 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-03 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-04 | ja                  | 50  | 50                 | 0     | 0          | 4.0    | 3.96       |
| uc-05 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-06 | ja                  | 50  | 49                 | 0     | 1          | 3.0    | 3.06       |
| uc-07 | ja                  | 50  | 50                 | 0     | 0          | 2.0    | 2.60       |
| uc-08 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 2.98       |
| uc-09 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-10 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 2.72       |

`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: `uc-04`, `uc-06`, `uc-07`, `uc-08`, `uc-10`.

Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.

#### Scores je Use Case und Dimension

| uc_id | n   | coverage Md | coverage Ø | coverage σ | selector Md | selector Ø | selector σ | map_interaction Md | map_interaction Ø | map_interaction σ | assertion Md | assertion Ø | assertion σ |
| ----- | --- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| uc-01 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 4.0          | 4.00        | 0.00        |
| uc-02 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 4.0          | 3.74        | 0.44        |
| uc-03 | 50  | 4.0         | 3.96       | 0.20       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 3.0          | 3.06        | 0.37        |
| uc-04 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 4.00       | 0.00       | 4.0                | 3.96              | 0.20              | 4.0          | 3.96        | 0.20        |
| uc-05 | 50  | 4.0         | 3.98       | 0.14       | 4.0         | 3.90       | 0.30       | n/a                | n/a               | -                 | 4.0          | 3.88        | 0.33        |
| uc-06 | 50  | 4.0         | 3.98       | 0.14       | 4.0         | 3.37       | 0.88       | 3.0                | 3.06              | 0.24              | 3.0          | 2.96        | 0.29        |
| uc-07 | 50  | 4.0         | 3.96       | 0.28       | 4.0         | 3.74       | 0.53       | 2.0                | 2.60              | 1.11              | 4.0          | 3.66        | 0.75        |
| uc-08 | 50  | 4.0         | 4.00       | 0.00       | 3.0         | 3.12       | 0.44       | 3.0                | 2.98              | 0.14              | 3.0          | 3.06        | 0.55        |
| uc-09 | 50  | 4.0         | 3.96       | 0.20       | 4.0         | 3.90       | 0.36       | n/a                | n/a               | -                 | 4.0          | 3.94        | 0.24        |
| uc-10 | 50  | 4.0         | 3.80       | 0.40       | 4.0         | 3.68       | 0.71       | 3.0                | 2.72              | 0.57              | 4.0          | 3.88        | 0.33        |

Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), jeweils nur über numerische Werte.

#### `vacuous_pass`

| Größe                                                     | n   | % der Stufengrundmenge |
| --------------------------------------------------------- | --- | ---------------------- |
| `vacuous_pass = true` laut Datei (Rohtyp: bool)           | 14  | 2.8                    |
| nach Definition erwartet (Phase-1-PASS und assertion ≤ 2) | 14  | 2.8                    |
| Abweichungen                                              | 0   | 0.0                    |

`vacuous_pass` je Use Case:

| uc_id | n   | vacuous_pass | %    |
| ----- | --- | ------------ | ---- |
| uc-01 | 50  | 0            | 0.0  |
| uc-02 | 50  | 0            | 0.0  |
| uc-03 | 50  | 0            | 0.0  |
| uc-04 | 50  | 0            | 0.0  |
| uc-05 | 50  | 0            | 0.0  |
| uc-06 | 50  | 0            | 0.0  |
| uc-07 | 50  | 8            | 16.0 |
| uc-08 | 50  | 6            | 12.0 |
| uc-09 | 50  | 0            | 0.0  |
| uc-10 | 50  | 0            | 0.0  |

#### Wiederkehrende Muster in den Judge-Begründungen

| Muster                                           | Dateien | % der Stufe | Treffer je Dimension                                       | Beispieldatei                                                                                                                                                                                                 |
| ------------------------------------------------ | ------- | ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| map-container / Canvas in der Begründung erwähnt | 149     | 29.8        | selector: 149, map_interaction: 83                         | `tests/stage_5_self_improvement_loop/run_01/uc-06-click-a-map-position-to-show-the-weather-forecast/uc-06-iter-1-click-a-map-position-to-show-the-weather-forecast.spec.ts`                                   |
| force: true / erzwungener Klick                  | 138     | 27.6        | selector: 138                                              | `tests/stage_5_self_improvement_loop/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-1-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Assertion prüft das falsche Element              | 55      | 11.0        | coverage: 1, selector: 55                                  | `tests/stage_5_self_improvement_loop/run_01/uc-07-click-both-point-station-layers-to-show-feature-info/uc-07-iter-1-click-both-point-station-layers-to-show-feature-info.spec.ts`                             |
| Selektor erfunden / existiert nicht              | 24      | 4.8         | selector: 19, map_interaction: 2, assertion: 4             | `tests/stage_5_self_improvement_loop/run_07/uc-06-click-a-map-position-to-show-the-weather-forecast/uc-06-iter-9-click-a-map-position-to-show-the-weather-forecast.spec.ts`                                   |
| \_\_openPioneerMap erwähnt                       | 17      | 3.4         | map_interaction: 17                                        | `tests/stage_5_self_improvement_loop/run_02/uc-07-click-both-point-station-layers-to-show-feature-info/uc-07-iter-2-click-both-point-station-layers-to-show-feature-info.spec.ts`                             |
| Netzwerk-/Request-Nachweis erwähnt               | 11      | 2.2         | coverage: 1, selector: 1, map_interaction: 4, assertion: 7 | `tests/stage_5_self_improvement_loop/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons/uc-03-iter-0-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                                                         |
| Assertion trivial / immer wahr                   | 4       | 0.8         | map_interaction: 1, assertion: 3                           | `tests/stage_5_self_improvement_loop/run_17/uc-03-zoom-in-and-out-using-the-zoom-buttons/uc-03-iter-0-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                                                         |
| strict-mode / mehrdeutiger Selektor              | 2       | 0.4         | selector: 2, assertion: 1                                  | `tests/stage_5_self_improvement_loop/run_09/uc-08-measure-a-distance-by-drawing-a-line-on-the-map/uc-08-iter-9-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                                       |
| Assertion entfernt / abgeschwächt                | 1       | 0.2         | assertion: 1                                               | `tests/stage_5_self_improvement_loop/run_11/uc-06-click-a-map-position-to-show-the-weather-forecast/uc-06-iter-9-click-a-map-position-to-show-the-weather-forecast.spec.ts`                                   |
| erfundene Test-ID (getByTestId)                  | 0       | 0.0         |                                                            | -                                                                                                                                                                                                             |
| Importpfad / Modul nicht auflösbar               | 0       | 0.0         |                                                            | -                                                                                                                                                                                                             |
| kein Zugriff auf das Kartenmodell                | 0       | 0.0         |                                                            | -                                                                                                                                                                                                             |
| fehlende Wartebedingung                          | 0       | 0.0         |                                                            | -                                                                                                                                                                                                             |
| Vorbedingung nicht geprüft (Regel 22)            | 0       | 0.0         |                                                            | -                                                                                                                                                                                                             |

Zählweise: Regex-Suche (case-insensitive) über die vier `reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei zählt einmal, wenn mindestens eine Dimension trifft. Die Regex-Definitionen stehen in `src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).

#### Auffälligkeiten in der Bewertung selbst

| Prüfung                                                                | Befund                                                                                                                                                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| identische `coverage`-Begründung                                       | 49 Textvarianten betreffen 434 Dateien; häufigster Text 41×                                                                                                                |
| identische `selector`-Begründung                                       | 70 Textvarianten betreffen 403 Dateien; häufigster Text 36×                                                                                                                |
| identische `map_interaction`-Begründung                                | 46 Textvarianten betreffen 457 Dateien; häufigster Text 50×                                                                                                                |
| identische `assertion`-Begründung                                      | 64 Textvarianten betreffen 408 Dateien; häufigster Text 21×                                                                                                                |
| Einträge ohne alle vier `reasoning`-Schlüssel                          | 0                                                                                                                                                                          |
| Einträge mit fehlendem Score in coverage/selector/assertion            | 1 (exec_category: GENERATION_ERROR: 1)                                                                                                                                     |
| Einträge mit fehlendem `map_interaction_score` (weder Zahl noch `n/a`) | 1 (`run_22/uc-06`)                                                                                                                                                         |
| selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“         | 0 Dateien; Beispiel: -                                                                                                                                                     |
| assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“          | 1 Dateien; Beispiel: `tests/stage_5_self_improvement_loop/run_17/uc-03-zoom-in-and-out-using-the-zoom-buttons/uc-03-iter-0-zoom-in-and-out-using-the-zoom-buttons.spec.ts` |
| coverage_score = 4 trotz Begründung „fehlt/unvollständig“              | 4 Dateien; Beispiel: `tests/stage_5_self_improvement_loop/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons/uc-03-iter-0-zoom-in-and-out-using-the-zoom-buttons.spec.ts` |
| map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“ | 0 Dateien; Beispiel: -                                                                                                                                                     |

Häufigste wörtlich identische Begründungstexte:

| Dimension       | n Dateien | Use Cases | Text (gekürzt)                                                                                                                                                             |
| --------------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | 41        | uc-09     | Alle vier UC-Schritte sind abgedeckt: Print-Panel oeffnen, Titel eingeben, PNG-Format waehlen und Export ausloesen; beide pruefbaren Ergebnisse (Panel sichtbar, PNG-Downl |
| coverage        | 36        | uc-03     | Beide UC-Schritte sind abgedeckt und beide erwarteten Ergebnisse werden mit Richtungsvergleich adressiert; der Ausgangszoom wird (fehlerhaft) erfasst.                     |
| selector        | 36        | uc-03     | Es werden nur reale Locator benutzt - die Test-IDs zoom-in-button/zoom-out-button bzw. die ToolButtons per Rolle mit den echten aria-labels 'Zoom in map'/'Zoom out map'.  |
| selector        | 20        | uc-09     | Nur reale Locator: print-toggle bzw. ToolButton 'Print Map', dialog 'Print Map' bzw. printing-panel, Titelfeld per Label/textbox 'Title', nativer Select per combobox/Labe |
| map_interaction | 50        | uc-01     | uc-01 ist nicht in MAP_UCS gelistet, daher n/a.                                                                                                                            |
| map_interaction | 50        | uc-02     | uc-02 ist nicht in MAP_UCS gelistet, daher n/a.                                                                                                                            |
| assertion       | 21        | uc-04     | toBeChecked() prueft den Toggle-Zustand, der wartende isLayerRendered-Poll das tatsaechliche Rendern der Kacheln - exakt die beiden UC-Erwartungen. Beide wuerden bei defe |
| assertion       | 21        | uc-03     | Die Richtungsabsicht (toBeGreaterThan/toBeLessThan) trifft die UC-Erwartung, aber die Referenzwerte entstehen ueber den Rueckgabewert von 'await expect.poll(...)' bzw. ei |

## 5 Loop-Protokoll: Struktur

### 5.1 Aufbau der beiden Protokolldateien

| Datei                       | Datensätze | Felder je Datensatz                                                                                                                        | Felder je Iteration                                                                                                                     |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `_stage_5_run_summary.json` | 500        | `complexity`, `final_spec`, `history`, `iterations_used`, `max_iterations`, `passed`, `run`, `screenshots_enabled`, `title`, `use_case_id` | `error_excerpt`, `error_type`, `failure_screenshot_captured`, `failure_snapshot_captured`, `iteration`, `passed`, `spec` (in `history`) |
| `_stage_5_all_runs.jsonl`   | 500        | `complexity`, `final_spec`, `iterations`, `iterations_used`, `passed`, `run`, `uc_id`                                                      | `error_excerpt`, `error_type`, `iteration`, `passed` (in `iterations`)                                                                  |

Die JSONL-Datei enthält je Iteration eine Teilmenge der Felder von `history` (kein `spec`, kein `failure_snapshot_captured`, kein `failure_screenshot_captured`). Beide Dateien decken dieselben 500 Läufe und dieselbe Zahl an Iterationen ab (2154 bzw. 2154).

### 5.2 Vollständigkeit der Iterationsdatensätze

| Prüfung                                              | Wert | Quelle / Berechnung                                        |
| ---------------------------------------------------- | ---- | ---------------------------------------------------------- |
| Iterationen insgesamt                                | 2154 | Summe über `history`                                       |
| davon `passed = true`                                | 366  | Feld `passed` je Iteration                                 |
| davon `passed = false`                               | 1788 | Feld `passed` je Iteration                                 |
| Fehlermeldung vorhanden (`error_excerpt` nicht leer) | 1788 | Feld `error_excerpt`                                       |
| `error_excerpt` genau 500 Zeichen lang               | 1771 | Feld `error_excerpt` - das Protokoll kürzt auf 500 Zeichen |
| `failure_snapshot_captured = true`                   | 1786 | Feld `failure_snapshot_captured`                           |
| `failure_screenshot_captured = true`                 | 1786 | Feld `failure_screenshot_captured`                         |
| Fehlgeschlagene Iterationen OHNE Snapshot            | 2    | `passed = false` und `failure_snapshot_captured = false`   |
| Fehlgeschlagene Iterationen OHNE Screenshot          | 2    | `passed = false` und `failure_screenshot_captured = false` |
| `*.spec.ts` je Iteration auf der Platte              | 2154 | Existenzprüfung des Pfads aus `history[].spec`             |
| `*.result.json` je Iteration auf der Platte          | 2154 | Existenzprüfung des zugehörigen Playwright-Reports         |
| `iterations_used` ≠ Länge von `history`              | 0    | Konsistenzprüfung je Lauf                                  |

Fehlgeschlagene Iterationen ohne Snapshot/Screenshot:

| run    | uc_id | iteration | error_type       | eigene Klassifikation |
| ------ | ----- | --------- | ---------------- | --------------------- |
| run_02 | uc-07 | 1         | generation_error | COMPILE_ERROR         |
| run_36 | uc-07 | 2         | generation_error | COMPILE_ERROR         |

### 5.3 `error_type` des Loop-Protokolls gegen die Phase-1-Klassifikation

| `error_type` (Protokoll) | ASSERTION_FAIL | COMPILE_ERROR | INFRA_FAIL | PASS | Summe |
| ------------------------ | -------------- | ------------- | ---------- | ---- | ----- |
| api_misuse               | 0              | 0             | 97         | 0    | 97    |
| assertion_fail           | 853            | 0             | 14         | 0    | 867   |
| element_not_found        | 0              | 0             | 167        | 0    | 167   |
| generation_error         | 1              | 2             | 0          | 0    | 3     |
| matcher_type_error       | 302            | 0             | 0          | 0    | 302   |
| none                     | 0              | 0             | 0          | 366  | 366   |
| other                    | 11             | 0             | 42         | 0    | 53    |
| pointer_interception     | 114            | 0             | 2          | 0    | 116   |
| selector_ambiguity       | 0              | 0             | 76         | 0    | 76    |
| timeout                  | 6              | 0             | 101        | 0    | 107   |
| **Summe**                | 1287           | 2             | 499        | 366  | 2154  |

Zeilen: Feld `error_type` aus dem Loop-Protokoll. Spalten: eigene Klassifikation der Iteration mit `classify_runtime_result()` aus `run_phase1_eval.py`, angewandt auf den vollständigen Playwright-Report der Iteration (`*.result.json`). Das Protokollfeld ist eine eigene, gröbere Taxonomie und nicht mit den Phase-1-Kategorien identisch.

## 6 Ergebnis des Loops

### 6.1 Endergebnis in den Phase-1-Kategorien

| Kategorie        | n   | %    |
| ---------------- | --- | ---- |
| PASS             | 366 | 73.2 |
| ASSERTION_FAIL   | 118 | 23.6 |
| INFRA_FAIL       | 15  | 3.0  |
| COMPILE_ERROR    | 0   | 0.0  |
| GENERATION_ERROR | 1   | 0.2  |
| TIMEOUT          | 0   | 0.0  |

Quelle: `_phase1_results.csv` (Endzustand je Lauf/UC).

### 6.2 Verteilung `iterations_used`

| iterations_used | Läufe | %    | davon PASS | davon ohne PASS | kumuliert | kumuliert % |
| --------------- | ----- | ---- | ---------- | --------------- | --------- | ----------- |
| 1               | 146   | 29.2 | 146        | 0               | 146       | 29.2        |
| 2               | 128   | 25.6 | 128        | 0               | 274       | 54.8        |
| 3               | 44    | 8.8  | 44         | 0               | 318       | 63.6        |
| 4               | 18    | 3.6  | 18         | 0               | 336       | 67.2        |
| 5               | 7     | 1.4  | 7          | 0               | 343       | 68.6        |
| 6               | 6     | 1.2  | 6          | 0               | 349       | 69.8        |
| 7               | 6     | 1.2  | 6          | 0               | 355       | 71.0        |
| 8               | 6     | 1.2  | 6          | 0               | 361       | 72.2        |
| 9               | 3     | 0.6  | 3          | 0               | 364       | 72.8        |
| 10              | 136   | 27.2 | 2          | 134             | 500       | 100.0       |

`max_iterations` in den Daten: [10] (Soll 10). Höchster beobachteter Wert von `iterations_used`: 10.

In Iteration 1 bestanden: 146 von 500 Läufen (29.2 %).
Nach 10 Iterationen ohne PASS abgebrochen: 134 (26.8 %).
Insgesamt PASS: 366 (73.2 %); ohne PASS: 134.

### 6.3 Grenznutzen je zusätzlicher Iteration

| Iteration | neu bestandene Läufe | % der 500 Läufe | kumuliert PASS | kumulierte PASS-Rate % |
| --------- | -------------------- | --------------- | -------------- | ---------------------- |
| 1         | 146                  | 29.2            | 146            | 29.2                   |
| 2         | 128                  | 25.6            | 274            | 54.8                   |
| 3         | 44                   | 8.8             | 318            | 63.6                   |
| 4         | 18                   | 3.6             | 336            | 67.2                   |
| 5         | 7                    | 1.4             | 343            | 68.6                   |
| 6         | 6                    | 1.2             | 349            | 69.8                   |
| 7         | 6                    | 1.2             | 355            | 71.0                   |
| 8         | 6                    | 1.2             | 361            | 72.2                   |
| 9         | 3                    | 0.6             | 364            | 72.8                   |
| 10        | 2                    | 0.4             | 366            | 73.2                   |

Ein Lauf zählt in der Iteration, in der er bestanden hat (`iterations_used` bei `passed = true`). Letzte Iteration mit Zugewinn: 10. Zugewinne treten bis zur letzten Iteration auf.

## 7 Fehlerklassen im Verlauf

### 7.1 Fehlerklasse je Iteration

| Iteration (0-basiert) | PASS | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | Summe |
| --------------------- | ---- | -------------- | ---------- | ------------- | ----- |
| 0                     | 146  | 164            | 190        | 0             | 500   |
| 1                     | 128  | 158            | 67         | 1             | 354   |
| 2                     | 44   | 130            | 51         | 1             | 226   |
| 3                     | 18   | 127            | 37         | 0             | 182   |
| 4                     | 7    | 123            | 34         | 0             | 164   |
| 5                     | 6    | 123            | 28         | 0             | 157   |
| 6                     | 6    | 116            | 29         | 0             | 151   |
| 7                     | 6    | 112            | 27         | 0             | 145   |
| 8                     | 3    | 115            | 21         | 0             | 139   |
| 9                     | 2    | 119            | 15         | 0             | 136   |

Klassifikation je Iteration mit `classify_runtime_result()` aus `run_phase1_eval.py` auf dem vollständigen Playwright-Report der Iteration (`*.result.json`); Vorschaltung von `scan_for_truncation()` und `collect_load_errors()` wie in `run_phase1_eval.main()`.

### 7.2 Häufigste Sequenzmuster der Fehlerklassen

500 Läufe, 88 verschiedene Sequenzen. Die 20 häufigsten:

| #   | n Läufe | %    | Sequenz                                                                                                                                                                 |
| --- | ------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 146     | 29.2 | PASS                                                                                                                                                                    |
| 2   | 83      | 16.6 | INFRA_FAIL → PASS                                                                                                                                                       |
| 3   | 52      | 10.4 | ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL |
| 4   | 45      | 9.0  | ASSERTION_FAIL → PASS                                                                                                                                                   |
| 5   | 29      | 5.8  | INFRA_FAIL → ASSERTION_FAIL → PASS                                                                                                                                      |
| 6   | 16      | 3.2  | INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL     |
| 7   | 9       | 1.8  | INFRA_FAIL → INFRA_FAIL → PASS                                                                                                                                          |
| 8   | 5       | 1.0  | INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → PASS                                                                                                                     |
| 9   | 5       | 1.0  | INFRA_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL         |
| 10  | 5       | 1.0  | INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL                                         |
| 11  | 5       | 1.0  | ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL     |
| 12  | 3       | 0.6  | INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL                     |
| 13  | 3       | 0.6  | ASSERTION_FAIL → ASSERTION_FAIL → PASS                                                                                                                                  |
| 14  | 3       | 0.6  | ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL     |
| 15  | 3       | 0.6  | ASSERTION_FAIL → INFRA_FAIL → INFRA_FAIL → PASS                                                                                                                         |
| 16  | 3       | 0.6  | ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL → PASS                                                                                                                     |
| 17  | 3       | 0.6  | ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → PASS                                                                                                                 |
| 18  | 2       | 0.4  | INFRA_FAIL → ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL         |
| 19  | 2       | 0.4  | ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL     |
| 20  | 2       | 0.4  | INFRA_FAIL → ASSERTION_FAIL → INFRA_FAIL → INFRA_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL → ASSERTION_FAIL             |

Komprimierte Sequenzen (unmittelbare Wiederholungen als `×k`), die 15 häufigsten:

| n Läufe | %    | Sequenz                                          |
| ------- | ---- | ------------------------------------------------ |
| 146     | 29.2 | PASS                                             |
| 83      | 16.6 | INFRA_FAIL → PASS                                |
| 52      | 10.4 | ASSERTION_FAIL×10                                |
| 45      | 9.0  | ASSERTION_FAIL → PASS                            |
| 29      | 5.8  | INFRA_FAIL → ASSERTION_FAIL → PASS               |
| 16      | 3.2  | INFRA_FAIL → ASSERTION_FAIL×9                    |
| 9       | 1.8  | INFRA_FAIL×2 → PASS                              |
| 5       | 1.0  | INFRA_FAIL → ASSERTION_FAIL×2 → PASS             |
| 5       | 1.0  | INFRA_FAIL×2 → ASSERTION_FAIL×8                  |
| 5       | 1.0  | INFRA_FAIL×10                                    |
| 5       | 1.0  | ASSERTION_FAIL → INFRA_FAIL → ASSERTION_FAIL×8   |
| 3       | 0.6  | INFRA_FAIL×5 → ASSERTION_FAIL×5                  |
| 3       | 0.6  | ASSERTION_FAIL×2 → PASS                          |
| 3       | 0.6  | ASSERTION_FAIL×7 → INFRA_FAIL → ASSERTION_FAIL×2 |
| 3       | 0.6  | ASSERTION_FAIL → INFRA_FAIL×2 → PASS             |

### 7.3 Aufeinanderfolgende Iterationen mit identischer Fehlerklasse

| Größe                          | Wert   |
| ------------------------------ | ------ |
| Iterationsübergänge insgesamt  | 1654   |
| davon gleiche Klasse wie zuvor | 1197   |
| Anteil                         | 72.4 % |

Ein Übergang ist ein Paar (Iteration k → k+1) innerhalb eines Laufs; PASS-Übergänge sind eingeschlossen.

### 7.4 Übergangsmatrix der Fehlerklassen

| von \ nach     | PASS | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | Summe |
| -------------- | ---- | -------------- | ---------- | ------------- | ----- |
| ASSERTION_FAIL | 108  | 973            | 85         | 2             | 1168  |
| INFRA_FAIL     | 111  | 149            | 224        | 0             | 484   |
| COMPILE_ERROR  | 1    | 1              | 0          | 0             | 2     |

Zeile = Klasse in Iteration k, Spalte = Klasse in Iteration k+1. Nur Läufe mit mindestens zwei Iterationen tragen bei.

### 7.5 Behebungsquote je Fehlerklasse

| Klasse in Iteration k | Übergänge | → PASS | → PASS % | → gleiche Klasse | gleich % | → andere Fehlerklasse | andere % |
| --------------------- | --------- | ------ | -------- | ---------------- | -------- | --------------------- | -------- |
| ASSERTION_FAIL        | 1168      | 108    | 9.2      | 973              | 83.3     | 87                    | 7.4      |
| INFRA_FAIL            | 484       | 111    | 22.9     | 224              | 46.3     | 149                   | 30.8     |
| COMPILE_ERROR         | 2         | 1      | 50.0     | 0                | 0.0      | 1                     | 50.0     |

Behebungsquote = Anteil der Übergänge aus dieser Klasse, die in der Folgeiteration PASS ergeben. Nenner ist die Zahl der Übergänge, nicht die Zahl der Läufe: eine Klasse, die in einem Lauf mehrfach auftritt, wird mehrfach gezählt.

### 7.6 Rückschritte

Rangfolge (höher = weiter fortgeschritten): `GENERATION_ERROR` = 0, `COMPILE_ERROR` = 1, `TIMEOUT` = 1, `INFRA_FAIL` = 2, `ASSERTION_FAIL` = 3, `PASS` = 4. Ein Rückschritt ist ein Übergang mit sinkendem Rang.

| Größe                  | Wert  |
| ---------------------- | ----- |
| Rückschritt-Übergänge  | 87    |
| Anteil aller Übergänge | 5.3 % |
| betroffene Läufe       | 74    |

Rückschritte nach Art:

| von            | nach          | n   | betroffene Use Cases (n)                                                 |
| -------------- | ------------- | --- | ------------------------------------------------------------------------ |
| ASSERTION_FAIL | INFRA_FAIL    | 85  | uc-03(24), uc-04(1), uc-06(1), uc-07(34), uc-08(14), uc-09(1), uc-10(10) |
| ASSERTION_FAIL | COMPILE_ERROR | 2   | uc-07(2)                                                                 |

Beispiele (erste fünf):

| run    | uc_id | von            | nach          |
| ------ | ----- | -------------- | ------------- |
| run_02 | uc-03 | ASSERTION_FAIL | INFRA_FAIL    |
| run_02 | uc-07 | ASSERTION_FAIL | COMPILE_ERROR |
| run_02 | uc-08 | ASSERTION_FAIL | INFRA_FAIL    |
| run_03 | uc-07 | ASSERTION_FAIL | INFRA_FAIL    |
| run_04 | uc-04 | ASSERTION_FAIL | INFRA_FAIL    |

### 7.7 Terminale Fehlerklasse der abgebrochenen Läufe (zentrale Tabelle)

| uc_id     | ASSERTION_FAIL | INFRA_FAIL | abgebrochene Läufe |
| --------- | -------------- | ---------- | ------------------ |
| uc-01     | 0              | 0          | 0                  |
| uc-02     | 0              | 0          | 0                  |
| uc-03     | 40             | 1          | 41                 |
| uc-04     | 0              | 0          | 0                  |
| uc-05     | 0              | 0          | 0                  |
| uc-06     | 18             | 0          | 18                 |
| uc-07     | 21             | 6          | 27                 |
| uc-08     | 30             | 6          | 36                 |
| uc-09     | 2              | 1          | 3                  |
| uc-10     | 8              | 1          | 9                  |
| **Summe** | 119            | 15         | 134                |

Abgebrochen = `passed = false` im Loop-Protokoll (134 Läufe). Terminale Klasse = eigene Klassifikation der letzten Iteration des Laufs.

`iterations_used` der abgebrochenen Läufe: 10 → 134 Läufe.

## 8 Was nicht behoben wird

### 8.1 Läufe mit über alle 10 Iterationen identischer Fehlersignatur

Geprüft wurden die 136 Läufe mit `iterations_used = 10`. Kriterium: alle 10 Iterationen haben dieselbe Fehlersignatur (`common.error_signature`, siehe Stufenbericht Abschnitt 3) und der Lauf endet ohne PASS. Treffer: 17 Läufe.

| run    | uc_id | Fehlerklasse   | Fehlersignatur (gekürzt)                                                                                                       |
| ------ | ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| run_05 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: undefined                                                                    |
| run_11 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeDefined() \| Received: undefined                                                                   |
| run_11 | uc-07 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: false                                                                        |
| run_14 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeDefined() \| Received: undefined                                                                   |
| run_17 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: undefined                                                                    |
| run_20 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeDefined() \| Received: undefined                                                                   |
| run_20 | uc-07 | ASSERTION_FAIL | Error: expect(locator).toContainText(expected) failed \| Locator: getByTestId(<Q>) \| Expected substring: <Q> \| Received s    |
| run_22 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeDefined() \| Received: undefined                                                                   |
| run_25 | uc-08 | INFRA_FAIL     | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByText(/^[<N>-<N>.,]+\s\*(m\|km\|mi\|ft)$/i) \| Er |
| run_27 | uc-03 | ASSERTION_FAIL | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received      |
| run_29 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBe(expected) // Object.is equality \| Received: <N>                                                  |
| run_34 | uc-07 | INFRA_FAIL     | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>) \| Error: element(s) not found                        |
| run_37 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: undefined                                                                    |
| run_39 | uc-08 | ASSERTION_FAIL | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                   |
| run_42 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: undefined                                                                    |
| run_48 | uc-09 | INFRA_FAIL     | Test timeout of 30000ms exceeded. \| Error: page.waitForEvent: Test timeout of 30000ms exceeded. \| waiting for event <Q>      |
| run_49 | uc-06 | ASSERTION_FAIL | Error: expect(received).toBeTruthy() \| Received: undefined                                                                    |

Betroffene Use Cases: `uc-03` (1), `uc-06` (10), `uc-07` (3), `uc-08` (2), `uc-09` (1)

Wörtliche Meldung eines Beispiels (auf 400 Zeichen gekürzt):

```
run_05/uc-06, Iteration 0
Error: expect(received).toBeTruthy()

Received: undefined

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
Error: expect(received).toBeTruthy()

Received: undefined

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate

  16 |   // Step 2: The user waits for the info panel to load the forecast.
  17 |   // Expected: The clicked position is highlighted on the map.
>
```

Zum Vergleich: 57 der Läufe mit 10 Iterationen tragen über alle Iterationen dieselbe _Fehlerklasse_ (nicht notwendigerweise dieselbe Meldung).

### 8.2 Fehlermeldungsgruppen über alle Iterationen

1788 fehlgeschlagene Iterationen, 223 Signaturgruppen. Davon treten 106 Gruppen ausschließlich in abgebrochenen Läufen auf (544 Iterationen). Die 20 häufigsten Gruppen:

| Iterationen | davon in abgebrochenen Läufen | nur in abgebrochenen Läufen | Signatur                                                                                                                             | Use Cases (n)                                                            |
| ----------- | ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 178         | 87                            | nein                        | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                         | uc-02(1), uc-04(7), uc-05(5), uc-07(87), uc-08(26), uc-09(16), uc-10(36) |
| 141         | 141                           | ja                          | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has type:  | uc-03(141)                                                               |
| 132         | 131                           | nein                        | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                        | uc-03(132)                                                               |
| 97          | 82                            | nein                        | Error: expect(received).toBe(expected) // Object.is equality \| Received: false                                                      | uc-03(1), uc-06(1), uc-07(45), uc-08(26), uc-10(24)                      |
| 86          | 79                            | nein                        | Error: expect(received).toBeDefined() \| Received: undefined                                                                         | uc-03(25), uc-06(50), uc-08(11)                                          |
| 80          | 61                            | nein                        | Error: expect(received).toBeTruthy() \| Received: undefined                                                                          | uc-06(74), uc-07(6)                                                      |
| 59          | 38                            | nein                        | Error: expect(received).toBe(expected) // Object.is equality \| Received: <N>                                                        | uc-06(38), uc-10(21)                                                     |
| 58          | 58                            | ja                          | TypeError: \_failureSnapshotFixture.expect.poll(...).toBeNumber is not a function                                                    | uc-03(58)                                                                |
| 43          | 23                            | nein                        | Error: expect(locator).toHaveCount(expected) failed \| Locator: getByTestId(<Q>).locator(<Q>) \| Received: <N>                       | uc-06(25), uc-10(18)                                                     |
| 40          | 39                            | nein                        | Error: expect(received).toBeTruthy() \| Received: false                                                                              | uc-03(1), uc-07(32), uc-08(7)                                            |
| 38          | 36                            | nein                        | Error: expect(received).toBe(expected) // Object.is equality \| Received: <Q>                                                        | uc-03(28), uc-06(8), uc-09(1), uc-10(1)                                  |
| 36          | 30                            | nein                        | Error: expect(received).toEqual(expected) // deep equality                                                                           | uc-07(36)                                                                |
| 31          | 0                             | nein                        | Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                          | uc-04(31)                                                                |
| 29          | 26                            | nein                        | Error: expect(received).toBeGreaterThanOrEqual(expected) \| Received: <N>                                                            | uc-06(9), uc-10(20)                                                      |
| 26          | 25                            | nein                        | Error: expect(received).toBeGreaterThan(expected) \| Received: <N>                                                                   | uc-07(10), uc-08(15), uc-10(1)                                           |
| 24          | 10                            | nein                        | Test timeout of 30000ms exceeded. \| Error: page.waitForEvent: Test timeout of 30000ms exceeded. \| waiting for event <Q>            | uc-09(24)                                                                |
| 22          | 22                            | ja                          | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: | uc-03(22)                                                                |
| 21          | 17                            | nein                        | Error: expect(received).toMatchObject(expected)                                                                                      | uc-10(21)                                                                |
| 20          | 13                            | nein                        | Error: <Q> does not support <Q> matcher.                                                                                             | uc-02(2), uc-03(2), uc-06(5), uc-07(4), uc-08(7)                         |
| 16          | 6                             | nein                        | Error: locator.\_expect: expectedNumber: expected float, got object                                                                  | uc-06(1), uc-10(15)                                                      |

Gruppen, die ausschließlich in abgebrochenen Läufen auftreten (die 12 häufigsten):

| Iterationen | Signatur                                                                                                                                          | Use Cases (n) |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 141         | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has type: object \| R   | uc-03(141)    |
| 58          | TypeError: \_failureSnapshotFixture.expect.poll(...).toBeNumber is not a function                                                                 | uc-03(58)     |
| 22          | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined    | uc-03(22)     |
| 16          | Error: expect(received).toMatch(expected) \| Expected pattern: /\d+\.?\d*\s*(m\|km\|mi\|ft)/i \| Received string: <Q>                             | uc-08(16)     |
| 14          | Error: expect(received).toMatch(expected) \| Expected pattern: /\d+(\.\d+)?\s\*(km\|m\|mi\|ft)/i \| Received string: <Q>                          | uc-08(14)     |
| 13          | Error: expect(locator).toContainText(expected) failed \| Locator: getByTestId(<Q>) \| Expected substring: <Q> \| Received string: "InformationW   | uc-07(13)     |
| 10          | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByText(/^[<N>-<N>.,]+\s\*(m\|km\|mi\|ft)$/i) \| Error: element(s) not | uc-08(10)     |
| 9           | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByText(/[\d,.]+\s\*(km\|m\|mi\|ft)/) \| Error: element(s) not found   | uc-08(9)      |
| 9           | Error: expect(received).toMatch(expected) \| Expected pattern: /[\d.]+\s\*(km\|m\|mi\|ft)/ \| Received string: <Q>                                | uc-08(9)      |
| 9           | Error: expect(received).toMatch(expected) \| Expected pattern: /\d+(\.\d+)?\s\*(m\|km\|mi\|ft)/i \| Received string: <Q>                          | uc-08(9)      |
| 9           | Error: expect(received).toBeTruthy() \| Received: null                                                                                            | uc-08(9)      |
| 9           | Error: expect(received).toMatch(expected) \| Expected pattern: /[<N>-<N>]+\.?[<N>-<N>]_\s_(km\|m\|mi\|ft)/ \| Received string: <Q>                | uc-08(9)      |

### 8.3 Karten-Canvas- und Chakra-spezifische Fehlerbilder

| Muster                                                  | Iterationen | % der Fehl-Iterationen | davon in abgebrochenen Läufen | betroffene Läufe | Use Cases (n)                                                                     |
| ------------------------------------------------------- | ----------- | ---------------------- | ----------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| Pointer-Events abgefangen (`intercepts pointer events`) | 122         | 6.8                    | 70                            | 67               | uc-04(7), uc-05(5), uc-07(74), uc-08(24), uc-09(6), uc-10(6)                      |
| Element nicht stabil (`element is not stable`)          | 0           | 0.0                    | 0                             | 0                |                                                                                   |
| Meldung nennt `map-container`                           | 143         | 8.0                    | 97                            | 62               | uc-07(102), uc-08(40), uc-10(1)                                                   |
| Meldung nennt `canvas` / `.ol-viewport`                 | 59          | 3.3                    | 36                            | 28               | uc-04(5), uc-07(41), uc-08(13)                                                    |
| Meldung nennt eine Chakra-Klasse (`chakra-`)            | 70          | 3.9                    | 25                            | 57               | uc-02(4), uc-04(17), uc-05(5), uc-06(1), uc-07(5), uc-08(18), uc-09(14), uc-10(6) |
| Meldung nennt `accessible name`                         | 4           | 0.2                    | 4                             | 1                | uc-08(4)                                                                          |
| `getByRole(...)` nicht gefunden / mehrdeutig            | 153         | 8.6                    | 64                            | 106              | uc-04(39), uc-05(3), uc-07(31), uc-08(45), uc-09(9), uc-10(26)                    |

Nenner: 1788 fehlgeschlagene Iterationen. Gesucht wird in der vollständigen Fehlermeldung aus `*.result.json` (case-insensitive Regex). Die Muster überlappen sich.

## 9 Entwicklung des Codes

### 9.1 Ähnlichkeit aufeinanderfolgender Iterationen

| Größe                                          | Wert          |
| ---------------------------------------------- | ------------- |
| Iterationspaare (k → k+1)                      | 1654          |
| Ähnlichkeit (SequenceMatcher) Median           | 0.972         |
| Ähnlichkeit Mittelwert                         | 0.920         |
| Paare mit Ähnlichkeit ≥ 0,95                   | 1022 (61.8 %) |
| Paare mit Ähnlichkeit ≥ 0,99                   | 608 (36.8 %)  |
| Paare mit Ähnlichkeit = 1,0 (identischer Code) | 491 (29.7 %)  |
| Paare mit Ähnlichkeit < 0,50                   | 45 (2.7 %)    |
| geänderte Codezeilen je Paar: Median           | 2.0           |
| geänderte Codezeilen je Paar: Mittelwert       | 3.2           |
| Paare mit 0 geänderten Zeilen                  | 491           |

Vor dem Vergleich werden Kommentare und Leerraum entfernt (`norm_code`). Ähnlichkeit = `difflib.SequenceMatcher(None, a, b).ratio()` auf dem normalisierten Text; geänderte Zeilen = Summe der nicht-`equal` Blöcke aus dem zeilenweisen Diff.

Aufgeschlüsselt nach Ausgang des Laufs:

| Lauf endet mit PASS | Paare | Median Ähnlichkeit | Mittelwert |
| ------------------- | ----- | ------------------ | ---------- |
| nein                | 1206  | 0.981              | 0.933      |
| ja                  | 448   | 0.949              | 0.884      |

Je Übergang k → k+1:

| k   | Paare | Median Ähnlichkeit | ≥ 0,95 | ≥ 0,95 % |
| --- | ----- | ------------------ | ------ | -------- |
| 0   | 354   | 0.910              | 131    | 37.0     |
| 1   | 226   | 0.963              | 128    | 56.6     |
| 2   | 182   | 0.966              | 110    | 60.4     |
| 3   | 164   | 0.978              | 110    | 67.1     |
| 4   | 157   | 0.989              | 106    | 67.5     |
| 5   | 151   | 0.999              | 111    | 73.5     |
| 6   | 145   | 0.990              | 110    | 75.9     |
| 7   | 139   | 0.992              | 112    | 80.6     |
| 8   | 136   | 0.995              | 104    | 76.5     |

### 9.2 Länge und Assertionszahl über die Iterationen

| Größe                                      | Wert         |
| ------------------------------------------ | ------------ |
| Läufe mit ≥ 2 Iterationen                  | 354          |
| Zeilen erste Iteration: Median             | 32.0         |
| Zeilen letzte Iteration: Median            | 34.0         |
| Läufe mit mehr Zeilen am Ende              | 201 (56.8 %) |
| Läufe mit weniger Zeilen am Ende           | 113 (31.9 %) |
| `expect(`-Aufrufe erste Iteration: Median  | 4.0          |
| `expect(`-Aufrufe letzte Iteration: Median | 4.0          |
| Läufe mit mehr Assertions am Ende          | 68 (19.2 %)  |
| Läufe mit weniger Assertions am Ende       | 96 (27.1 %)  |
| Läufe mit unveränderter Assertionszahl     | 190 (53.7 %) |

`expect(`-Aufrufe = Treffer der Regex `\bexpect\s*\(|\bexpect\.poll\(` in der Datei (zählt auch `expect` innerhalb von Hilfsfunktionen).

Aufgeschlüsselt nach Ausgang:

| PASS | Läufe | Zeilen erste (Md) | Zeilen letzte (Md) | expect erste (Md) | expect letzte (Md) | Läufe mit Assertion-Abbau |
| ---- | ----- | ----------------- | ------------------ | ----------------- | ------------------ | ------------------------- |
| nein | 134   | 31.5              | 35.0               | 4.0               | 4.0                | 50 (37.3 %)               |
| ja   | 220   | 32.5              | 32.5               | 4.0               | 4.0                | 46 (20.9 %)               |

Median je Iterationsindex (nur die Läufe, die diese Iteration erreicht haben):

| Iteration | n Dateien | Zeilen (Md) | `expect(` (Md) |
| --------- | --------- | ----------- | -------------- |
| 0         | 500       | 27.5        | 4.0            |
| 1         | 354       | 32.0        | 4.0            |
| 2         | 226       | 38.0        | 5.0            |
| 3         | 182       | 37.0        | 5.0            |
| 4         | 164       | 35.0        | 4.0            |
| 5         | 157       | 35.0        | 4.0            |
| 6         | 151       | 35.0        | 4.0            |
| 7         | 145       | 35.0        | 4.0            |
| 8         | 139       | 35.0        | 4.0            |
| 9         | 136       | 35.0        | 4.0            |

## 10 Aufwand

### 10.1 Protokollierte Größen

| Größe                                     | Verfügbarkeit                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token je Generierungsaufruf               | **nicht protokolliert** - weder `_stage_5_run_summary.json`, `_stage_5_all_runs.jsonl`, die `*.result.json` noch die `*.raw.txt` enthalten ein Feld zu Token-/Usage-Werten; `generate_tests_stage_1..5.py` setzen nur `max_tokens` und schreiben keine Usage-Daten |
| Wanduhrzeit je Generierungsaufruf         | **nicht protokolliert** - kein Zeitstempel je Iteration in den Protokolldateien                                                                                                                                                                                    |
| Ausführungszeit je Iteration (Playwright) | vorhanden: `*.result.json`, Feld `stats.duration` (ms) bzw. `suites[].specs[].tests[].results[].duration`                                                                                                                                                          |
| Ausführungszeit je Testdatei Stufen 1-4   | vorhanden: `_phase1_results.csv`, Spalte `duration_s`                                                                                                                                                                                                              |
| Ausführungszeit Endergebnis Stufe 5       | **nicht vorhanden** - `duration_s` ist in `_phase1_results.csv` der Stufe 5 in allen 500 Zeilen leer                                                                                                                                                               |

Ein Vergleich der *Generierungs*kosten zwischen Stufe 5 und den Stufen 1-4 ist mit den vorliegenden Daten nicht möglich. Vergleichbar ist nur die Zahl der Generierungsaufrufe und die Playwright-Ausführungszeit.

### 10.2 Zahl der Generierungsaufrufe

| Größe                                     | Wert  | Berechnung                                |
| ----------------------------------------- | ----- | ----------------------------------------- |
| Generierungsaufrufe Stufen 1-4 (je Stufe) | 500   | eine Generierung je Lauf/UC               |
| Generierungsaufrufe Stufe 5               | 2154  | Summe der Iterationen über alle 500 Läufe |
| Faktor gegenüber einer Stufe 1-4          | 4.31  | = Iterationen / 500                       |
| Iterationen je Lauf: Median               | 2.0   | -                                         |
| Iterationen je Lauf: Mittelwert           | 4.31  | -                                         |
| Iterationen je Lauf: Mittelwert bei PASS  | 2.22  | -                                         |
| Iterationen je Lauf: Mittelwert ohne PASS | 10.00 | -                                         |

### 10.3 Playwright-Ausführungszeit der Iterationen

| Größe                                       | Wert             |
| ------------------------------------------- | ---------------- |
| Iterationen mit Zeitwert                    | 2154             |
| Ausführungszeit je Iteration: Median        | 7.49 s           |
| Ausführungszeit je Iteration: Mittelwert    | 8.82 s           |
| Ausführungszeit je Iteration: Maximum       | 33.00 s          |
| Ausführungszeit je Lauf (Summe): Median     | 22.79 s          |
| Ausführungszeit je Lauf (Summe): Mittelwert | 38.01 s          |
| Ausführungszeit je Lauf (Summe): Maximum    | 305.52 s         |
| Ausführungszeit gesamt (alle Iterationen)   | 19007 s = 5.28 h |

Quelle: je Iteration `*.result.json`, `results[].duration` (ms → s), ersatzweise `stats.duration`.

Vergleich der Ausführungszeiten:

| Stufe                      | n Ausführungen | Median s | Mittelwert s | Summe s |
| -------------------------- | -------------- | -------- | ------------ | ------- |
| Stufe 1                    | 500            | 6.95     | 8.63         | 4317    |
| Stufe 2                    | 500            | 4.07     | 9.54         | 4772    |
| Stufe 3                    | 499            | 3.74     | 8.26         | 4121    |
| Stufe 4                    | 500            | 3.00     | 8.42         | 4210    |
| Stufe 5 (alle Iterationen) | 2154           | 7.49     | 8.82         | 19007   |

## 11 Auffälligkeiten (Stichpunkte)

- Höchste PASS-Rate aller Stufen (73,2 %); INFRA_FAIL fällt auf 15 von 500 Dateien (3,0 %), COMPILE_ERROR auf 0.
- Vier Use Cases erreichen in allen 50 Läufen PASS (uc-01, uc-02, uc-04, uc-05); kein Use Case bleibt bei 0 %.
- 146 Läufe (29,2 %) bestehen in Iteration 1, 136 Läufe erreichen 10 Iterationen - davon bestehen nur 2. Nach Iteration 2 sind 54,8 % aller Läufe erledigt.
- 72,4 % der 1654 Iterationsübergänge behalten die Fehlerklasse des Vorgängers. Aus ASSERTION_FAIL führen nur 9,2 % der Übergänge zu PASS, aus INFRA_FAIL 22,9 %.
- 87 Übergänge (5,3 %) sind Rückschritte, alle von ASSERTION_FAIL zu INFRA_FAIL (85) oder COMPILE_ERROR (2).
- 119 der 134 abgebrochenen Läufe enden in ASSERTION_FAIL; die drei größten Blöcke sind uc-03 (41 Abbrüche), uc-08 (36) und uc-07 (27).
- 491 der 1654 Iterationspaare (29,7 %) enthalten nach Entfernen von Kommentaren und Leerraum identischen Code; der Medianwert der Ähnlichkeit steigt von 0,910 (Iteration 0 → 1) auf 0,995 (Iteration 8 → 9).
- In 96 der 354 Läufe mit mehreren Iterationen (27,1 %) enthält die letzte Iteration weniger `expect(`-Aufrufe als die erste; bei den abgebrochenen Läufen sind es 50 von 134 (37,3 %).
- 17 Läufe tragen über alle 10 Iterationen dieselbe Fehlersignatur, 10 davon in uc-06.
- 106 der 223 Fehlersignaturgruppen treten ausschließlich in abgebrochenen Läufen auf (544 von 1788 Fehl-Iterationen).
- 122 Fehl-Iterationen melden abgefangene Pointer-Events, 143 nennen `map-container`, 70 nennen eine Chakra-Klasse, 153 einen nicht gefundenen oder mehrdeutigen `getByRole`-Locator.
- Token- und Generierungszeit sind nicht protokolliert; messbar ist nur der Faktor 4,31 an Generierungsaufrufen (2154 gegenüber 500).

## 12 Hypothesen (unbelegt)

- Die niedrige Behebungsquote aus ASSERTION_FAIL könnte damit zusammenhängen, dass die zurückgespielte Fehlermeldung auf 500 Zeichen gekürzt ist und die eigentliche Ursache (z. B. der Typfehler beim Vergleich) außerhalb dieses Fensters liegt.
- Der mit den Iterationen steigende Anteil identischen Codes könnte darauf hindeuten, dass ohne neue Information keine andere Lösung gefunden wird; belegt ist nur die Ähnlichkeit, nicht die Ursache.
- Dass uc-03 die meisten Abbrüche stellt, könnte am Rückgabetyp von `getMapZoomLevel` liegen; belegt ist nur das Fehlerbild `Matcher error: ... must be a number or bigint`.
