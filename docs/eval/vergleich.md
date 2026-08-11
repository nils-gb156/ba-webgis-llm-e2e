# Stufenvergleich 1–5

Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/compare.py`. Grundmenge je Stufe: 500 Dateien (50 Läufe × 10 Use Cases).

## 1 Stufe × `exec_category`

Quelle: `_phase1_results.csv` je Stufe, Spalte `exec_category`, alle 500 Zeilen. Prozent = Anteil an den 500 Dateien der Stufe.

| Stufe | n   | PASS  | ASSERTION_FAIL | INFRA_FAIL | GENERATION_ERROR |
| ----- | --- | ----- | -------------- | ---------- | ---------------- |
| 1     | 500 | 20.4% | 27.6%          | 51.8%      | 0.2%             |
| 2     | 500 | 50.8% | 29.4%          | 19.8%      | 0.0%             |
| 3     | 500 | 72.4% | 12.2%          | 15.4%      | 0.0%             |
| 4     | 500 | 64.4% | 16.2%          | 19.4%      | 0.0%             |
| 5     | 500 | 99.0% | 0.8%           | 0.2%       | 0.0%             |

Dieselbe Tabelle absolut:

| Stufe | n   | PASS | ASSERTION_FAIL | INFRA_FAIL | GENERATION_ERROR |
| ----- | --- | ---- | -------------- | ---------- | ---------------- |
| 1     | 500 | 102  | 138            | 259        | 1                |
| 2     | 500 | 254  | 147            | 99         | 0                |
| 3     | 500 | 362  | 61             | 77         | 0                |
| 4     | 500 | 322  | 81             | 97         | 0                |
| 5     | 500 | 495  | 4              | 1          | 0                |

## 2 Stufe × Bewertungsdimension

Quelle: `_phase2_judge.csv` je Stufe. Median und Mittelwert nur über die numerischen Werte (`n/a` ausgeschlossen).

| Stufe | coverage Md | coverage Ø | coverage n | selector Md | selector Ø | selector n | map_interaction Md | map_interaction Ø | map_interaction n | assertion Md | assertion Ø | assertion n |
| ----- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| 1     | 4.0         | 3.56       | 499        | 2.0         | 2.55       | 499        | 1.0                | 1.82              | 250               | 4.0          | 3.71        | 499         |
| 2     | 4.0         | 3.69       | 500        | 4.0         | 3.28       | 500        | 2.0                | 2.00              | 250               | 4.0          | 3.75        | 500         |
| 3     | 4.0         | 3.65       | 500        | 4.0         | 3.58       | 500        | 4.0                | 3.75              | 250               | 4.0          | 3.79        | 500         |
| 4     | 4.0         | 3.70       | 500        | 4.0         | 3.67       | 500        | 4.0                | 3.78              | 250               | 4.0          | 3.90        | 500         |
| 5     | 4.0         | 3.80       | 500        | 4.0         | 3.97       | 500        | 4.0                | 3.65              | 250               | 4.0          | 3.88        | 500         |

Verteilung der Score-Werte je Stufe und Dimension (Anzahl Dateien):

| Stufe | Dimension       | 1   | 2   | 3   | 4   | n/a |
| ----- | --------------- | --- | --- | --- | --- | --- |
| 1     | coverage        | 0   | 0   | 221 | 278 | 1   |
| 1     | selector        | 44  | 270 | 53  | 132 | 1   |
| 1     | map_interaction | 138 | 19  | 93  | 0   | 250 |
| 1     | assertion       | 1   | 24  | 94  | 380 | 1   |
| 2     | coverage        | 0   | 0   | 154 | 346 | 0   |
| 2     | selector        | 0   | 119 | 120 | 261 | 0   |
| 2     | map_interaction | 103 | 45  | 100 | 2   | 250 |
| 2     | assertion       | 2   | 14  | 93  | 391 | 0   |
| 3     | coverage        | 0   | 2   | 170 | 328 | 0   |
| 3     | selector        | 46  | 6   | 61  | 387 | 0   |
| 3     | map_interaction | 0   | 7   | 49  | 194 | 250 |
| 3     | assertion       | 0   | 0   | 104 | 396 | 0   |
| 4     | coverage        | 0   | 2   | 145 | 353 | 0   |
| 4     | selector        | 0   | 41  | 81  | 378 | 0   |
| 4     | map_interaction | 0   | 2   | 51  | 197 | 250 |
| 4     | assertion       | 0   | 0   | 52  | 448 | 0   |
| 5     | coverage        | 0   | 1   | 96  | 403 | 0   |
| 5     | selector        | 0   | 2   | 13  | 485 | 0   |
| 5     | map_interaction | 0   | 19  | 50  | 181 | 250 |
| 5     | assertion       | 0   | 7   | 46  | 447 | 0   |

## 3 PASS-Raten-Matrix Use Case × Stufe

Quelle: `_phase1_results.csv` je Stufe; je Zelle `sum(exec_category=='PASS') / 50` in Prozent.

| uc_id  | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 | Stufe 5 |
| ------ | ------- | ------- | ------- | ------- | ------- |
| uc-01  | 94%     | 100%    | 100%    | 100%    | 100%    |
| uc-02  | 0%      | 2%      | 0%      | 38%     | 100%    |
| uc-03  | 0%      | 94%     | 100%    | 98%     | 100%    |
| uc-04  | 78%     | 96%     | 98%     | 100%    | 100%    |
| uc-05  | 4%      | 98%     | 100%    | 24%     | 100%    |
| uc-06  | 10%     | 22%     | 94%     | 58%     | 96%     |
| uc-07  | 2%      | 0%      | 56%     | 78%     | 98%     |
| uc-08  | 6%      | 64%     | 0%      | 0%      | 100%    |
| uc-09  | 8%      | 28%     | 94%     | 92%     | 100%    |
| uc-10  | 2%      | 4%      | 82%     | 56%     | 96%     |
| GESAMT | 20%     | 51%     | 72%     | 64%     | 99%     |

Differenzen zwischen benachbarten Stufen (Prozentpunkte, positiv = Verbesserung):

| uc_id  | 1→2 | 2→3 | 3→4 | 4→5  | 1→5  |
| ------ | --- | --- | --- | ---- | ---- |
| uc-01  | +6  | +0  | +0  | +0   | +6   |
| uc-02  | +2  | -2  | +38 | +62  | +100 |
| uc-03  | +94 | +6  | -2  | +2   | +100 |
| uc-04  | +18 | +2  | +2  | +0   | +22  |
| uc-05  | +94 | +2  | -76 | +76  | +96  |
| uc-06  | +12 | +72 | -36 | +38  | +86  |
| uc-07  | -2  | +56 | +22 | +20  | +96  |
| uc-08  | +58 | -64 | +0  | +100 | +94  |
| uc-09  | +20 | +66 | -2  | +8   | +92  |
| uc-10  | +2  | +78 | -26 | +40  | +94  |
| GESAMT | +30 | +22 | -8  | +35  | +79  |

## 4 `vacuous_pass` je Stufe

Quelle: `_phase2_judge.csv` (Judge-Flag) und `_phase1_results.csv` ⋈ `_phase2_judge.csv` für die Nachrechnung (PASS und `assertion_score ≤ 2`).

| Stufe | PASS | vacuous_pass (Judge) | % der Stufe | % der PASS | Nachrechnung PASS ∧ assertion ≤ 2 | Abweichung |
| ----- | ---- | -------------------- | ----------- | ---------- | --------------------------------- | ---------- |
| 1     | 102  | 1                    | 0.2%        | 1.0%       | 1                                 | 0          |
| 2     | 254  | 6                    | 1.2%        | 2.4%       | 6                                 | 0          |
| 3     | 362  | 0                    | 0.0%        | 0.0%       | 0                                 | 0          |
| 4     | 322  | 0                    | 0.0%        | 0.0%       | 0                                 | 0          |
| 5     | 495  | 7                    | 1.4%        | 1.4%       | 7                                 | 0          |

`vacuous_pass` je Stufe und Use Case (absolut):

| uc_id | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 | Stufe 5 |
| ----- | ------- | ------- | ------- | ------- | ------- |
| uc-01 | 0       | 0       | 0       | 0       | 0       |
| uc-02 | 0       | 0       | 0       | 0       | 0       |
| uc-03 | 0       | 0       | 0       | 0       | 0       |
| uc-04 | 0       | 0       | 0       | 0       | 0       |
| uc-05 | 0       | 0       | 0       | 0       | 0       |
| uc-06 | 0       | 6       | 0       | 0       | 2       |
| uc-07 | 1       | 0       | 0       | 0       | 0       |
| uc-08 | 0       | 0       | 0       | 0       | 5       |
| uc-09 | 0       | 0       | 0       | 0       | 0       |
| uc-10 | 0       | 0       | 0       | 0       | 0       |

## 5 Wanderung der Fehlerklassen zwischen den Stufen

Quelle: `_phase1_results.csv` je Stufe. Absolute Zahlen und Veränderung gegenüber der Vorstufe.

| exec_category    | Stufe 1 | Stufe 2 | Δ 1→2 | Stufe 3 | Δ 2→3 | Stufe 4 | Δ 3→4 | Stufe 5 | Δ 4→5 |
| ---------------- | ------- | ------- | ----- | ------- | ----- | ------- | ----- | ------- | ----- |
| PASS             | 102     | 254     | +152  | 362     | +108  | 322     | -40   | 495     | +173  |
| ASSERTION_FAIL   | 138     | 147     | +9    | 61      | -86   | 81      | +20   | 4       | -77   |
| INFRA_FAIL       | 259     | 99      | -160  | 77      | -22   | 97      | +20   | 1       | -96   |
| GENERATION_ERROR | 1       | 0       | -1    | 0       | +0    | 0       | +0    | 0       | +0    |

**INFRA_FAIL → ASSERTION_FAIL?** – Anteil der Fehlschläge, die auf eine inhaltliche Assertion entfallen (`ASSERTION_FAIL / (ASSERTION_FAIL + INFRA_FAIL + COMPILE_ERROR + GENERATION_ERROR + TIMEOUT)`):

| Stufe | Fehlschläge gesamt | ASSERTION_FAIL | INFRA_FAIL | Anteil ASSERTION_FAIL an den Fehlschlägen | Verhältnis ASSERTION/INFRA |
| ----- | ------------------ | -------------- | ---------- | ----------------------------------------- | -------------------------- |
| 1     | 398                | 138            | 259        | 34.7%                                     | 0.53                       |
| 2     | 246                | 147            | 99         | 59.8%                                     | 1.48                       |
| 3     | 138                | 61             | 77         | 44.2%                                     | 0.79                       |
| 4     | 178                | 81             | 97         | 45.5%                                     | 0.84                       |
| 5     | 5                  | 4              | 1          | 80.0%                                     | 4.00                       |

**COMPILE_ERROR und GENERATION_ERROR ab Stufe 3** (Einführung der Map-Model-Helfer):

| Stufe | COMPILE_ERROR | GENERATION_ERROR | Cannot-find-module-Meldungen in `error_summary` | Helferimport im Code (Dateien) |
| ----- | ------------- | ---------------- | ----------------------------------------------- | ------------------------------ |
| 1     | 0             | 1                | 0                                               | 0                              |
| 2     | 0             | 0                | 0                                               | 0                              |
| 3     | 0             | 0                | 0                                               | 450                            |
| 4     | 0             | 0                | 0                                               | 453                            |
| 5     | 0             | 0                | 0                                               | 460                            |

- `COMPILE_ERROR` kommt in **keiner** Stufe vor; die Einführung der Helferdatei ab Stufe 3 hat weder `Cannot find module`-Fehler noch `COMPILE_ERROR` erzeugt (siehe Spalte 4 und 5).

**Fehlergruppen je Stufe** (Anteil an den Fehlschlägen der Stufe; Regeltabelle `common.py:ERROR_GROUP_RULES`):

| Gruppe                                | Stufe 1     | Stufe 2     | Stufe 3    | Stufe 4    | Stufe 5   |
| ------------------------------------- | ----------- | ----------- | ---------- | ---------- | --------- |
| A_generierung_abgeschnitten           | 1 (0.3%)    | 0 (0.0%)    | 0 (0.0%)   | 0 (0.0%)   | 0 (0.0%)  |
| C_strict_mode_violation               | 14 (3.5%)   | 0 (0.0%)    | 8 (5.8%)   | 0 (0.0%)   | 0 (0.0%)  |
| D_element_not_found                   | 226 (56.8%) | 37 (15.0%)  | 62 (44.9%) | 95 (53.4%) | 0 (0.0%)  |
| E_js_laufzeitfehler                   | 1 (0.3%)    | 36 (14.6%)  | 2 (1.4%)   | 1 (0.6%)   | 0 (0.0%)  |
| G_target_closed                       | 0 (0.0%)    | 1 (0.4%)    | 0 (0.0%)   | 0 (0.0%)   | 0 (0.0%)  |
| I_element_nicht_stabil_sichtbar       | 0 (0.0%)    | 1 (0.4%)    | 0 (0.0%)   | 0 (0.0%)   | 0 (0.0%)  |
| J_konkreter_received_wert             | 70 (17.6%)  | 147 (59.8%) | 57 (41.3%) | 49 (27.5%) | 3 (60.0%) |
| K_locator_aufgeloest_aktion_scheitert | 65 (16.3%)  | 1 (0.4%)    | 2 (1.4%)   | 30 (16.9%) | 0 (0.0%)  |
| L_predicate_timeout                   | 0 (0.0%)    | 6 (2.4%)    | 2 (1.4%)   | 2 (1.1%)   | 0 (0.0%)  |
| M_timeout_beim_warten_auf_locator     | 0 (0.0%)    | 7 (2.8%)    | 3 (2.2%)   | 0 (0.0%)   | 0 (0.0%)  |
| N_generischer_test_timeout            | 5 (1.3%)    | 5 (2.0%)    | 0 (0.0%)   | 1 (0.6%)   | 1 (20.0%) |
| Y_sonstige                            | 16 (4.0%)   | 5 (2.0%)    | 2 (1.4%)   | 0 (0.0%)   | 1 (20.0%) |

## 6 Use Cases gegen den Gesamttrend

Referenz ist die Zeile GESAMT der PASS-Raten-Matrix. „Gegentrend“ = das Vorzeichen der Änderung eines UC weicht vom Vorzeichen der Gesamtänderung derselben Stufengrenze ab. Quelle: `_phase1_results.csv` aller Stufen.

| Stufengrenze | uc_id | PASS vorher | PASS nachher | Δ UC (pp) | Δ GESAMT (pp) |
| ------------ | ----- | ----------- | ------------ | --------- | ------------- |
| 1→2          | uc-07 | 2%          | 0%           | -2        | +30           |
| 2→3          | uc-02 | 2%          | 0%           | -2        | +22           |
| 2→3          | uc-08 | 64%         | 0%           | -64       | +22           |
| 3→4          | uc-02 | 0%          | 38%          | +38       | -8            |
| 3→4          | uc-04 | 98%         | 100%         | +2        | -8            |
| 3→4          | uc-07 | 56%         | 78%          | +22       | -8            |

Use Cases, die über die Stufen 1→4 **nicht** besser werden (Δ ≤ 0 pp) – trotz wachsendem Kontext:

| uc_id | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 | Δ 1→4 (pp) |
| ----- | ------- | ------- | ------- | ------- | ---------- |
| uc-08 | 6%      | 64%     | 0%      | 0%      | -6         |

Use Cases mit einem Rückgang zwischen zwei benachbarten Stufen von mindestens 10 pp:

| Stufengrenze | uc_id | von  | nach | Δ (pp) |
| ------------ | ----- | ---- | ---- | ------ |
| 2→3          | uc-08 | 64%  | 0%   | -64    |
| 3→4          | uc-05 | 100% | 24%  | -76    |
| 3→4          | uc-06 | 94%  | 58%  | -36    |
| 3→4          | uc-10 | 82%  | 56%  | -26    |

## 7 Stufe 5 gegen Stufe 2

Verglichen werden (a) das Ergebnis der **ersten** Loop-Iteration (`history[0]`, klassifiziert mit `classify_runtime_result`) gegen Stufe 2 und (b) das Endergebnis gegen die Stufen 2–4.

> **Prüfung der Annahme.** Die Aufgabenstellung geht davon aus, dass Stufe 5 mit dem Kontext von Stufe 2 startet. Die abgelegten Kontextdateien belegen das **nicht**: der Startkontext von Stufe 5 enthält zusätzlich zum Stufe-2-Material (testid-Liste + Accessibility-Tree) den vollständigen Quelltext von `map-model-helpers.ts` — denselben Block, den Stufe 3 und 4 bekommen. `generate_tests_stage_5.py:build_ui_context()` fügt ihn explizit an (Kommentar dort: „identical role to stage 2, plus helpers“). Zusätzlich stammt der Scrape aus einem späteren Lauf und listet 24 statt 19 `data-testid`-Werte. Der Vergleich unten ist deshalb **kein** Vergleich bei gleichem Kontext.

| Stufe | Zeichen | Zeilen | Abschnitte                                                                                                     | Ähnlichkeit zu Stufe 5 |
| ----- | ------- | ------ | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 2     | 2535    | 98     | `data-testid attributes found in the app:`, `Accessibility tree (roles, names, states):`                       | 0.457                  |
| 3     | 11652   | 204    | `map-model-helpers:`                                                                                           | 0.581                  |
| 4     | 16979   | 400    | `ui-map:`, `map-model-helpers:`                                                                                | 0.466                  |
| 5     | 8379    | 234    | `data-testid attributes found in the app:`, `Accessibility tree (roles, names, states):`, `map-model-helpers:` | 1.000                  |

**(a) Phase-1-Kategorien**

| exec_category  | Stufe 2     | Stufe 5, Iteration 1 | Δ Iter. 1 − Stufe 2 (pp) | Stufe 5, Endergebnis |
| -------------- | ----------- | -------------------- | ------------------------ | -------------------- |
| PASS           | 254 (50.8%) | 299 (59.8%)          | +9.0                     | 495 (99.0%)          |
| ASSERTION_FAIL | 147 (29.4%) | 121 (24.2%)          | -5.2                     | 4 (0.8%)             |
| INFRA_FAIL     | 99 (19.8%)  | 80 (16.0%)           | -3.8                     | 1 (0.2%)             |

PASS-Rate je UC – Stufe 2 gegen Stufe 5 (Iteration 1) gegen Stufe 5 (Endergebnis):

| uc_id | Stufe 2 | Stufe 5 Iter. 1 | Δ (pp) | Stufe 5 Ende |
| ----- | ------- | --------------- | ------ | ------------ |
| uc-01 | 100%    | 100%            | +0     | 100%         |
| uc-02 | 2%      | 0%              | -2     | 100%         |
| uc-03 | 94%     | 100%            | +6     | 100%         |
| uc-04 | 96%     | 98%             | +2     | 100%         |
| uc-05 | 98%     | 92%             | -6     | 100%         |
| uc-06 | 22%     | 50%             | +28    | 96%          |
| uc-07 | 0%      | 66%             | +66    | 98%          |
| uc-08 | 64%     | 28%             | -36    | 100%         |
| uc-09 | 28%     | 46%             | +18    | 100%         |
| uc-10 | 4%      | 18%             | +14    | 96%          |

**(b) Judge-Dimensionen: Endergebnis Stufe 5 gegen Stufen 2–4**

Der Judge hat für Stufe 5 die _finale_ Spec-Datei bewertet; für die erste Iteration liegen **keine** Judge-Scores vor (nur 299 der 500 bewerteten Dateien sind `iter-0`-Dateien; siehe `stufe_5.md`). Ein Vergleich der Judge-Dimensionen für die erste Iteration ist mit den vorliegenden Daten nicht möglich.

| Stufe | coverage Md | coverage Ø | selector Md | selector Ø | map_interaction Md | map_interaction Ø | assertion Md | assertion Ø |
| ----- | ----------- | ---------- | ----------- | ---------- | ------------------ | ----------------- | ------------ | ----------- |
| 2     | 4.0         | 3.69       | 4.0         | 3.28       | 2.0                | 2.00              | 4.0          | 3.75        |
| 3     | 4.0         | 3.65       | 4.0         | 3.58       | 4.0                | 3.75              | 4.0          | 3.79        |
| 4     | 4.0         | 3.70       | 4.0         | 3.67       | 4.0                | 3.78              | 4.0          | 3.90        |
| 5     | 4.0         | 3.80       | 4.0         | 3.97       | 4.0                | 3.65              | 4.0          | 3.88        |

Iterationsindex der von Judge bewerteten Stufe-5-Dateien:

| iter-Index | n bewertete Dateien | %     |
| ---------- | ------------------- | ----- |
| 0          | 299                 | 59.8% |
| 1          | 142                 | 28.4% |
| 2          | 33                  | 6.6%  |
| 3          | 13                  | 2.6%  |
| 4          | 3                   | 0.6%  |
| 5          | 3                   | 0.6%  |
| 6          | 1                   | 0.2%  |
| 7          | 1                   | 0.2%  |
| 9          | 5                   | 1.0%  |

## 8 Nutzung der Map-Model-Helfer

Quelle: die generierten `*.spec.ts` je Stufe (Stufe 5: die `final_spec` je Lauf/UC). Gezählt wird das Vorkommen des jeweiligen Bezeichners im Quelltext (Regex, siehe `common.py:CODE_PATTERNS`). Prozent = Anteil der 500 Dateien der Stufe.

| Stufe | Dateien | \_\_openPioneerMap | helper_any  | helper_import | helper_getActiveBaseLayerTitle | helper_isLayerRendered | helper_getMapZoomLevel | helper_getMapCenter | helper_getHighlightedCoordinate |
| ----- | ------- | ------------------ | ----------- | ------------- | ------------------------------ | ---------------------- | ---------------------- | ------------------- | ------------------------------- |
| 1     | 500     | 0 (0.0%)           | 0 (0.0%)    | 0 (0.0%)      | 0 (0.0%)                       | 0 (0.0%)               | 0 (0.0%)               | 0 (0.0%)            | 0 (0.0%)                        |
| 2     | 500     | 0 (0.0%)           | 0 (0.0%)    | 0 (0.0%)      | 0 (0.0%)                       | 0 (0.0%)               | 0 (0.0%)               | 0 (0.0%)            | 0 (0.0%)                        |
| 3     | 500     | 49 (9.8%)          | 450 (90.0%) | 450 (90.0%)   | 282 (56.4%)                    | 250 (50.0%)            | 118 (23.6%)            | 82 (16.4%)          | 71 (14.2%)                      |
| 4     | 500     | 50 (10.0%)         | 453 (90.6%) | 453 (90.6%)   | 249 (49.8%)                    | 250 (50.0%)            | 119 (23.8%)            | 112 (22.4%)         | 75 (15.0%)                      |
| 5     | 500     | 51 (10.2%)         | 460 (92.0%) | 460 (92.0%)   | 256 (51.2%)                    | 250 (50.0%)            | 151 (30.2%)            | 100 (20.0%)         | 92 (18.4%)                      |

Importpfade der Helferdatei (exakte Zeichenkette im `from '...'`):

| Stufe | Importpfad                      | n Dateien |
| ----- | ------------------------------- | --------- |
| 3     | `../../../map-model-helpers`    | 450       |
| 4     | `../../../map-model-helpers`    | 453       |
| 5     | `../../../../map-model-helpers` | 460       |

Helfernutzung je Stufe und Use Case (Dateien mit mindestens einem Helferaufruf oder `__openPioneerMap`):

| uc_id | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 | Stufe 5 |
| ----- | ------- | ------- | ------- | ------- | ------- |
| uc-01 | 0/50    | 0/50    | 5/50    | 11/50   | 11/50   |
| uc-02 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-03 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-04 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-05 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-06 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-07 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-08 | 0/50    | 0/50    | 45/50   | 42/50   | 49/50   |
| uc-09 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
| uc-10 | 0/50    | 0/50    | 50/50   | 50/50   | 50/50   |
