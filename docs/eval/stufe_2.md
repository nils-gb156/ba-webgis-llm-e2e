# Stufe 2 - Auswertung

Stufenverzeichnis: `src/app/llm/tests/stage_2_accessibility_snapshot/`  
Bezeichnung: Stufe 2 - Accessibility-Snapshot  
Erzeugt von: `src/app/llm/eval_extract/report_stages.py` (Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).

## 1 Bestandsaufnahme

### Dateien im Stufenverzeichnis

| Datei                         | Format        | kB   | Datensätze/Zeilen | Spalten bzw. Schlüssel                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_phase1_results.csv          | CSV           | 302  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `duration_s`, `error_summary`, `needs_review`                                                                                                                                                                                                                                                                                                                                      |
| \_phase2_judge.csv            | CSV           | 115  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `coverage_score`, `selector_score`, `map_interaction_score`, `assertion_score`, `vacuous_pass`                                                                                                                                                                                                                                                                                     |
| \_phase2_judge.json           | JSON (Liste)  | 791  | 500               | `assertion_score`, `coverage_score`, `exec_category`, `file`, `map_interaction_score`, `reasoning`, `run`, `selector_score`, `stage`, `uc_id`, `vacuous_pass`                                                                                                                                                                                                                                                                        |
| \_playwright_report.json      | JSON (Objekt) | 2497 | -                 | `config`, `suites`, `errors`, `stats`                                                                                                                                                                                                                                                                                                                                                                                                |
| \_stage_2_context.txt         | Text          | 3    | 98                | (Kontextdatei, kein Datensatz)                                                                                                                                                                                                                                                                                                                                                                                                       |
| plots/aggregates.csv          | CSV           | 1    | 11                | `uc_id`, `n`, `PASS`, `ASSERTION_FAIL`, `INFRA_FAIL`, `COMPILE_ERROR`, `GENERATION_ERROR`, `TIMEOUT`, `coverage_score_mean`, `coverage_score_median`, `coverage_score_std`, `selector_score_mean`, `selector_score_median`, `selector_score_std`, `map_interaction_score_mean`, `map_interaction_score_median`, `map_interaction_score_std`, `assertion_score_mean`, `assertion_score_median`, `assertion_score_std`, `vacuous_pass` |
| plots/exec_category_by_uc.png | PNG           | 52   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_distribution.png  | PNG           | 52   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_heatmap.png       | PNG           | 71   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Verzeichnisse

| Größe                                      | Wert |
| ------------------------------------------ | ---- |
| `run_*`-Verzeichnisse                      | 50   |
| `*.spec.ts`-Dateien (ohne `.exec.spec.ts`) | 500  |

## 2 Grundmenge

| Größe                                      | Wert | Quelle / Berechnung                       |
| ------------------------------------------ | ---- | ----------------------------------------- |
| Testdateien im Verzeichnis (`*.spec.ts`)   | 500  | `rglob('*.spec.ts')` im Stufenordner      |
| Zeilen in `_phase1_results.csv`            | 500  | eine Zeile je Testdatei                   |
| Läufe (`run`, distinct)                    | 50   | `_phase1_results.csv`, Spalte `run`       |
| Use Cases (`uc_id`, distinct)              | 10   | `_phase1_results.csv`, Spalte `uc_id`     |
| Soll (50 Läufe × 10 UC)                    | 500  | -                                         |
| fehlende Kombinationen Lauf/UC             | 0    | Sollmenge minus vorhandene `(run, uc_id)` |
| in Phase 2 bewertet (`_phase2_judge.json`) | 500  | Anzahl Einträge                           |
| Phase-1-Zeilen ohne Phase-2-Bewertung      | 0    | Mengendifferenz `(run, uc_id)`            |
| Phase-2-Einträge ohne Phase-1-Zeile        | 0    | Mengendifferenz `(run, uc_id)`            |

Fehlende Kombinationen: keine.

Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: 12 (`run_04/uc-07` (GENERATION_ERROR), `run_05/uc-07` (GENERATION_ERROR), `run_07/uc-07` (GENERATION_ERROR), `run_07/uc-10` (GENERATION_ERROR), `run_10/uc-07` (GENERATION_ERROR), `run_13/uc-03` (GENERATION_ERROR), `run_16/uc-08` (GENERATION_ERROR), `run_21/uc-08` (GENERATION_ERROR), `run_22/uc-03` (GENERATION_ERROR), `run_38/uc-07` (GENERATION_ERROR), `run_41/uc-07` (GENERATION_ERROR), `run_46/uc-03` (GENERATION_ERROR))

## 3 Phase 1 (Ausführung)

#### Verteilung `exec_category`

| Kategorie        | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 110 | 22.0                   |
| ASSERTION_FAIL   | 166 | 33.2                   |
| INFRA_FAIL       | 211 | 42.2                   |
| COMPILE_ERROR    | 1   | 0.2                    |
| GENERATION_ERROR | 12  | 2.4                    |
| TIMEOUT          | 0   | 0.0                    |
| **Summe**        | 500 | 100.0                  |

Quelle: `_phase1_results.csv`, Spalte `exec_category`, `value_counts()`; Prozent = n / 500.

#### PASS-Rate je Use Case

| uc_id      | n   | PASS | PASS % | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR |
| ---------- | --- | ---- | ------ | -------------- | ---------- | ------------- | ---------------- |
| uc-01      | 50  | 41   | 82.0   | 1              | 8          | 0             | 0                |
| uc-02      | 50  | 11   | 22.0   | 3              | 36         | 0             | 0                |
| uc-03      | 50  | 16   | 32.0   | 19             | 12         | 0             | 3                |
| uc-04      | 50  | 2    | 4.0    | 2              | 46         | 0             | 0                |
| uc-05      | 50  | 33   | 66.0   | 13             | 4          | 0             | 0                |
| uc-06      | 50  | 0    | 0.0    | 46             | 4          | 0             | 0                |
| uc-07      | 50  | 1    | 2.0    | 30             | 12         | 1             | 6                |
| uc-08      | 50  | 0    | 0.0    | 30             | 18         | 0             | 2                |
| uc-09      | 50  | 6    | 12.0   | 7              | 37         | 0             | 0                |
| uc-10      | 50  | 0    | 0.0    | 15             | 34         | 0             | 1                |
| **gesamt** | 500 | 110  | 22.0   | 166            | 211        | 1             | 12               |

Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, PASS % = PASS / n je UC.

#### Streuung der PASS-Rate über die Läufe

| Größe                                                      | Wert                                    |
| ---------------------------------------------------------- | --------------------------------------- |
| Anzahl Läufe                                               | 50                                      |
| PASS-Rate je Lauf: Minimum                                 | 0.0 % (run_06)                          |
| PASS-Rate je Lauf: Maximum                                 | 40.0 % (run_03, run_07, run_09, run_36) |
| PASS-Rate je Lauf: Median                                  | 20.0 %                                  |
| PASS-Rate je Lauf: Mittelwert                              | 22.0 %                                  |
| PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1) | 8.81 Prozentpunkte                      |

Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit `exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber Min/Max/Median/Mittelwert/Standardabweichung.

#### Use Cases, die zwischen PASS und Fehlschlag springen

| uc_id | PASS % | PASS | Fehlschlag | Fehlerkategorien der Fehlschläge                                          |
| ----- | ------ | ---- | ---------- | ------------------------------------------------------------------------- |
| uc-01 | 82.0   | 41   | 9          | INFRA_FAIL: 8, ASSERTION_FAIL: 1                                          |
| uc-02 | 22.0   | 11   | 39         | INFRA_FAIL: 36, ASSERTION_FAIL: 3                                         |
| uc-03 | 32.0   | 16   | 34         | ASSERTION_FAIL: 19, INFRA_FAIL: 12, GENERATION_ERROR: 3                   |
| uc-04 | 4.0    | 2    | 48         | INFRA_FAIL: 46, ASSERTION_FAIL: 2                                         |
| uc-05 | 66.0   | 33   | 17         | ASSERTION_FAIL: 13, INFRA_FAIL: 4                                         |
| uc-07 | 2.0    | 1    | 49         | ASSERTION_FAIL: 30, INFRA_FAIL: 12, GENERATION_ERROR: 6, COMPILE_ERROR: 1 |
| uc-09 | 12.0   | 6    | 44         | INFRA_FAIL: 37, ASSERTION_FAIL: 7                                         |

Immer PASS: keine. Nie PASS: uc-06, uc-08, uc-10.

Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.

#### `duration_s` (Sekunden)

| Größe        | Wert   |
| ------------ | ------ |
| n mit Wert   | 500    |
| Minimum      | 0.00   |
| 25 %-Quantil | 2.38   |
| Median       | 4.07   |
| Mittelwert   | 9.54   |
| 75 %-Quantil | 8.77   |
| 90 %-Quantil | 30.05  |
| 95 %-Quantil | 30.05  |
| Maximum      | 124.38 |

Median je `exec_category`:

| exec_category    | n   | Median | Maximum |
| ---------------- | --- | ------ | ------- |
| ASSERTION_FAIL   | 166 | 7.59   | 30.16   |
| COMPILE_ERROR    | 1   | 0.00   | 0.00    |
| GENERATION_ERROR | 12  | 0.00   | 0.00    |
| INFRA_FAIL       | 211 | 3.37   | 124.38  |
| PASS             | 110 | 2.50   | 12.06   |

Ausreißer (`duration_s` > Median + 3 × IQR = 23.24 s): 95 Zeilen. Am Playwright-Testtimeout (`duration_s` ≥ 30,00 s): 95 Zeilen (19.0 %). `duration_s` = 0,00 s: 13 Zeilen (nicht ausgeführt, i. d. R. GENERATION_ERROR).

| run    | uc_id | duration_s | exec_category  |
| ------ | ----- | ---------- | -------------- |
| run_33 | uc-05 | 124.38     | INFRA_FAIL     |
| run_31 | uc-02 | 119.81     | INFRA_FAIL     |
| run_29 | uc-05 | 30.16      | ASSERTION_FAIL |
| run_24 | uc-09 | 30.10      | INFRA_FAIL     |
| run_32 | uc-10 | 30.07      | ASSERTION_FAIL |
| run_22 | uc-05 | 30.07      | ASSERTION_FAIL |
| run_09 | uc-07 | 30.06      | ASSERTION_FAIL |
| run_20 | uc-10 | 30.06      | INFRA_FAIL     |
| run_22 | uc-07 | 30.06      | ASSERTION_FAIL |
| run_18 | uc-09 | 30.06      | INFRA_FAIL     |
| run_17 | uc-09 | 30.06      | ASSERTION_FAIL |
| run_31 | uc-10 | 30.06      | INFRA_FAIL     |
| run_30 | uc-07 | 30.06      | ASSERTION_FAIL |
| run_30 | uc-05 | 30.06      | ASSERTION_FAIL |
| run_28 | uc-07 | 30.06      | ASSERTION_FAIL |

(maximal 15 Zeilen gezeigt)

#### Gruppierte `error_summary` (nur Zeilen ohne PASS)

Nicht-PASS-Zeilen: 390; daraus 102 Signaturgruppen. Die 15 häufigsten:

| n   | % der Fehlschläge | Signatur                                                                                                                                                 | exec_category              | Use Cases (n)                                                                     |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| 77  | 19.7              | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                             | ASSERTION_FAIL, INFRA_FAIL | uc-02(2), uc-04(2), uc-05(12), uc-06(1), uc-07(29), uc-08(3), uc-09(7), uc-10(21) |
| 38  | 9.7               | Error: expect(received).toBe(expected) // Object.is equality \| Received: <N>                                                                            | ASSERTION_FAIL             | uc-06(34), uc-10(4)                                                               |
| 27  | 6.9               | Error: expect(locator).toHaveValue(expected) failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: Not an input element                             | INFRA_FAIL                 | uc-02(27)                                                                         |
| 21  | 5.4               | Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                                              | INFRA_FAIL                 | uc-04(21)                                                                         |
| 13  | 3.3               | Error: expect(locator).not.toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByRole(<Q>, { name: <Q> }) | INFRA_FAIL                 | uc-04(13)                                                                         |
| 11  | 2.8               | Error: expect(received).toBeLessThan(expected) \| Received: <N>                                                                                          | ASSERTION_FAIL             | uc-03(11)                                                                         |
| 8   | 2.1               | Test timeout of 30000ms exceeded. \| Error: page.waitForEvent: Test timeout of 30000ms exceeded. \| waiting for event <Q>                                | INFRA_FAIL                 | uc-09(8)                                                                          |
| 8   | 2.1               | Unbalancierte Klammern (geschweift: +<N>, rund: +<N>) -> Datei wahrscheinlich abgeschnitten                                                              | GENERATION_ERROR           | uc-03(3), uc-07(2), uc-08(2), uc-10(1)                                            |
| 8   | 2.1               | Error: expect(locator).toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: Not a checkbox or radio button                           | INFRA_FAIL                 | uc-01(3), uc-02(3), uc-07(1), uc-09(1)                                            |
| 7   | 1.8               | Error: expect(locator).not.toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: Not a checkbox or radio button                       | INFRA_FAIL                 | uc-01(1), uc-07(6)                                                                |
| 7   | 1.8               | Error: expect(received).toBeTruthy() \| Received: false                                                                                                  | ASSERTION_FAIL             | uc-07(1), uc-08(4), uc-09(1), uc-10(1)                                            |
| 7   | 1.8               | Error: expect(received).toBeGreaterThanOrEqual(expected) \| Received: <N>                                                                                | ASSERTION_FAIL             | uc-06(5), uc-10(2)                                                                |
| 6   | 1.5               | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).locator(<Q>).first() \| Error: element(s) not found                             | INFRA_FAIL                 | uc-10(6)                                                                          |
| 6   | 1.5               | Error: expect(locator).toBeChecked({ checked: false }) failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByRole(<Q>,  | INFRA_FAIL                 | uc-04(6)                                                                          |
| 6   | 1.5               | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: element(s) not found                                     | INFRA_FAIL                 | uc-09(6)                                                                          |

Gruppierungsregel (`common.error_signature`): ANSI entfernen; Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste Zeile plus bis zu drei ursachenkonkretisierende Zeilen (`Error:`, `Locator:`, `Matcher error`, `Received`, `Expected pattern/string/substring`, `Cannot find module`, `waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.

`needs_review = true`: 1 Zeilen (`run_46/uc-07` → COMPILE_ERROR)

## 4 Phase 2 (Judge-Bewertung)

#### Score-Verteilung je Dimension

| Dimension       | 1   | 2   | 3   | 4   | n numerisch | Median | Mittelwert | Std (ddof=1) | `n/a` | Wert fehlt |
| --------------- | --- | --- | --- | --- | ----------- | ------ | ---------- | ------------ | ----- | ---------- |
| coverage        | 0   | 0   | 132 | 356 | 488         | 4.0    | 3.73       | 0.44         | 0     | 12         |
| selector        | 0   | 154 | 181 | 153 | 488         | 3.0    | 3.00       | 0.79         | 0     | 12         |
| map_interaction | 105 | 90  | 46  | 0   | 241         | 2.0    | 1.76       | 0.75         | 250   | 9          |
| assertion       | 13  | 95  | 130 | 250 | 488         | 4.0    | 3.26       | 0.86         | 0     | 12         |

Quelle: `_phase2_judge.json` (500 Einträge). `n/a` = literaler Wert `"n/a"`; "Wert fehlt" = Schlüssel `null`/nicht gesetzt. Median/Mittelwert nur über numerische Werte.

#### `map_interaction`: tatsächlicher Anwendungsbereich

| uc_id | in MAP_UCS (Prompt) | n   | numerisch bewertet | `n/a` | Wert fehlt | Median | Mittelwert |
| ----- | ------------------- | --- | ------------------ | ----- | ---------- | ------ | ---------- |
| uc-01 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-02 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-03 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-04 | ja                  | 50  | 50                 | 0     | 0          | 1.0    | 1.00       |
| uc-05 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-06 | ja                  | 50  | 50                 | 0     | 0          | 2.0    | 2.20       |
| uc-07 | ja                  | 50  | 44                 | 0     | 6          | 2.0    | 1.89       |
| uc-08 | ja                  | 50  | 48                 | 0     | 2          | 3.0    | 2.73       |
| uc-09 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-10 | ja                  | 50  | 49                 | 0     | 1          | 1.0    | 1.00       |

`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: `uc-04`, `uc-06`, `uc-07`, `uc-08`, `uc-10`.

Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.

#### Scores je Use Case und Dimension

| uc_id | n   | coverage Md | coverage Ø | coverage σ | selector Md | selector Ø | selector σ | map_interaction Md | map_interaction Ø | map_interaction σ | assertion Md | assertion Ø | assertion σ |
| ----- | --- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| uc-01 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 3.84       | 0.42       | n/a                | n/a               | -                 | 4.0          | 3.88        | 0.33        |
| uc-02 | 50  | 4.0         | 3.94       | 0.24       | 3.0         | 3.12       | 0.56       | n/a                | n/a               | -                 | 3.0          | 3.16        | 0.37        |
| uc-03 | 50  | 4.0         | 3.83       | 0.38       | 4.0         | 3.66       | 0.56       | n/a                | n/a               | -                 | 3.0          | 3.17        | 0.60        |
| uc-04 | 50  | 4.0         | 3.94       | 0.24       | 3.0         | 3.00       | 0.00       | 1.0                | 1.00              | 0.00              | 3.0          | 3.38        | 0.49        |
| uc-05 | 50  | 4.0         | 3.98       | 0.14       | 4.0         | 3.66       | 0.52       | n/a                | n/a               | -                 | 4.0          | 3.92        | 0.27        |
| uc-06 | 50  | 3.0         | 3.16       | 0.37       | 2.0         | 2.24       | 0.43       | 2.0                | 2.20              | 0.45              | 2.0          | 1.76        | 0.48        |
| uc-07 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 3.55       | 0.73       | 2.0                | 1.89              | 0.32              | 4.0          | 3.66        | 0.71        |
| uc-08 | 50  | 4.0         | 3.73       | 0.45       | 3.0         | 2.88       | 0.33       | 3.0                | 2.73              | 0.45              | 2.0          | 2.02        | 0.14        |
| uc-09 | 50  | 4.0         | 3.72       | 0.45       | 2.0         | 2.12       | 0.44       | n/a                | n/a               | -                 | 4.0          | 3.86        | 0.35        |
| uc-10 | 50  | 3.0         | 3.02       | 0.14       | 2.0         | 2.00       | 0.00       | 1.0                | 1.00              | 0.00              | 4.0          | 3.84        | 0.43        |

Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), jeweils nur über numerische Werte.

#### `vacuous_pass`

| Größe                                                     | n   | % der Stufengrundmenge |
| --------------------------------------------------------- | --- | ---------------------- |
| `vacuous_pass = true` laut Datei (Rohtyp: bool)           | 3   | 0.6                    |
| nach Definition erwartet (Phase-1-PASS und assertion ≤ 2) | 3   | 0.6                    |
| Abweichungen                                              | 0   | 0.0                    |

`vacuous_pass` je Use Case:

| uc_id | n   | vacuous_pass | %   |
| ----- | --- | ------------ | --- |
| uc-01 | 50  | 0            | 0.0 |
| uc-02 | 50  | 0            | 0.0 |
| uc-03 | 50  | 2            | 4.0 |
| uc-04 | 50  | 0            | 0.0 |
| uc-05 | 50  | 0            | 0.0 |
| uc-06 | 50  | 0            | 0.0 |
| uc-07 | 50  | 1            | 2.0 |
| uc-08 | 50  | 0            | 0.0 |
| uc-09 | 50  | 0            | 0.0 |
| uc-10 | 50  | 0            | 0.0 |

#### Wiederkehrende Muster in den Judge-Begründungen

| Muster                                           | Dateien | % der Stufe | Treffer je Dimension                                             | Beispieldatei                                                                                                            |
| ------------------------------------------------ | ------- | ----------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| map-container / Canvas in der Begründung erwähnt | 182     | 36.4        | coverage: 28, selector: 132, map_interaction: 149, assertion: 22 | `stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Selektor erfunden / existiert nicht              | 181     | 36.2        | coverage: 1, selector: 167, map_interaction: 16, assertion: 86   | `stage_2_accessibility_snapshot/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| \_\_openPioneerMap erwähnt                       | 110     | 22.0        | selector: 10, map_interaction: 100                               | `stage_2_accessibility_snapshot/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| Netzwerk-/Request-Nachweis erwähnt               | 102     | 20.4        | coverage: 21, selector: 5, map_interaction: 99, assertion: 28    | `stage_2_accessibility_snapshot/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| kein Zugriff auf das Kartenmodell                | 99      | 19.8        | map_interaction: 99                                              | `stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| force: true / erzwungener Klick                  | 65      | 13.0        | selector: 65                                                     | `stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Assertion prüft das falsche Element              | 64      | 12.8        | selector: 64                                                     | `stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| strict-mode / mehrdeutiger Selektor              | 63      | 12.6        | selector: 62, assertion: 3                                       | `stage_2_accessibility_snapshot/run_02/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Vorbedingung nicht geprüft (Regel 22)            | 50      | 10.0        | assertion: 50                                                    | `stage_2_accessibility_snapshot/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| fehlende Wartebedingung                          | 7       | 1.4         | assertion: 7                                                     | `stage_2_accessibility_snapshot/run_15/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| Assertion trivial / immer wahr                   | 5       | 1.0         | assertion: 5                                                     | `stage_2_accessibility_snapshot/run_08/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| erfundene Test-ID (getByTestId)                  | 0       | 0.0         |                                                                  | -                                                                                                                        |
| Importpfad / Modul nicht auflösbar               | 0       | 0.0         |                                                                  | -                                                                                                                        |
| Assertion entfernt / abgeschwächt                | 0       | 0.0         |                                                                  | -                                                                                                                        |

Zählweise: Regex-Suche (case-insensitive) über die vier `reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei zählt einmal, wenn mindestens eine Dimension trifft. Die Regex-Definitionen stehen in `src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).

#### Auffälligkeiten in der Bewertung selbst

| Prüfung                                                                | Befund                                                                                                                                             |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| identische `coverage`-Begründung                                       | 21 Textvarianten betreffen 494 Dateien; häufigster Text 49×                                                                                        |
| identische `selector`-Begründung                                       | 34 Textvarianten betreffen 458 Dateien; häufigster Text 48×                                                                                        |
| identische `map_interaction`-Begründung                                | 14 Textvarianten betreffen 496 Dateien; häufigster Text 50×                                                                                        |
| identische `assertion`-Begründung                                      | 27 Textvarianten betreffen 464 Dateien; häufigster Text 47×                                                                                        |
| Einträge ohne alle vier `reasoning`-Schlüssel                          | 0                                                                                                                                                  |
| Einträge mit fehlendem Score in coverage/selector/assertion            | 12 (exec_category: GENERATION_ERROR: 12)                                                                                                           |
| Einträge mit fehlendem `map_interaction_score` (weder Zahl noch `n/a`) | 9 (`run_04/uc-07`, `run_05/uc-07`, `run_07/uc-07`, `run_07/uc-10`, `run_10/uc-07`, `run_16/uc-08`, `run_21/uc-08`, `run_38/uc-07`, `run_41/uc-07`) |
| selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“         | 13 Dateien; Beispiel: `stage_2_accessibility_snapshot/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                                 |
| assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“          | 0 Dateien; Beispiel: -                                                                                                                             |
| coverage_score = 4 trotz Begründung „fehlt/unvollständig“              | 0 Dateien; Beispiel: -                                                                                                                             |
| map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“ | 0 Dateien; Beispiel: -                                                                                                                             |

Häufigste wörtlich identische Begründungstexte:

| Dimension       | n Dateien | Use Cases | Text (gekürzt)                                                                                                                                                             |
| --------------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | 49        | uc-01     | Beide Klicks auf den Toolbar-Toggle stehen unbedingt im Code und nach jedem Klick wird das erwartete Ergebnis am Panel selbst geprueft. Alle UC-Schritte und beide erwarte |
| coverage        | 49        | uc-05     | Der Toggle-Klick steht unbedingt im Code und beide erwarteten Ergebnisse werden geprueft: der Checked-Zustand des Toggles und der Legendeneintrag fuer Precipitation. Voll |
| selector        | 48        | uc-10     | Die Layer-Toggles ueber getByRole('checkbox', { name: 'Temperature'/'Precipitation' }) und getByTestId('geocoder-input') bzw. geocoder-panel sind real und eindeutig. Erfu |
| selector        | 46        | uc-09     | Toggle und Titelfeld sind korrekt; die Formatauswahl laeuft aber ueber getByRole('radio', { name: 'PNG' }) - die App rendert ein natives <select class="printing-select">  |
| map_interaction | 50        | uc-01     | uc-01 steht nicht in MAP_UCS und erfordert keine kartenspezifische Interaktion; der Toggle wirkt ausschliesslich auf das DOM-Panel. Daher n/a.                             |
| map_interaction | 50        | uc-02     | uc-02 steht nicht in MAP_UCS; der Basemap-Wechsel wird ueber das Select-Widget bedient und im DOM geprueft. Kartenspezifische Interaktion ist nicht erforderlich, daher n/ |
| assertion       | 47        | uc-08     | Keine der beiden Erwartungen ist zustandstragend geprueft: die gepruefte Panel-Sichtbarkeit (info-panel / map-controls-panel) besteht unabhaengig vom Messwerkzeug, und de |
| assertion       | 46        | uc-05     | Geprueft werden beide Erwartungen unbedingt und zustandstragend: toBeChecked auf dem Toggle und der Precipitation-Eintrag im Legenden-Container, der nur bei sichtbarem La |

## 5 Auffälligkeiten (Stichpunkte)

- Gegenüber Stufe 1 verschiebt sich das Fehlerbild von INFRA_FAIL (345 → 211) zu ASSERTION_FAIL (43 → 166); die PASS-Rate steigt nur von 20,0 % auf 22,0 %.
- Drei Use Cases erreichen nie PASS (uc-06, uc-08, uc-10), sieben springen zwischen PASS und Fehlschlag.
- Ein Lauf (`run_06`) hat PASS-Rate 0 %, der beste Lauf 40 %; die Streuung über die Läufe ist mit 8,81 Prozentpunkten die zweitgrößte aller Stufen.
- Häufigste Fehlersignatur ist der Klick-Timeout (`locator.click: Test timeout of 30000ms exceeded`) mit 77 von 390 Fehlschlägen (19,7 %).
- 27 Fehlschläge tragen `toHaveValue ... Error: Not an input element` - der Accessibility-Snapshot weist das Basemap-Widget als `combobox` aus, das reale Element ist kein `<input>`.
- Nur 2 von 500 Dateien verwenden eine nicht existierende testid (gegenüber 197 in Stufe 1); die Kontextdatei listet 24 der 39 real existierenden testids.
- Zwei Zeilen haben `duration_s` über dem Testtimeout (124,38 s und 119,81 s); beide sind Umgebungsfehler (`browserContext.newPage` bzw. `while setting up "page"`).
- `map_interaction_score` bleibt mit Median 2 niedrig und erreicht in keiner Datei 4, obwohl die Helferdatei in dieser Stufe nicht im Kontext liegt.

## 6 Hypothesen (unbelegt)

- Die Verschiebung von INFRA_FAIL zu ASSERTION_FAIL könnte daran liegen, dass der Accessibility-Snapshot echte Rollen und Namen liefert, sodass Locator auflösen und der Test bis zur Assertion kommt.
- Die 27 `Not an input element`-Fälle könnten daraus folgen, dass der Snapshot ein Chakra-Select als `combobox` beschreibt und daraus auf ein `<input>` geschlossen wird.
