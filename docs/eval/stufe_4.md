# Stufe 4 - Auswertung

Stufenverzeichnis: `src/app/llm/tests/stage_4_manual_ui_map/`  
Bezeichnung: Stufe 4 - manuelle UI-Map + Map-Model-Helfer  
Erzeugt von: `src/app/llm/eval_extract/report_stages.py` (Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).

## 1 Bestandsaufnahme

### Dateien im Stufenverzeichnis

| Datei                         | Format        | kB   | Datensätze/Zeilen | Spalten bzw. Schlüssel                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_phase1_results.csv          | CSV           | 254  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `duration_s`, `error_summary`, `needs_review`                                                                                                                                                                                                                                                                                                                                      |
| \_phase2_judge.csv            | CSV           | 106  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `coverage_score`, `selector_score`, `map_interaction_score`, `assertion_score`, `vacuous_pass`                                                                                                                                                                                                                                                                                     |
| \_phase2_judge.json           | JSON (Liste)  | 674  | 500               | `assertion_score`, `coverage_score`, `exec_category`, `file`, `map_interaction_score`, `reasoning`, `run`, `selector_score`, `stage`, `uc_id`, `vacuous_pass`                                                                                                                                                                                                                                                                        |
| \_playwright_report.json      | JSON (Objekt) | 2147 | -                 | `config`, `suites`, `errors`, `stats`                                                                                                                                                                                                                                                                                                                                                                                                |
| \_stage_4_context.txt         | Text          | 17   | 400               | (Kontextdatei, kein Datensatz)                                                                                                                                                                                                                                                                                                                                                                                                       |
| plots/aggregates.csv          | CSV           | 1    | 11                | `uc_id`, `n`, `PASS`, `ASSERTION_FAIL`, `INFRA_FAIL`, `COMPILE_ERROR`, `GENERATION_ERROR`, `TIMEOUT`, `coverage_score_mean`, `coverage_score_median`, `coverage_score_std`, `selector_score_mean`, `selector_score_median`, `selector_score_std`, `map_interaction_score_mean`, `map_interaction_score_median`, `map_interaction_score_std`, `assertion_score_mean`, `assertion_score_median`, `assertion_score_std`, `vacuous_pass` |
| plots/exec_category_by_uc.png | PNG           | 48   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_distribution.png  | PNG           | 47   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_heatmap.png       | PNG           | 67   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |

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

Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: 4 (`run_03/uc-07` (GENERATION_ERROR), `run_10/uc-10` (GENERATION_ERROR), `run_40/uc-10` (GENERATION_ERROR), `run_47/uc-10` (GENERATION_ERROR))

## 3 Phase 1 (Ausführung)

#### Verteilung `exec_category`

| Kategorie        | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 193 | 38.6                   |
| ASSERTION_FAIL   | 154 | 30.8                   |
| INFRA_FAIL       | 145 | 29.0                   |
| COMPILE_ERROR    | 4   | 0.8                    |
| GENERATION_ERROR | 4   | 0.8                    |
| TIMEOUT          | 0   | 0.0                    |
| **Summe**        | 500 | 100.0                  |

Quelle: `_phase1_results.csv`, Spalte `exec_category`, `value_counts()`; Prozent = n / 500.

#### PASS-Rate je Use Case

| uc_id      | n   | PASS | PASS % | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR |
| ---------- | --- | ---- | ------ | -------------- | ---------- | ------------- | ---------------- |
| uc-01      | 50  | 49   | 98.0   | 1              | 0          | 0             | 0                |
| uc-02      | 50  | 14   | 28.0   | 2              | 34         | 0             | 0                |
| uc-03      | 50  | 7    | 14.0   | 43             | 0          | 0             | 0                |
| uc-04      | 50  | 6    | 12.0   | 2              | 42         | 0             | 0                |
| uc-05      | 50  | 43   | 86.0   | 6              | 1          | 0             | 0                |
| uc-06      | 50  | 12   | 24.0   | 11             | 23         | 4             | 0                |
| uc-07      | 50  | 1    | 2.0    | 32             | 16         | 0             | 1                |
| uc-08      | 50  | 12   | 24.0   | 37             | 1          | 0             | 0                |
| uc-09      | 50  | 14   | 28.0   | 11             | 25         | 0             | 0                |
| uc-10      | 50  | 35   | 70.0   | 9              | 3          | 0             | 3                |
| **gesamt** | 500 | 193  | 38.6   | 154            | 145        | 4             | 4                |

Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, PASS % = PASS / n je UC.

#### Streuung der PASS-Rate über die Läufe

| Größe                                                      | Wert                                    |
| ---------------------------------------------------------- | --------------------------------------- |
| Anzahl Läufe                                               | 50                                      |
| PASS-Rate je Lauf: Minimum                                 | 20.0 % (run_05, run_18, run_22, run_44) |
| PASS-Rate je Lauf: Maximum                                 | 60.0 % (run_11, run_38)                 |
| PASS-Rate je Lauf: Median                                  | 40.0 %                                  |
| PASS-Rate je Lauf: Mittelwert                              | 38.6 %                                  |
| PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1) | 9.69 Prozentpunkte                      |

Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit `exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber Min/Max/Median/Mittelwert/Standardabweichung.

#### Use Cases, die zwischen PASS und Fehlschlag springen

| uc_id | PASS % | PASS | Fehlschlag | Fehlerkategorien der Fehlschläge                        |
| ----- | ------ | ---- | ---------- | ------------------------------------------------------- |
| uc-01 | 98.0   | 49   | 1          | ASSERTION_FAIL: 1                                       |
| uc-02 | 28.0   | 14   | 36         | INFRA_FAIL: 34, ASSERTION_FAIL: 2                       |
| uc-03 | 14.0   | 7    | 43         | ASSERTION_FAIL: 43                                      |
| uc-04 | 12.0   | 6    | 44         | INFRA_FAIL: 42, ASSERTION_FAIL: 2                       |
| uc-05 | 86.0   | 43   | 7          | ASSERTION_FAIL: 6, INFRA_FAIL: 1                        |
| uc-06 | 24.0   | 12   | 38         | INFRA_FAIL: 23, ASSERTION_FAIL: 11, COMPILE_ERROR: 4    |
| uc-07 | 2.0    | 1    | 49         | ASSERTION_FAIL: 32, INFRA_FAIL: 16, GENERATION_ERROR: 1 |
| uc-08 | 24.0   | 12   | 38         | ASSERTION_FAIL: 37, INFRA_FAIL: 1                       |
| uc-09 | 28.0   | 14   | 36         | INFRA_FAIL: 25, ASSERTION_FAIL: 11                      |
| uc-10 | 70.0   | 35   | 15         | ASSERTION_FAIL: 9, INFRA_FAIL: 3, GENERATION_ERROR: 3   |

Immer PASS: keine. Nie PASS: keine.

Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.

#### `duration_s` (Sekunden)

| Größe        | Wert  |
| ------------ | ----- |
| n mit Wert   | 500   |
| Minimum      | 0.00  |
| 25 %-Quantil | 2.33  |
| Median       | 3.00  |
| Mittelwert   | 8.42  |
| 75 %-Quantil | 7.48  |
| 90 %-Quantil | 30.03 |
| 95 %-Quantil | 30.03 |
| Maximum      | 30.05 |

Median je `exec_category`:

| exec_category    | n   | Median | Maximum |
| ---------------- | --- | ------ | ------- |
| ASSERTION_FAIL   | 154 | 7.61   | 30.05   |
| COMPILE_ERROR    | 4   | 0.00   | 0.00    |
| GENERATION_ERROR | 4   | 0.00   | 0.00    |
| INFRA_FAIL       | 145 | 6.18   | 30.04   |
| PASS             | 193 | 2.40   | 4.07    |

Ausreißer (`duration_s` > Median + 3 × IQR = 18.45 s): 91 Zeilen. Am Playwright-Testtimeout (`duration_s` ≥ 30,00 s): 91 Zeilen (18.2 %). `duration_s` = 0,00 s: 8 Zeilen (nicht ausgeführt, i. d. R. GENERATION_ERROR).

| run    | uc_id | duration_s | exec_category  |
| ------ | ----- | ---------- | -------------- |
| run_09 | uc-08 | 30.05      | ASSERTION_FAIL |
| run_05 | uc-10 | 30.04      | ASSERTION_FAIL |
| run_01 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_13 | uc-08 | 30.04      | ASSERTION_FAIL |
| run_17 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_03 | uc-09 | 30.04      | ASSERTION_FAIL |
| run_25 | uc-09 | 30.04      | INFRA_FAIL     |
| run_24 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_25 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_21 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_19 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_32 | uc-04 | 30.04      | ASSERTION_FAIL |
| run_40 | uc-09 | 30.04      | ASSERTION_FAIL |
| run_39 | uc-07 | 30.04      | ASSERTION_FAIL |
| run_38 | uc-07 | 30.04      | ASSERTION_FAIL |

(maximal 15 Zeilen gezeigt)

#### Gruppierte `error_summary` (nur Zeilen ohne PASS)

Nicht-PASS-Zeilen: 307; daraus 69 Signaturgruppen. Die 15 häufigsten:

| n   | % der Fehlschläge | Signatur                                                                                                                                       | exec_category              | Use Cases (n)                                                          |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- |
| 69  | 22.5              | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                   | ASSERTION_FAIL, INFRA_FAIL | uc-02(12), uc-04(2), uc-05(5), uc-07(30), uc-08(9), uc-09(5), uc-10(6) |
| 36  | 11.7              | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>) \| Error: element(s) not found                                        | INFRA_FAIL                 | uc-02(2), uc-06(22), uc-07(9), uc-08(1), uc-09(2)                      |
| 34  | 11.1              | Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                                    | INFRA_FAIL                 | uc-04(34)                                                              |
| 23  | 7.5               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                                  | ASSERTION_FAIL             | uc-03(23)                                                              |
| 16  | 5.2               | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined | ASSERTION_FAIL             | uc-03(16)                                                              |
| 13  | 4.2               | Error: <Q> does not support <Q> matcher.                                                                                                       | INFRA_FAIL                 | uc-02(11), uc-09(1), uc-10(1)                                          |
| 8   | 2.6               | Error: expect(received).toBeDefined() \| Received: undefined                                                                                   | ASSERTION_FAIL             | uc-06(7), uc-10(1)                                                     |
| 7   | 2.3               | Test timeout of 30000ms exceeded. \| Error: locator.fill: Test timeout of 30000ms exceeded.                                                    | INFRA_FAIL                 | uc-09(7)                                                               |
| 6   | 2.0               | Test timeout of 30000ms exceeded. \| Error: locator.isChecked: Test timeout of 30000ms exceeded.                                               | INFRA_FAIL                 | uc-09(6)                                                               |
| 6   | 2.0               | Error: expect(received).toBeTruthy() \| Received: false                                                                                        | ASSERTION_FAIL             | uc-07(1), uc-08(5)                                                     |
| 6   | 2.0               | Error: locator.click: Error: strict mode violation: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                   | INFRA_FAIL                 | uc-04(6)                                                               |
| 5   | 1.6               | Error: expect(received).toBeTruthy() \| Received: undefined                                                                                    | ASSERTION_FAIL             | uc-06(4), uc-09(1)                                                     |
| 5   | 1.6               | Error: expect(received).toBe(expected) // Object.is equality \| Received: false                                                                | ASSERTION_FAIL             | uc-07(1), uc-08(3), uc-10(1)                                           |
| 4   | 1.3               | Test timeout of 30000ms exceeded. \| Error: page.click: Test timeout of 30000ms exceeded.                                                      | ASSERTION_FAIL             | uc-07(4)                                                               |
| 4   | 1.3               | Falscher relativer Import-Pfad (../../ statt vorgegebenem ..<PATH>)                                                                            | COMPILE_ERROR              | uc-06(4)                                                               |

Gruppierungsregel (`common.error_signature`): ANSI entfernen; Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste Zeile plus bis zu drei ursachenkonkretisierende Zeilen (`Error:`, `Locator:`, `Matcher error`, `Received`, `Expected pattern/string/substring`, `Cannot find module`, `waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.

`needs_review = true`: 4 Zeilen (`run_26/uc-06` → COMPILE_ERROR, `run_28/uc-06` → COMPILE_ERROR, `run_40/uc-06` → COMPILE_ERROR, `run_43/uc-06` → COMPILE_ERROR)

## 4 Phase 2 (Judge-Bewertung)

#### Score-Verteilung je Dimension

| Dimension       | 1   | 2   | 3   | 4   | n numerisch | Median | Mittelwert | Std (ddof=1) | `n/a` | Wert fehlt |
| --------------- | --- | --- | --- | --- | ----------- | ------ | ---------- | ------------ | ----- | ---------- |
| coverage        | 0   | 0   | 47  | 449 | 496         | 4.0    | 3.91       | 0.29         | 0     | 4          |
| selector        | 11  | 74  | 112 | 299 | 496         | 4.0    | 3.41       | 0.82         | 0     | 4          |
| map_interaction | 12  | 45  | 118 | 71  | 246         | 3.0    | 3.01       | 0.82         | 250   | 4          |
| assertion       | 0   | 62  | 81  | 353 | 496         | 4.0    | 3.59       | 0.70         | 0     | 4          |

Quelle: `_phase2_judge.json` (500 Einträge). `n/a` = literaler Wert `"n/a"`; "Wert fehlt" = Schlüssel `null`/nicht gesetzt. Median/Mittelwert nur über numerische Werte.

#### `map_interaction`: tatsächlicher Anwendungsbereich

| uc_id | in MAP_UCS (Prompt) | n   | numerisch bewertet | `n/a` | Wert fehlt | Median | Mittelwert |
| ----- | ------------------- | --- | ------------------ | ----- | ---------- | ------ | ---------- |
| uc-01 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-02 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-03 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-04 | ja                  | 50  | 50                 | 0     | 0          | 4.0    | 4.00       |
| uc-05 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-06 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 3.26       |
| uc-07 | ja                  | 50  | 49                 | 0     | 1          | 2.0    | 1.84       |
| uc-08 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 3.00       |
| uc-09 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-10 | ja                  | 50  | 47                 | 0     | 3          | 3.0    | 2.91       |

`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: `uc-04`, `uc-06`, `uc-07`, `uc-08`, `uc-10`.

Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.

#### Scores je Use Case und Dimension

| uc_id | n   | coverage Md | coverage Ø | coverage σ | selector Md | selector Ø | selector σ | map_interaction Md | map_interaction Ø | map_interaction σ | assertion Md | assertion Ø | assertion σ |
| ----- | --- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| uc-01 | 50  | 4.0         | 3.98       | 0.14       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 4.0          | 3.96        | 0.28        |
| uc-02 | 50  | 4.0         | 3.78       | 0.42       | 2.0         | 2.36       | 1.10       | n/a                | n/a               | -                 | 3.0          | 3.38        | 0.49        |
| uc-03 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 4.00       | 0.00       | n/a                | n/a               | -                 | 2.0          | 2.26        | 0.66        |
| uc-04 | 50  | 4.0         | 3.98       | 0.14       | 3.0         | 3.12       | 0.33       | 4.0                | 4.00              | 0.00              | 4.0          | 4.00        | 0.00        |
| uc-05 | 50  | 4.0         | 3.96       | 0.20       | 4.0         | 3.84       | 0.42       | n/a                | n/a               | -                 | 4.0          | 3.98        | 0.14        |
| uc-06 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 3.98       | 0.14       | 3.0                | 3.26              | 0.60              | 4.0          | 3.88        | 0.33        |
| uc-07 | 50  | 4.0         | 4.00       | 0.00       | 4.0         | 3.84       | 0.55       | 2.0                | 1.84              | 0.62              | 4.0          | 3.98        | 0.14        |
| uc-08 | 50  | 4.0         | 3.98       | 0.14       | 3.0         | 3.00       | 0.00       | 3.0                | 3.00              | 0.00              | 3.0          | 2.74        | 0.44        |
| uc-09 | 50  | 3.0         | 3.46       | 0.50       | 2.0         | 2.14       | 0.45       | n/a                | n/a               | -                 | 4.0          | 3.98        | 0.14        |
| uc-10 | 50  | 4.0         | 3.91       | 0.28       | 4.0         | 3.85       | 0.42       | 3.0                | 2.91              | 0.41              | 4.0          | 3.72        | 0.65        |

Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), jeweils nur über numerische Werte.

#### `vacuous_pass`

| Größe                                                     | n   | % der Stufengrundmenge |
| --------------------------------------------------------- | --- | ---------------------- |
| `vacuous_pass = true` laut Datei (Rohtyp: str)            | 15  | 3.0                    |
| nach Definition erwartet (Phase-1-PASS und assertion ≤ 2) | 15  | 3.0                    |
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
| uc-07 | 50  | 0            | 0.0  |
| uc-08 | 50  | 12           | 24.0 |
| uc-09 | 50  | 0            | 0.0  |
| uc-10 | 50  | 3            | 6.0  |

#### Wiederkehrende Muster in den Judge-Begründungen

| Muster                                           | Dateien | % der Stufe | Treffer je Dimension                           | Beispieldatei                                                                                                   |
| ------------------------------------------------ | ------- | ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| map-container / Canvas in der Begründung erwähnt | 149     | 29.8        | selector: 149, map_interaction: 98             | `stage_4_manual_ui_map/run_01/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`                  |
| force: true / erzwungener Klick                  | 62      | 12.4        | selector: 62                                   | `stage_4_manual_ui_map/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`   |
| Assertion prüft das falsche Element              | 53      | 10.6        | selector: 53                                   | `stage_4_manual_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                    |
| Netzwerk-/Request-Nachweis erwähnt               | 51      | 10.2        | selector: 50, map_interaction: 1, assertion: 6 | `stage_4_manual_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| strict-mode / mehrdeutiger Selektor              | 43      | 8.6         | selector: 43                                   | `stage_4_manual_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Vorbedingung nicht geprüft (Regel 22)            | 39      | 7.8         | assertion: 39                                  | `stage_4_manual_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| Selektor erfunden / existiert nicht              | 31      | 6.2         | selector: 31                                   | `stage_4_manual_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| \_\_openPioneerMap erwähnt                       | 4       | 0.8         | map_interaction: 4                             | `stage_4_manual_ui_map/run_09/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               |
| erfundene Test-ID (getByTestId)                  | 1       | 0.2         | selector: 1                                    | `stage_4_manual_ui_map/run_19/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| Importpfad / Modul nicht auflösbar               | 0       | 0.0         |                                                | -                                                                                                               |
| kein Zugriff auf das Kartenmodell                | 0       | 0.0         |                                                | -                                                                                                               |
| fehlende Wartebedingung                          | 0       | 0.0         |                                                | -                                                                                                               |
| Assertion trivial / immer wahr                   | 0       | 0.0         |                                                | -                                                                                                               |
| Assertion entfernt / abgeschwächt                | 0       | 0.0         |                                                | -                                                                                                               |

Zählweise: Regex-Suche (case-insensitive) über die vier `reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei zählt einmal, wenn mindestens eine Dimension trifft. Die Regex-Definitionen stehen in `src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).

#### Auffälligkeiten in der Bewertung selbst

| Prüfung                                                                | Befund                                                                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| identische `coverage`-Begründung                                       | 18 Textvarianten betreffen 489 Dateien; häufigster Text 50×                                           |
| identische `selector`-Begründung                                       | 22 Textvarianten betreffen 473 Dateien; häufigster Text 50×                                           |
| identische `map_interaction`-Begründung                                | 15 Textvarianten betreffen 498 Dateien; häufigster Text 200×                                          |
| identische `assertion`-Begründung                                      | 20 Textvarianten betreffen 488 Dateien; häufigster Text 50×                                           |
| Einträge ohne alle vier `reasoning`-Schlüssel                          | 0                                                                                                     |
| Einträge mit fehlendem Score in coverage/selector/assertion            | 4 (exec_category: GENERATION_ERROR: 4)                                                                |
| Einträge mit fehlendem `map_interaction_score` (weder Zahl noch `n/a`) | 4 (`run_03/uc-07`, `run_10/uc-10`, `run_40/uc-10`, `run_47/uc-10`)                                    |
| selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“         | 2 Dateien; Beispiel: `stage_4_manual_ui_map/run_20/uc-09-print-the-current-map-view-as-a-png.spec.ts` |
| assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“          | 0 Dateien; Beispiel: -                                                                                |
| coverage_score = 4 trotz Begründung „fehlt/unvollständig“              | 0 Dateien; Beispiel: -                                                                                |
| map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“ | 0 Dateien; Beispiel: -                                                                                |

Häufigste wörtlich identische Begründungstexte:

| Dimension       | n Dateien | Use Cases                  | Text (gekürzt)                                                                                                                                                             |
| --------------- | --------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | 50        | uc-03                      | Beide Klicks (Zoom in, Zoom out) stehen unbedingt im Code, der Ausgangszoom wird vor dem ersten Klick erfasst und beide Richtungsvergleiche sind adressiert. Damit ist der |
| coverage        | 50        | uc-06                      | Der Kartenklick und das Warten auf den Forecast stehen unbedingt im Code; alle drei erwarteten Ergebnisse (Highlight, Forecast-Sektion/-Inhalt, 24 Eintraege) werden adres |
| selector        | 50        | uc-03                      | Verwendet ausschliesslich die realen Test-IDs 'zoom-in-button' und 'zoom-out-button' sowie den bereitgestellten Helper getMapZoomLevel - gleichwertig zum Referenztest, ke |
| selector        | 50        | uc-08                      | measurement-toggle, measurement-panel, measurement und map-container sind real. Der Messwert steht aber im OL-Overlay ausserhalb des Panels (div.measurement-tooltip[role= |
| map_interaction | 200       | uc-01, uc-02, uc-03, uc-09 | uc nicht in MAP_UCS gelistet; keine kartenspezifische Interaktion erforderlich.                                                                                            |
| map_interaction | 50        | uc-04                      | Der Renderzustand wird ueber den bereitgestellten Helper geprueft: await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true) - korrekte, wartende Map-Model-Nu |
| assertion       | 50        | uc-04                      | Beide erwarteten Ergebnisse werden zustandstragend geprueft: toBeChecked() am Toggle und der wartende Map-Model-Poll auf den Renderzustand des Layers. Bei defekter Funkti |
| assertion       | 49        | uc-01                      | Beide erwarteten Ergebnisse werden ueber den zustandstragenden Panel-Zustand geprueft (not.toBeVisible nach dem ersten, toBeVisible nach dem zweiten Klick). Bei defekter  |

## 5 Auffälligkeiten (Stichpunkte)

- Höchste PASS-Rate der Stufen 1-4 (38,6 %); erstmals erreicht jeder Use Case mindestens einmal PASS und keiner immer.
- Die Scores sind in allen vier Dimensionen die höchsten der Stufen 1-4 (coverage Ø 3,91, selector Ø 3,41, map_interaction Ø 3,01, assertion Ø 3,59).
- uc-04 fällt trotz besserem Kontext auf 12 % PASS: 34 der 44 Fehlschläge (77,3 %) sind `strict mode violation` bei `getByRole('checkbox', { name: 'UV-Index' })` - der Name trifft auch `UV-Index Stations`.
- Alle vier COMPILE_ERROR-Zeilen liegen in uc-06 und haben dieselbe Ursache: der Importpfad `../../map-model-helpers` statt `../../../map-model-helpers` (4 von 370 Dateien mit Helfer-Import).
- uc-03 bleibt bei 14 % PASS; alle 43 Fehlschläge sind ASSERTION_FAIL und alle 43 tragen `Matcher error` beim Vergleich der Zoomstufe.
- 12 der 15 `vacuous_pass` liegen in uc-08 - dort haben alle 12 PASS-Fälle einen `assertion_score` ≤ 2.
- Die Zahl der Fehlersignaturgruppen sinkt auf 69 (Stufe 1: 99); die Fehlerbilder konzentrieren sich.

## 6 Hypothesen (unbelegt)

- Der Einbruch bei uc-04 gegenüber Stufe 3 könnte daran liegen, dass die manuelle UI-Map Layernamen auflistet und daraus `getByRole('checkbox', { name: 'UV-Index' })` ohne `exact: true` abgeleitet wird.
- Die vier Importpfad-Fehler in uc-06 könnten daran liegen, dass die Pfadangabe im Kontext und das Beispiel im Docstring der Helferdatei unterschiedliche Pfade nennen.
