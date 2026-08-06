# Stufe 3 - Auswertung

Stufenverzeichnis: `src/app/llm/tests/stage_3_generated_ui_map/`  
Bezeichnung: Stufe 3 - generierte UI-Map + Map-Model-Helfer  
Erzeugt von: `src/app/llm/eval_extract/report_stages.py` (Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).

## 1 Bestandsaufnahme

### Dateien im Stufenverzeichnis

| Datei                         | Format        | kB   | Datensätze/Zeilen | Spalten bzw. Schlüssel                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_phase1_results.csv          | CSV           | 264  | 499               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `duration_s`, `error_summary`, `needs_review`                                                                                                                                                                                                                                                                                                                                      |
| \_phase2_judge.csv            | CSV           | 109  | 499               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `coverage_score`, `selector_score`, `map_interaction_score`, `assertion_score`, `vacuous_pass`                                                                                                                                                                                                                                                                                     |
| \_phase2_judge.json           | JSON (Liste)  | 729  | 499               | `assertion_score`, `coverage_score`, `exec_category`, `file`, `map_interaction_score`, `reasoning`, `run`, `selector_score`, `stage`, `uc_id`, `vacuous_pass`                                                                                                                                                                                                                                                                        |
| \_playwright_report.json      | JSON (Objekt) | 2157 | -                 | `config`, `suites`, `errors`, `stats`                                                                                                                                                                                                                                                                                                                                                                                                |
| \_stage_3_context.txt         | Text          | 12   | 204               | (Kontextdatei, kein Datensatz)                                                                                                                                                                                                                                                                                                                                                                                                       |
| plots/aggregates.csv          | CSV           | 1    | 11                | `uc_id`, `n`, `PASS`, `ASSERTION_FAIL`, `INFRA_FAIL`, `COMPILE_ERROR`, `GENERATION_ERROR`, `TIMEOUT`, `coverage_score_mean`, `coverage_score_median`, `coverage_score_std`, `selector_score_mean`, `selector_score_median`, `selector_score_std`, `map_interaction_score_mean`, `map_interaction_score_median`, `map_interaction_score_std`, `assertion_score_mean`, `assertion_score_median`, `assertion_score_std`, `vacuous_pass` |
| plots/exec_category_by_uc.png | PNG           | 50   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_distribution.png  | PNG           | 50   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_heatmap.png       | PNG           | 69   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Verzeichnisse

| Größe                                      | Wert |
| ------------------------------------------ | ---- |
| `run_*`-Verzeichnisse                      | 50   |
| `*.spec.ts`-Dateien (ohne `.exec.spec.ts`) | 499  |

## 2 Grundmenge

| Größe                                      | Wert | Quelle / Berechnung                       |
| ------------------------------------------ | ---- | ----------------------------------------- |
| Testdateien im Verzeichnis (`*.spec.ts`)   | 499  | `rglob('*.spec.ts')` im Stufenordner      |
| Zeilen in `_phase1_results.csv`            | 499  | eine Zeile je Testdatei                   |
| Läufe (`run`, distinct)                    | 50   | `_phase1_results.csv`, Spalte `run`       |
| Use Cases (`uc_id`, distinct)              | 10   | `_phase1_results.csv`, Spalte `uc_id`     |
| Soll (50 Läufe × 10 UC)                    | 500  | -                                         |
| fehlende Kombinationen Lauf/UC             | 1    | Sollmenge minus vorhandene `(run, uc_id)` |
| in Phase 2 bewertet (`_phase2_judge.json`) | 499  | Anzahl Einträge                           |
| Phase-1-Zeilen ohne Phase-2-Bewertung      | 0    | Mengendifferenz `(run, uc_id)`            |
| Phase-2-Einträge ohne Phase-1-Zeile        | 0    | Mengendifferenz `(run, uc_id)`            |

Fehlende Kombinationen namentlich: `run_20/uc-02`

Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: 1 (`run_16/uc-07` (GENERATION_ERROR))

## 3 Phase 1 (Ausführung)

#### Verteilung `exec_category`

| Kategorie        | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 178 | 35.7                   |
| ASSERTION_FAIL   | 184 | 36.9                   |
| INFRA_FAIL       | 133 | 26.7                   |
| COMPILE_ERROR    | 3   | 0.6                    |
| GENERATION_ERROR | 1   | 0.2                    |
| TIMEOUT          | 0   | 0.0                    |
| **Summe**        | 499 | 100.0                  |

Quelle: `_phase1_results.csv`, Spalte `exec_category`, `value_counts()`; Prozent = n / 499.

#### PASS-Rate je Use Case

| uc_id      | n   | PASS | PASS % | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR |
| ---------- | --- | ---- | ------ | -------------- | ---------- | ------------- | ---------------- |
| uc-01      | 50  | 50   | 100.0  | 0              | 0          | 0             | 0                |
| uc-02      | 49  | 0    | 0.0    | 2              | 47         | 0             | 0                |
| uc-03      | 50  | 2    | 4.0    | 48             | 0          | 0             | 0                |
| uc-04      | 50  | 33   | 66.0   | 2              | 15         | 0             | 0                |
| uc-05      | 50  | 37   | 74.0   | 3              | 10         | 0             | 0                |
| uc-06      | 50  | 4    | 8.0    | 40             | 6          | 0             | 0                |
| uc-07      | 50  | 5    | 10.0   | 33             | 9          | 2             | 1                |
| uc-08      | 50  | 8    | 16.0   | 36             | 6          | 0             | 0                |
| uc-09      | 50  | 11   | 22.0   | 10             | 29         | 0             | 0                |
| uc-10      | 50  | 28   | 56.0   | 10             | 11         | 1             | 0                |
| **gesamt** | 499 | 178  | 35.7   | 184            | 133        | 3             | 1                |

Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, PASS % = PASS / n je UC.

#### Streuung der PASS-Rate über die Läufe

| Größe                                                      | Wert                |
| ---------------------------------------------------------- | ------------------- |
| Anzahl Läufe                                               | 50                  |
| PASS-Rate je Lauf: Minimum                                 | 10.0 % (run_35)     |
| PASS-Rate je Lauf: Maximum                                 | 70.0 % (run_43)     |
| PASS-Rate je Lauf: Median                                  | 40.0 %              |
| PASS-Rate je Lauf: Mittelwert                              | 35.6 %              |
| PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1) | 11.41 Prozentpunkte |

Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit `exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber Min/Max/Median/Mittelwert/Standardabweichung.

#### Use Cases, die zwischen PASS und Fehlschlag springen

| uc_id | PASS % | PASS | Fehlschlag | Fehlerkategorien der Fehlschläge                                         |
| ----- | ------ | ---- | ---------- | ------------------------------------------------------------------------ |
| uc-03 | 4.0    | 2    | 48         | ASSERTION_FAIL: 48                                                       |
| uc-04 | 66.0   | 33   | 17         | INFRA_FAIL: 15, ASSERTION_FAIL: 2                                        |
| uc-05 | 74.0   | 37   | 13         | INFRA_FAIL: 10, ASSERTION_FAIL: 3                                        |
| uc-06 | 8.0    | 4    | 46         | ASSERTION_FAIL: 40, INFRA_FAIL: 6                                        |
| uc-07 | 10.0   | 5    | 45         | ASSERTION_FAIL: 33, INFRA_FAIL: 9, COMPILE_ERROR: 2, GENERATION_ERROR: 1 |
| uc-08 | 16.0   | 8    | 42         | ASSERTION_FAIL: 36, INFRA_FAIL: 6                                        |
| uc-09 | 22.0   | 11   | 39         | INFRA_FAIL: 29, ASSERTION_FAIL: 10                                       |
| uc-10 | 56.0   | 28   | 22         | INFRA_FAIL: 11, ASSERTION_FAIL: 10, COMPILE_ERROR: 1                     |

Immer PASS: uc-01. Nie PASS: uc-02.

Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.

#### `duration_s` (Sekunden)

| Größe        | Wert  |
| ------------ | ----- |
| n mit Wert   | 499   |
| Minimum      | 0.00  |
| 25 %-Quantil | 2.33  |
| Median       | 3.74  |
| Mittelwert   | 8.26  |
| 75 %-Quantil | 7.34  |
| 90 %-Quantil | 30.03 |
| 95 %-Quantil | 30.03 |
| Maximum      | 30.04 |

Median je `exec_category`:

| exec_category    | n   | Median | Maximum |
| ---------------- | --- | ------ | ------- |
| ASSERTION_FAIL   | 184 | 7.29   | 30.04   |
| COMPILE_ERROR    | 3   | 0.00   | 0.00    |
| GENERATION_ERROR | 1   | 0.00   | 0.00    |
| INFRA_FAIL       | 133 | 6.14   | 30.04   |
| PASS             | 178 | 2.37   | 5.65    |

Ausreißer (`duration_s` > Median + 3 × IQR = 18.76 s): 83 Zeilen. Am Playwright-Testtimeout (`duration_s` ≥ 30,00 s): 83 Zeilen (16.6 %). `duration_s` = 0,00 s: 4 Zeilen (nicht ausgeführt, i. d. R. GENERATION_ERROR).

| run    | uc_id | duration_s | exec_category  |
| ------ | ----- | ---------- | -------------- |
| run_07 | uc-09 | 30.04      | INFRA_FAIL     |
| run_08 | uc-05 | 30.04      | INFRA_FAIL     |
| run_03 | uc-09 | 30.04      | INFRA_FAIL     |
| run_33 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_37 | uc-09 | 30.04      | INFRA_FAIL     |
| run_35 | uc-10 | 30.04      | ASSERTION_FAIL |
| run_34 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_46 | uc-05 | 30.04      | ASSERTION_FAIL |
| run_49 | uc-09 | 30.04      | ASSERTION_FAIL |
| run_45 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_42 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_23 | uc-09 | 30.04      | ASSERTION_FAIL |
| run_25 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_28 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_27 | uc-07 | 30.04      | ASSERTION_FAIL |

(maximal 15 Zeilen gezeigt)

#### Gruppierte `error_summary` (nur Zeilen ohne PASS)

Nicht-PASS-Zeilen: 321; daraus 89 Signaturgruppen. Die 15 häufigsten:

| n   | % der Fehlschläge | Signatur                                                                                                                                                 | exec_category              | Use Cases (n)                                                                      |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| 67  | 20.9              | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                             | ASSERTION_FAIL, INFRA_FAIL | uc-02(12), uc-04(2), uc-05(6), uc-06(4), uc-07(16), uc-08(12), uc-09(10), uc-10(5) |
| 28  | 8.7               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                                            | ASSERTION_FAIL             | uc-03(28)                                                                          |
| 27  | 8.4               | Error: <Q> does not support <Q> matcher.                                                                                                                 | INFRA_FAIL                 | uc-02(21), uc-09(4), uc-10(2)                                                      |
| 23  | 7.2               | Error: expect(received).toBeTruthy() \| Received: undefined                                                                                              | ASSERTION_FAIL             | uc-06(23)                                                                          |
| 16  | 5.0               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined           | ASSERTION_FAIL             | uc-03(16)                                                                          |
| 13  | 4.0               | Error: expect(received).toBeDefined() \| Received: undefined                                                                                             | ASSERTION_FAIL             | uc-03(2), uc-06(10), uc-07(1)                                                      |
| 11  | 3.4               | Error: expect(received).toBe(expected) // Object.is equality \| Received: false                                                                          | ASSERTION_FAIL             | uc-07(6), uc-08(1), uc-09(3), uc-10(1)                                             |
| 7   | 2.2               | Error: expect(locator).toBeVisible() failed \| Locator: getByText(<Q>) \| Error: strict mode violation: getByText(<Q>) resolved to <N> elements:         | INFRA_FAIL                 | uc-05(2), uc-07(5)                                                                 |
| 7   | 2.2               | Test timeout of 30000ms exceeded. \| Error: locator.isChecked: Test timeout of 30000ms exceeded.                                                         | INFRA_FAIL                 | uc-05(1), uc-09(6)                                                                 |
| 5   | 1.6               | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: element(s) not found                                     | INFRA_FAIL                 | uc-02(3), uc-05(1), uc-09(1)                                                       |
| 5   | 1.6               | Test timeout of 30000ms exceeded. \| Error: locator.check: Test timeout of 30000ms exceeded.                                                             | INFRA_FAIL                 | uc-09(5)                                                                           |
| 5   | 1.6               | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>) \| Error: element(s) not found                                                  | INFRA_FAIL                 | uc-06(1), uc-07(1), uc-08(1), uc-09(2)                                             |
| 4   | 1.2               | Error: expect(received).toEqual(expected) // deep equality                                                                                               | ASSERTION_FAIL             | uc-07(4)                                                                           |
| 4   | 1.2               | Error: expect(locator).not.toBeChecked() failed \| Locator: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByTestId( | INFRA_FAIL                 | uc-04(4)                                                                           |
| 4   | 1.2               | Error: expect(locator).toHaveCount(expected) failed \| Locator: getByTestId(<PATH>\d+/) \| Received: <N>                                                 | ASSERTION_FAIL             | uc-06(4)                                                                           |

Gruppierungsregel (`common.error_signature`): ANSI entfernen; Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste Zeile plus bis zu drei ursachenkonkretisierende Zeilen (`Error:`, `Locator:`, `Matcher error`, `Received`, `Expected pattern/string/substring`, `Cannot find module`, `waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.

`needs_review = true`: 3 Zeilen (`run_08/uc-10` → COMPILE_ERROR, `run_40/uc-07` → COMPILE_ERROR, `run_50/uc-07` → COMPILE_ERROR)

## 4 Phase 2 (Judge-Bewertung)

#### Score-Verteilung je Dimension

| Dimension       | 1   | 2   | 3   | 4   | n numerisch | Median | Mittelwert | Std (ddof=1) | `n/a` | Wert fehlt |
| --------------- | --- | --- | --- | --- | ----------- | ------ | ---------- | ------------ | ----- | ---------- |
| coverage        | 0   | 3   | 132 | 363 | 498         | 4.0    | 3.72       | 0.46         | 0     | 1          |
| selector        | 45  | 111 | 78  | 264 | 498         | 4.0    | 3.13       | 1.05         | 0     | 1          |
| map_interaction | 0   | 104 | 79  | 66  | 249         | 3.0    | 2.85       | 0.81         | 249   | 1          |
| assertion       | 0   | 24  | 169 | 305 | 498         | 4.0    | 3.56       | 0.59         | 0     | 1          |

Quelle: `_phase2_judge.json` (499 Einträge). `n/a` = literaler Wert `"n/a"`; "Wert fehlt" = Schlüssel `null`/nicht gesetzt. Median/Mittelwert nur über numerische Werte.

#### `map_interaction`: tatsächlicher Anwendungsbereich

| uc_id | in MAP_UCS (Prompt) | n   | numerisch bewertet | `n/a` | Wert fehlt | Median | Mittelwert |
| ----- | ------------------- | --- | ------------------ | ----- | ---------- | ------ | ---------- |
| uc-01 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-02 | nein                | 49  | 0                  | 49    | 0          | -      | -          |
| uc-03 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-04 | ja                  | 50  | 50                 | 0     | 0          | 4.0    | 4.00       |
| uc-05 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-06 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 3.10       |
| uc-07 | ja                  | 50  | 49                 | 0     | 1          | 2.0    | 2.29       |
| uc-08 | ja                  | 50  | 50                 | 0     | 0          | 2.0    | 2.24       |
| uc-09 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-10 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 2.60       |

`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: `uc-04`, `uc-06`, `uc-07`, `uc-08`, `uc-10`.

Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.

#### Scores je Use Case und Dimension

| uc_id | n   | coverage Md | coverage Ø | coverage σ | selector Md | selector Ø | selector σ | map_interaction Md | map_interaction Ø | map_interaction σ | assertion Md | assertion Ø | assertion σ |
| ----- | --- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| uc-01 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 4.0          | 4.00        | 0.00        |
| uc-02 | 49  | 3.0         | 3.10       | 0.31       | 1.0         | 1.14       | 0.35       | n/a                | n/a               | -                 | 4.0          | 3.57        | 0.50        |
| uc-03 | 50  | 4.0         | 3.98       | 0.14       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 3.0          | 3.02        | 0.25        |
| uc-04 | 50  | 4.0         | 3.86       | 0.35       | 4.0         | 3.40       | 0.90       | 4.0                | 4.00              | 0.00              | 4.0          | 3.98        | 0.14        |
| uc-05 | 50  | 4.0         | 3.90       | 0.30       | 4.0         | 3.52       | 0.79       | n/a                | n/a               | -                 | 4.0          | 3.92        | 0.27        |
| uc-06 | 50  | 4.0         | 4.00       | 0.00       | 2.0         | 2.96       | 1.01       | 3.0                | 3.10              | 0.51              | 3.0          | 3.06        | 0.24        |
| uc-07 | 50  | 4.0         | 3.92       | 0.40       | 4.0         | 3.51       | 0.74       | 2.0                | 2.29              | 0.68              | 4.0          | 3.53        | 0.84        |
| uc-08 | 50  | 4.0         | 3.58       | 0.50       | 3.0         | 2.98       | 0.14       | 2.0                | 2.24              | 0.43              | 3.0          | 2.80        | 0.40        |
| uc-09 | 50  | 3.0         | 3.34       | 0.48       | 2.0         | 2.18       | 0.56       | n/a                | n/a               | -                 | 4.0          | 3.98        | 0.14        |
| uc-10 | 50  | 4.0         | 3.54       | 0.54       | 4.0         | 3.54       | 0.84       | 3.0                | 2.60              | 0.53              | 4.0          | 3.78        | 0.51        |

Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), jeweils nur über numerische Werte.

#### `vacuous_pass`

| Größe                                                     | n   | % der Stufengrundmenge |
| --------------------------------------------------------- | --- | ---------------------- |
| `vacuous_pass = true` laut Datei (Rohtyp: str)            | 10  | 2.0                    |
| nach Definition erwartet (Phase-1-PASS und assertion ≤ 2) | 10  | 2.0                    |
| Abweichungen                                              | 0   | 0.0                    |

`vacuous_pass` je Use Case:

| uc_id | n   | vacuous_pass | %    |
| ----- | --- | ------------ | ---- |
| uc-01 | 50  | 0            | 0.0  |
| uc-02 | 49  | 0            | 0.0  |
| uc-03 | 50  | 0            | 0.0  |
| uc-04 | 50  | 0            | 0.0  |
| uc-05 | 50  | 0            | 0.0  |
| uc-06 | 50  | 0            | 0.0  |
| uc-07 | 50  | 1            | 2.0  |
| uc-08 | 50  | 8            | 16.0 |
| uc-09 | 50  | 0            | 0.0  |
| uc-10 | 50  | 1            | 2.0  |

#### Wiederkehrende Muster in den Judge-Begründungen

| Muster                                           | Dateien | % der Stufe | Treffer je Dimension                             | Beispieldatei                                                                                                        |
| ------------------------------------------------ | ------- | ----------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Selektor erfunden / existiert nicht              | 197     | 39.5        | selector: 156, map_interaction: 42, assertion: 4 | `stage_3_generated_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`                |
| force: true / erzwungener Klick                  | 109     | 21.8        | selector: 109                                    | `stage_3_generated_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`   |
| map-container / Canvas in der Begründung erwähnt | 100     | 20.0        | selector: 88, map_interaction: 60                | `stage_3_generated_ui_map/run_01/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`                    |
| Assertion prüft das falsche Element              | 49      | 9.8         | selector: 49, assertion: 40                      | `stage_3_generated_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                      |
| Netzwerk-/Request-Nachweis erwähnt               | 49      | 9.8         | selector: 48, map_interaction: 1, assertion: 4   | `stage_3_generated_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                               |
| \_\_openPioneerMap erwähnt                       | 34      | 6.8         | map_interaction: 34                              | `stage_3_generated_ui_map/run_01/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts` |
| strict-mode / mehrdeutiger Selektor              | 14      | 2.8         | selector: 14                                     | `stage_3_generated_ui_map/run_03/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`     |
| Assertion trivial / immer wahr                   | 10      | 2.0         | assertion: 10                                    | `stage_3_generated_ui_map/run_05/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                      |
| erfundene Test-ID (getByTestId)                  | 0       | 0.0         |                                                  | -                                                                                                                    |
| Importpfad / Modul nicht auflösbar               | 0       | 0.0         |                                                  | -                                                                                                                    |
| kein Zugriff auf das Kartenmodell                | 0       | 0.0         |                                                  | -                                                                                                                    |
| fehlende Wartebedingung                          | 0       | 0.0         |                                                  | -                                                                                                                    |
| Vorbedingung nicht geprüft (Regel 22)            | 0       | 0.0         |                                                  | -                                                                                                                    |
| Assertion entfernt / abgeschwächt                | 0       | 0.0         |                                                  | -                                                                                                                    |

Zählweise: Regex-Suche (case-insensitive) über die vier `reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei zählt einmal, wenn mindestens eine Dimension trifft. Die Regex-Definitionen stehen in `src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).

#### Auffälligkeiten in der Bewertung selbst

| Prüfung                                                                | Befund                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| identische `coverage`-Begründung                                       | 17 Textvarianten betreffen 496 Dateien; häufigster Text 50× |
| identische `selector`-Begründung                                       | 25 Textvarianten betreffen 494 Dateien; häufigster Text 49× |
| identische `map_interaction`-Begründung                                | 17 Textvarianten betreffen 497 Dateien; häufigster Text 50× |
| identische `assertion`-Begründung                                      | 21 Textvarianten betreffen 494 Dateien; häufigster Text 50× |
| Einträge ohne alle vier `reasoning`-Schlüssel                          | 0                                                           |
| Einträge mit fehlendem Score in coverage/selector/assertion            | 1 (exec_category: GENERATION_ERROR: 1)                      |
| Einträge mit fehlendem `map_interaction_score` (weder Zahl noch `n/a`) | 1 (`run_16/uc-07`)                                          |
| selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“         | 0 Dateien; Beispiel: -                                      |
| assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“          | 0 Dateien; Beispiel: -                                      |
| coverage_score = 4 trotz Begründung „fehlt/unvollständig“              | 0 Dateien; Beispiel: -                                      |
| map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“ | 0 Dateien; Beispiel: -                                      |

Häufigste wörtlich identische Begründungstexte:

| Dimension       | n Dateien | Use Cases | Text (gekürzt)                                                                                                                                                             |
| --------------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | 50        | uc-01     | Beide UC-Schritte (Klick zum Ausblenden, Klick zum Wieder-Einblenden) werden unbedingt ausgefuehrt und beide erwarteten Ergebnisse werden direkt am Panel geprueft. Damit  |
| coverage        | 50        | uc-06     | Der Kartenklick wird ausgefuehrt und alle drei erwarteten Ergebnisse (Highlight an der geklickten Position, Forecast-Bereich im Info-Panel, 24 Eintraege) sind im Code adr |
| selector        | 49        | uc-08     | Toggle, Panel und Kartencontainer werden ueber die realen Test-IDs gegriffen; der Laengenwert wird aber in 'measurement'/'measurement-panel' gesucht, waehrend ihn die App |
| selector        | 48        | uc-01     | Verwendet die realen Test-IDs 'layer-switcher-toggle' und 'layer-switcher' wie der Referenztest. Keine erfundenen Selektoren.                                              |
| map_interaction | 50        | uc-01     | uc-01 ist nicht in MAP_UCS gelistet und erfordert keine kartenspezifische Interaktion.                                                                                     |
| map_interaction | 50        | uc-03     | uc-03 ist nicht in MAP_UCS gelistet und erfordert keine kartenspezifische Interaktion.                                                                                     |
| assertion       | 50        | uc-01     | Beide erwarteten Ergebnisse werden ueber den zustandstragenden Panel-Zustand geprueft (not.toBeVisible nach dem ersten, toBeVisible nach dem zweiten Klick). Bei defekter  |
| assertion       | 49        | uc-04     | Prueft beide erwarteten Ergebnisse zustandstragend und unbedingt: toBeChecked() am Toggle und den wartenden Map-Model-Poll isLayerRendered('UV-Index'). Bei ausbleibender  |

## 5 Auffälligkeiten (Stichpunkte)

- Erste Stufe mit einem Use Case bei 100 % PASS (uc-01) und gleichzeitig einem bei 0 % (uc-02).
- `map_interaction_score` springt auf Median 3 (Mittelwert 2,85) und erreicht erstmals den Wert 4 (66 Dateien); `selector_score` steigt auf Median 4.
- Bei uc-02 sind 47 der 49 Läufe INFRA_FAIL; die häufigste Signatur (21 Fälle) ist `expect.poll() does not support "resolves" matcher` - eine unzulässige Matcher-Kombination, kein Selektorproblem.
- uc-03 fällt auf 4 % PASS: alle 48 Fehlschläge sind ASSERTION_FAIL, davon 46 mit `Matcher error: ... must be a number or bigint`.
- Alle drei COMPILE_ERROR-Zeilen sind Syntaxdefekte im generierten Code (fehlendes `//`, Leerzeichen im Identifier `__open pioneerMap`) und keine Importfehler.
- 416 der 499 Dateien (83,4 %) importieren die Helferdatei, alle mit dem identischen Pfad `../../../map-model-helpers`; kein abweichender Pfad.
- `run_20/uc-02` fehlt vollständig (keine Testdatei, keine CSV-Zeile, keine Judge-Bewertung).

## 6 Hypothesen (unbelegt)

- Der Sprung von `map_interaction_score` könnte auf die im Kontext mitgelieferte Helferdatei zurückgehen (83,4 % der Dateien importieren sie).
- Der Einbruch bei uc-02 und uc-03 könnte damit zusammenhängen, dass die Helferfunktionen `Promise`-Werte liefern und im Kontext nicht erklärt ist, dass `expect.poll` sie bereits auflöst.
