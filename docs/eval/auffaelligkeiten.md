# Auffälligkeiten mit Beleg (Schritte A bis E)

Erzeugt von `src/app/llm/eval_extract/report_auffaelligkeiten.py`. Grundlage: PASS-Raten-Matrix aus `_phase1_results.csv` aller Stufen, Fehlermeldungsgruppen aus der Spalte `error_summary`, Codestichproben aus den generierten `*.spec.ts`-Dateien.

## Schritt A - auffällige Zellen

Ausgangstabelle (PASS-Rate in Prozent):

| uc_id      | Stufe 1 | Stufe 2 | Stufe 3 | Stufe 4 | Stufe 5 |
| ---------- | ------- | ------- | ------- | ------- | ------- |
| uc-01      | 52      | 82      | 100     | 98      | 100     |
| uc-02      | 0       | 22      | 0       | 28      | 100     |
| uc-03      | 62      | 32      | 4       | 14      | 18      |
| uc-04      | 18      | 4       | 66      | 12      | 100     |
| uc-05      | 64      | 66      | 74      | 86      | 100     |
| uc-06      | 0       | 0       | 8       | 24      | 64      |
| uc-07      | 0       | 2       | 10      | 2       | 46      |
| uc-08      | 0       | 0       | 16      | 24      | 28      |
| uc-09      | 4       | 12      | 22      | 28      | 94      |
| uc-10      | 0       | 0       | 56      | 70      | 82      |
| **gesamt** | 20.0    | 22.0    | 35.7    | 38.6    | 73.2    |

Auswahlregeln (in `find_cells`):

1. **Sprung**: Änderung der Zelle von Stufe k zu k+1 weicht um mindestens 25 Prozentpunkte von der Änderung der Gesamt-PASS-Rate ab.
2. **kein Kontextnutzen**: PASS-Rate in Stufe 4 ist nicht höher als in Stufe 1, obwohl die Gesamt-PASS-Rate um +18.6 Prozentpunkte steigt.
3. **Extremwert**: Zelle ist 0 % (bei positiver Stufenrate) oder 100 % (Stufen 1-4).

Sortiert nach Auffälligkeitsmaß (Regel 1: Betrag der Abweichung; Regel 2: Betrag der Differenz + 20; Regel 3: Abstand zur Stufenrate). Die zehn auffälligsten Zellen:

| #   | Zelle           | Regel              | PASS-Rate | Begründung                                                                                                                                                       | Maß |
| --- | --------------- | ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| 1   | uc-03 / Stufe 4 | kein Kontextnutzen | 14 %      | Stufe 1 = 62 %, Stufe 4 = 14 % (-48 pp), obwohl der Stufentrend +18.6 pp beträgt                                                                                 | 68  |
| 2   | uc-01 / Stufe 3 | Voll-Zelle         | 100 %     | 100 % PASS in Stufe 3 bei Stufen-PASS-Rate 35.7 %                                                                                                                | 64  |
| 3   | uc-04 / Stufe 4 | Sprung             | 12 %      | PASS-Rate 66 % → 12 % (-54 pp) gegenüber Stufentrend +2.9 pp, Abweichung -57 pp; Stufe 1 = 18 %, Stufe 4 = 12 % (-6 pp), obwohl der Stufentrend +18.6 pp beträgt | 57  |
| 4   | uc-04 / Stufe 5 | Sprung             | 100 %     | PASS-Rate 12 % → 100 % (+88 pp) gegenüber Stufentrend +34.6 pp, Abweichung +53 pp                                                                                | 53  |
| 5   | uc-04 / Stufe 3 | Sprung             | 66 %      | PASS-Rate 4 % → 66 % (+62 pp) gegenüber Stufentrend +13.7 pp, Abweichung +48 pp                                                                                  | 48  |
| 6   | uc-10 / Stufe 3 | Sprung             | 56 %      | PASS-Rate 0 % → 56 % (+56 pp) gegenüber Stufentrend +13.7 pp, Abweichung +42 pp                                                                                  | 42  |
| 7   | uc-03 / Stufe 3 | Sprung             | 4 %       | PASS-Rate 32 % → 4 % (-28 pp) gegenüber Stufentrend +13.7 pp, Abweichung -42 pp                                                                                  | 42  |
| 8   | uc-02 / Stufe 5 | Sprung             | 100 %     | PASS-Rate 28 % → 100 % (+72 pp) gegenüber Stufentrend +34.6 pp, Abweichung +37 pp                                                                                | 37  |
| 9   | uc-02 / Stufe 3 | Sprung             | 0 %       | PASS-Rate 22 % → 0 % (-22 pp) gegenüber Stufentrend +13.7 pp, Abweichung -36 pp; 0 % PASS in Stufe 3 bei Stufen-PASS-Rate 35.7 %                                 | 36  |
| 10  | uc-01 / Stufe 5 | Sprung             | 100 %     | PASS-Rate 98 % → 100 % (+2 pp) gegenüber Stufentrend +34.6 pp, Abweichung -33 pp                                                                                 | 33  |

## Schritt B und C - Fehlermeldungsgruppen und Codestichprobe je Zelle

### 1. `uc-03` / Stufe 4 (PASS 14 %, 50 Läufe, 43 Fehlschläge)

Kategorien: ASSERTION_FAIL: 43, PASS: 7.

**Schritt B - Fehlermeldungsgruppen** (4 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                                  |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23  | 53.5                           | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                                             |
| 16  | 37.2                           | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined            |
| 3   | 7.0                            | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has type: object \| Received ha |
| 1   | 2.3                            | Error: expect(received).toBeLessThan(expected) \| Matcher error: expected value must be a number or bigint                                                |

**Schritt C - Stichprobe** (5 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_4_manual_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 2
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeTruthy();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedInLevel);
    ```
- `stage_4_manual_ui_map/run_02/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 2
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    ASSERT:expect(zoomedIn).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedIn);
    ASSERT:expect(zoomedOut).toBeLessThan(zoomedIn);
    ```
- `stage_4_manual_ui_map/run_03/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 2
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button')
    ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom!);
    getByTestId('zoom-out-button')
    ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomedInLevel);
    ```
- `stage_4_manual_ui_map/run_05/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 2
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom!);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn);
    ```
- `stage_4_manual_ui_map/run_14/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 2
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn);
    ```

### 2. `uc-01` / Stufe 3 (PASS 100 %, 50 Läufe, 0 Fehlschläge)

Kategorien: PASS: 50.

**Schritt B**: keine Fehlschläge in dieser Zelle.

**Schritt C - Stichprobe** (5 Dateien):

- `stage_3_generated_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `stage_3_generated_ui_map/run_02/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `stage_3_generated_ui_map/run_03/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `stage_3_generated_ui_map/run_04/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `stage_3_generated_ui_map/run_05/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByTestId('layer-switcher-toggle') | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```

### 3. `uc-04` / Stufe 4 (PASS 12 %, 50 Läufe, 44 Fehlschläge)

Kategorien: INFRA_FAIL: 42, PASS: 6, ASSERTION_FAIL: 2.

**Schritt B - Fehlermeldungsgruppen** (5 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                                |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34  | 77.3                           | Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                                             |
| 6   | 13.6                           | Error: locator.click: Error: strict mode violation: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                            |
| 2   | 4.5                            | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                            |
| 1   | 2.3                            | Error: locator.isChecked: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                                         |
| 1   | 2.3                            | Error: expect(locator).toBeChecked({ checked: false }) failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByRole(<Q>, |

**Schritt C - Stichprobe** (5 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_4_manual_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexToggle).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_4_manual_ui_map/run_02/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexToggle).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_4_manual_ui_map/run_04/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_4_manual_ui_map/run_05/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_4_manual_ui_map/run_06/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```

### 4. `uc-04` / Stufe 5 (PASS 100 %, 50 Läufe, 0 Fehlschläge)

Kategorien: PASS: 50.

**Schritt B**: keine Fehlschläge in dieser Zelle.

**Schritt C - Stichprobe** (5 Dateien):

- `tests/stage_5_self_improvement_loop/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-1-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index', exact: true })
    ASSERT:expect(uvIndexCheckbox).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `tests/stage_5_self_improvement_loop/run_02/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-1-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index', exact: true })
    ASSERT:expect(uvIndexCheckbox).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `tests/stage_5_self_improvement_loop/run_03/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-0-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index' })
    ASSERT:expect(uvIndexCheckbox).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `tests/stage_5_self_improvement_loop/run_04/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-5-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction 4, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('list', { name: 'Operational layers' })
    getByRole('checkbox', { name: 'UV-Index', exact: true })
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `tests/stage_5_self_improvement_loop/run_05/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-1-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction 4, assertion 4
    ```
    goto
    getByRole('checkbox', { name: 'UV-Index', exact: true })
    ASSERT:expect(uvIndexCheckbox).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```

### 5. `uc-04` / Stufe 3 (PASS 66 %, 50 Läufe, 17 Fehlschläge)

Kategorien: PASS: 33, INFRA_FAIL: 15, ASSERTION_FAIL: 2.

**Schritt B - Fehlermeldungsgruppen** (9 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                                 |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | 23.5                           | Error: expect(locator).not.toBeChecked() failed \| Locator: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: getByTestId( |
| 3   | 17.6                           | Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                                              |
| 2   | 11.8                           | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                             |
| 2   | 11.8                           | Error: expect(locator).toBeVisible() failed \| Locator: locator(<Q>) \| Error: element(s) not found                                                      |
| 2   | 11.8                           | Error: locator.click: Error: strict mode violation: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                             |

**Schritt C - Stichprobe** (4 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_3_generated_ui_map/run_15/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher')
    getByRole('checkbox', { name: 'UV-Index' })
    ASSERT:expect(uvIndexToggle).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexToggle).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_3_generated_ui_map/run_21/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher')
    ASSERT:expect(layerSwitcherPanel).toBeVisible();
    getByRole('checkbox', { name: 'UV-Index' })
    ASSERT:expect(uvIndexToggle).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexToggle).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_3_generated_ui_map/run_41/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher')
    getByRole('checkbox', { name: 'UV-Index' })
    ASSERT:expect(uvIndexToggle).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexToggle).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```
- `stage_3_generated_ui_map/run_47/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 3, map_interaction 4, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher')
    getByRole('checkbox', { name: 'UV-Index' })
    ASSERT:expect(uvIndexCheckbox).not.toBeChecked();
    ACTION:click{force:true}
    ASSERT:expect(uvIndexCheckbox).toBeChecked();
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
    ```

### 6. `uc-10` / Stufe 3 (PASS 56 %, 50 Läufe, 22 Fehlschläge)

Kategorien: PASS: 28, INFRA_FAIL: 11, ASSERTION_FAIL: 10, COMPILE_ERROR: 1.

**Schritt B - Fehlermeldungsgruppen** (14 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                                 |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | 22.7                           | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                                             |
| 3   | 13.6                           | Error: expect(locator).toBeChecked() failed \| Locator: getByRole(<Q>, { name: <Q> }).first().getByRole(<Q>, { name: <Q> }) \| Error: element(s) not fou |
| 2   | 9.1                            | Error: <Q> does not support <Q> matcher.                                                                                                                 |
| 2   | 9.1                            | Error: expect(locator).toBeChecked() failed \| Locator: getByTestId(<Q>).getByRole(<Q>, { name: <Q>, exact: true }) \| Received: unchecked               |
| 1   | 4.5                            | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }).first() \| Error: element(s) not found                             |

**Schritt C - Stichprobe** (5 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_3_generated_ui_map/run_02/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 2, map_interaction 3, assertion 4
    ```
    goto
    getByTestId('map-container') | ASSERT:expect(page.getByTestId('map-container')).toBeVisible();
    getByTestId('layer-switcher')
    getByRole('checkbox', { name: 'Temperature' }) | ACTION:click{force:true}
    getByTestId('layer-switcher')
    getByRole('checkbox', { name: 'Precipitation' }) | ACTION:click{force:true}
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    getByTestId('geocoder-input')
    ACTION:click
    ACTION:fill
    getByTestId('geocoder-results') | ASSERT:expect(page.getByTestId('geocoder-results')).toBeVisible();
    getByTestId('geocoder-result-item-0')
    ASSERT:expect(firstResult).toBeVisible();
    … (gekürzt)
    ```
- `stage_3_generated_ui_map/run_05/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 2, map_interaction 3, assertion 4
    ```
    goto
    getByRole('region', { name: /layer/i })
    getByRole('checkbox', { name: 'Temperature', exact: true })
    ACTION:click{force:true}
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
    getByRole('checkbox', { name: 'Precipitation', exact: true })
    ACTION:click{force:true}
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
    getByTestId('geocoder-input')
    ACTION:fill
    getByTestId('geocoder-result-item-0')
    ASSERT:expect(firstResult).toBeVisible();
    ACTION:click
    HELPER:getMapCenter
    … (gekürzt)
    ```
- `stage_3_generated_ui_map/run_27/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 2, map_interaction 2, assertion 4
    ```
    goto
    getByTestId("map-container") | ASSERT:expect(page.getByTestId("map-container")).toBeVisible();
    getByTestId("info-panel") | ASSERT:expect(page.getByTestId("info-panel")).toBeVisible();
    getByTestId("layer-switcher") | ASSERT:expect(page.getByTestId("layer-switcher")).toBeVisible();
    getByTestId("layer-switcher")
    getByRole("group", { name: /Temperature/i })
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, "Temperature")).toBe(true);
    getByRole("checkbox", { name: "Temperature" })
    getByRole("switch", { name: "Temperature" })
    ACTION:click{force:true}
    ACTION:click{force:true}
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, "Temperature")).toBe(false);
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, "Precipitation")).toBe(false);
    getByTestId("layer-switcher")
    … (gekürzt)
    ```
- `stage_3_generated_ui_map/run_35/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 3, map_interaction 3, assertion 4
    ```
    goto
    getByRole("checkbox", { name: "Temperature" })
    ACTION:click
    getByRole("checkbox", { name: "Precipitation" })
    ACTION:click
    getByTestId("geocoder-input")
    ACTION:fill
    getByTestId("geocoder-result-item-0")
    ASSERT:expect(firstResult).toBeVisible();
    ACTION:click
    page.evaluate
    ASSERT:expect.poll(() => {
    page.evaluate
    getByTestId("weather-forecast-section")
    … (gekürzt)
    ```
- `stage_3_generated_ui_map/run_39/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 4, selector 2, map_interaction 3, assertion 4
    ```
    goto
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, "Temperature")).toBe(true);
    getByRole("panel", { name: /layer/i })
    getByRole("checkbox", {)
    ACTION:click{force:true}
    getByRole("checkbox", {)
    ACTION:click{force:true}
    HELPER:isLayerRendered | ASSERT:expect.poll(() => isLayerRendered(page, "Temperature")).toBe(false);
    HELPER:isLayerRendered
    getByTestId("geocoder-input")
    ACTION:fill
    getByTestId("geocoder-result-item-0")
    ASSERT:expect(firstResult).toBeVisible();
    ACTION:click
    … (gekürzt)
    ```

### 7. `uc-03` / Stufe 3 (PASS 4 %, 50 Läufe, 48 Fehlschläge)

Kategorien: ASSERTION_FAIL: 48, PASS: 2.

**Schritt B - Fehlermeldungsgruppen** (5 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                                  |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 28  | 58.3                           | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint                                             |
| 16  | 33.3                           | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined            |
| 2   | 4.2                            | Error: expect(received).toBeDefined() \| Received: undefined                                                                                              |
| 1   | 2.1                            | Error: expect(received).toBeGreaterThan(expected) \| Matcher error: received value must be a number or bigint \| Received has type: object \| Received ha |
| 1   | 2.1                            | Error: expect(received).toBeLessThan(expected) \| Matcher error: received value must be a number or bigint \| Received has value: undefined               |

**Schritt C - Stichprobe** (5 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_3_generated_ui_map/run_04/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByRole('button', { name: 'Zoom in' }) | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByRole('button', { name: 'Zoom out' }) | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page));
    ASSERT:expect(zoomAfterOut).toBeLessThan(zoomAfterOut);
    ```
- `stage_3_generated_ui_map/run_06/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn);
    ```
- `stage_3_generated_ui_map/run_07/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn);
    ```
- `stage_3_generated_ui_map/run_08/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeTruthy();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(await expect.poll(() => getMapZoomLe
    ```
- `stage_3_generated_ui_map/run_09/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`  
  Phase 1: ASSERTION_FAIL; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeDefined();
    getByTestId('zoom-in-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(initialZoom);
    getByTestId('zoom-out-button') | ACTION:click
    HELPER:getMapZoomLevel | ASSERT:expect.poll(() => getMapZoomLevel(page)).toBeLessThan(zoomAfterIn);
    ```

### 8. `uc-02` / Stufe 5 (PASS 100 %, 50 Läufe, 0 Fehlschläge)

Kategorien: PASS: 50.

**Schritt B**: keine Fehlschläge in dieser Zelle.

**Schritt C - Stichprobe** (5 Dateien):

- `tests/stage_5_self_improvement_loop/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-1-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    getByRole('combobox', { name: 'Basemaps' })
    ACTION:click
    getByRole('option', { name: 'OpenStreetMap' }) | ACTION:click
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    ```
- `tests/stage_5_self_improvement_loop/run_02/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-0-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    getByRole('combobox', { name: 'Basemaps' })
    ACTION:selectOption
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    ```
- `tests/stage_5_self_improvement_loop/run_03/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-0-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    getByRole('combobox', { name: 'Basemaps' })
    ACTION:selectOption
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    ```
- `tests/stage_5_self_improvement_loop/run_04/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-0-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    getByRole('combobox', { name: 'Basemaps' })
    ACTION:selectOption
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    ```
- `tests/stage_5_self_improvement_loop/run_05/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-0-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
    getByRole('combobox', { name: 'Basemaps' })
    ACTION:selectOption
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    ```

### 9. `uc-02` / Stufe 3 (PASS 0 %, 49 Läufe, 49 Fehlschläge)

Kategorien: INFRA_FAIL: 47, ASSERTION_FAIL: 2.

**Schritt B - Fehlermeldungsgruppen** (13 Gruppen, die 5 häufigsten):

| n   | % der Fehlschläge dieser Zelle | Signatur                                                                                                                                |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | 42.9                           | Error: <Q> does not support <Q> matcher.                                                                                                |
| 12  | 24.5                           | Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded.                                            |
| 3   | 6.1                            | Error: expect(locator).toBeVisible() failed \| Locator: getByRole(<Q>, { name: <Q> }) \| Error: element(s) not found                    |
| 2   | 4.1                            | Error: expect(locator).toBeVisible() failed \| Locator: getByTestId(<Q>).getByText(<Q>, { exact: true }) \| Error: element(s) not found |
| 2   | 4.1                            | Error: expect(received).toBe(expected) // Object.is equality \| Received: <Q>                                                           |

**Schritt C - Stichprobe** (5 Dateien aus der größten Fehlermeldungsgruppe):

- `stage_3_generated_ui_map/run_06/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 1, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');
    getByTestId('layer-switcher')
    getByText('OpenStreetMap', { exact: true }) | ACTION:click
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
    ```
- `stage_3_generated_ui_map/run_07/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 1, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');
    getByRole('panel', { name: /layer/i })
    ASSERT:expect(layerSwitcherPanel).toBeVisible();
    getByRole('radio', { name: 'OpenStreetMap', exact: true })
    ACTION:click{force:true}
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.not.toBe('Carto Light');
    ```
- `stage_3_generated_ui_map/run_08/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 2, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');
    getByTestId('layer-switcher')
    getByRole('combobox')
    locator('select')
    ACTION:click
    getByRole('option', { name: 'OpenStreetMap' }) | ASSERT:expect(layerSwitcher.getByRole('option', { name: 'OpenStreetMap' })).toBeVisible();
    getByRole('option', { name: 'OpenStreetMap' }) | ACTION:click
    ACTION:selectOption
    getByText('OpenStreetMap', { exact: true })
    ACTION:click
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
    ```
- `stage_3_generated_ui_map/run_12/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 1, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');
    getByTestId('layer-switcher')
    getByRole('radio', { name: 'OpenStreetMap' })
    ACTION:click
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
    ```
- `stage_3_generated_ui_map/run_13/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`  
  Phase 1: INFRA_FAIL; Judge: coverage 3, selector 1, map_interaction n/a, assertion 3
    ```
    goto
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');
    getByTestId('layer-switcher')
    ASSERT:expect(layerSwitcher).toBeVisible();
    getByRole('radio', { name: 'OpenStreetMap' })
    getByTestId('layer-switcher')
    ACTION:click
    HELPER:getActiveBaseLayerTitle | ASSERT:expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
    ```

### 10. `uc-01` / Stufe 5 (PASS 100 %, 50 Läufe, 0 Fehlschläge)

Kategorien: PASS: 50.

**Schritt B**: keine Fehlschläge in dieser Zelle.

**Schritt C - Stichprobe** (5 Dateien):

- `tests/stage_5_self_improvement_loop/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `tests/stage_5_self_improvement_loop/run_02/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `tests/stage_5_self_improvement_loop/run_03/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `tests/stage_5_self_improvement_loop/run_04/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```
- `tests/stage_5_self_improvement_loop/run_05/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts`  
  Phase 1: PASS; Judge: coverage 4, selector 4, map_interaction n/a, assertion 4
    ```
    goto
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).not.toBeVisible();
    getByRole('button', { name: 'Layer Switcher' }) | ACTION:click
    getByTestId('layer-switcher') | ASSERT:expect(page.getByTestId('layer-switcher')).toBeVisible();
    ```

## Schritt D - Muster über alle Dateien der Stufen

Die vollständige Auszählung aller geforderten Muster über ALLE Dateien jeder Stufe steht in [codemuster.md](codemuster.md) (erzeugt von `report_patterns.py`). Zusammenfassung der Pflichtmuster:

| Muster                             | Stufe 1 (n=500) | Stufe 2 (n=500) | Stufe 3 (n=499) | Stufe 4 (n=500) | Stufe 5 (Iter. 0) (n=500) | Stufe 5 (Endstand) (n=500) |
| ---------------------------------- | --------------- | --------------- | --------------- | --------------- | ------------------------- | -------------------------- |
| getByTestId                        | 378 (75.6 %)    | 436 (87.2 %)    | 479 (96.0 %)    | 459 (91.8 %)    | 335 (67.0 %)              | 367 (73.4 %)               |
| getByRole                          | 429 (85.8 %)    | 432 (86.4 %)    | 262 (52.5 %)    | 244 (48.8 %)    | 382 (76.4 %)              | 378 (75.6 %)               |
| getByText                          | 126 (25.2 %)    | 74 (14.8 %)     | 81 (16.2 %)     | 83 (16.6 %)     | 69 (13.8 %)               | 46 (9.2 %)                 |
| getByLabel                         | 63 (12.6 %)     | 45 (9.0 %)      | 31 (6.2 %)      | 26 (5.2 %)      | 29 (5.8 %)                | 25 (5.0 %)                 |
| \_\_openPioneerMap                 | 3 (0.6 %)       | 8 (1.6 %)       | 24 (4.8 %)      | 15 (3.0 %)      | 30 (6.0 %)                | 28 (5.6 %)                 |
| Helferfunktion (irgendeine)        | 1 (0.2 %)       | 1 (0.2 %)       | 416 (83.4 %)    | 370 (74.0 %)    | 454 (90.8 %)              | 367 (73.4 %)               |
| getActiveBaseLayerTitle            | 0 (0.0 %)       | 0 (0.0 %)       | 83 (16.6 %)     | 69 (13.8 %)     | 65 (13.0 %)               | 65 (13.0 %)                |
| isLayerRendered                    | 0 (0.0 %)       | 0 (0.0 %)       | 300 (60.1 %)    | 218 (43.6 %)    | 273 (54.6 %)              | 217 (43.4 %)               |
| getMapZoomLevel                    | 1 (0.2 %)       | 1 (0.2 %)       | 106 (21.2 %)    | 84 (16.8 %)     | 114 (22.8 %)              | 81 (16.2 %)                |
| getMapCenter                       | 0 (0.0 %)       | 0 (0.0 %)       | 50 (10.0 %)     | 59 (11.8 %)     | 60 (12.0 %)               | 30 (6.0 %)                 |
| getHighlightedCoordinate           | 0 (0.0 %)       | 0 (0.0 %)       | 65 (13.0 %)     | 62 (12.4 %)     | 113 (22.6 %)              | 68 (13.6 %)                |
| Import map-model-helpers           | 0 (0.0 %)       | 0 (0.0 %)       | 416 (83.4 %)    | 370 (74.0 %)    | 454 (90.8 %)              | 367 (73.4 %)               |
| waitForTimeout                     | 25 (5.0 %)      | 14 (2.8 %)      | 8 (1.6 %)       | 7 (1.4 %)       | 4 (0.8 %)                 | 3 (0.6 %)                  |
| expect.poll                        | 134 (26.8 %)    | 239 (47.8 %)    | 441 (88.4 %)    | 414 (82.8 %)    | 445 (89.0 %)              | 419 (83.8 %)               |
| waitFor (Locator/Page)             | 40 (8.0 %)      | 10 (2.0 %)      | 1 (0.2 %)       | 4 (0.8 %)       | 3 (0.6 %)                 | 3 (0.6 %)                  |
| Wartestrategie: nur waitForTimeout | 15 (3.0 %)      | 10 (2.0 %)      | 0 (0.0 %)       | 3 (0.6 %)       | 1 (0.2 %)                 | 3 (0.6 %)                  |
| force: true                        | 153 (30.6 %)    | 171 (34.2 %)    | 209 (41.9 %)    | 161 (32.2 %)    | 173 (34.6 %)              | 224 (44.8 %)               |
| Assertion auf map-container/Canvas | 176 (35.2 %)    | 161 (32.2 %)    | 148 (29.7 %)    | 35 (7.0 %)      | 18 (3.6 %)                | 26 (5.2 %)                 |
| getByTestId('map-container')       | 65 (13.0 %)     | 267 (53.4 %)    | 250 (50.1 %)    | 159 (31.8 %)    | 130 (26.0 %)              | 155 (31.0 %)               |

Halluzinierte testids (nicht in der Menge der 39 real existierenden `data-testid`-Werte):

| Grundmenge         | Dateien | Dateien mit halluzinierter testid | %    | verschiedene halluzinierte testids | häufigste (Dateien)                                                                                                                                                                                                                                                           |
| ------------------ | ------- | --------------------------------- | ---- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe 1            | 500     | 197                               | 39.4 | 106                                | `forecast-entry` (27), `print-panel` (22), `layer-precipitation-toggle` (22), `layer-temperature-toggle` (22), `base-map-selector` (20), `geocoder-search-field` (16), `measurement-result` (15), `print-title-input` (11), `layer-switcher-panel` (11), `base-map-list` (10) |
| Stufe 2            | 500     | 2                                 | 0.4  | 1                                  | `print-panel` (2)                                                                                                                                                                                                                                                             |
| Stufe 3            | 499     | 5                                 | 1.0  | 5                                  | `printing-title-input` (3), `print-title-input` (2), `format-png` (1), `print-export-button` (1), `printing-format-select` (1)                                                                                                                                                |
| Stufe 4            | 500     | 9                                 | 1.8  | 8                                  | `printing-title-input` (3), `print-title-input` (2), `basemap-selector` (1), `basemaps-dropdown` (1), `precipitation-layer-toggle` (1), `printing-export-button` (1), `printing-format-selector` (1), `print-export-button` (1)                                               |
| Stufe 5 (Iter. 0)  | 500     | 1                                 | 0.2  | 1                                  | `measurement-result` (1)                                                                                                                                                                                                                                                      |
| Stufe 5 (Endstand) | 500     | 0                                 | 0.0  | 0                                  | -                                                                                                                                                                                                                                                                             |

## Schritt E - Steckbriefe

### Steckbrief 1: uc-03 / Stufe 4

| Feld                                                            | Wert                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 4 / uc-03                                                                                                                                |
| PASS-Rate der Zelle                                             | 14 % (7 von 50)                                                                                                                                |
| Auffälligkeitsregel                                             | kein Kontextnutzen - Stufe 1 = 62 %, Stufe 4 = 14 % (-48 pp), obwohl der Stufentrend +18.6 pp beträgt                                          |
| häufigste Fehlermeldungsgruppe                                  | 23 von 43 Fehlschlägen (53.5 %): Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint |
| Beispieldatei                                                   | `stage_4_manual_ui_map/run_01/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                                                            |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                       |
| Zählmuster `getByTestId` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                                            |
| Zählmuster `getByRole` in dieser Zelle                          | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 50 von 50 (100.0 %)                                                                                                                            |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `expect.poll` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                                            |
| Zählmuster `force: true` in dieser Zelle                        | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 0 von 50 (0.0 %)                                                                                                                               |

### Steckbrief 2: uc-01 / Stufe 3

| Feld                                                            | Wert                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 3 / uc-01                                                                                         |
| PASS-Rate der Zelle                                             | 100 % (50 von 50)                                                                                       |
| Auffälligkeitsregel                                             | Voll-Zelle - 100 % PASS in Stufe 3 bei Stufen-PASS-Rate 35.7 %                                          |
| häufigste Fehlermeldungsgruppe                                  | 0 von 0 Fehlschlägen (- %): -                                                                           |
| Beispieldatei                                                   | `stage_3_generated_ui_map/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts` |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                |
| Zählmuster `getByTestId` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                     |
| Zählmuster `getByRole` in dieser Zelle                          | 2 von 50 (4.0 %)                                                                                        |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 1 von 50 (2.0 %)                                                                                        |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 0 von 50 (0.0 %)                                                                                        |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 50 (0.0 %)                                                                                        |
| Zählmuster `expect.poll` in dieser Zelle                        | 1 von 50 (2.0 %)                                                                                        |
| Zählmuster `force: true` in dieser Zelle                        | 3 von 50 (6.0 %)                                                                                        |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 14 von 50 (28.0 %)                                                                                      |

### Steckbrief 3: uc-04 / Stufe 4

| Feld                                                            | Wert                                                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 4 / uc-04                                                                                                                                                           |
| PASS-Rate der Zelle                                             | 12 % (6 von 50)                                                                                                                                                           |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 66 % → 12 % (-54 pp) gegenüber Stufentrend +2.9 pp, Abweichung -57 pp; Stufe 1 = 18 %, Stufe 4 = 12 % (-6 pp), obwohl der Stufentrend +18.6 pp beträgt |
| häufigste Fehlermeldungsgruppe                                  | 34 von 44 Fehlschlägen (77.3 %): Error: locator.click: Error: strict mode violation: getByRole(<Q>, { name: <Q> }) resolved to <N> elements:                              |
| Beispieldatei                                                   | `stage_4_manual_ui_map/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`                                                           |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                                                  |
| Zählmuster `getByTestId` in dieser Zelle                        | 17 von 50 (34.0 %)                                                                                                                                                        |
| Zählmuster `getByRole` in dieser Zelle                          | 50 von 50 (100.0 %)                                                                                                                                                       |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 50 (0.0 %)                                                                                                                                                          |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 50 von 50 (100.0 %)                                                                                                                                                       |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 50 (0.0 %)                                                                                                                                                          |
| Zählmuster `expect.poll` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                                                                       |
| Zählmuster `force: true` in dieser Zelle                        | 48 von 50 (96.0 %)                                                                                                                                                        |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 9 von 50 (18.0 %)                                                                                                                                                         |

### Steckbrief 4: uc-04 / Stufe 5

| Feld                                                            | Wert                                                                                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 5 / uc-04                                                                                                                                                                                               |
| PASS-Rate der Zelle                                             | 100 % (50 von 50)                                                                                                                                                                                             |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 12 % → 100 % (+88 pp) gegenüber Stufentrend +34.6 pp, Abweichung +53 pp                                                                                                                    |
| häufigste Fehlermeldungsgruppe                                  | 0 von 0 Fehlschlägen (- %): -                                                                                                                                                                                 |
| Beispieldatei                                                   | `tests/stage_5_self_improvement_loop/run_01/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map/uc-04-iter-1-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts` |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                                                                                      |
| Zählmuster `getByTestId` in dieser Zelle                        | 27 von 99 (27.3 %)                                                                                                                                                                                            |
| Zählmuster `getByRole` in dieser Zelle                          | 99 von 99 (100.0 %)                                                                                                                                                                                           |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 99 (0.0 %)                                                                                                                                                                                              |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 99 von 99 (100.0 %)                                                                                                                                                                                           |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 99 (0.0 %)                                                                                                                                                                                              |
| Zählmuster `expect.poll` in dieser Zelle                        | 99 von 99 (100.0 %)                                                                                                                                                                                           |
| Zählmuster `force: true` in dieser Zelle                        | 88 von 99 (88.9 %)                                                                                                                                                                                            |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 12 von 99 (12.1 %)                                                                                                                                                                                            |

### Steckbrief 5: uc-04 / Stufe 3

| Feld                                                            | Wert                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stufe / Use Case                                                | Stufe 3 / uc-04                                                                                                                                                                |
| PASS-Rate der Zelle                                             | 66 % (33 von 50)                                                                                                                                                               |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 4 % → 66 % (+62 pp) gegenüber Stufentrend +13.7 pp, Abweichung +48 pp                                                                                       |
| häufigste Fehlermeldungsgruppe                                  | 4 von 17 Fehlschlägen (23.5 %): Error: expect(locator).not.toBeChecked() failed \| Locator: getByTestId(<Q>).getByRole(<Q>, { name: <Q> }) \| Error: strict mode violation: ge |
| Beispieldatei                                                   | `stage_3_generated_ui_map/run_15/uc-04-activate-the-uv-index-overlay-and-verify-it-is-rendered-on-the-map.spec.ts`                                                             |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                                                       |
| Zählmuster `getByTestId` in dieser Zelle                        | 45 von 50 (90.0 %)                                                                                                                                                             |
| Zählmuster `getByRole` in dieser Zelle                          | 50 von 50 (100.0 %)                                                                                                                                                            |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 50 (0.0 %)                                                                                                                                                               |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 50 von 50 (100.0 %)                                                                                                                                                            |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 50 (0.0 %)                                                                                                                                                               |
| Zählmuster `expect.poll` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                                                                            |
| Zählmuster `force: true` in dieser Zelle                        | 49 von 50 (98.0 %)                                                                                                                                                             |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 39 von 50 (78.0 %)                                                                                                                                                             |

### Steckbrief 6: uc-10 / Stufe 3

| Feld                                                            | Wert                                                                                                                         |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 3 / uc-10                                                                                                              |
| PASS-Rate der Zelle                                             | 56 % (28 von 50)                                                                                                             |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 0 % → 56 % (+56 pp) gegenüber Stufentrend +13.7 pp, Abweichung +42 pp                                     |
| häufigste Fehlermeldungsgruppe                                  | 5 von 22 Fehlschlägen (22.7 %): Test timeout of 30000ms exceeded. \| Error: locator.click: Test timeout of 30000ms exceeded. |
| Beispieldatei                                                   | `stage_3_generated_ui_map/run_02/uc-10-configure-layers-search-for-a-location-and-load-the-weather-forecast.spec.ts`         |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                     |
| Zählmuster `getByTestId` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                          |
| Zählmuster `getByRole` in dieser Zelle                          | 50 von 50 (100.0 %)                                                                                                          |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 4 von 50 (8.0 %)                                                                                                             |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 50 von 50 (100.0 %)                                                                                                          |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 1 von 50 (2.0 %)                                                                                                             |
| Zählmuster `expect.poll` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                          |
| Zählmuster `force: true` in dieser Zelle                        | 49 von 50 (98.0 %)                                                                                                           |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 22 von 50 (44.0 %)                                                                                                           |

### Steckbrief 7: uc-03 / Stufe 3

| Feld                                                            | Wert                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 3 / uc-03                                                                                                                                |
| PASS-Rate der Zelle                                             | 4 % (2 von 50)                                                                                                                                 |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 32 % → 4 % (-28 pp) gegenüber Stufentrend +13.7 pp, Abweichung -42 pp                                                       |
| häufigste Fehlermeldungsgruppe                                  | 28 von 48 Fehlschlägen (58.3 %): Error: expect(received).toBeGreaterThan(expected) \| Matcher error: expected value must be a number or bigint |
| Beispieldatei                                                   | `stage_3_generated_ui_map/run_04/uc-03-zoom-in-and-out-using-the-zoom-buttons.spec.ts`                                                         |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                       |
| Zählmuster `getByTestId` in dieser Zelle                        | 48 von 50 (96.0 %)                                                                                                                             |
| Zählmuster `getByRole` in dieser Zelle                          | 2 von 50 (4.0 %)                                                                                                                               |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 50 von 50 (100.0 %)                                                                                                                            |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `expect.poll` in dieser Zelle                        | 50 von 50 (100.0 %)                                                                                                                            |
| Zählmuster `force: true` in dieser Zelle                        | 0 von 50 (0.0 %)                                                                                                                               |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 0 von 50 (0.0 %)                                                                                                                               |

### Steckbrief 8: uc-02 / Stufe 5

| Feld                                                            | Wert                                                                                                                                                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 5 / uc-02                                                                                                                                                                     |
| PASS-Rate der Zelle                                             | 100 % (50 von 50)                                                                                                                                                                   |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 28 % → 100 % (+72 pp) gegenüber Stufentrend +34.6 pp, Abweichung +37 pp                                                                                          |
| häufigste Fehlermeldungsgruppe                                  | 0 von 0 Fehlschlägen (- %): -                                                                                                                                                       |
| Beispieldatei                                                   | `tests/stage_5_self_improvement_loop/run_01/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap/uc-02-iter-1-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts` |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                                                            |
| Zählmuster `getByTestId` in dieser Zelle                        | 3 von 60 (5.0 %)                                                                                                                                                                    |
| Zählmuster `getByRole` in dieser Zelle                          | 60 von 60 (100.0 %)                                                                                                                                                                 |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 60 (0.0 %)                                                                                                                                                                    |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 60 von 60 (100.0 %)                                                                                                                                                                 |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 60 (0.0 %)                                                                                                                                                                    |
| Zählmuster `expect.poll` in dieser Zelle                        | 60 von 60 (100.0 %)                                                                                                                                                                 |
| Zählmuster `force: true` in dieser Zelle                        | 0 von 60 (0.0 %)                                                                                                                                                                    |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 0 von 60 (0.0 %)                                                                                                                                                                    |

### Steckbrief 9: uc-02 / Stufe 3

| Feld                                                            | Wert                                                                                                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 3 / uc-02                                                                                                                           |
| PASS-Rate der Zelle                                             | 0 % (0 von 49)                                                                                                                            |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 22 % → 0 % (-22 pp) gegenüber Stufentrend +13.7 pp, Abweichung -36 pp; 0 % PASS in Stufe 3 bei Stufen-PASS-Rate 35.7 % |
| häufigste Fehlermeldungsgruppe                                  | 21 von 49 Fehlschlägen (42.9 %): Error: <Q> does not support <Q> matcher.                                                                 |
| Beispieldatei                                                   | `stage_3_generated_ui_map/run_06/uc-02-switch-the-base-map-from-carto-light-to-openstreetmap.spec.ts`                                     |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 49                                                                                                                                  |
| Zählmuster `getByTestId` in dieser Zelle                        | 39 von 49 (79.6 %)                                                                                                                        |
| Zählmuster `getByRole` in dieser Zelle                          | 43 von 49 (87.8 %)                                                                                                                        |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 49 (0.0 %)                                                                                                                          |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 49 von 49 (100.0 %)                                                                                                                       |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 49 (0.0 %)                                                                                                                          |
| Zählmuster `expect.poll` in dieser Zelle                        | 49 von 49 (100.0 %)                                                                                                                       |
| Zählmuster `force: true` in dieser Zelle                        | 10 von 49 (20.4 %)                                                                                                                        |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 0 von 49 (0.0 %)                                                                                                                          |

### Steckbrief 10: uc-01 / Stufe 5

| Feld                                                            | Wert                                                                                                                                                                                    |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stufe / Use Case                                                | Stufe 5 / uc-01                                                                                                                                                                         |
| PASS-Rate der Zelle                                             | 100 % (50 von 50)                                                                                                                                                                       |
| Auffälligkeitsregel                                             | Sprung - PASS-Rate 98 % → 100 % (+2 pp) gegenüber Stufentrend +34.6 pp, Abweichung -33 pp                                                                                               |
| häufigste Fehlermeldungsgruppe                                  | 0 von 0 Fehlschlägen (- %): -                                                                                                                                                           |
| Beispieldatei                                                   | `tests/stage_5_self_improvement_loop/run_01/uc-01-show-and-hide-the-layer-switcher-via-the-toolbar-button/uc-01-iter-0-show-and-hide-the-layer-switcher-via-the-toolbar-button.spec.ts` |
| Dateien der Zelle mit halluzinierter testid                     | 0 von 50                                                                                                                                                                                |
| Zählmuster `getByTestId` in dieser Zelle                        | 51 von 51 (100.0 %)                                                                                                                                                                     |
| Zählmuster `getByRole` in dieser Zelle                          | 23 von 51 (45.1 %)                                                                                                                                                                      |
| Zählmuster `__openPioneerMap` in dieser Zelle                   | 0 von 51 (0.0 %)                                                                                                                                                                        |
| Zählmuster `Helferfunktion (irgendeine)` in dieser Zelle        | 4 von 51 (7.8 %)                                                                                                                                                                        |
| Zählmuster `waitForTimeout` in dieser Zelle                     | 0 von 51 (0.0 %)                                                                                                                                                                        |
| Zählmuster `expect.poll` in dieser Zelle                        | 2 von 51 (3.9 %)                                                                                                                                                                        |
| Zählmuster `force: true` in dieser Zelle                        | 1 von 51 (2.0 %)                                                                                                                                                                        |
| Zählmuster `Assertion auf map-container/Canvas` in dieser Zelle | 0 von 51 (0.0 %)                                                                                                                                                                        |

## Auffälligkeiten (Stichpunkte)

- Die zehn Zellen verteilen sich auf fünf Use Cases (uc-04 dreimal, uc-01, uc-02 und uc-03 je zweimal, uc-10 einmal). Vier der zehn Zellen haben keinen einzigen Fehlschlag (uc-01/Stufe 3, uc-01/Stufe 5, uc-02/Stufe 5, uc-04/Stufe 5); für sie entfällt Schritt B.
- In drei der sechs Zellen mit Fehlschlägen umfasst die größte Fehlermeldungsgruppe mehr als die Hälfte der Fehlschläge (uc-04/Stufe 4: 77,3 %, uc-03/Stufe 3: 58,3 %, uc-03/Stufe 4: 53,5 %); in den übrigen drei liegt sie zwischen 22,7 % und 42,9 %.
- In den Stichproben zu uc-03 (Stufen 3 und 4) verwenden alle geöffneten Dateien `getMapZoomLevel` über `expect.poll` und weisen dessen Rückgabewert einer Variablen zu (`const initialZoom = await expect.poll(...).toBeTruthy()`); `expect.poll(...)` liefert keinen Wert, der Folgevergleich erhält deshalb `undefined`.
- In den Stichproben zu uc-04 / Stufe 4 verwenden alle geöffneten Dateien `getByRole('checkbox', { name: 'UV-Index' })` ohne `exact: true`, klicken mit `force: true` und prüfen danach `toBeChecked()` sowie `isLayerRendered(page, 'UV-Index')`.
- In den Stichproben zu uc-01 (Stufe 3, 100 % PASS) greifen alle geöffneten Dateien ausschließlich auf `layer-switcher` und `layer-switcher-toggle` zu und prüfen die Sichtbarkeit des Panels.

## Hypothesen (unbelegt)

- Die Häufung von `Matcher error: ... must be a number or bigint` in uc-03 könnte daran liegen, dass im Kontext nicht steht, dass `expect.poll` keinen Wert zurückgibt.
- Die `strict mode violation` in uc-04 / Stufe 4 könnte daran liegen, dass die UI-Map die Layer `UV-Index` und `UV-Index Stations` nebeneinander auflistet, ohne auf die Namensüberlappung hinzuweisen.
