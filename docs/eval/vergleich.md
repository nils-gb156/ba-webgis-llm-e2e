# Stufenvergleich

Erzeugt von `src/app/llm/eval_extract/report_vergleich.py`. Alle Werte aus `_phase1_results.csv` bzw. `_phase2_judge.json` der jeweiligen Stufe; Stufe-5-Iterationsdaten aus `_stage_5_run_summary.json` und den `*.result.json` der Iterationen.

| Stufe | Bezeichnung                                           | Dateien in Phase 1 | Dateien in Phase 2 |
| ----- | ----------------------------------------------------- | ------------------ | ------------------ |
| 1     | Stufe 1 - Baseline (nur UC-Text)                      | 500                | 500                |
| 2     | Stufe 2 - Accessibility-Snapshot                      | 500                | 500                |
| 3     | Stufe 3 - generierte UI-Map + Map-Model-Helfer        | 499                | 499                |
| 4     | Stufe 4 - manuelle UI-Map + Map-Model-Helfer          | 500                | 500                |
| 5     | Stufe 5 - Self-Improvement-Loop (Kontext von Stufe 2) | 500                | 500                |

## 1 Stufe × `exec_category` (in Prozent der Stufengrundmenge)

| Stufe   | n   | PASS | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR | TIMEOUT |
| ------- | --- | ---- | -------------- | ---------- | ------------- | ---------------- | ------- |
| Stufe 1 | 500 | 20.0 | 8.6            | 69.0       | 0.6           | 1.8              | 0.0     |
| Stufe 2 | 500 | 22.0 | 33.2           | 42.2       | 0.2           | 2.4              | 0.0     |
| Stufe 3 | 499 | 35.7 | 36.9           | 26.7       | 0.6           | 0.2              | 0.0     |
| Stufe 4 | 500 | 38.6 | 30.8           | 29.0       | 0.8           | 0.8              | 0.0     |
| Stufe 5 | 500 | 73.2 | 23.6           | 3.0        | 0.0           | 0.2              | 0.0     |

Dieselbe Tabelle in absoluten Zahlen:

| Stufe   | n   | PASS | ASSERTION_FAIL | INFRA_FAIL | COMPILE_ERROR | GENERATION_ERROR | TIMEOUT |
| ------- | --- | ---- | -------------- | ---------- | ------------- | ---------------- | ------- |
| Stufe 1 | 500 | 100  | 43             | 345        | 3             | 9                | 0       |
| Stufe 2 | 500 | 110  | 166            | 211        | 1             | 12               | 0       |
| Stufe 3 | 499 | 178  | 184            | 133        | 3             | 1                | 0       |
| Stufe 4 | 500 | 193  | 154            | 145        | 4             | 4                | 0       |
| Stufe 5 | 500 | 366  | 118            | 15         | 0             | 1                | 0       |

## 2 Stufe × Bewertungsdimension (Median, Mittelwert)

| Stufe   | coverage Md | coverage Ø | coverage n | selector Md | selector Ø | selector n | map_interaction Md | map_interaction Ø | map_interaction n | assertion Md | assertion Ø | assertion n |
| ------- | ----------- | ---------- | ---------- | ----------- | ---------- | ---------- | ------------------ | ----------------- | ----------------- | ------------ | ----------- | ----------- |
| Stufe 1 | 4.0         | 3.68       | 492        | 2.0         | 2.48       | 492        | 1.0                | 1.40              | 245               | 4.0          | 3.29        | 492         |
| Stufe 2 | 4.0         | 3.73       | 488        | 3.0         | 3.00       | 488        | 2.0                | 1.76              | 241               | 4.0          | 3.26        | 488         |
| Stufe 3 | 4.0         | 3.72       | 498        | 4.0         | 3.13       | 498        | 3.0                | 2.85              | 249               | 4.0          | 3.56        | 498         |
| Stufe 4 | 4.0         | 3.91       | 496        | 4.0         | 3.41       | 496        | 3.0                | 3.01              | 246               | 4.0          | 3.59        | 496         |
| Stufe 5 | 4.0         | 3.96       | 499        | 4.0         | 3.77       | 499        | 3.0                | 3.06              | 249               | 4.0          | 3.62        | 499         |

`n` = Anzahl numerisch bewerteter Dateien (bei `map_interaction` nur die MAP_UCS uc-04/06/07/08/10).

Verteilung der Einzelwerte:

| Stufe   | Dimension       | 1   | 2   | 3   | 4   | n   |
| ------- | --------------- | --- | --- | --- | --- | --- |
| Stufe 1 | coverage        | 0   | 3   | 151 | 338 | 492 |
| Stufe 1 | selector        | 35  | 288 | 68  | 101 | 492 |
| Stufe 1 | map_interaction | 174 | 43  | 28  | 0   | 245 |
| Stufe 1 | assertion       | 36  | 65  | 113 | 278 | 492 |
| Stufe 2 | coverage        | 0   | 0   | 132 | 356 | 488 |
| Stufe 2 | selector        | 0   | 154 | 181 | 153 | 488 |
| Stufe 2 | map_interaction | 105 | 90  | 46  | 0   | 241 |
| Stufe 2 | assertion       | 13  | 95  | 130 | 250 | 488 |
| Stufe 3 | coverage        | 0   | 3   | 132 | 363 | 498 |
| Stufe 3 | selector        | 45  | 111 | 78  | 264 | 498 |
| Stufe 3 | map_interaction | 0   | 104 | 79  | 66  | 249 |
| Stufe 3 | assertion       | 0   | 24  | 169 | 305 | 498 |
| Stufe 4 | coverage        | 0   | 0   | 47  | 449 | 496 |
| Stufe 4 | selector        | 11  | 74  | 112 | 299 | 496 |
| Stufe 4 | map_interaction | 12  | 45  | 118 | 71  | 246 |
| Stufe 4 | assertion       | 0   | 62  | 81  | 353 | 496 |
| Stufe 5 | coverage        | 0   | 1   | 16  | 482 | 499 |
| Stufe 5 | selector        | 0   | 25  | 64  | 410 | 499 |
| Stufe 5 | map_interaction | 8   | 38  | 133 | 70  | 249 |
| Stufe 5 | assertion       | 0   | 19  | 154 | 326 | 499 |

## 3 PASS-Rate-Matrix Use Case × Stufe (in Prozent)

| uc_id      | St. 1 | St. 2 | St. 3 | St. 4 | St. 5 | Min | Max | Δ St.5−St.1 | Δ St.4−St.1 |
| ---------- | ----- | ----- | ----- | ----- | ----- | --- | --- | ----------- | ----------- |
| uc-01      | 52    | 82    | 100   | 98    | 100   | 52  | 100 | +48         | +46         |
| uc-02      | 0     | 22    | 0     | 28    | 100   | 0   | 100 | +100        | +28         |
| uc-03      | 62    | 32    | 4     | 14    | 18    | 4   | 62  | -44         | -48         |
| uc-04      | 18    | 4     | 66    | 12    | 100   | 4   | 100 | +82         | -6          |
| uc-05      | 64    | 66    | 74    | 86    | 100   | 64  | 100 | +36         | +22         |
| uc-06      | 0     | 0     | 8     | 24    | 64    | 0   | 64  | +64         | +24         |
| uc-07      | 0     | 2     | 10    | 2     | 46    | 0   | 46  | +46         | +2          |
| uc-08      | 0     | 0     | 16    | 24    | 28    | 0   | 28  | +28         | +24         |
| uc-09      | 4     | 12    | 22    | 28    | 94    | 4   | 94  | +90         | +24         |
| uc-10      | 0     | 0     | 56    | 70    | 82    | 0   | 82  | +82         | +70         |
| **gesamt** | 20.0  | 22.0  | 35.7  | 38.6  | 73.2  | -   | -   | -           | -           |

Zellwert = Anteil `exec_category == PASS` an den Läufen des UC in der Stufe (Nenner 50, in Stufe 3 für uc-02 49).

## 4 `vacuous_pass` je Stufe

| Stufe   | n   | vacuous_pass | % der Stufe | PASS in Phase 1 | % der PASS | Verteilung je UC             |
| ------- | --- | ------------ | ----------- | --------------- | ---------- | ---------------------------- |
| Stufe 1 | 500 | 33           | 6.6         | 100             | 33.0       | uc-01: 2, uc-03: 31          |
| Stufe 2 | 500 | 3            | 0.6         | 110             | 2.7        | uc-03: 2, uc-07: 1           |
| Stufe 3 | 499 | 10           | 2.0         | 178             | 5.6        | uc-07: 1, uc-08: 8, uc-10: 1 |
| Stufe 4 | 500 | 15           | 3.0         | 193             | 7.8        | uc-08: 12, uc-10: 3          |
| Stufe 5 | 500 | 14           | 2.8         | 366             | 3.8        | uc-07: 8, uc-08: 6           |

Definition (`phase2_judge_prompt.md`): `exec_category == PASS` **und** `assertion_score ≤ 2`.

## 5 Wanderung der Fehlerklassen zwischen den Stufen

| Kategorie        | St. 1 | St. 2 | St. 3 | St. 4 | St. 5 | Δ 1→2 | Δ 2→3 | Δ 3→4 | Δ 4→5 |
| ---------------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| PASS             | 100   | 110   | 178   | 193   | 366   | +10   | +68   | +15   | +173  |
| ASSERTION_FAIL   | 43    | 166   | 184   | 154   | 118   | +123  | +18   | -30   | -36   |
| INFRA_FAIL       | 345   | 211   | 133   | 145   | 15    | -134  | -78   | +12   | -130  |
| COMPILE_ERROR    | 3     | 1     | 3     | 4     | 0     | -2    | +2    | +1    | -4    |
| GENERATION_ERROR | 9     | 12    | 1     | 4     | 1     | +3    | -11   | +3    | -3    |
| TIMEOUT          | 0     | 0     | 0     | 0     | 0     | +0    | +0    | +0    | +0    |

INFRA_FAIL / ASSERTION_FAIL je Use Case und Stufe (Zellwert `INFRA_FAIL / ASSERTION_FAIL`):

| uc_id | St. 1   | St. 2   | St. 3   | St. 4   | St. 5  |
| ----- | ------- | ------- | ------- | ------- | ------ |
| uc-01 | 24 / 0  | 8 / 1   | 0 / 0   | 0 / 1   | 0 / 0  |
| uc-02 | 50 / 0  | 36 / 3  | 47 / 2  | 34 / 2  | 0 / 0  |
| uc-03 | 13 / 2  | 12 / 19 | 0 / 48  | 0 / 43  | 1 / 40 |
| uc-04 | 29 / 10 | 46 / 2  | 15 / 2  | 42 / 2  | 0 / 0  |
| uc-05 | 16 / 2  | 4 / 13  | 10 / 3  | 1 / 6   | 0 / 0  |
| uc-06 | 44 / 6  | 4 / 46  | 6 / 40  | 23 / 11 | 0 / 17 |
| uc-07 | 42 / 7  | 12 / 30 | 9 / 33  | 16 / 32 | 6 / 21 |
| uc-08 | 42 / 8  | 18 / 30 | 6 / 36  | 1 / 37  | 6 / 30 |
| uc-09 | 41 / 5  | 37 / 7  | 29 / 10 | 25 / 11 | 1 / 2  |
| uc-10 | 44 / 3  | 34 / 15 | 11 / 10 | 3 / 9   | 1 / 8  |

Helfernutzung gegen COMPILE_ERROR/GENERATION_ERROR (Spalten 2-7 aus dem Codescan der jeweiligen Grundmenge, Spalten 8-9 aus Phase 1 der zugehörigen Stufe):

| Grundmenge           | Dateien | Import der Helferdatei | %    | Helferfunktion verwendet | %    | `__openPioneerMap` | %   | COMPILE_ERROR        | GENERATION_ERROR      |
| -------------------- | ------- | ---------------------- | ---- | ------------------------ | ---- | ------------------ | --- | -------------------- | --------------------- |
| Stufe 1              | 500     | 0                      | 0.0  | 1                        | 0.2  | 3                  | 0.6 | 3 (Stufe 1, Phase 1) | 9 (Stufe 1, Phase 1)  |
| Stufe 2              | 500     | 0                      | 0.0  | 1                        | 0.2  | 8                  | 1.6 | 1 (Stufe 2, Phase 1) | 12 (Stufe 2, Phase 1) |
| Stufe 3              | 499     | 416                    | 83.4 | 416                      | 83.4 | 24                 | 4.8 | 3 (Stufe 3, Phase 1) | 1 (Stufe 3, Phase 1)  |
| Stufe 4              | 500     | 370                    | 74.0 | 370                      | 74.0 | 15                 | 3.0 | 4 (Stufe 4, Phase 1) | 4 (Stufe 4, Phase 1)  |
| Stufe 5 (Iter. 0)    | 500     | 454                    | 90.8 | 454                      | 90.8 | 30                 | 6.0 | 0 (Stufe 5, Phase 1) | 1 (Stufe 5, Phase 1)  |
| Stufe 5 (Endstand)   | 500     | 367                    | 73.4 | 367                      | 73.4 | 28                 | 5.6 | 0 (Stufe 5, Phase 1) | 1 (Stufe 5, Phase 1)  |
| Stufe 5 (alle Iter.) | 2154    | 1562                   | 72.5 | 1565                     | 72.7 | 135                | 6.3 | 0 (Stufe 5, Phase 1) | 1 (Stufe 5, Phase 1)  |

## 6 Use Cases gegen den Gesamttrend

Stufen-PASS-Rate gesamt: Stufe 1 = 20.0 %, Stufe 2 = 22.0 %, Stufe 3 = 35.7 %, Stufe 4 = 38.6 %, Stufe 5 = 73.2 %.

| uc_id | PASS % Stufen 1-5    | Übergänge gegen die Richtung des Stufentrends                               |
| ----- | -------------------- | --------------------------------------------------------------------------- |
| uc-01 | 52, 82, 100, 98, 100 | 3→4 (-2 pp vs. Stufentrend +2.9 pp)                                         |
| uc-02 | 0, 22, 0, 28, 100    | 2→3 (-22 pp vs. Stufentrend +13.7 pp)                                       |
| uc-03 | 62, 32, 4, 14, 18    | 1→2 (-30 pp vs. Stufentrend +2.0 pp); 2→3 (-28 pp vs. Stufentrend +13.7 pp) |
| uc-04 | 18, 4, 66, 12, 100   | 1→2 (-14 pp vs. Stufentrend +2.0 pp); 3→4 (-54 pp vs. Stufentrend +2.9 pp)  |
| uc-07 | 0, 2, 10, 2, 46      | 3→4 (-8 pp vs. Stufentrend +2.9 pp)                                         |

Kriterium: Vorzeichen der UC-Änderung von Stufe k zu k+1 ist entgegengesetzt zum Vorzeichen der Änderung der Gesamt-PASS-Rate.

## 7 Stufe 5 gegen Stufe 2

Verglichen wird die **erste Iteration** von Stufe 5 (vor jedem Reparaturschritt) mit dem Ergebnis von Stufe 2. **Einschränkung:** Der Startkontext der Stufe 5 ist nicht identisch mit dem der Stufe 2. Er enthält denselben Accessibility-Snapshot und dieselbe Liste von 24 testids, zusätzlich aber den vollständigen Quelltext von `map-model-helpers.ts` samt Importanweisung (`_stage_5_initial_context.txt`, Zeilen 100-234). Stufe 5 hat damit in der ersten Iteration mehr Kontext als Stufe 2; siehe pruefprotokoll.md, Abschnitt 6.

### 7.1 Erste Iteration Stufe 5 gegen Stufe 2 (Phase-1-Kategorien)

| Kategorie        | Stufe 2 n | Stufe 2 % | Stufe 5 Iter. 0 n | Stufe 5 Iter. 0 % | Δ n |
| ---------------- | --------- | --------- | ----------------- | ----------------- | --- |
| PASS             | 110       | 22.0      | 146               | 29.2              | +36 |
| ASSERTION_FAIL   | 166       | 33.2      | 164               | 32.8              | -2  |
| INFRA_FAIL       | 211       | 42.2      | 190               | 38.0              | -21 |
| COMPILE_ERROR    | 1         | 0.2       | 0                 | 0.0               | -1  |
| GENERATION_ERROR | 12        | 2.4       | 0                 | 0.0               | -12 |
| TIMEOUT          | 0         | 0.0       | 0                 | 0.0               | +0  |

Die Klassifikation der Stufe-5-Iteration 0 erfolgt mit derselben Funktion `classify_runtime_result()` auf dem `*.result.json`-Report dieser Iteration.

PASS-Rate je Use Case:

| uc_id      | Stufe 2 % | Stufe 5 Iter. 0 % | Δ    | Stufe 5 Endstand % | Δ zu Stufe 2 |
| ---------- | --------- | ----------------- | ---- | ------------------ | ------------ |
| uc-01      | 82        | 98                | +16  | 100                | +18          |
| uc-02      | 22        | 84                | +62  | 100                | +78          |
| uc-03      | 32        | 12                | -20  | 18                 | -14          |
| uc-04      | 4         | 16                | +12  | 100                | +96          |
| uc-05      | 66        | 70                | +4   | 100                | +34          |
| uc-06      | 0         | 2                 | +2   | 64                 | +64          |
| uc-07      | 2         | 0                 | -2   | 46                 | +44          |
| uc-08      | 0         | 0                 | +0   | 28                 | +28          |
| uc-09      | 12        | 10                | -2   | 94                 | +82          |
| uc-10      | 0         | 0                 | +0   | 82                 | +82          |
| **gesamt** | 22.0      | 29.2              | +7.2 | 73.2               | +51.2        |

### 7.2 Endergebnis Stufe 5 gegen die Stufen 2-4

| Stufe   | n   | PASS         | ASSERTION_FAIL | INFRA_FAIL   | COMPILE_ERROR | GENERATION_ERROR | TIMEOUT   |
| ------- | --- | ------------ | -------------- | ------------ | ------------- | ---------------- | --------- |
| Stufe 2 | 500 | 110 (22.0 %) | 166 (33.2 %)   | 211 (42.2 %) | 1 (0.2 %)     | 12 (2.4 %)       | 0 (0.0 %) |
| Stufe 3 | 499 | 178 (35.7 %) | 184 (36.9 %)   | 133 (26.7 %) | 3 (0.6 %)     | 1 (0.2 %)        | 0 (0.0 %) |
| Stufe 4 | 500 | 193 (38.6 %) | 154 (30.8 %)   | 145 (29.0 %) | 4 (0.8 %)     | 4 (0.8 %)        | 0 (0.0 %) |
| Stufe 5 | 500 | 366 (73.2 %) | 118 (23.6 %)   | 15 (3.0 %)   | 0 (0.0 %)     | 1 (0.2 %)        | 0 (0.0 %) |

Judge-Dimensionen (Stufe 5 wird nur im Endstand bewertet - es gibt keine Judge-Bewertung der ersten Iteration):

| Stufe   | coverage Md | coverage Ø | selector Md | selector Ø | map_interaction Md | map_interaction Ø | assertion Md | assertion Ø |
| ------- | ----------- | ---------- | ----------- | ---------- | ------------------ | ----------------- | ------------ | ----------- |
| Stufe 2 | 4.0         | 3.73       | 3.0         | 3.00       | 2.0                | 1.76              | 4.0          | 3.26        |
| Stufe 3 | 4.0         | 3.72       | 4.0         | 3.13       | 3.0                | 2.85              | 4.0          | 3.56        |
| Stufe 4 | 4.0         | 3.91       | 4.0         | 3.41       | 3.0                | 3.01              | 4.0          | 3.59        |
| Stufe 5 | 4.0         | 3.96       | 4.0         | 3.77       | 3.0                | 3.06              | 4.0          | 3.62        |

## 8 Nutzung der Map-Model-Helfer je Stufe

| Grundmenge           | Dateien | irgendeine Helferfunktion | `__openPioneerMap` | `isLayerRendered` | `getMapZoomLevel` | `getMapCenter` | `getActiveBaseLayerTitle` | `getHighlightedCoordinate` |
| -------------------- | ------- | ------------------------- | ------------------ | ----------------- | ----------------- | -------------- | ------------------------- | -------------------------- |
| Stufe 1              | 500     | 1 (0.2 %)                 | 3 (0.6 %)          | 0 (0.0 %)         | 1 (0.2 %)         | 0 (0.0 %)      | 0 (0.0 %)                 | 0 (0.0 %)                  |
| Stufe 2              | 500     | 1 (0.2 %)                 | 8 (1.6 %)          | 0 (0.0 %)         | 1 (0.2 %)         | 0 (0.0 %)      | 0 (0.0 %)                 | 0 (0.0 %)                  |
| Stufe 3              | 499     | 416 (83.4 %)              | 24 (4.8 %)         | 300 (60.1 %)      | 106 (21.2 %)      | 50 (10.0 %)    | 83 (16.6 %)               | 65 (13.0 %)                |
| Stufe 4              | 500     | 370 (74.0 %)              | 15 (3.0 %)         | 218 (43.6 %)      | 84 (16.8 %)       | 59 (11.8 %)    | 69 (13.8 %)               | 62 (12.4 %)                |
| Stufe 5 (Iter. 0)    | 500     | 454 (90.8 %)              | 30 (6.0 %)         | 273 (54.6 %)      | 114 (22.8 %)      | 60 (12.0 %)    | 65 (13.0 %)               | 113 (22.6 %)               |
| Stufe 5 (Endstand)   | 500     | 367 (73.4 %)              | 28 (5.6 %)         | 217 (43.4 %)      | 81 (16.2 %)       | 30 (6.0 %)     | 65 (13.0 %)               | 68 (13.6 %)                |
| Stufe 5 (alle Iter.) | 2154    | 1565 (72.7 %)             | 135 (6.3 %)        | 769 (35.7 %)      | 563 (26.1 %)      | 226 (10.5 %)   | 103 (4.8 %)               | 460 (21.4 %)               |

Die Helferdatei und `globalThis.__openPioneerMap` stehen in den Stufen 3 und 4 im Kontext, in den Stufen 1 und 2 nicht. Der Startkontext der Stufe 5 enthält sie ebenfalls (`_stage_5_initial_context.txt`, Abschnitt „Map Model Helper Functions“) - anders als der Kontext der Stufe 2, auf dem er sonst aufbaut. Werte = Dateien mit mindestens einem Vorkommen. Vollständige Mustertabelle in [codemuster.md](codemuster.md).

## 9 Auffälligkeiten (Stichpunkte)

- Die PASS-Rate steigt über die Stufen 1-4 von 20,0 % auf 38,6 % und in Stufe 5 auf 73,2 %. Der größte Einzelschritt der Stufen 1-4 liegt zwischen Stufe 2 und 3 (+13,7 Prozentpunkte).
- INFRA_FAIL sinkt monoton von 345 auf 133 (Stufe 3), steigt in Stufe 4 wieder auf 145 und fällt in Stufe 5 auf 15. ASSERTION_FAIL steigt von 43 auf 184 (Stufe 3) und sinkt danach auf 118. Die Verschiebung von INFRA_FAIL zu ASSERTION_FAIL findet zwischen Stufe 1 und 2 statt (-134 / +123).
- COMPILE_ERROR bleibt über alle Stufen im einstelligen Bereich (3, 1, 3, 4, 0). Mit Einführung der Helferdatei ab Stufe 3 entsteht ein neuer Fehlertyp: in Stufe 4 sind alle vier COMPILE_ERROR-Zeilen falsche Importpfade, in Stufe 3 alle drei Syntaxdefekte im generierten Code.
- GENERATION_ERROR (abgeschnittene oder degenerierte Ausgaben) sinkt von 9 und 12 auf 1 bis 4.
- uc-03 ist der einzige Use Case, dessen PASS-Rate über die Stufen insgesamt fällt (62 % → 18 %); uc-04 fällt von Stufe 3 auf Stufe 4 um 54 Prozentpunkte und ist in Stufe 5 bei 100 %.
- `vacuous_pass` ist in Stufe 1 mit 33 Fällen am höchsten (33,0 % aller PASS) und liegt danach zwischen 3 und 15 Fällen (2,7 bis 7,8 % der PASS). Ab Stufe 3 konzentrieren sich die Fälle auf uc-07, uc-08 und uc-10.
- Die Nutzung der Map-Model-Helfer springt von 1 Datei (Stufen 1 und 2) auf 416 (Stufe 3) und 370 (Stufe 4). `map_interaction_score` steigt parallel von Median 1 bzw. 2 auf 3.
- Der direkte Zugriff über `globalThis.__openPioneerMap` bleibt in allen Stufen selten (3 bis 30 Dateien); genutzt werden die fertigen Helferfunktionen, vor allem `isLayerRendered`.
- Die erste Iteration der Stufe 5 erreicht 29,2 % PASS gegenüber 22,0 % in Stufe 2. Der Kontext der Stufe 5 ist nicht identisch mit dem der Stufe 2: er enthält zusätzlich den vollständigen Quelltext der Helferdatei (siehe pruefprotokoll.md, Abschnitt 6).
- Assertions auf dem Kartencontainer statt auf einer Helferfunktion gehen von 176 Dateien (Stufe 1) auf 35 (Stufe 4) und 26 (Stufe 5, Endstand) zurück.
- `waitForTimeout` als einzige Wartestrategie ist durchgehend selten (0 bis 15 Dateien je Stufe); `expect.poll` steigt von 134 auf 419 Dateien.

## 10 Hypothesen (unbelegt)

- Der Sprung der ersten Iteration der Stufe 5 gegenüber Stufe 2 könnte durch die zusätzlich mitgelieferte Helferdatei erklärt werden, nicht durch den Loop selbst - der Loop wirkt erst ab Iteration 2.
- Dass Stufe 4 gegenüber Stufe 3 bei uc-04 einbricht, während der Stufendurchschnitt steigt, könnte daran liegen, dass die manuelle UI-Map mehr Layernamen nennt und damit mehr mehrdeutige Accessible Names anbietet.
- Der Rückgang von INFRA_FAIL bei gleichzeitigem Anstieg von ASSERTION_FAIL könnte bedeuten, dass zusätzlicher Kontext vor allem das Auffinden von Elementen verbessert und erst danach die inhaltliche Prüfung zum begrenzenden Faktor wird.
