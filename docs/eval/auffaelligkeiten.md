# Auffälligkeiten mit Beleg

Erzeugt mit `src/app/llm/eval_extract/anomalies.py`. Die Schritte A, B, D und E sind vollständig aus den Rohdaten berechnet; Schritt C beruht auf dem vollständigen Lesen der dort genannten Dateien (Daten in `eval_extract/stichprobe.py`).

## Schritt A – auffällige Zellen der PASS-Raten-Matrix

Quelle: `_phase1_results.csv` aller Stufen; Zelle = `sum(exec_category=='PASS') / 50` je (uc_id, Stufe). Auswahlregeln (rein numerisch, im Skript `anomalies.py:schritt_a()`):

| Regel | Bedingung                                               |
| ----- | ------------------------------------------------------- |
| R1    | PASS-Rate = 0 % obwohl UI-Kontext vorhanden (Stufe ≥ 2) |
| R2    | Abweichung vom Stufenmittel ≥ 30 pp                     |
| R3    | Sprung zur Nachbarstufe ≥ 25 pp (Betrag)                |
| R4    | keine Verbesserung über die Stufen 1 → 4 (Δ ≤ 0 pp)     |

Alle Zellen, die mindestens eine Regel erfüllen (n = 29), absteigend nach der größten auslösenden Abweichung:

| uc_id | Stufe | PASS-Rate | Stufenmittel | Richtung | Begründung                                                                |
| ----- | ----- | --------- | ------------ | -------- | ------------------------------------------------------------------------- |
| uc-02 | 3     | 0%        | 72%          | schlecht | R1: 0 % PASS; R2: -72 pp gegen Stufenmittel (72 %)                        |
| uc-08 | 3     | 0%        | 72%          | schlecht | R1: 0 % PASS; R2: -72 pp gegen Stufenmittel (72 %); R3: Sprung 2→3 -64 pp |
| uc-08 | 4     | 0%        | 64%          | schlecht | R1: 0 % PASS; R2: -64 pp gegen Stufenmittel (64 %); R4: Δ 1→4 = -6 pp     |
| uc-08 | 5     | 100%      | 99%          | gut      | R3: Sprung 4→5 +100 pp                                                    |
| uc-07 | 2     | 0%        | 51%          | schlecht | R1: 0 % PASS; R2: -51 pp gegen Stufenmittel (51 %)                        |
| uc-05 | 2     | 98%       | 51%          | gut      | R2: +47 pp gegen Stufenmittel (51 %); R3: Sprung 1→2 +94 pp               |
| uc-03 | 2     | 94%       | 51%          | gut      | R2: +43 pp gegen Stufenmittel (51 %); R3: Sprung 1→2 +94 pp               |
| uc-10 | 3     | 82%       | 72%          | gut      | R3: Sprung 2→3 +78 pp                                                     |
| uc-05 | 4     | 24%       | 64%          | schlecht | R2: -40 pp gegen Stufenmittel (64 %); R3: Sprung 3→4 -76 pp               |
| uc-05 | 5     | 100%      | 99%          | gut      | R3: Sprung 4→5 +76 pp                                                     |
| uc-01 | 1     | 94%       | 20%          | gut      | R2: +74 pp gegen Stufenmittel (20 %)                                      |
| uc-06 | 3     | 94%       | 72%          | gut      | R3: Sprung 2→3 +72 pp                                                     |
| uc-09 | 3     | 94%       | 72%          | gut      | R3: Sprung 2→3 +66 pp                                                     |
| uc-02 | 5     | 100%      | 99%          | gut      | R3: Sprung 4→5 +62 pp                                                     |
| uc-08 | 2     | 64%       | 51%          | gut      | R3: Sprung 1→2 +58 pp                                                     |
| uc-04 | 1     | 78%       | 20%          | gut      | R2: +58 pp gegen Stufenmittel (20 %)                                      |
| uc-07 | 3     | 56%       | 72%          | schlecht | R3: Sprung 2→3 +56 pp                                                     |
| uc-01 | 2     | 100%      | 51%          | gut      | R2: +49 pp gegen Stufenmittel (51 %)                                      |
| uc-02 | 2     | 2%        | 51%          | schlecht | R2: -49 pp gegen Stufenmittel (51 %)                                      |
| uc-10 | 2     | 4%        | 51%          | schlecht | R2: -47 pp gegen Stufenmittel (51 %)                                      |
| uc-04 | 2     | 96%       | 51%          | gut      | R2: +45 pp gegen Stufenmittel (51 %)                                      |
| uc-10 | 5     | 96%       | 99%          | schlecht | R3: Sprung 4→5 +40 pp                                                     |
| uc-06 | 5     | 96%       | 99%          | schlecht | R3: Sprung 4→5 +38 pp                                                     |
| uc-02 | 4     | 38%       | 64%          | schlecht | R3: Sprung 3→4 +38 pp                                                     |
| uc-06 | 4     | 58%       | 64%          | schlecht | R3: Sprung 3→4 -36 pp                                                     |
| uc-01 | 4     | 100%      | 64%          | gut      | R2: +36 pp gegen Stufenmittel (64 %)                                      |
| uc-04 | 4     | 100%      | 64%          | gut      | R2: +36 pp gegen Stufenmittel (64 %)                                      |
| uc-03 | 4     | 98%       | 64%          | gut      | R2: +34 pp gegen Stufenmittel (64 %)                                      |
| uc-10 | 4     | 56%       | 64%          | schlecht | R3: Sprung 3→4 -26 pp                                                     |

Für die Schritte B bis E ausgewählt sind die 9 Zellen der Fehlerseite (Richtung „schlecht" bzw. R1/R4). Zellen mit auffällig **gutem** Wert stehen in der Tabelle oben, werden aber nicht weiter untersucht:

| uc_id | Stufe | PASS-Rate | Stufenmittel | Richtung | Begründung                                                                |
| ----- | ----- | --------- | ------------ | -------- | ------------------------------------------------------------------------- |
| uc-02 | 3     | 0%        | 72%          | schlecht | R1: 0 % PASS; R2: -72 pp gegen Stufenmittel (72 %)                        |
| uc-08 | 3     | 0%        | 72%          | schlecht | R1: 0 % PASS; R2: -72 pp gegen Stufenmittel (72 %); R3: Sprung 2→3 -64 pp |
| uc-08 | 4     | 0%        | 64%          | schlecht | R1: 0 % PASS; R2: -64 pp gegen Stufenmittel (64 %); R4: Δ 1→4 = -6 pp     |
| uc-07 | 2     | 0%        | 51%          | schlecht | R1: 0 % PASS; R2: -51 pp gegen Stufenmittel (51 %)                        |
| uc-05 | 4     | 24%       | 64%          | schlecht | R2: -40 pp gegen Stufenmittel (64 %); R3: Sprung 3→4 -76 pp               |
| uc-02 | 2     | 2%        | 51%          | schlecht | R2: -49 pp gegen Stufenmittel (51 %)                                      |
| uc-10 | 2     | 4%        | 51%          | schlecht | R2: -47 pp gegen Stufenmittel (51 %)                                      |
| uc-06 | 4     | 58%       | 64%          | schlecht | R3: Sprung 3→4 -36 pp                                                     |
| uc-10 | 4     | 56%       | 64%          | schlecht | R3: Sprung 3→4 -26 pp                                                     |

## Schritt B – Fehlermeldungen der ausgewählten Zellen

Quelle: `_phase1_results.csv` der jeweiligen Stufe, Zeilen mit `uc_id == <UC>` und `exec_category != 'PASS'`. Gruppierung nach `common.py:ERROR_GROUP_RULES`.

| Zelle           | Fehlschläge | größte Gruppe             | n   | Anteil an der Zelle | häufigster Fehlerkopf                                                                   | n (Kopf) | Anteil (Kopf) |
| --------------- | ----------- | ------------------------- | --- | ------------------- | --------------------------------------------------------------------------------------- | -------- | ------------- |
| uc-08 / Stufe 3 | 50          | J_konkreter_received_wert | 48  | 96.0%               | `Error: expect(locator).toContainText(expected) failed`                                 | 38       | 76.0%         |
| uc-08 / Stufe 4 | 50          | J_konkreter_received_wert | 47  | 94.0%               | `Error: expect(locator).toContainText(expected) failed`                                 | 32       | 64.0%         |
| uc-02 / Stufe 3 | 50          | D_element_not_found       | 41  | 82.0%               | `Error: expect(locator).toBeVisible() failed`                                           | 31       | 62.0%         |
| uc-02 / Stufe 2 | 49          | E_js_laufzeitfehler       | 35  | 71.4%               | `Error: locator.evaluate: TypeError: Cannot read properties of undefined (reading <s>)` | 34       | 69.4%         |
| uc-05 / Stufe 4 | 38          | D_element_not_found       | 37  | 97.4%               | `Error: expect(locator).toBeVisible() failed`                                           | 37       | 97.4%         |
| uc-06 / Stufe 4 | 21          | D_element_not_found       | 21  | 100.0%              | `Error: expect(locator).toBeVisible() failed`                                           | 21       | 100.0%        |
| uc-10 / Stufe 4 | 22          | D_element_not_found       | 22  | 100.0%              | `Error: expect(locator).toBeVisible() failed`                                           | 22       | 100.0%        |
| uc-07 / Stufe 2 | 50          | J_konkreter_received_wert | 47  | 94.0%               | `Error: expect(locator).toBeVisible() failed`                                           | 43       | 86.0%         |
| uc-10 / Stufe 2 | 48          | J_konkreter_received_wert | 31  | 64.6%               | `Error: expect(locator).toBeVisible() failed`                                           | 17       | 35.4%         |

Vollständige Gruppenverteilung je Zelle:

| Zelle           | Gruppe                                | n   | Anteil |
| --------------- | ------------------------------------- | --- | ------ |
| uc-08 / Stufe 3 | J_konkreter_received_wert             | 48  | 96.0%  |
| uc-08 / Stufe 3 | L_predicate_timeout                   | 2   | 4.0%   |
| uc-08 / Stufe 4 | J_konkreter_received_wert             | 47  | 94.0%  |
| uc-08 / Stufe 4 | D_element_not_found                   | 2   | 4.0%   |
| uc-08 / Stufe 4 | L_predicate_timeout                   | 1   | 2.0%   |
| uc-02 / Stufe 3 | D_element_not_found                   | 41  | 82.0%  |
| uc-02 / Stufe 3 | J_konkreter_received_wert             | 3   | 6.0%   |
| uc-02 / Stufe 3 | M_timeout_beim_warten_auf_locator     | 3   | 6.0%   |
| uc-02 / Stufe 3 | K_locator_aufgeloest_aktion_scheitert | 2   | 4.0%   |
| uc-02 / Stufe 3 | Y_sonstige                            | 1   | 2.0%   |
| uc-02 / Stufe 2 | E_js_laufzeitfehler                   | 35  | 71.4%  |
| uc-02 / Stufe 2 | J_konkreter_received_wert             | 10  | 20.4%  |
| uc-02 / Stufe 2 | D_element_not_found                   | 2   | 4.1%   |
| uc-02 / Stufe 2 | L_predicate_timeout                   | 1   | 2.0%   |
| uc-02 / Stufe 2 | K_locator_aufgeloest_aktion_scheitert | 1   | 2.0%   |
| uc-05 / Stufe 4 | D_element_not_found                   | 37  | 97.4%  |
| uc-05 / Stufe 4 | N_generischer_test_timeout            | 1   | 2.6%   |
| uc-06 / Stufe 4 | D_element_not_found                   | 21  | 100.0% |
| uc-10 / Stufe 4 | D_element_not_found                   | 22  | 100.0% |
| uc-07 / Stufe 2 | J_konkreter_received_wert             | 47  | 94.0%  |
| uc-07 / Stufe 2 | D_element_not_found                   | 2   | 4.0%   |
| uc-07 / Stufe 2 | G_target_closed                       | 1   | 2.0%   |
| uc-10 / Stufe 2 | J_konkreter_received_wert             | 31  | 64.6%  |
| uc-10 / Stufe 2 | D_element_not_found                   | 13  | 27.1%  |
| uc-10 / Stufe 2 | N_generischer_test_timeout            | 2   | 4.2%   |
| uc-10 / Stufe 2 | L_predicate_timeout                   | 1   | 2.1%   |
| uc-10 / Stufe 2 | Y_sonstige                            | 1   | 2.1%   |

## Schritt C – Stichprobe (je Zelle 5 Dateien gelesen)

Ausgewählt wurden je Zelle die ersten fünf Läufe aus der größten Fehlergruppe nach Schritt B. Die Beschreibung ist deskriptiv; Daten in `eval_extract/stichprobe.py:STICHPROBE`.

### uc-08 / Stufe 3

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_3_generated_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_3_generated_ui_map/run_02/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_3_generated_ui_map/run_03/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_3_generated_ui_map/run_04/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_3_generated_ui_map/run_05/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`

- Selektoren ausschließlich `getByTestId`: `map-container`, `measurement-toggle`, `measurement-panel`, `measurement` (5/5); keine Rollen-, Text- oder CSS-Selektoren.
- Panel wird bedingt geöffnet: `if (!(await measurementPanel.isVisible())) { await measurementToggle.click(); }` (5/5).
- Interaktion: `mapContainer.boundingBox()`, daraus relative Punkte (`Math.round(box.width * f)`), dann 2–3× `mapContainer.click({ position })` und genau 1× `mapContainer.dblclick({ position })` als Abschluss (5/5). Keine `page.mouse.*`-Bewegung, kein Drag.
- Wartestrategie: `expect.poll` auf einen Map-Model-Helfer (4/5 `getMapZoomLevel`, in run_03 als Typprüfung `typeof … === 'number'`); kein `waitForTimeout`, kein `waitFor()`.
- Abschluss-Assertion ist immer eine Regex-Textprüfung auf „Zahl + Längeneinheit", nie ein exakter Wert und nie ein Zahlenbereich: `toContainText(/\d[\d.,]*\s*(m|km)\b/)` (run_01), `/\d+(?:[.,]\d+)?\s?(?:m|km)\b/i` (run_02), `/\b\d+(?:[.,]\d+)?\s*(?:m|km)\b/` (run_03, auf dem _Panel_ statt auf `measurement`), `toMatch(...)` in run_04 und run_05.
- Die Einheitenliste der Regex ist in 5/5 auf `m|km` beschränkt.

### uc-08 / Stufe 4

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_4_manual_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_4_manual_ui_map/run_02/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_4_manual_ui_map/run_03/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_4_manual_ui_map/run_04/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`
- `stage_4_manual_ui_map/run_05/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`

- Identisches Selektor- und Interaktionsmuster wie Stufe 3: nur `getByTestId`, bedingtes Panel-Öffnen, `boundingBox()` + relative Klickpunkte, genau ein `dblclick` (5/5).
- Wartestrategie: `expect.poll` auf `getMapZoomLevel` (4/5) bzw. `getActiveBaseLayerTitle` (run_03, `.toBe('Carto Light')`); kein `waitForTimeout` (5/5).
- Abschluss-Assertion wieder Regex auf Zahl + Einheit: run_01 `/\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|km)\b/i`, run_04 `/\b\d+(?:[.,]\d+)?\s?(?:mm|cm|m|km)\b/i` – diese beiden erweitern die Einheitenliste um `mm|cm`; run_02 schließt mit `/(?:[1-9]\d*(?:[.,]\d+)?|0[.,]\d*[1-9]\d*)\s*(m|km)\b/i` den Wert 0 explizit aus; run_03 prüft auf dem _Panel_ statt auf `measurement`.
- run_03 importiert als einzige Datei `getActiveBaseLayerTitle` statt `getMapZoomLevel`.

### uc-02 / Stufe 3

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_3_generated_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_3_generated_ui_map/run_02/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_3_generated_ui_map/run_03/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_3_generated_ui_map/run_05/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_3_generated_ui_map/run_07/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`

- Der Umschalter wird in 5/5 als Radio adressiert: `getByRole('radio', { name: 'OpenStreetMap', exact: true })` und `… { name: 'Carto Light', exact: true }`, verankert an `getByTestId('layer-switcher')`.
- Interaktion in 5/5 `click({ force: true })` auf das OSM-Radio. Kein `selectOption`, keine Combobox (0/5).
- Vor dem Klick steht in 5/5 ein defensiver Block, der ein „Basemap"-Aufklappelement über eine Kandidatenliste sucht: `getByRole('button', { name: 'Base maps' | 'Base map' | 'Basemaps' | 'Background maps' | 'Base layer' | 'Base layers' | 'Basiskarten', exact: true })`, teils zusätzlich `getByRole('tab', …)` (run_03, run_05) und `getByText(/base\s*maps?|basemaps?/i)` (run_03).
- Zustand wird in 5/5 über den Helfer gelesen: `expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light')` bzw. `.toBe('OpenStreetMap')`. Kein direktes `page.evaluate` in der Testdatei (0/5).
- Zusätzlich `toBeChecked()`/`not.toBeChecked()` auf den Radios (4/5). Kein `waitForTimeout` (0/5).

### uc-02 / Stufe 2

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_2_accessibility_snapshot/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_2_accessibility_snapshot/run_04/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_2_accessibility_snapshot/run_05/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_2_accessibility_snapshot/run_06/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`
- `stage_2_accessibility_snapshot/run_07/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`

- Der Basemap-Umschalter wird in 5/5 als Combobox adressiert: `getByRole('combobox', { name: 'Basemaps', exact: true })` – verankert an `page.` (run_01, 05, 07) oder an `getByTestId('layer-switcher')` (run_04, 06).
- Interaktion in 5/5 `selectOption({ label: 'OpenStreetMap' })`, immer über `label`, nie `value`/`index`; 3/5 zusätzlich ein `click()` auf den Select davor.
- Zustand wird in 5/5 per `locator.evaluate` mit Cast `(element as HTMLSelectElement)` und `selectedOptions[0]?.textContent?.trim()` gelesen.
- Assertions: `expect.poll(...).toBe('Carto Light')` vorher und `.toBe('OpenStreetMap')` nachher (5/5); Negativprüfung `.not.toBe('Carto Light')` (3/5) bzw. über `select.options … ?.selected` → `.toBe(false)` (2/5).
- Kein `getByRole('radio', …)`, kein `toBeChecked()` (0/5). Kein `waitForTimeout` (0/5); 1/5 `waitForLoadState('domcontentloaded')`.

### uc-05 / Stufe 4

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_4_manual_ui_map/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`
- `stage_4_manual_ui_map/run_02/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`
- `stage_4_manual_ui_map/run_03/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`
- `stage_4_manual_ui_map/run_04/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`
- `stage_4_manual_ui_map/run_05/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`

- Der Layer-Schalter wird in 5/5 über `layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true })` adressiert und mit `click({ force: true })` genau einmal geklickt.
- Der Kartenzustand wird in 5/5 über den Helfer geprüft: `expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(false)` vor dem Klick, `.toBe(true)` danach.
- Die letzte Zeile ist in 5/5 wörtlich `await expect(legend.getByText('Precipitation', { exact: true })).toBeVisible();` – die Legendenprüfung erfolgt ausschließlich über exakte Textgleichheit im Container `getByTestId('legend')`; kein Regex, kein legendenspezifisches testid (`precipitation-legend`) und kein Helferaufruf.
- Kein `waitForTimeout`, kein `waitForSelector` (0/5); Warten ausschließlich über `expect.poll` und Auto-Waiting.
- run_03 prüft zusätzlich `getActiveBaseLayerTitle(page)).toBe('Carto Light')`.

### uc-06 / Stufe 4

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_4_manual_ui_map/run_30/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_31/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_32/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_33/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_34/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`

- Genau ein Kartenklick je Datei über `mapContainer.click({ position: { x, y } })` mit aus `boundingBox()` berechneten Koordinaten (5/5); nie feste Pixelwerte, nie `page.mouse`. Klickstelle unterschiedlich: Mitte (run_31, run_34), 0.6/0.6 (run_30), 0.35/0.65 (run_32), 0.75/0.5 (run_33).
- Kartenzustand über Helfer: `getMapCenter` (5/5), `getHighlightedCoordinate` nach dem Klick (5/5), `getMapZoomLevel` (1/5, run_34).
- Die Ergebnisprüfung endet in 5/5 mit `expect(weatherForecast).toBeVisible()` gefolgt von `toHaveCount(24)` auf `getByTestId('weather-forecast-entry')` – die erwartete Anzahl 24 steht als Literal im Code.
- Das Info-Panel wird in 3/5 bedingt über `getByTestId('info-panel-toggle')` und `aria-pressed` geöffnet, in 2/5 unbedingt als sichtbar erwartet.
- Vorab-`toBeHidden()` auf `weather-forecast` in 3/5. Kein `waitForTimeout` (0/5).

### uc-10 / Stufe 4

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_4_manual_ui_map/run_29/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_30/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_31/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_32/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_4_manual_ui_map/run_33/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`

- Reihenfolge in 5/5: Temperature ausschalten, Precipitation einschalten, beide über `getByRole('checkbox', { name: …, exact: true })` mit `click({ force: true })`.
- Suchbegriff in 5/5 wörtlich `'Münster'`; Eingabe 4/5 über `fill('Münster')`, 1/5 über `type('Münster')` (run_30).
- Ergebnisauswahl 4/5 über `getByTestId('geocoder-result-item-0')`, 1/5 über `geocoderResults.getByRole('listitem').first()` (run_32).
- Kartenzustand über Helfer: `isLayerRendered` und `getMapCenter` (5/5), `getActiveBaseLayerTitle(page)).toBe('Carto Light')` (3/5), `getHighlightedCoordinate` (3/5).
- Abschluss in 5/5 `toHaveCount(24)` auf `weather-forecast-entry`, davor `expect(weatherForecast).toBeVisible()`.
- Ein Kartenklick nach der Suche findet nur in run_30 unbedingt statt und in run_33 als `catch`-Fallback; run_29/31/32 klicken die Karte nicht.
- Kein `waitForTimeout` (0/5).

### uc-07 / Stufe 2

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_2_accessibility_snapshot/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`
- `stage_2_accessibility_snapshot/run_02/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`
- `stage_2_accessibility_snapshot/run_03/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`
- `stage_2_accessibility_snapshot/run_04/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`
- `stage_2_accessibility_snapshot/run_05/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`

- In 5/5 steht dieselbe feste Zielkoordinate im Code: `1188692.84` / `6767643.28` (EPSG:3857), in run_01/03/05 als Objekt, in run_02/04 als Tupel.
- Es wird in 5/5 **nicht** mit festen Pixeln geklickt: die Klickposition wird zur Laufzeit aus `boundingBox()` und dem Text von `getByTestId('coordinate-viewer')` interpoliert. Kalibrierung über 3–5 `hover({ position })`-Punkte (run_03 über `page.mouse.move`) und ein iteratives Refinement (2, 2, 5, 2 bzw. 3 Durchläufe). run_02 sucht zusätzlich in `page.evaluate` das OpenLayers-Objekt mit `getPixelFromCoordinate` (Graph-Traversal, `maxDepth = 7`, `maxNodes = 4000`).
- Jede Datei bringt einen eigenen Parser für lokalisierte Zahlen und eine eigene Regex zur Koordinatenextraktion mit.
- Vorbereitung in 5/5: beide Stations-Checkboxen über `getByRole('checkbox', { name: 'UV-Index Stations' | 'EUCOS Ground Stations', exact: true })` mit `click({ force: true })` sicherstellen, Messwerkzeug über `aria-pressed` deaktivieren, `getByTestId('initial-extent-button')` klicken.
- Ergebnisprüfung: `toContainText(/UV-Index Station/i)` bzw. `/EUCOS Ground Station/i` (3/5), als Plain-String (2/5), in run_05 `getByText(/…/i)` + `toBeVisible()`.
- Kein `waitForTimeout` (0/5); Warten über `expect.poll`.

### uc-10 / Stufe 2

Gelesene Dateien (unter `src/app/llm/tests/`):

- `stage_2_accessibility_snapshot/run_01/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_2_accessibility_snapshot/run_02/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_2_accessibility_snapshot/run_04/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_2_accessibility_snapshot/run_05/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`
- `stage_2_accessibility_snapshot/run_06/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`

- Keine Map-Model-Helfer verfügbar; der Kartenzustand wird indirekt über Text gelesen: `getByTestId('scale-viewer')` (run_01) bzw. `getByTestId('coordinate-viewer')` (run_04, 05, 06); run_02 prüft die Navigation gar nicht.
- Kein Kartenklick und keine festen Pixelkoordinaten in 5/5; einzige Kartenberührung ist ein `hover` in run_04 (Mitte, `+30 px` Offset).
- Suchbegriff in 5/5 `'Münster'`; Eingabe 4/5 `fill`, 1/5 `pressSequentially` (run_01). Ergebnisauswahl primär über `getByRole('option')` mit Fallback-Ketten auf `getByRole('listitem'|'button'|'link')` und in run_02 zusätzlich Tastatur (`press('ArrowDown')`, `press('Enter')`).
- Die erwartete Forecast-Anzahl `24` steht in 5/5 als Literal; gezählt wird über eine Rollen-Kaskade (`getByRole('listitem')` → `article` → `row` → `img`) (run_01, 02, 04), über `toHaveCount(24)` auf `getByRole('listitem')` (run_05) oder über `element.children`-Zählung plus `waitForResponse` auf ein JSON-Array der Länge 24 (run_06).
- Der Platzhaltertext `'Click on the map to load a forecast.'` wird in 4/5 geprüft.
- Kein `waitForTimeout` (0/5); run_06 nutzt als einzige Datei `page.on('request', …)` und `waitForResponse`.

## Schritt D – Zählmuster über ALLE Dateien der Stufe

Grundmenge je Stufe: 500 generierte `*.spec.ts` (Stufe 5: die `final_spec` je Lauf/UC). Angegeben sind Dateien mit mindestens einem Treffer (absolut und in Prozent der 500 Dateien). Alle Regexe stehen in `anomalies.py:BASE_PATTERNS` / `EXTRA_PATTERNS`.

### Pflichtmuster

| Gruppe         | Muster                                  | Regex                                                                                                          | Stufe 1     | Stufe 2      | Stufe 3      | Stufe 4      | Stufe 5     |
| -------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- | ------------ | ------------ | ------------ | ----------- |
| Selektorart    | getByTestId                             | `getByTestId\s*\(`                                                                                             | 36 (7.2%)   | 500 (100.0%) | 500 (100.0%) | 500 (100.0%) | 499 (99.8%) |
| Selektorart    | getByRole                               | `getByRole\s*\(`                                                                                               | 476 (95.2%) | 392 (78.4%)  | 249 (49.8%)  | 266 (53.2%)  | 389 (77.8%) |
| Selektorart    | getByText                               | `getByText\s*\(`                                                                                               | 230 (46.0%) | 131 (26.2%)  | 11 (2.2%)    | 52 (10.4%)   | 99 (19.8%)  |
| Selektorart    | getByLabel(Text)                        | `getByLabel(?:Text)?\s*\(`                                                                                     | 41 (8.2%)   | 36 (7.2%)    | 37 (7.4%)    | 36 (7.2%)    | 16 (3.2%)   |
| Selektorart    | page.locator(CSS)                       | `page\.locator\s*\(`                                                                                           | 260 (52.0%) | 11 (2.2%)    | 0 (0.0%)     | 0 (0.0%)     | 0 (0.0%)    |
| Kartenmodell   | \_\_openPioneerMap                      | `__openPioneerMap`                                                                                             | 0 (0.0%)    | 0 (0.0%)     | 49 (9.8%)    | 50 (10.0%)   | 51 (10.2%)  |
| Kartenmodell   | Helferfunktion (eine der fünf)          | `\b(?:getActiveBaseLayerTitle\|isLayerRendered\|getMapZoomLevel\|getMapCenter\|getHighlightedCoordinate)\s*\(` | 0 (0.0%)    | 0 (0.0%)     | 450 (90.0%)  | 453 (90.6%)  | 460 (92.0%) |
| Kartenmodell   | Import `map-model-helpers`              | `from\s+['\"][^'\"]*map-model-helpers[^'\"]*['\"]`                                                             | 0 (0.0%)    | 0 (0.0%)     | 450 (90.0%)  | 453 (90.6%)  | 460 (92.0%) |
| Wartestrategie | waitForTimeout                          | `waitForTimeout\s*\(`                                                                                          | 0 (0.0%)    | 0 (0.0%)     | 0 (0.0%)     | 0 (0.0%)     | 0 (0.0%)    |
| Wartestrategie | expect.poll                             | `expect\.poll\s*\(`                                                                                            | 239 (47.8%) | 268 (53.6%)  | 441 (88.2%)  | 441 (88.2%)  | 454 (90.8%) |
| Wartestrategie | waitFor/waitForSelector/waitForFunction | `\.waitFor\s*\(\|waitForSelector\s*\(\|waitForFunction\s*\(`                                                   | 0 (0.0%)    | 0 (0.0%)     | 2 (0.4%)     | 2 (0.4%)     | 2 (0.4%)    |
| Wartestrategie | waitForLoadState                        | `waitForLoadState\s*\(`                                                                                        | 305 (61.0%) | 129 (25.8%)  | 56 (11.2%)   | 60 (12.0%)   | 55 (11.0%)  |
| Interaktion    | force: true                             | `force\s*:\s*true`                                                                                             | 279 (55.8%) | 247 (49.4%)  | 255 (51.0%)  | 221 (44.2%)  | 217 (43.4%) |
| Interaktion    | page.mouse.\*                           | `page\.mouse\.`                                                                                                | 2 (0.4%)    | 16 (3.2%)    | 0 (0.0%)     | 1 (0.2%)     | 1 (0.2%)    |
| Interaktion    | dblclick                                | `\.dblclick\s*\(`                                                                                              | 50 (10.0%)  | 50 (10.0%)   | 50 (10.0%)   | 50 (10.0%)   | 50 (10.0%)  |

### Aus Schritt C abgeleitete Muster

| Gruppe          | Muster                                    | Regex                                                                      | Stufe 1        | Stufe 2         | Stufe 3     | Stufe 4     | Stufe 5     |
| --------------- | ----------------------------------------- | -------------------------------------------------------------------------- | -------------- | --------------- | ----------- | ----------- | ----------- | --------- | --------- | --------- | --------- | --------- |
| aus uc-08       | Regex-Textprüfung auf Zahl + m/km         | `\(m\\                                                                     | km\)\|\(\?:m\\ | km\)\|\(\?:mm\\ | cm\\        | m\\         | km\)`       | 31 (6.2%) | 40 (8.0%) | 37 (7.4%) | 33 (6.6%) | 45 (9.0%) |
| aus uc-08       | erweiterte Einheiten mm                   | cm                                                                         | `mm\\          | cm`             | 31 (6.2%)   | 18 (3.6%)   | 16 (3.2%)   | 36 (7.2%) | 13 (2.6%) |
| aus uc-02       | selectOption(...)                         | `\.selectOption\s*\(`                                                      | 49 (9.8%)      | 98 (19.6%)      | 52 (10.4%)  | 100 (20.0%) | 77 (15.4%)  |
| aus uc-02       | Cast auf HTMLSelectElement                | `HTMLSelectElement`                                                        | 6 (1.2%)       | 73 (14.6%)      | 14 (2.8%)   | 13 (2.6%)   | 40 (8.0%)   |
| aus uc-02       | getByRole('combobox'…)                    | `getByRole\s*\(\s*['\"]combobox['\"]`                                      | 96 (19.2%)     | 100 (20.0%)     | 53 (10.6%)  | 100 (20.0%) | 115 (23.0%) |
| aus uc-02       | getByRole('radio'…)                       | `getByRole\s*\(\s*['\"]radio['\"]`                                         | 101 (20.2%)    | 51 (10.2%)      | 99 (19.8%)  | 55 (11.0%)  | 23 (4.6%)   |
| aus uc-02       | Kandidatenliste 'Base maps'/'Basemaps'    | `['\"]Base ?maps?['\"]\|['\"]Basiskarten['\"]\|['\"]Background maps?['\"]` | 13 (2.6%)      | 98 (19.6%)      | 13 (2.6%)   | 0 (0.0%)    | 50 (10.0%)  |
| aus uc-05       | Legende über exakten Text 'Precipitation' | `getByText\s*\(\s*['\"]Precipitation['\"]`                                 | 49 (9.8%)      | 0 (0.0%)        | 0 (0.0%)    | 38 (7.6%)   | 0 (0.0%)    |
| aus uc-05       | legendenspezifisches testid (`*-legend`)  | `getByTestId\s*\(\s*['\"][a-z-]*-legend['\"]`                              | 0 (0.0%)       | 42 (8.4%)       | 51 (10.2%)  | 0 (0.0%)    | 22 (4.4%)   |
| aus uc-06/uc-10 | Literal 24 in Assertion                   | `toHaveCount\s*\(\s*24\s*\)\|\.toBe\s*\(\s*24\s*\)`                        | 88 (17.6%)     | 89 (17.8%)      | 100 (20.0%) | 100 (20.0%) | 80 (16.0%)  |
| aus uc-07       | feste Zielkoordinate 1188692.84           | `1188692\.84`                                                              | 12 (2.4%)      | 47 (9.4%)       | 50 (10.0%)  | 50 (10.0%)  | 50 (10.0%)  |
| aus uc-07       | Kalibrierung über coordinate-viewer       | `getByTestId\s*\(\s*['\"]coordinate-viewer['\"]`                           | 0 (0.0%)       | 59 (11.8%)      | 0 (0.0%)    | 0 (0.0%)    | 0 (0.0%)    |
| aus uc-07       | hover({ position …                        | `\.hover\s*\(\s*\{`                                                        | 0 (0.0%)       | 32 (6.4%)       | 0 (0.0%)    | 0 (0.0%)    | 0 (0.0%)    |
| aus uc-10       | Suchbegriff 'Münster'                     | `M(?:ü\|ue\|u)nster`                                                       | 50 (10.0%)     | 50 (10.0%)      | 50 (10.0%)  | 50 (10.0%)  | 50 (10.0%)  |
| aus uc-10       | Platzhaltertext 'Click on the map…'       | `Click on the map to load a forecast`                                      | 0 (0.0%)       | 92 (18.4%)      | 0 (0.0%)    | 0 (0.0%)    | 85 (17.0%)  |

### Assertions direkt auf `map-container`

Gezählt werden Assertions, deren Subjekt der `map-container` selbst ist – also `expect(page.getByTestId('map-container'))…` bzw. `expect(<var>)…` für eine so deklarierte Variable. Verschachtelte Locator wie `mapContainer.getByText(...)` zählen **nicht**, weil dort ein anderes Element geprüft wird (`anomalies.py:count_map_container_assertions`).

| Stufe | Dateien mit Assertion auf map-container | Assertions gesamt | Dateien mit Helferaufruf | Dateien mit beidem | Dateien mit map-container-Assertion, aber ohne Helfer |
| ----- | --------------------------------------- | ----------------- | ------------------------ | ------------------ | ----------------------------------------------------- |
| 1     | 0 (0.0%)                                | 0                 | 0 (0.0%)                 | 0                  | 0                                                     |
| 2     | 332 (66.4%)                             | 338               | 0 (0.0%)                 | 0                  | 332                                                   |
| 3     | 246 (49.2%)                             | 246               | 450 (90.0%)              | 240                | 6                                                     |
| 4     | 393 (78.6%)                             | 393               | 453 (90.6%)              | 358                | 35                                                    |
| 5     | 256 (51.2%)                             | 257               | 460 (92.0%)              | 252                | 4                                                     |

### Importpfad der Helferdatei und seine Varianten

Quelle: Regex `from\s+['\"]([^'\"]*map-model-helpers[^'\"]*)['\"]` über alle Dateien der Stufe.

| Stufe | Importpfad                      | n Dateien | % der Stufe |
| ----- | ------------------------------- | --------- | ----------- |
| 1     | – (kein Import)                 | 0         | 0.0%        |
| 2     | – (kein Import)                 | 0         | 0.0%        |
| 3     | `../../../map-model-helpers`    | 450       | 90.0%       |
| 4     | `../../../map-model-helpers`    | 453       | 90.6%       |
| 5     | `../../../../map-model-helpers` | 460       | 92.0%       |

- Die Verzeichnistiefe unterscheidet sich bauartbedingt: Stufen 1–4 legen die Spec unter `run_NN/` ab (drei Ebenen bis `src/app/llm/`), Stufe 5 unter `run_NN/<uc-dir>/` (vier Ebenen). Andere Varianten kommen in den Daten nicht vor.

### Verwendete `getByTestId`-Werte gegen die reale Liste

Referenzliste (Grundwahrheit): alle `data-testid`-Werte im Anwendungsquelltext `src/app/**/*.tsx|ts` ohne `llm/` – **40** Werte (`common.py:real_testids_from_source()`). Die Datei `generated-ui-map.md` nennt im Kopf „39 unique data-testid values"; ihre Tabelle enthält 38 benannte Einträge plus drei Zeilen `...`. Gegenüber dem Quelltext fehlen ihr `eucos-station-info`, `uvi-station-info`. Ausgezählt wird gegen die Quelltextliste; ein dynamischer Eintrag (`geocoder-result-item-${…}`) gilt über sein Präfix als getroffen.

| Stufe | verschiedene verwendete testids | davon real | davon halluziniert | Dateien mit ≥ 1 halluziniertem testid | Vorkommen halluzinierter testids (Dateien summiert) |
| ----- | ------------------------------- | ---------- | ------------------ | ------------------------------------- | --------------------------------------------------- |
| 1     | 36                              | 8          | 28                 | 30 (6.0%)                             | 79                                                  |
| 2     | 24                              | 24         | 0                  | 0 (0.0%)                              | 0                                                   |
| 3     | 28                              | 28         | 0                  | 0 (0.0%)                              | 0                                                   |
| 4     | 32                              | 32         | 0                  | 0 (0.0%)                              | 0                                                   |
| 5     | 33                              | 33         | 0                  | 0 (0.0%)                              | 0                                                   |

Liste der halluzinierten testids je Stufe (Wert – Anzahl Dateien):

| Stufe | n   | halluzinierte testids                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 28  | `map` (25), `forecast-entry` (11), `ol-map` (7), `forecast` (5), `forecast-item` (3), `forecast-section` (3), `information-panel` (3), `details-panel` (2), `weather-entry` (1), `weather-location-marker` (1), `highlighted-position` (1), `map-highlight` (1), `selected-position` (1), `infopanel` (1), `forecast-card` (1), `geocoder-search` (1), `feature-info-panel` (1), `selected-location` (1), `selected-position-marker` (1), `search-input` (1), `layer-toggle-precipitation` (1), `layer-toggle-temperature` (1), `toggle-temperature` (1), `precipitation-layer-toggle` (1), `temperature-layer-toggle` (1), `toggle-precipitation` (1), `map-view` (1), `map-canvas` (1) |
| 2     | 0   | – keine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3     | 0   | – keine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 4     | 0   | – keine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 5     | 0   | – keine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### Selektorstrategie je Stufe

| Stufe | nur getByTestId | nur Rolle/Text/Label/CSS | gemischt    |
| ----- | --------------- | ------------------------ | ----------- |
| 1     | 0 (0.0%)        | 461 (92.2%)              | 36 (7.2%)   |
| 2     | 103 (20.6%)     | 0 (0.0%)                 | 397 (79.4%) |
| 3     | 244 (48.8%)     | 0 (0.0%)                 | 256 (51.2%) |
| 4     | 232 (46.4%)     | 0 (0.0%)                 | 268 (53.6%) |
| 5     | 106 (21.2%)     | 1 (0.2%)                 | 393 (78.6%) |

## Schritt E – Steckbrief je auffälliger Zelle

„Häufigkeit des Problems" = Anteil der Fehlschläge der Zelle in der größten Fehlergruppe aus Schritt B. „Zählmuster" ist das aus Schritt C abgeleitete Muster, ausgezählt über alle 50 Dateien der Zelle **und** über alle 500 Dateien der Stufe.

| Zelle               | PASS-Rate | Fehlschläge | größte Fehlergruppe                    | Zählmuster (Schritt D)                    | Treffer in der Zelle | davon unter den Fehlschlägen | Treffer in der Stufe | Beispieldatei                                                                                                                    |
| ------------------- | --------- | ----------- | -------------------------------------- | ----------------------------------------- | -------------------- | ---------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **uc-08 / Stufe 3** | 0%        | 50          | J_konkreter_received_wert – 48 (96.0%) | Regex-Textprüfung auf Zahl + m/km         | 37/50 (74.0%)        | 37/50 (74.0%)                | 37/500 (7.4%)        | `tests/stage_3_generated_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                            |
| **uc-08 / Stufe 4** | 0%        | 50          | J_konkreter_received_wert – 47 (94.0%) | Regex-Textprüfung auf Zahl + m/km         | 33/50 (66.0%)        | 33/50 (66.0%)                | 33/500 (6.6%)        | `tests/stage_4_manual_ui_map/run_01/uc-08-measure-a-distance-by-drawing-a-line-on-the-map.spec.ts`                               |
| **uc-02 / Stufe 3** | 0%        | 50          | D_element_not_found – 41 (82.0%)       | getByRole('radio'…) + click({force:true}) | 50/50 (100.0%)       | 50/50 (100.0%)               | 99/500 (19.8%)       | `tests/stage_3_generated_ui_map/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`                      |
| **uc-02 / Stufe 2** | 2%        | 49          | E_js_laufzeitfehler – 35 (71.4%)       | selectOption(...) auf einer Combobox      | 50/50 (100.0%)       | 49/49 (100.0%)               | 98/500 (19.6%)       | `tests/stage_2_accessibility_snapshot/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`                |
| **uc-05 / Stufe 4** | 24%       | 38          | D_element_not_found – 37 (97.4%)       | Legende über exakten Text 'Precipitation' | 38/50 (76.0%)        | 38/38 (100.0%)               | 38/500 (7.6%)        | `tests/stage_4_manual_ui_map/run_01/uc-05-activate-the-precipitation-overlay-and-verify-the-legend-updates.spec.ts`              |
| **uc-06 / Stufe 4** | 58%       | 21          | D_element_not_found – 21 (100.0%)      | Literal 24 in der Abschluss-Assertion     | 50/50 (100.0%)       | 21/21 (100.0%)               | 100/500 (20.0%)      | `tests/stage_4_manual_ui_map/run_30/uc-06-click-a-map-position-to-show-the-weather-forecast.spec.ts`                             |
| **uc-10 / Stufe 4** | 56%       | 22          | D_element_not_found – 22 (100.0%)      | Literal 24 in der Abschluss-Assertion     | 50/50 (100.0%)       | 22/22 (100.0%)               | 100/500 (20.0%)      | `tests/stage_4_manual_ui_map/run_29/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`          |
| **uc-07 / Stufe 2** | 0%        | 50          | J_konkreter_received_wert – 47 (94.0%) | feste Zielkoordinate 1188692.84           | 47/50 (94.0%)        | 47/50 (94.0%)                | 47/500 (9.4%)        | `tests/stage_2_accessibility_snapshot/run_01/uc-07-click-both-point-station-layers-to-show-feature-info.spec.ts`                 |
| **uc-10 / Stufe 2** | 4%        | 48          | J_konkreter_received_wert – 31 (64.6%) | Suchbegriff 'Münster'                     | 50/50 (100.0%)       | 48/48 (100.0%)               | 50/500 (10.0%)       | `tests/stage_2_accessibility_snapshot/run_01/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts` |

## Hypothesen (unbelegt)

> Dieser Abschnitt ist **nicht** aus den Daten belegt. Er listet mögliche
> Erklärungen für die oben gezählten Muster, die sich jeweils mit einem
> konkreten nächsten Schritt am Code prüfen ließen. Nichts davon wurde
> geprüft.

| Beobachtung (belegt)                                                                                                                                                                                                                                                                                            | Hypothese (unbelegt)                                                                                                                                                                                                      | prüfbar durch                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| uc-08: 0 % PASS in Stufe 3 und 4; 96 % bzw. 94 % der Fehlschläge in `J_konkreter_received_wert`, Fehlerkopf `toContainText(expected) failed`; 74 % bzw. 66 % der Dateien prüfen mit einer Regex auf Zahl + `m`/`km`                                                                                             | Der reale Text im `measurement`-Element trägt eine andere Einheit oder ein anderes Format, als die Regex erwartet                                                                                                         | einmal manuell messen und den tatsächlichen `textContent` von `getByTestId('measurement')` protokollieren; gegen die acht in Schritt C notierten Regexe halten    |
| uc-02: Stufe 2 adressiert den Basemap-Umschalter in 100 % als `getByRole('combobox')` + `selectOption`, Stufe 3 in 100 % als `getByRole('radio')` + `click({force:true})`; Stufe 2 scheitert zu 71 % an `Cannot read properties of undefined`, Stufe 3 zu 82 % an `element(s) not found`; Stufe 4 erreicht 38 % | Das reale Bedienelement ist weder ein `<select>` noch eine Radiogruppe; beide Kontextstufen legen eine falsche Widget-Art nahe                                                                                            | die tatsächliche Rolle des Elements im Accessibility-Tree ablesen und mit den drei Kontextdateien (Stufe 2, 3, 4) vergleichen                                     |
| uc-05: Stufe 3 100 % PASS, Stufe 4 24 %; 97 % der Fehlschläge `element(s) not found`; 76 % der Stufe-4-Dateien schließen mit `legend.getByText('Precipitation', {exact:true})`, in Stufe 3 tut das keine Datei                                                                                                  | Die manuelle UI-Map (Stufe 4) legt den exakten Legendentext `Precipitation` nahe, während die Legende anders beschriftet ist oder das legendenspezifische testid (`precipitation-legend`) tragen würde                    | den gerenderten Inhalt von `getByTestId('legend')` nach Aktivierung protokollieren; `manual-ui-map.json` gegen `generated-ui-map.md` an dieser Stelle vergleichen |
| uc-06 und uc-10: 100 % der Dateien enthalten das Literal `24` in der Abschluss-Assertion; in Stufe 4 sind alle Fehlschläge dieser beiden Zellen `element(s) not found`                                                                                                                                          | Die Zahl 24 stammt aus dem Referenztest bzw. dem Use-Case-Text und ist datenabhängig (Stundenwerte der Vorhersage)                                                                                                        | `use_cases.md` und den Referenztest auf die Herkunft der 24 prüfen; die tatsächliche Zahl der `weather-forecast-entry`-Elemente in mehreren Läufen zählen         |
| uc-07: 94 % der Stufe-2-Dateien enthalten dieselbe feste Zielkoordinate `1188692.84 / 6767643.28`, jede Datei baut eine eigene Pixel-Kalibrierung über `coordinate-viewer`                                                                                                                                      | Die Koordinate stammt aus dem Use-Case-Text; ohne Map-Model-Helfer bleibt nur die Kalibrierung über den Koordinatenanzeiger. Stufe 3 (56 %) und 4 (78 %) verbessern sich, sobald `getHighlightedCoordinate` verfügbar ist | die Kalibrierungsgenauigkeit einmal messen: Zielkoordinate gegen tatsächlich geklickte Koordinate                                                                 |
| Stufe 1: 28 verschiedene halluzinierte testids in 30 Dateien (u. a. `map`, `forecast-entry`, `ol-map`); ab Stufe 2 null                                                                                                                                                                                         | Ohne testid-Liste im Kontext erfindet das Modell plausible Namen                                                                                                                                                          | keine weitere Prüfung nötig – der Befund ist bereits gezählt                                                                                                      |
| `waitForTimeout` kommt in **keiner** der 2500 Dateien vor; `expect.poll` in 47,8 % (Stufe 1) bis 90,8 % (Stufe 5)                                                                                                                                                                                               | Die Wartestrategie wird durch den Generierungs-Prompt bzw. das Skill-Dokument vorgegeben, nicht durch den UI-Kontext                                                                                                      | `generate_tests_stage_*.py` und `SKILL.md` auf eine entsprechende Anweisung durchsuchen                                                                           |
| Stufe 4 setzt in 78,6 % der Dateien mindestens eine Assertion direkt auf `map-container`, Stufe 3 in 49,2 % – bei gleichzeitig 90 % Helfernutzung in beiden                                                                                                                                                     | Die zusätzliche `ui-map`-Sektion der Stufe 4 nennt `map-container` als Element und lädt zu einer Sichtbarkeitsprüfung darauf ein, die zum Testziel nichts beiträgt                                                        | `_stage_4_context.txt` an der `map-container`-Zeile mit `_stage_3_context.txt` vergleichen                                                                        |
