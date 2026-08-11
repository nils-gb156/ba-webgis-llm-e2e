"""Schritt C: Beschreibung der gelesenen Stichprobendateien.

Reine Datendatei. Der Inhalt stammt aus dem vollständigen Lesen der unten
genannten Dateien; er ist deskriptiv und enthält keine Bewertung. Die daraus
abgeleiteten Zählmuster stehen in `anomalies.py:EXTRA_PATTERNS` und werden
dort über ALLE Dateien der jeweiligen Stufe ausgezählt.
"""

# key -> (Liste der gelesenen Dateien (relativ zu src/app/llm/tests/),
#         Liste von Beschreibungs-Stichpunkten)
STICHPROBE: dict[str, tuple[list[str], list[str]]] = {

    "uc-08_S3": (
        [f"stage_3_generated_ui_map/run_0{i}/uc-08-measure-a-distance-by-"
         f"drawing-a-line-on-the-map.spec.ts" for i in range(1, 6)],
        [
            "Selektoren ausschließlich `getByTestId`: `map-container`, "
            "`measurement-toggle`, `measurement-panel`, `measurement` "
            "(5/5); keine Rollen-, Text- oder CSS-Selektoren.",
            "Panel wird bedingt geöffnet: "
            "`if (!(await measurementPanel.isVisible())) { await "
            "measurementToggle.click(); }` (5/5).",
            "Interaktion: `mapContainer.boundingBox()`, daraus relative "
            "Punkte (`Math.round(box.width * f)`), dann 2–3× "
            "`mapContainer.click({ position })` und genau 1× "
            "`mapContainer.dblclick({ position })` als Abschluss (5/5). "
            "Keine `page.mouse.*`-Bewegung, kein Drag.",
            "Wartestrategie: `expect.poll` auf einen Map-Model-Helfer "
            "(4/5 `getMapZoomLevel`, in run_03 als Typprüfung "
            "`typeof … === 'number'`); kein `waitForTimeout`, kein "
            "`waitFor()`.",
            "Abschluss-Assertion ist immer eine Regex-Textprüfung auf "
            "„Zahl + Längeneinheit\", nie ein exakter Wert und nie ein "
            "Zahlenbereich: `toContainText(/\\d[\\d.,]*\\s*(m|km)\\b/)` "
            "(run_01), `/\\d+(?:[.,]\\d+)?\\s?(?:m|km)\\b/i` (run_02), "
            "`/\\b\\d+(?:[.,]\\d+)?\\s*(?:m|km)\\b/` (run_03, auf dem "
            "*Panel* statt auf `measurement`), `toMatch(...)` in run_04 "
            "und run_05.",
            "Die Einheitenliste der Regex ist in 5/5 auf `m|km` "
            "beschränkt.",
        ]),

    "uc-08_S4": (
        [f"stage_4_manual_ui_map/run_0{i}/uc-08-measure-a-distance-by-"
         f"drawing-a-line-on-the-map.spec.ts" for i in range(1, 6)],
        [
            "Identisches Selektor- und Interaktionsmuster wie Stufe 3: "
            "nur `getByTestId`, bedingtes Panel-Öffnen, "
            "`boundingBox()` + relative Klickpunkte, genau ein "
            "`dblclick` (5/5).",
            "Wartestrategie: `expect.poll` auf `getMapZoomLevel` (4/5) "
            "bzw. `getActiveBaseLayerTitle` (run_03, `.toBe('Carto "
            "Light')`); kein `waitForTimeout` (5/5).",
            "Abschluss-Assertion wieder Regex auf Zahl + Einheit: "
            "run_01 `/\\b\\d+(?:[.,]\\d+)?\\s*(?:mm|cm|m|km)\\b/i`, "
            "run_04 `/\\b\\d+(?:[.,]\\d+)?\\s?(?:mm|cm|m|km)\\b/i` – "
            "diese beiden erweitern die Einheitenliste um `mm|cm`; "
            "run_02 schließt mit "
            "`/(?:[1-9]\\d*(?:[.,]\\d+)?|0[.,]\\d*[1-9]\\d*)\\s*(m|km)\\b/i` "
            "den Wert 0 explizit aus; run_03 prüft auf dem *Panel* "
            "statt auf `measurement`.",
            "run_03 importiert als einzige Datei `getActiveBaseLayerTitle` "
            "statt `getMapZoomLevel`.",
        ]),

    "uc-02_S2": (
        [f"stage_2_accessibility_snapshot/run_{i:02d}/uc-02-switch-the-base-"
         f"map-from-carto-light-to-openstreetmap.spec.ts"
         for i in [1, 4, 5, 6, 7]],
        [
            "Der Basemap-Umschalter wird in 5/5 als Combobox adressiert: "
            "`getByRole('combobox', { name: 'Basemaps', exact: true })` – "
            "verankert an `page.` (run_01, 05, 07) oder an "
            "`getByTestId('layer-switcher')` (run_04, 06).",
            "Interaktion in 5/5 `selectOption({ label: 'OpenStreetMap' })`, "
            "immer über `label`, nie `value`/`index`; 3/5 zusätzlich ein "
            "`click()` auf den Select davor.",
            "Zustand wird in 5/5 per `locator.evaluate` mit Cast "
            "`(element as HTMLSelectElement)` und "
            "`selectedOptions[0]?.textContent?.trim()` gelesen.",
            "Assertions: `expect.poll(...).toBe('Carto Light')` vorher und "
            "`.toBe('OpenStreetMap')` nachher (5/5); Negativprüfung "
            "`.not.toBe('Carto Light')` (3/5) bzw. über "
            "`select.options … ?.selected` → `.toBe(false)` (2/5).",
            "Kein `getByRole('radio', …)`, kein `toBeChecked()` (0/5). "
            "Kein `waitForTimeout` (0/5); 1/5 "
            "`waitForLoadState('domcontentloaded')`.",
        ]),

    "uc-02_S3": (
        [f"stage_3_generated_ui_map/run_{i:02d}/uc-02-switch-the-base-map-"
         f"from-carto-light-to-openstreetmap.spec.ts"
         for i in [1, 2, 3, 5, 7]],
        [
            "Der Umschalter wird in 5/5 als Radio adressiert: "
            "`getByRole('radio', { name: 'OpenStreetMap', exact: true })` "
            "und `… { name: 'Carto Light', exact: true }`, verankert an "
            "`getByTestId('layer-switcher')`.",
            "Interaktion in 5/5 `click({ force: true })` auf das "
            "OSM-Radio. Kein `selectOption`, keine Combobox (0/5).",
            "Vor dem Klick steht in 5/5 ein defensiver Block, der ein "
            "„Basemap\"-Aufklappelement über eine Kandidatenliste sucht: "
            "`getByRole('button', { name: 'Base maps' | 'Base map' | "
            "'Basemaps' | 'Background maps' | 'Base layer' | 'Base "
            "layers' | 'Basiskarten', exact: true })`, teils zusätzlich "
            "`getByRole('tab', …)` (run_03, run_05) und "
            "`getByText(/base\\s*maps?|basemaps?/i)` (run_03).",
            "Zustand wird in 5/5 über den Helfer gelesen: "
            "`expect.poll(() => getActiveBaseLayerTitle(page))"
            ".toBe('Carto Light')` bzw. `.toBe('OpenStreetMap')`. "
            "Kein direktes `page.evaluate` in der Testdatei (0/5).",
            "Zusätzlich `toBeChecked()`/`not.toBeChecked()` auf den "
            "Radios (4/5). Kein `waitForTimeout` (0/5).",
        ]),

    "uc-05_S4": (
        [f"stage_4_manual_ui_map/run_0{i}/uc-05-activate-the-precipitation-"
         f"overlay-and-verify-the-legend-updates.spec.ts"
         for i in range(1, 6)],
        [
            "Der Layer-Schalter wird in 5/5 über "
            "`layerSwitcher.getByRole('checkbox', { name: "
            "'Precipitation', exact: true })` adressiert und mit "
            "`click({ force: true })` genau einmal geklickt.",
            "Der Kartenzustand wird in 5/5 über den Helfer geprüft: "
            "`expect.poll(() => isLayerRendered(page, 'Precipitation'))"
            ".toBe(false)` vor dem Klick, `.toBe(true)` danach.",
            "Die letzte Zeile ist in 5/5 wörtlich "
            "`await expect(legend.getByText('Precipitation', "
            "{ exact: true })).toBeVisible();` – die Legendenprüfung "
            "erfolgt ausschließlich über exakte Textgleichheit im "
            "Container `getByTestId('legend')`; kein Regex, kein "
            "legendenspezifisches testid (`precipitation-legend`) und "
            "kein Helferaufruf.",
            "Kein `waitForTimeout`, kein `waitForSelector` (0/5); "
            "Warten ausschließlich über `expect.poll` und "
            "Auto-Waiting.",
            "run_03 prüft zusätzlich "
            "`getActiveBaseLayerTitle(page)).toBe('Carto Light')`.",
        ]),

    "uc-06_S4": (
        [f"stage_4_manual_ui_map/run_{i}/uc-06-click-a-map-position-to-show-"
         f"the-weather-forecast.spec.ts" for i in
         ["30", "31", "32", "33", "34"]],
        [
            "Genau ein Kartenklick je Datei über "
            "`mapContainer.click({ position: { x, y } })` mit aus "
            "`boundingBox()` berechneten Koordinaten (5/5); nie feste "
            "Pixelwerte, nie `page.mouse`. Klickstelle unterschiedlich: "
            "Mitte (run_31, run_34), 0.6/0.6 (run_30), 0.35/0.65 "
            "(run_32), 0.75/0.5 (run_33).",
            "Kartenzustand über Helfer: `getMapCenter` (5/5), "
            "`getHighlightedCoordinate` nach dem Klick (5/5), "
            "`getMapZoomLevel` (1/5, run_34).",
            "Die Ergebnisprüfung endet in 5/5 mit "
            "`expect(weatherForecast).toBeVisible()` gefolgt von "
            "`toHaveCount(24)` auf `getByTestId("
            "'weather-forecast-entry')` – die erwartete Anzahl 24 steht "
            "als Literal im Code.",
            "Das Info-Panel wird in 3/5 bedingt über "
            "`getByTestId('info-panel-toggle')` und `aria-pressed` "
            "geöffnet, in 2/5 unbedingt als sichtbar erwartet.",
            "Vorab-`toBeHidden()` auf `weather-forecast` in 3/5. "
            "Kein `waitForTimeout` (0/5).",
        ]),

    "uc-10_S4": (
        [f"stage_4_manual_ui_map/run_{i}/uc-10-configure-layers-search-for-a-"
         f"location-and-load-the-weather-forecast.spec.ts" for i in
         ["29", "30", "31", "32", "33"]],
        [
            "Reihenfolge in 5/5: Temperature ausschalten, Precipitation "
            "einschalten, beide über "
            "`getByRole('checkbox', { name: …, exact: true })` mit "
            "`click({ force: true })`.",
            "Suchbegriff in 5/5 wörtlich `'Münster'`; Eingabe 4/5 über "
            "`fill('Münster')`, 1/5 über `type('Münster')` (run_30).",
            "Ergebnisauswahl 4/5 über "
            "`getByTestId('geocoder-result-item-0')`, 1/5 über "
            "`geocoderResults.getByRole('listitem').first()` (run_32).",
            "Kartenzustand über Helfer: `isLayerRendered` und "
            "`getMapCenter` (5/5), `getActiveBaseLayerTitle(page))"
            ".toBe('Carto Light')` (3/5), `getHighlightedCoordinate` "
            "(3/5).",
            "Abschluss in 5/5 `toHaveCount(24)` auf "
            "`weather-forecast-entry`, davor "
            "`expect(weatherForecast).toBeVisible()`.",
            "Ein Kartenklick nach der Suche findet nur in run_30 "
            "unbedingt statt und in run_33 als `catch`-Fallback; "
            "run_29/31/32 klicken die Karte nicht.",
            "Kein `waitForTimeout` (0/5).",
        ]),

    "uc-07_S2": (
        [f"stage_2_accessibility_snapshot/run_0{i}/uc-07-click-both-point-"
         f"station-layers-to-show-feature-info.spec.ts"
         for i in range(1, 6)],
        [
            "In 5/5 steht dieselbe feste Zielkoordinate im Code: "
            "`1188692.84` / `6767643.28` (EPSG:3857), in run_01/03/05 "
            "als Objekt, in run_02/04 als Tupel.",
            "Es wird in 5/5 **nicht** mit festen Pixeln geklickt: die "
            "Klickposition wird zur Laufzeit aus `boundingBox()` und "
            "dem Text von `getByTestId('coordinate-viewer')` "
            "interpoliert. Kalibrierung über 3–5 `hover({ position })`-"
            "Punkte (run_03 über `page.mouse.move`) und ein iteratives "
            "Refinement (2, 2, 5, 2 bzw. 3 Durchläufe). run_02 sucht "
            "zusätzlich in `page.evaluate` das OpenLayers-Objekt mit "
            "`getPixelFromCoordinate` (Graph-Traversal, `maxDepth = 7`, "
            "`maxNodes = 4000`).",
            "Jede Datei bringt einen eigenen Parser für lokalisierte "
            "Zahlen und eine eigene Regex zur Koordinatenextraktion mit.",
            "Vorbereitung in 5/5: beide Stations-Checkboxen über "
            "`getByRole('checkbox', { name: 'UV-Index Stations' | "
            "'EUCOS Ground Stations', exact: true })` mit "
            "`click({ force: true })` sicherstellen, Messwerkzeug über "
            "`aria-pressed` deaktivieren, "
            "`getByTestId('initial-extent-button')` klicken.",
            "Ergebnisprüfung: `toContainText(/UV-Index Station/i)` bzw. "
            "`/EUCOS Ground Station/i` (3/5), als Plain-String (2/5), "
            "in run_05 `getByText(/…/i)` + `toBeVisible()`.",
            "Kein `waitForTimeout` (0/5); Warten über `expect.poll`.",
        ]),

    "uc-10_S2": (
        [f"stage_2_accessibility_snapshot/run_{i:02d}/uc-10-configure-layers-"
         f"search-for-a-location-and-load-the-weather-forecast.spec.ts"
         for i in [1, 2, 4, 5, 6]],
        [
            "Keine Map-Model-Helfer verfügbar; der Kartenzustand wird "
            "indirekt über Text gelesen: `getByTestId('scale-viewer')` "
            "(run_01) bzw. `getByTestId('coordinate-viewer')` "
            "(run_04, 05, 06); run_02 prüft die Navigation gar nicht.",
            "Kein Kartenklick und keine festen Pixelkoordinaten in "
            "5/5; einzige Kartenberührung ist ein `hover` in run_04 "
            "(Mitte, `+30 px` Offset).",
            "Suchbegriff in 5/5 `'Münster'`; Eingabe 4/5 `fill`, 1/5 "
            "`pressSequentially` (run_01). Ergebnisauswahl primär über "
            "`getByRole('option')` mit Fallback-Ketten auf "
            "`getByRole('listitem'|'button'|'link')` und in run_02 "
            "zusätzlich Tastatur (`press('ArrowDown')`, "
            "`press('Enter')`).",
            "Die erwartete Forecast-Anzahl `24` steht in 5/5 als "
            "Literal; gezählt wird über eine Rollen-Kaskade "
            "(`getByRole('listitem')` → `article` → `row` → `img`) "
            "(run_01, 02, 04), über `toHaveCount(24)` auf "
            "`getByRole('listitem')` (run_05) oder über "
            "`element.children`-Zählung plus `waitForResponse` auf ein "
            "JSON-Array der Länge 24 (run_06).",
            "Der Platzhaltertext `'Click on the map to load a "
            "forecast.'` wird in 4/5 geprüft.",
            "Kein `waitForTimeout` (0/5); run_06 nutzt als einzige "
            "Datei `page.on('request', …)` und `waitForResponse`.",
        ]),
}
