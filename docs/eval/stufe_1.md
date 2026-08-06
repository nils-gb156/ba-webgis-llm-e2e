# Stufe 1 - Auswertung

Stufenverzeichnis: `src/app/llm/tests/stage_1_baseline/`  
Bezeichnung: Stufe 1 - Baseline (nur UC-Text)  
Erzeugt von: `src/app/llm/eval_extract/report_stages.py` (Rohdaten: `_phase1_results.csv`, `_phase2_judge.json`).

## 1 Bestandsaufnahme

### Dateien im Stufenverzeichnis

| Datei                         | Format        | kB   | Datensätze/Zeilen | Spalten bzw. Schlüssel                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| \_phase1_results.csv          | CSV           | 293  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `duration_s`, `error_summary`, `needs_review`                                                                                                                                                                                                                                                                                                                                      |
| \_phase2_judge.csv            | CSV           | 101  | 500               | `stage`, `run`, `uc_id`, `file`, `exec_category`, `coverage_score`, `selector_score`, `map_interaction_score`, `assertion_score`, `vacuous_pass`                                                                                                                                                                                                                                                                                     |
| \_phase2_judge.json           | JSON (Liste)  | 725  | 500               | `assertion_score`, `coverage_score`, `exec_category`, `file`, `map_interaction_score`, `reasoning`, `run`, `selector_score`, `stage`, `uc_id`, `vacuous_pass`                                                                                                                                                                                                                                                                        |
| \_playwright_report.json      | JSON (Objekt) | 2519 | -                 | `config`, `suites`, `errors`, `stats`                                                                                                                                                                                                                                                                                                                                                                                                |
| plots/aggregates.csv          | CSV           | 1    | 11                | `uc_id`, `n`, `PASS`, `ASSERTION_FAIL`, `INFRA_FAIL`, `COMPILE_ERROR`, `GENERATION_ERROR`, `TIMEOUT`, `coverage_score_mean`, `coverage_score_median`, `coverage_score_std`, `selector_score_mean`, `selector_score_median`, `selector_score_std`, `map_interaction_score_mean`, `map_interaction_score_median`, `map_interaction_score_std`, `assertion_score_mean`, `assertion_score_median`, `assertion_score_std`, `vacuous_pass` |
| plots/exec_category_by_uc.png | PNG           | 50   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_distribution.png  | PNG           | 51   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| plots/score_heatmap.png       | PNG           | 69   | -                 | (Diagramm)                                                                                                                                                                                                                                                                                                                                                                                                                           |

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

Phase-2-Einträge ohne numerische Scores in coverage/selector/assertion: 8 (`run_11/uc-04` (GENERATION_ERROR), `run_16/uc-10` (GENERATION_ERROR), `run_21/uc-03` (GENERATION_ERROR), `run_24/uc-10` (GENERATION_ERROR), `run_25/uc-03` (GENERATION_ERROR), `run_27/uc-10` (GENERATION_ERROR), `run_36/uc-04` (GENERATION_ERROR), `run_43/uc-03` (GENERATION_ERROR))

## 3 Phase 1 (Ausführung)

#### Verteilung `exec_category`

| Kategorie        | n   | % der Stufengrundmenge |
| ---------------- | --- | ---------------------- |
| PASS             | 100 | 20.0                   |
| ASSERTION_FAIL   | 43  | 8.6                    |
| INFRA_FAIL       | 345 | 69.0                   |
| COMPILE_ERROR    | 3   | 0.6                    |
| GENERATION_ERROR | 9   | 1.8                    |
| TIMEOUT          | 0   | 0.0                    |
| **Summe**        | 500 | 100.0                  |

Quelle: `_phase1_results.csv`, Spalte `exec_category`, `value_counts()`; Prozent = n / 500.

#### PASS-Rate je Use Case

| uc_id      | n   | PASS | PASS % | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR |
| ---------- | --- | ---- | ------ | -------------- | ---------- | ------------- | ---------------- |
| uc-01      | 50  | 26   | 52.0   | 0              | 24         | 0             | 0                |
| uc-02      | 50  | 0    | 0.0    | 0              | 50         | 0             | 0                |
| uc-03      | 50  | 31   | 62.0   | 2              | 13         | 1             | 3                |
| uc-04      | 50  | 9    | 18.0   | 10             | 29         | 0             | 2                |
| uc-05      | 50  | 32   | 64.0   | 2              | 16         | 0             | 0                |
| uc-06      | 50  | 0    | 0.0    | 6              | 44         | 0             | 0                |
| uc-07      | 50  | 0    | 0.0    | 7              | 42         | 0             | 1                |
| uc-08      | 50  | 0    | 0.0    | 8              | 42         | 0             | 0                |
| uc-09      | 50  | 2    | 4.0    | 5              | 41         | 2             | 0                |
| uc-10      | 50  | 0    | 0.0    | 3              | 44         | 0             | 3                |
| **gesamt** | 500 | 100  | 20.0   | 43             | 345        | 3             | 9                |

Quelle: `_phase1_results.csv`, Gruppierung nach `uc_id`, PASS % = PASS / n je UC.

#### Streuung der PASS-Rate über die Läufe

| Größe                                                      | Wert                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| Anzahl Läufe                                               | 50                                                      |
| PASS-Rate je Lauf: Minimum                                 | 10.0 % (run_08, run_09, run_11, run_12, run_13, run_21) |
| PASS-Rate je Lauf: Maximum                                 | 40.0 % (run_24)                                         |
| PASS-Rate je Lauf: Median                                  | 20.0 %                                                  |
| PASS-Rate je Lauf: Mittelwert                              | 20.0 %                                                  |
| PASS-Rate je Lauf: Standardabweichung (Stichprobe, ddof=1) | 7.82 Prozentpunkte                                      |

Quelle: `_phase1_results.csv`; je `run` Anteil der Zeilen mit `exec_category == PASS` (Nenner = Anzahl UC im Lauf), darüber Min/Max/Median/Mittelwert/Standardabweichung.

#### Use Cases, die zwischen PASS und Fehlschlag springen

| uc_id | PASS % | PASS | Fehlschlag | Fehlerkategorien der Fehlschläge                                         |
| ----- | ------ | ---- | ---------- | ------------------------------------------------------------------------ |
| uc-01 | 52.0   | 26   | 24         | INFRA_FAIL: 24                                                           |
| uc-03 | 62.0   | 31   | 19         | INFRA_FAIL: 13, GENERATION_ERROR: 3, ASSERTION_FAIL: 2, COMPILE_ERROR: 1 |
| uc-04 | 18.0   | 9    | 41         | INFRA_FAIL: 29, ASSERTION_FAIL: 10, GENERATION_ERROR: 2                  |
| uc-05 | 64.0   | 32   | 18         | INFRA_FAIL: 16, ASSERTION_FAIL: 2                                        |
| uc-09 | 4.0    | 2    | 48         | INFRA_FAIL: 41, ASSERTION_FAIL: 5, COMPILE_ERROR: 2                      |

Immer PASS: keine. Nie PASS: uc-02, uc-06, uc-07, uc-08, uc-10.

Kriterium: 0 % < PASS-Rate < 100 % über die Läufe des UC.

#### `duration_s` (Sekunden)

| Größe        | Wert  |
| ------------ | ----- |
| n mit Wert   | 500   |
| Minimum      | 0.00  |
| 25 %-Quantil | 2.39  |
| Median       | 6.95  |
| Mittelwert   | 8.63  |
| 75 %-Quantil | 7.55  |
| 90 %-Quantil | 30.04 |
| 95 %-Quantil | 30.05 |
| Maximum      | 30.11 |

Median je `exec_category`:

| exec_category    | n   | Median | Maximum |
| ---------------- | --- | ------ | ------- |
| ASSERTION_FAIL   | 43  | 7.83   | 30.09   |
| COMPILE_ERROR    | 3   | 2.28   | 3.37    |
| GENERATION_ERROR | 9   | 0.00   | 0.00    |
| INFRA_FAIL       | 345 | 7.02   | 30.11   |
| PASS             | 100 | 2.41   | 7.22    |

Ausreißer (`duration_s` > Median + 3 × IQR = 22.45 s): 73 Zeilen. Am Playwright-Testtimeout (`duration_s` ≥ 30,00 s): 73 Zeilen (14.6 %). `duration_s` = 0,00 s: 10 Zeilen (nicht ausgeführt, i. d. R. GENERATION_ERROR).

| run    | uc_id | duration_s | exec_category  |
| ------ | ----- | ---------- | -------------- |
| run_18 | uc-04 | 30.11      | INFRA_FAIL     |
| run_20 | uc-09 | 30.11      | INFRA_FAIL     |
| run_22 | uc-04 | 30.09      | ASSERTION_FAIL |
| run_21 | uc-07 | 30.09      | INFRA_FAIL     |
| run_23 | uc-04 | 30.09      | ASSERTION_FAIL |
| run_22 | uc-05 | 30.09      | INFRA_FAIL     |
| run_17 | uc-09 | 30.08      | INFRA_FAIL     |
| run_20 | uc-10 | 30.08      | ASSERTION_FAIL |
| run_18 | uc-09 | 30.07      | INFRA_FAIL     |
| run_48 | uc-03 | 30.07      | INFRA_FAIL     |
| run_46 | uc-06 | 30.06      | ASSERTION_FAIL |
| run_45 | uc-04 | 30.06      | INFRA_FAIL     |
| run_41 | uc-09 | 30.06      | INFRA_FAIL     |
| run_36 | uc-09 | 30.06      | INFRA_FAIL     |
| run_46 | uc-09 | 30.06      | INFRA_FAIL     |

(maximal 15 Zeilen gezeigt)

#### Gruppierte `error_summary` (nur Zeilen ohne PASS)

Nicht-PASS-Zeilen: 400; daraus 99 Signaturgruppen. Die 15 häufigsten:

| n   | % der Fehlschläge | Signatur                                                                                                                                                  | exec_category              | Use Cases (n)                                                                                        |
| --- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| 69  | 17.2              | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>) \| Error: element(s) not found                                                   | INFRA_FAIL                 | uc-01(10), uc-02(22), uc-03(3), uc-04(1), uc-05(4), uc-06(7), uc-07(1), uc-08(9), uc-09(4), uc-10(8) |
| 68  | 17.0              | Error: expect(locator).toBeVisible() failed \| Locator: locator(<Q>) \| Error: strict mode violation: locator(<Q>) resolved to <N> elements:              | INFRA_FAIL                 | uc-03(4), uc-04(1), uc-06(21), uc-07(16), uc-08(19), uc-09(7)                                        |
| 35  | 8.8               | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                              | ASSERTION_FAIL, INFRA_FAIL | uc-02(8), uc-04(3), uc-05(3), uc-06(1), uc-07(5), uc-09(4), uc-10(11)                                |
| 27  | 6.8               | Error: expect(locator).toBeVisible() failed \| Locator: locator(<Q>) \| Error: element(s) not found                                                       | INFRA_FAIL                 | uc-03(1), uc-06(9), uc-07(5), uc-08(8), uc-09(4)                                                     |
| 23  | 5.8               | Error: expect(locator).toBeChecked() failed \| Locator: getByTestId(<Q>) \| Error: element(s) not found                                                   | INFRA_FAIL                 | uc-10(23)                                                                                            |
| 22  | 5.5               | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: element(s) not found                                      | INFRA_FAIL                 | uc-01(10), uc-02(9), uc-04(1), uc-05(1), uc-07(1)                                                    |
| 9   | 2.2               | Test timeout of 30000ms exceeded. \| Error: locator.isChecked: Test timeout of 30000ms exceeded.                                                          | INFRA_FAIL                 | uc-05(1), uc-07(5), uc-09(3)                                                                         |
| 7   | 1.8               | Error: Timeout 5000ms exceeded while waiting on the predicate                                                                                             | ASSERTION_FAIL             | uc-08(7)                                                                                             |
| 6   | 1.5               | Error: expect(locator).not.toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByRole(<Q>, { name: <Q> })  | INFRA_FAIL                 | uc-04(6)                                                                                             |
| 6   | 1.5               | Error: expect(locator).not.toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }).first() \| Received: checked \| Error: e                        | ASSERTION_FAIL             | uc-04(6)                                                                                             |
| 5   | 1.2               | Test timeout of 30000ms exceeded. \| Error: page.waitForResponse: Test timeout of 30000ms exceeded.                                                       | INFRA_FAIL                 | uc-04(5)                                                                                             |
| 5   | 1.2               | Unbalancierte Klammern (geschweift: +<N>, rund: +<N>) -> Datei wahrscheinlich abgeschnitten                                                               | GENERATION_ERROR           | uc-03(2), uc-10(3)                                                                                   |
| 4   | 1.0               | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByText(<Q>, { exact: true }) \| Error: element(s) not found \| Error: element | INFRA_FAIL                 | uc-05(4)                                                                                             |
| 4   | 1.0               | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }).first() \| Error: element(s) not found                              | INFRA_FAIL                 | uc-02(1), uc-04(1), uc-06(1), uc-10(1)                                                               |
| 3   | 0.8               | Test timeout of 30000ms exceeded. \| Error: page.waitForEvent: Test timeout of 30000ms exceeded. \| waiting for event <Q>                                 | INFRA_FAIL                 | uc-09(3)                                                                                             |

Gruppierungsregel (`common.error_signature`): ANSI entfernen; Call-Log-, Code-Frame- und Stacktrace-Zeilen verwerfen; erste Zeile plus bis zu drei ursachenkonkretisierende Zeilen (`Error:`, `Locator:`, `Matcher error`, `Received`, `Expected pattern/string/substring`, `Cannot find module`, `waiting for`) behalten; Duplikate entfernen; Pfade → `<PATH>`, gequotete Literale → `<Q>`, Zahlen → `<N>`; auf 200 Zeichen kürzen.

`needs_review = true`: 2 Zeilen (`run_03/uc-03` → COMPILE_ERROR, `run_15/uc-07` → GENERATION_ERROR)

## 4 Phase 2 (Judge-Bewertung)

#### Score-Verteilung je Dimension

| Dimension       | 1   | 2   | 3   | 4   | n numerisch | Median | Mittelwert | Std (ddof=1) | `n/a` | Wert fehlt |
| --------------- | --- | --- | --- | --- | ----------- | ------ | ---------- | ------------ | ----- | ---------- |
| coverage        | 0   | 3   | 151 | 338 | 492         | 4.0    | 3.68       | 0.48         | 0     | 8          |
| selector        | 35  | 288 | 68  | 101 | 492         | 2.0    | 2.48       | 0.90         | 0     | 8          |
| map_interaction | 174 | 43  | 28  | 0   | 245         | 1.0    | 1.40       | 0.69         | 250   | 5          |
| assertion       | 36  | 65  | 113 | 278 | 492         | 4.0    | 3.29       | 0.95         | 0     | 8          |

Quelle: `_phase2_judge.json` (500 Einträge). `n/a` = literaler Wert `"n/a"`; "Wert fehlt" = Schlüssel `null`/nicht gesetzt. Median/Mittelwert nur über numerische Werte.

#### `map_interaction`: tatsächlicher Anwendungsbereich

| uc_id | in MAP_UCS (Prompt) | n   | numerisch bewertet | `n/a` | Wert fehlt | Median | Mittelwert |
| ----- | ------------------- | --- | ------------------ | ----- | ---------- | ------ | ---------- |
| uc-01 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-02 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-03 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-04 | ja                  | 50  | 48                 | 0     | 2          | 1.0    | 1.00       |
| uc-05 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-06 | ja                  | 50  | 50                 | 0     | 0          | 1.0    | 1.00       |
| uc-07 | ja                  | 50  | 50                 | 0     | 0          | 1.0    | 1.42       |
| uc-08 | ja                  | 50  | 50                 | 0     | 0          | 3.0    | 2.56       |
| uc-09 | nein                | 50  | 0                  | 50    | 0          | -      | -          |
| uc-10 | ja                  | 50  | 47                 | 0     | 3          | 1.0    | 1.00       |

`MAP_UCS` laut `phase2_judge_prompt.md` Zeile 16: `uc-04`, `uc-06`, `uc-07`, `uc-08`, `uc-10`.

Keine Abweichung: numerisch bewertet wurden genau die MAP_UCS.

#### Scores je Use Case und Dimension

| uc_id | n   | coverage Md | coverage Ø | coverage σ | selector Md | selector Ø | selector σ | map_interaction Md | map_interaction Ø | map_interaction σ | assertion Md | assertion Ø | assertion σ |
| ----- | --- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| uc-01 | 50  | 4.0         | 3.96       | 0.20       | 2.0         | 2.92       | 1.01       | n/a                | n/a               | -                 | 4.0          | 3.90        | 0.42        |
| uc-02 | 50  | 4.0         | 3.88       | 0.33       | 2.0         | 1.72       | 0.45       | n/a                | n/a               | -                 | 3.0          | 2.92        | 0.27        |
| uc-03 | 50  | 3.0         | 3.13       | 0.45       | 4.0         | 3.36       | 0.87       | n/a                | n/a               | -                 | 1.0          | 1.47        | 0.91        |
| uc-04 | 50  | 4.0         | 3.77       | 0.42       | 3.0         | 2.73       | 0.89       | 1.0                | 1.00              | 0.00              | 4.0          | 3.54        | 0.50        |
| uc-05 | 50  | 4.0         | 3.88       | 0.33       | 4.0         | 3.30       | 0.97       | n/a                | n/a               | -                 | 4.0          | 3.96        | 0.20        |
| uc-06 | 50  | 3.0         | 3.30       | 0.46       | 2.0         | 1.94       | 0.31       | 1.0                | 1.00              | 0.00              | 3.0          | 2.72        | 0.78        |
| uc-07 | 50  | 4.0         | 3.96       | 0.28       | 2.0         | 2.48       | 0.68       | 1.0                | 1.42              | 0.50              | 4.0          | 3.04        | 1.01        |
| uc-08 | 50  | 4.0         | 3.82       | 0.39       | 2.0         | 2.42       | 0.57       | 3.0                | 2.56              | 0.50              | 4.0          | 3.52        | 0.65        |
| uc-09 | 50  | 4.0         | 3.98       | 0.14       | 2.0         | 2.10       | 0.51       | n/a                | n/a               | -                 | 4.0          | 3.96        | 0.20        |
| uc-10 | 50  | 3.0         | 3.06       | 0.25       | 2.0         | 1.83       | 0.38       | 1.0                | 1.00              | 0.00              | 4.0          | 3.77        | 0.63        |

Md = Median, Ø = Mittelwert, σ = Standardabweichung (ddof=1), jeweils nur über numerische Werte.

#### `vacuous_pass`

| Größe                                                     | n   | % der Stufengrundmenge |
| --------------------------------------------------------- | --- | ---------------------- |
| `vacuous_pass = true` laut Datei (Rohtyp: bool)           | 33  | 6.6                    |
| nach Definition erwartet (Phase-1-PASS und assertion ≤ 2) | 33  | 6.6                    |
| Abweichungen                                              | 0   | 0.0                    |

`vacuous_pass` je Use Case:

| uc_id | n   | vacuous_pass | %    |
| ----- | --- | ------------ | ---- |
| uc-01 | 50  | 2            | 4.0  |
| uc-02 | 50  | 0            | 0.0  |
| uc-03 | 50  | 31           | 62.0 |
| uc-04 | 50  | 0            | 0.0  |
| uc-05 | 50  | 0            | 0.0  |
| uc-06 | 50  | 0            | 0.0  |
| uc-07 | 50  | 0            | 0.0  |
| uc-08 | 50  | 0            | 0.0  |
| uc-09 | 50  | 0            | 0.0  |
| uc-10 | 50  | 0            | 0.0  |

#### Wiederkehrende Muster in den Judge-Begründungen

| Muster                                           | Dateien | % der Stufe | Treffer je Dimension                                          | Beispieldatei                                                                                              |
| ------------------------------------------------ | ------- | ----------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Selektor erfunden / existiert nicht              | 333     | 66.6        | selector: 322, map_interaction: 79, assertion: 24             | `stage_1_baseline/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| map-container / Canvas in der Begründung erwähnt | 217     | 43.4        | coverage: 1, selector: 212, map_interaction: 12, assertion: 5 | `stage_1_baseline/run_01/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`                  |
| \_\_openPioneerMap erwähnt                       | 183     | 36.6        | selector: 2, map_interaction: 181                             | `stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| kein Zugriff auf das Kartenmodell                | 145     | 29.0        | map_interaction: 145                                          | `stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| erfundene Test-ID (getByTestId)                  | 103     | 20.6        | selector: 103                                                 | `stage_1_baseline/run_01/uc-09-print-the-current-map-view-as-a-png.spec.ts`                                |
| Netzwerk-/Request-Nachweis erwähnt               | 95      | 19.0        | coverage: 37, selector: 9, map_interaction: 95, assertion: 38 | `stage_1_baseline/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| strict-mode / mehrdeutiger Selektor              | 49      | 9.8         | selector: 49                                                  | `stage_1_baseline/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               |
| Vorbedingung nicht geprüft (Regel 22)            | 46      | 9.2         | assertion: 46                                                 | `stage_1_baseline/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`              |
| force: true / erzwungener Klick                  | 36      | 7.2         | selector: 36                                                  | `stage_1_baseline/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`   |
| Assertion trivial / immer wahr                   | 29      | 5.8         | assertion: 29                                                 | `stage_1_baseline/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                             |
| Assertion prüft das falsche Element              | 21      | 4.2         | selector: 21                                                  | `stage_1_baseline/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               |
| fehlende Wartebedingung                          | 2       | 0.4         | assertion: 2                                                  | `stage_1_baseline/run_22/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Importpfad / Modul nicht auflösbar               | 0       | 0.0         |                                                               | -                                                                                                          |
| Assertion entfernt / abgeschwächt                | 0       | 0.0         |                                                               | -                                                                                                          |

Zählweise: Regex-Suche (case-insensitive) über die vier `reasoning`-Texte je Eintrag in `_phase2_judge.json`; eine Datei zählt einmal, wenn mindestens eine Dimension trifft. Die Regex-Definitionen stehen in `src/app/llm/eval_extract/common.py` (`REASONING_PATTERNS`).

#### Auffälligkeiten in der Bewertung selbst

| Prüfung                                                                | Befund                                                                                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| identische `coverage`-Begründung                                       | 20 Textvarianten betreffen 480 Dateien; häufigster Text 49×                                         |
| identische `selector`-Begründung                                       | 30 Textvarianten betreffen 394 Dateien; häufigster Text 46×                                         |
| identische `map_interaction`-Begründung                                | 16 Textvarianten betreffen 500 Dateien; häufigster Text 50×                                         |
| identische `assertion`-Begründung                                      | 26 Textvarianten betreffen 474 Dateien; häufigster Text 48×                                         |
| Einträge ohne alle vier `reasoning`-Schlüssel                          | 0                                                                                                   |
| Einträge mit fehlendem Score in coverage/selector/assertion            | 8 (exec_category: GENERATION_ERROR: 8)                                                              |
| Einträge mit fehlendem `map_interaction_score` (weder Zahl noch `n/a`) | 5 (`run_11/uc-04`, `run_16/uc-10`, `run_24/uc-10`, `run_27/uc-10`, `run_36/uc-04`)                  |
| selector_score ≥ 3 trotz Begründung „erfunden/existiert nicht“         | 6 Dateien; Beispiel: `stage_1_baseline/run_05/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts` |
| assertion_score ≥ 3 trotz Begründung „trivial/beweist nichts“          | 0 Dateien; Beispiel: -                                                                              |
| coverage_score = 4 trotz Begründung „fehlt/unvollständig“              | 0 Dateien; Beispiel: -                                                                              |
| map_interaction ≥ 3 trotz Begründung „keine kartenspezifische Prüfung“ | 0 Dateien; Beispiel: -                                                                              |

Häufigste wörtlich identische Begründungstexte:

| Dimension       | n Dateien | Use Cases | Text (gekürzt)                                                                                                                                                             |
| --------------- | --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | 49        | uc-07     | Der Kartenklick wird ausgefuehrt und beide erwarteten Ergebnisse - die UV-Index-Station-Sektion und die EUCOS-Ground-Station-Sektion im Info-Panel - sind im Code adressie |
| coverage        | 49        | uc-09     | Alle vier Schritte - Print-Werkzeug oeffnen, Titel eintragen, PNG waehlen, Export ausloesen - stehen unbedingt im Code, und beide pruefbaren Ergebnisse sind adressiert: d |
| selector        | 46        | uc-09     | Mindestens ein benutzter Locator existiert nicht. Dominant ist getByRole('radio', { name: 'PNG' }) bzw. role 'radiogroup' - die Formatauswahl ist ein natives <select>, ke |
| selector        | 45        | uc-06     | Mischung: reale Locator (info-panel, weather-forecast bzw. map-container/canvas) stehen neben erfundenen (forecast-entry, map-marker/-highlight, canvas.ol-layer/-viewport |
| map_interaction | 50        | uc-01     | uc-01 steht nicht in MAP_UCS und erfordert keine kartenspezifische Interaktion; der Toggle wirkt rein auf das DOM-Panel. Daher n/a.                                        |
| map_interaction | 50        | uc-02     | uc-02 steht nicht in MAP_UCS; der Basemap-Wechsel wird ueber das Select-Widget bedient und im DOM geprueft. Kartenspezifische Interaktion ist nicht erforderlich, daher n/ |
| assertion       | 48        | uc-05     | Geprueft werden beide Erwartungen unbedingt und zustandstragend: toBeChecked auf dem Toggle und der Legendeneintrag, der nur bei sichtbarem Layer gerendert wird. Bei defe |
| assertion       | 48        | uc-09     | Beide Erwartungen werden unbedingt geprueft: die Sichtbarkeit des Printing-Panels (bzw. eines panelinternen Elements, das nur bei geoeffnetem Panel existiert) und das abg |

## 5 Auffälligkeiten (Stichpunkte)

- INFRA_FAIL ist mit 345 von 500 Dateien (69,0 %) die dominierende Kategorie; PASS erreichen 100 Dateien (20,0 %).
- Fünf der zehn Use Cases erreichen in keinem der 50 Läufe PASS (uc-02, uc-06, uc-07, uc-08, uc-10); kein Use Case erreicht in allen Läufen PASS.
- Die beiden häufigsten Fehlersignaturen (`element(s) not found` bei `getByTestId` mit 69 Fällen und `strict mode violation` bei `locator('canvas')` mit 68 Fällen) machen zusammen 34,2 % aller Fehlschläge aus.
- `selector_score` hat den Median 2; 288 der 492 bewerteten Dateien erhalten genau 2. `map_interaction_score` hat den Median 1 und in keiner einzigen Datei den Wert 4.
- Bei uc-03 liegt der `assertion_score` in 35 von 47 bewerteten Dateien auf 1 - bei gleichzeitig 62 % PASS-Rate. Daraus kommen 31 der 33 `vacuous_pass` dieser Stufe.
- Alle 73 Laufzeit-Ausreißer liegen bei `duration_s` ≥ 30,00 s, also am Playwright-Testtimeout; 10 Zeilen haben `duration_s` = 0,00 s (GENERATION_ERROR, nie ausgeführt).
- 197 der 500 Dateien (39,4 %) verwenden mindestens eine testid, die im Anwendungsquellcode nicht existiert; insgesamt 106 verschiedene erfundene Werte (siehe codemuster.md).
- Die Begründungstexte des Judge sind weitgehend Vorlagen: bei `map_interaction` deckten 16 verschiedene Texte alle 500 Dateien ab.

## 6 Hypothesen (unbelegt)

- Der hohe INFRA_FAIL-Anteil könnte daran liegen, dass ohne jede Selektorinformation überwiegend erfundene testids entstehen; diese scheitern schon beim Auflösen des Locators und erreichen keine inhaltliche Assertion.
- Die 68 `strict mode violation`-Fälle auf `locator('canvas')` könnten damit zusammenhängen, dass die Anwendung zwei `<canvas>`-Elemente rendert; das ist hier nicht überprüft.
