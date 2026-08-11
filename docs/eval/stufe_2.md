# Stufe 2 – Accessibility-Snapshot

Datenverzeichnis: `src/app/llm/tests/stage_2_accessibility_snapshot/`  
Alle Zahlen aus den Rohdaten berechnet mit `src/app/llm/eval_extract/stage_reports.py`.

## 1 Bestandsaufnahme

| Datei                    | Format      | kB      | Inhalt                                                                                                                                                                 |
| ------------------------ | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \_phase1_results.csv     | CSV         | 234.50  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, duration_s, error_summary, needs_review                                                              |
| \_phase2_judge.csv       | CSV         | 114.30  | 500 Datenzeilen; Spalten: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass                 |
| \_phase2_judge.json      | JSON        | 819.90  | Liste, 500 Objekte; Schlüssel: stage, run, uc_id, file, exec_category, coverage_score, selector_score, map_interaction_score, assertion_score, vacuous_pass, reasoning |
| \_playwright_report.json | JSON        | 1978.40 | Objekt; Schlüssel: config, suites, errors, stats                                                                                                                       |
| \_stage_2_context.txt    | TXT         | 2.60    | 98 Zeilen                                                                                                                                                              |
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
| PASS           | 254 | 50.8%                  |
| ASSERTION_FAIL | 147 | 29.4%                  |
| INFRA_FAIL     | 99  | 19.8%                  |
| GESAMT         | 500 | 100.0%                 |

### PASS-Rate je Use Case

Quelle: `_phase1_results.csv`; je UC `sum(exec_category=='PASS') / count()`, n = 50 Läufe.

| uc_id | n   | PASS | PASS-Rate | ASSERTION_FAIL | INFRA_FAIL |
| ----- | --- | ---- | --------- | -------------- | ---------- |
| uc-01 | 50  | 50   | 100.0%    | 0              | 0          |
| uc-02 | 50  | 1    | 2.0%      | 12             | 37         |
| uc-03 | 50  | 47   | 94.0%     | 2              | 1          |
| uc-04 | 50  | 48   | 96.0%     | 1              | 1          |
| uc-05 | 50  | 49   | 98.0%     | 0              | 1          |
| uc-06 | 50  | 11   | 22.0%     | 34             | 5          |
| uc-07 | 50  | 0    | 0.0%      | 47             | 3          |
| uc-08 | 50  | 32   | 64.0%     | 13             | 5          |
| uc-09 | 50  | 14   | 28.0%     | 6              | 30         |
| uc-10 | 50  | 2    | 4.0%      | 32             | 16         |

### Streuung der PASS-Rate über die 50 Läufe

Quelle: `_phase1_results.csv`; je Lauf PASS-Anteil über die 10 UC, dann Kennzahlen über die 50 Läufe. Standardabweichung: Populations-SD (`ddof=0`).

| Kennzahl                    | Wert           |
| --------------------------- | -------------- |
| Min PASS-Rate (Lauf)        | 30.0% (run_42) |
| Max PASS-Rate (Lauf)        | 70.0% (run_19) |
| Mittelwert                  | 50.8%          |
| Median                      | 50.0%          |
| Standardabweichung (ddof=0) | 0.0821         |

- Use Cases, die zwischen PASS und Fehlschlag springen (0 < PASS < 50): **8** – uc-02, uc-03, uc-04, uc-05, uc-06, uc-08, uc-09, uc-10
- immer PASS (50/50): uc-01
- nie PASS (0/50): uc-07

### `duration_s`

Quelle: `_phase1_results.csv`, Spalte `duration_s` (Sekunden, Playwright-Ergebnis). Ausreißer: Tukey-Zaun `> Q3 + 1.5·IQR`.

| Kennzahl                 | Wert    |
| ------------------------ | ------- |
| n (nicht leer)           | 500     |
| Median                   | 3.10 s  |
| Mittelwert               | 4.91 s  |
| Min                      | 1.13 s  |
| Q1                       | 2.12 s  |
| Q3                       | 7.28 s  |
| Max                      | 30.03 s |
| Ausreißerzaun Q3+1.5·IQR | 15.03 s |
| Anzahl über dem Zaun     | 12      |

Median je `exec_category`:

| exec_category  | n   | Median s | Mittelwert s | Max s |
| -------------- | --- | -------- | ------------ | ----- |
| ASSERTION_FAIL | 147 | 7.25     | 7.06         | 30.03 |
| INFRA_FAIL     | 99  | 2.31     | 5.64         | 30.03 |
| PASS           | 254 | 2.62     | 3.39         | 14.88 |

10 längste Läufe:

| run    | uc_id | exec_category  | duration_s |
| ------ | ----- | -------------- | ---------- |
| run_16 | uc-06 | INFRA_FAIL     | 30.03      |
| run_25 | uc-09 | ASSERTION_FAIL | 30.03      |
| run_40 | uc-10 | INFRA_FAIL     | 30.03      |
| run_43 | uc-07 | INFRA_FAIL     | 30.03      |
| run_46 | uc-06 | INFRA_FAIL     | 30.03      |
| run_29 | uc-06 | INFRA_FAIL     | 30.02      |
| run_34 | uc-10 | INFRA_FAIL     | 30.02      |
| run_07 | uc-10 | ASSERTION_FAIL | 22.66      |
| run_15 | uc-10 | INFRA_FAIL     | 22.44      |
| run_49 | uc-07 | ASSERTION_FAIL | 16.50      |

### Gruppierte `error_summary`

Quelle: `_phase1_results.csv`, Zeilen mit `exec_category != 'PASS'` (n = 246). Gruppierung regelbasiert nach `eval_extract/common.py:ERROR_GROUP_RULES` (erste passende Regel gewinnt).

| Gruppe                                | n   | % der Fehlschläge | % der Stufe | betroffene UC                                          |
| ------------------------------------- | --- | ----------------- | ----------- | ------------------------------------------------------ |
| J_konkreter_received_wert             | 147 | 59.8%             | 29.4%       | uc-02, uc-04, uc-06, uc-07, uc-08, uc-09, uc-10        |
| D_element_not_found                   | 37  | 15.0%             | 7.4%        | uc-02, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| E_js_laufzeitfehler                   | 36  | 14.6%             | 7.2%        | uc-02, uc-06                                           |
| M_timeout_beim_warten_auf_locator     | 7   | 2.8%              | 1.4%        | uc-09                                                  |
| L_predicate_timeout                   | 6   | 2.4%              | 1.2%        | uc-02, uc-03, uc-09, uc-10                             |
| N_generischer_test_timeout            | 5   | 2.0%              | 1.0%        | uc-06, uc-10                                           |
| Y_sonstige                            | 5   | 2.0%              | 1.0%        | uc-03, uc-06, uc-10                                    |
| G_target_closed                       | 1   | 0.4%              | 0.2%        | uc-07                                                  |
| I_element_nicht_stabil_sichtbar       | 1   | 0.4%              | 0.2%        | uc-09                                                  |
| K_locator_aufgeloest_aktion_scheitert | 1   | 0.4%              | 0.2%        | uc-02                                                  |

Gruppe × `exec_category` (Kontrolle, ob die Gruppierung zur Klassifikation aus `run_phase1_eval.py` passt):

| grp                                   | ASSERTION_FAIL | INFRA_FAIL |
| ------------------------------------- | -------------- | ---------- |
| D_element_not_found                   | 0              | 37         |
| E_js_laufzeitfehler                   | 0              | 36         |
| G_target_closed                       | 0              | 1          |
| I_element_nicht_stabil_sichtbar       | 1              | 0          |
| J_konkreter_received_wert             | 135            | 12         |
| K_locator_aufgeloest_aktion_scheitert | 1              | 0          |
| L_predicate_timeout                   | 6              | 0          |
| M_timeout_beim_warten_auf_locator     | 0              | 7          |
| N_generischer_test_timeout            | 0              | 5          |
| Y_sonstige                            | 4              | 1          |

Häufigste normalisierte Fehlerköpfe (erste Fehlerzeile; Zeichenketten → `<s>`, Zahlen → `<n>`):

| normalisierter Fehlerkopf                                                                           | n   | % der Fehlschläge | UC                                                     |
| --------------------------------------------------------------------------------------------------- | --- | ----------------- | ------------------------------------------------------ |
| `Error: expect(locator).toBeVisible() failed`                                                       | 82  | 33.3%             | uc-02, uc-04, uc-05, uc-06, uc-07, uc-08, uc-09, uc-10 |
| `Error: expect(received).toBe(expected) // Object.is equality`                                      | 46  | 18.7%             | uc-02, uc-06, uc-07, uc-09, uc-10                      |
| `Error: locator.evaluate: TypeError: Cannot read properties of undefined (reading <s>)`             | 34  | 13.8%             | uc-02                                                  |
| `Error: expect(locator).toHaveValue(expected) failed`                                               | 12  | 4.9%              | uc-09, uc-10                                           |
| `Error: expect(received).toMatch(expected)`                                                         | 9   | 3.7%              | uc-08                                                  |
| `Error: expect(received).toBeGreaterThan(expected)`                                                 | 8   | 3.3%              | uc-07, uc-08, uc-09, uc-10                             |
| `Error: expect(locator).toHaveAttribute(expected) failed`                                           | 7   | 2.8%              | uc-02, uc-04, uc-06                                    |
| `Error: expect(received).toContain(expected) // indexOf`                                            | 6   | 2.4%              | uc-06, uc-10                                           |
| `Test timeout of <n>ms exceeded. \|\| Error: page.waitForResponse: Test timeout of <n>ms exceeded.` | 5   | 2.0%              | uc-06, uc-10                                           |
| `Error: locator.inputValue: Error: Node is not an <input>, <textarea> or <select> element`          | 4   | 1.6%              | uc-09                                                  |
| `Error: expect(locator).toHaveCount(expected) failed`                                               | 3   | 1.2%              | uc-06, uc-10                                           |
| `Error: expect(received).not.toBe(expected) // Object.is equality`                                  | 3   | 1.2%              | uc-09, uc-10                                           |

## 4 Phase 2

### Verteilung je Bewertungsdimension

Quelle: `_phase2_judge.csv`, Spalten `*_score`. `n/a` = nicht-numerischer Zellwert. Median/Mittelwert nur über die numerischen Werte.

| Dimension       | 1   | 2   | 3   | 4   | n/a | n numerisch | Median | Mittelwert | SD (ddof=0) |
| --------------- | --- | --- | --- | --- | --- | ----------- | ------ | ---------- | ----------- |
| coverage        | 0   | 0   | 154 | 346 | 0   | 500         | 4.0    | 3.69       | 0.46        |
| selector        | 0   | 119 | 120 | 261 | 0   | 500         | 4.0    | 3.28       | 0.82        |
| map_interaction | 103 | 45  | 100 | 2   | 250 | 250         | 2.0    | 2.00       | 0.92        |
| assertion       | 2   | 14  | 93  | 391 | 0   | 500         | 4.0    | 3.75       | 0.52        |

### `map_interaction`: tatsächliche Anwendung

| uc_id | n   | numerisch bewertet | n/a | Mittelwert |
| ----- | --- | ------------------ | --- | ---------- |
| uc-01 | 50  | 0                  | 50  | –          |
| uc-02 | 50  | 0                  | 50  | –          |
| uc-03 | 50  | 0                  | 50  | –          |
| uc-04 | 50  | 50                 | 0   | 1.00       |
| uc-05 | 50  | 0                  | 50  | –          |
| uc-06 | 50  | 50                 | 0   | 3.00       |
| uc-07 | 50  | 50                 | 0   | 2.02       |
| uc-08 | 50  | 50                 | 0   | 3.00       |
| uc-09 | 50  | 0                  | 50  | –          |
| uc-10 | 50  | 50                 | 0   | 1.00       |

- numerisch bewertet in: uc-04, uc-06, uc-07, uc-08, uc-10
- durchgehend `n/a` in: uc-01, uc-02, uc-03, uc-05, uc-09
- uneinheitlich (teils Score, teils `n/a`): –

### Scores je Use Case und Dimension

Quelle: `_phase2_judge.csv`; je UC Mittelwert und Median über die 50 Läufe, nur numerische Werte.

| uc_id | n   | coverage Ø | coverage Md | selector Ø | selector Md | map_interaction Ø | map_interaction Md | assertion Ø | assertion Md |
| ----- | --- | ---------- | ----------- | ---------- | ----------- | ----------------- | ------------------ | ----------- | ------------ |
| uc-01 | 50  | 3.92       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-02 | 50  | 3.50       | 3.5         | 2.98       | 3.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-03 | 50  | 4.00       | 4.0         | 3.98       | 4.0         | n/a               | n/a                | 3.94        | 4.0          |
| uc-04 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 1.00              | 1.0                | 3.98        | 4.0          |
| uc-05 | 50  | 3.98       | 4.0         | 4.00       | 4.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-06 | 50  | 3.08       | 3.0         | 2.20       | 2.0         | 3.00              | 3.0                | 2.72        | 3.0          |
| uc-07 | 50  | 4.00       | 4.0         | 4.00       | 4.0         | 2.02              | 2.0                | 4.00        | 4.0          |
| uc-08 | 50  | 3.14       | 3.0         | 2.90       | 3.0         | 3.00              | 3.0                | 2.98        | 3.0          |
| uc-09 | 50  | 3.40       | 3.0         | 2.58       | 3.0         | n/a               | n/a                | 4.00        | 4.0          |
| uc-10 | 50  | 3.90       | 4.0         | 2.20       | 2.0         | 1.00              | 1.0                | 3.84        | 4.0          |

### `vacuous_pass`

Definition laut Aufgabenstellung: Phase 1 = `PASS` **und** `assertion_score ≤ 2`. Quelle: `_phase1_results.csv` (`exec_category`) ⋈ `_phase2_judge.csv` (`assertion_score`, `vacuous_pass`) über `stage, run, uc_id, file`.

| Kennzahl                                          | Wert |
| ------------------------------------------------- | ---- |
| `vacuous_pass == true` (Judge)                    | 6    |
| Anteil an der Stufe                               | 1.2% |
| Anteil an den PASS-Fällen                         | 2.4% |
| eigene Nachrechnung: PASS und assertion_score ≤ 2 | 6    |
| markiert, aber Definition nicht erfüllt           | 0    |
| Definition erfüllt, aber nicht markiert           | 0    |

- keine Abweichung zwischen Judge-Flag und Definition.

### Muster in den Begründungstexten

Quelle: `_phase2_judge.json`, Feld `reasoning` (alle vier Teiltexte zusammengefasst). Regeltabelle: `eval_extract/stage_reports.py:REASON_PATTERNS`. Ein Treffer gilt als _negiert_, wenn im selben Satz ein Negationswort steht (`kein`, `nicht`, `ohne`, `statt`, `weder`).

| Muster                     | Bedeutung                                    | Dateien gesamt | davon nicht negiert | davon negiert | % der Stufe (nicht negiert) |
| -------------------------- | -------------------------------------------- | -------------- | ------------------- | ------------- | --------------------------- |
| nicht_zustandstragend      | Zustandstragendes Element (Regel 13)         | 347            | 344                 | 3             | 68.8%                       |
| canvas_statt_modell        | Canvas/map-container statt Kartenmodell      | 199            | 199                 | 0             | 39.8%                       |
| selektor_erfunden          | Selektor erfunden / nicht real               | 225            | 120                 | 105           | 24.0%                       |
| force_klick                | force:true beim Klick                        | 105            | 56                  | 49            | 11.2%                       |
| assertion_falsches_element | Assertion prüft falsches Element             | 50             | 50                  | 0             | 10.0%                       |
| vacuous_tautologisch       | vacuous / tautologische Assertion            | 2              | 2                   | 0             | 0.4%                        |
| map_model_zugriff          | Zugriff auf das Kartenmodell                 | 102            | 2                   | 100           | 0.4%                        |
| selektor_existiert_nicht   | Element existiert nicht                      | 0              | 0                   | 0             | 0.0%                        |
| importpfad                 | Importpfad der Helferdatei                   | 0              | 0                   | 0             | 0.0%                        |
| helper_erwaehnt            | Map-Model-Helfer erwähnt                     | 0              | 0                   | 0             | 0.0%                        |
| wartebedingung             | Wartebedingung                               | 0              | 0                   | 0             | 0.0%                        |
| verdeckt_ueberdeckt        | Element verdeckt / Pointer-Events abgefangen | 0              | 0                   | 0             | 0.0%                        |
| strict_mode                | mehrdeutiger Selektor                        | 50             | 0                   | 50            | 0.0%                        |

Je ein Beispielsatz (nicht negierter Treffer):

| Muster                     | Datei                                                                                                                          | Beispielsatz                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selektor_erfunden          | `tests/stage_2_accessibility_snapshot/run_01/uc-09-print-the-current-map-view-as-a-png.spec.ts`                                | `Titelfeld und Panel-Locator sind dagegen real - Mischung aus korrekten und erfundenen Locatoren.`                                                                                                           |
| map_model_zugriff          | `tests/stage_2_accessibility_snapshot/run_02/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`               | `Der Lauf sucht das echte OpenLayers-Map-Objekt (Objekt mit getPixelFromCoordinate) und rechnet die UC-Zielkoordinate korrekt in eine Pixelposition um, bevor er klickt - funktional gleichwertig zum Ref …` |
| assertion_falsches_element | `tests/stage_2_accessibility_snapshot/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                    | `Der Laengenwert wird aber am falschen Element gesucht: er steht im OL-Overlay div.measurement-tooltip innerhalb des map-container, waehrend die Laeufe seitenweit bzw.`                                     |
| canvas_statt_modell        | `tests/stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `layer-switcher/map-container sind real;`                                                                                                                                                                    |
| nicht_zustandstragend      | `tests/stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `Beide Erwartungen sind zustandstragend geprueft.`                                                                                                                                                           |
| vacuous_tautologisch       | `tests/stage_2_accessibility_snapshot/run_19/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`                  | `Ein vacuous pass ist damit moeglich.`                                                                                                                                                                       |
| force_klick                | `tests/stage_2_accessibility_snapshot/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` | `getByRole('checkbox', {name:'UV-Index', exact:true}) ist der korrekte, eindeutige Locator (exact schliesst 'UV-Index Stations' aus), der Klick nutzt {force:true} gegen die versteckte Chakra-Checkbox.`    |

### Auffälligkeiten in der Bewertung selbst

**Identische Begründungen** (exakter Textvergleich je Teiltext, Quelle `_phase2_judge.json` → `reasoning.<dim>`):

| Teiltext        | Dateien | verschiedene Texte | Texte, die mehrfach vorkommen | Dateien mit einem mehrfach vorkommenden Text | häufigster Text – Anzahl |
| --------------- | ------- | ------------------ | ----------------------------- | -------------------------------------------- | ------------------------ |
| coverage        | 500     | 18                 | 16                            | 498                                          | 50                       |
| selector        | 500     | 21                 | 16                            | 495                                          | 50                       |
| map_interaction | 500     | 12                 | 12                            | 500                                          | 50                       |
| assertion       | 500     | 21                 | 15                            | 494                                          | 50                       |

Die je Teiltext häufigsten identischen Texte (mit UC):

| Teiltext        | uc_id | n Dateien | Text                                                                                                                                   |
| --------------- | ----- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| coverage        | uc-03 | 50        | `Ausgangsmassstab wird erfasst, danach folgen beide Klicks (Zoom in, Zoom out) unbedingt, und nach jedem Klick wird die Zoomrichtun …` |
| coverage        | uc-04 | 50        | `Der Sichtbarkeits-Toggle des UV-Index-Layers wird unbedingt geklickt, das Warten auf die Tiles laeuft ueber Netzwerkbeobachtung bz …` |
| coverage        | uc-07 | 50        | `Der Kartenklick und das Warten auf die Stationsinfos stehen unbedingt im Code, und beide erwarteten Ergebnisse (UV-Index-Station-A …` |
| selector        | uc-07 | 50        | `Alle benutzten Locator sind real: map-container, info-panel(-toggle), layer-switcher(-toggle), coordinate-viewer, measurement-togg …` |
| selector        | uc-01 | 49        | `layer-switcher und layer-switcher-toggle sind die realen data-testid des Referenztests; aria-pressed am ToolButton ist der reale Z …` |
| selector        | uc-03 | 49        | `zoom-in-button, zoom-out-button und scale-viewer sind die realen data-testid des Referenztests; die aria-label-Frage der ZoomIn/Zo …` |
| map_interaction | uc-01 | 50        | `uc-01 ist nicht in MAP_UCS gelistet, also keine kartenspezifische Interaktion gefordert (Regel 1).`                                   |
| map_interaction | uc-02 | 50        | `uc-02 ist nicht in MAP_UCS gelistet, also keine kartenspezifische Interaktion gefordert (Regel 1).`                                   |
| map_interaction | uc-03 | 50        | `uc-03 ist nicht in MAP_UCS gelistet, also keine kartenspezifische Interaktion gefordert (Regel 1).`                                   |
| assertion       | uc-05 | 50        | `toBeChecked() prueft den Toggle-Zustand, der Legendeneintrag wird ueber den nur bei sichtbarem Layer gerenderten Eintrag im legend …` |
| assertion       | uc-09 | 50        | `Das panel-interne Titelfeld wird geprueft (existiert nur bei offenem Printing-Panel, also zustandstragend), und der Export wird ue …` |
| assertion       | uc-01 | 49        | `Nach jedem Klick wird die Panel-Sichtbarkeit in der richtigen Richtung geprueft (not.toBeVisible/toBeHidden bzw. toBeVisible), zus …` |

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

| Prüfregel                                                                                 | n   | % der Stufe | Beispiel                                                                                        |
| ----------------------------------------------------------------------------------------- | --- | ----------- | ----------------------------------------------------------------------------------------------- |
| selector ≥ 3, aber Begründung nennt einen erfundenen Selektor (nicht negiert)             | 1   | 0.2%        | `tests/stage_2_accessibility_snapshot/run_04/uc-09-print-the-current-map-view-as-a-png.spec.ts` |
| assertion ≥ 3, aber Begründung nennt eine vacuous/tautologische Assertion (nicht negiert) | 0   | 0.0%        | `–`                                                                                             |
| coverage = 4, aber Begründung nennt eine Lücke                                            | 0   | 0.0%        | `–`                                                                                             |

- Zeilen aus Phase 1 ohne jeden Judge-Score nach dem Join: **0**

## 5 Abgleich mit der Referenzaggregation

`plots/aggregates.csv` existiert im Repository nicht (kein `plots/`-Verzeichnis in keiner Stufe, keine Datei `aggregates.csv` im Arbeitsbaum). Als Ersatz wird die Referenzfunktion `plot_stage.write_aggregates()` auf denselben Rohdaten ausgeführt und Zelle für Zelle mit der eigenen Rechnung verglichen.

| uc_id  | n eigen | n Referenz | PASS eigen | PASS Referenz | coverage Ø eigen | coverage Ø Ref | selector Ø eigen | selector Ø Ref | map_interaction Ø eigen | map_interaction Ø Ref | assertion Ø eigen | assertion Ø Ref | vacuous eigen | vacuous Ref |
| ------ | ------- | ---------- | ---------- | ------------- | ---------------- | -------------- | ---------------- | -------------- | ----------------------- | --------------------- | ----------------- | --------------- | ------------- | ----------- |
| uc-01  | 50      | 50         | 50         | 50            | 3.92             | 3.92           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-02  | 50      | 50         | 1          | 1             | 3.50             | 3.50           | 2.98             | 2.98           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-03  | 50      | 50         | 47         | 47            | 4.00             | 4.00           | 3.98             | 3.98           | –                       | –                     | 3.94              | 3.94            | 0             | 0           |
| uc-04  | 50      | 50         | 48         | 48            | 4.00             | 4.00           | 4.00             | 4.00           | 1.00                    | 1.00                  | 3.98              | 3.98            | 0             | 0           |
| uc-05  | 50      | 50         | 49         | 49            | 3.98             | 3.98           | 4.00             | 4.00           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-06  | 50      | 50         | 11         | 11            | 3.08             | 3.08           | 2.20             | 2.20           | 3.00                    | 3.00                  | 2.72              | 2.72            | 6             | 6           |
| uc-07  | 50      | 50         | 0          | 0             | 4.00             | 4.00           | 4.00             | 4.00           | 2.02                    | 2.02                  | 4.00              | 4.00            | 0             | 0           |
| uc-08  | 50      | 50         | 32         | 32            | 3.14             | 3.14           | 2.90             | 2.90           | 3.00                    | 3.00                  | 2.98              | 2.98            | 0             | 0           |
| uc-09  | 50      | 50         | 14         | 14            | 3.40             | 3.40           | 2.58             | 2.58           | –                       | –                     | 4.00              | 4.00            | 0             | 0           |
| uc-10  | 50      | 50         | 2          | 2             | 3.90             | 3.90           | 2.20             | 2.20           | 1.00                    | 1.00                  | 3.84              | 3.84            | 0             | 0           |
| GESAMT | 500     | 500        | 254        | 254           | 3.69             | 3.69           | 3.28             | 3.28           | 2.00                    | 2.00                  | 3.75              | 3.75            | 6             | 6           |

- **keine Abweichung** zwischen eigener Rechnung und `plot_stage.write_aggregates()`.
