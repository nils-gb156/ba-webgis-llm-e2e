# Use Cases

## Use Case 1: Show and hide the layer switcher via the toolbar button

**Description:** The user toggles the layer switcher (TOC) panel off and on using the toolbar button.

**Preconditions:**

- The app is loaded successfully.
- The layer switcher (TOC) is initially visible.

**Steps:**

1. The user clicks the 'Layer Switcher' button in the toolbar to hide the panel.
2. The user clicks the 'Layer Switcher' button again to show the panel.

**Expected results:**

- After the first click, the layer switcher panel is no longer visible.
- After the second click, the layer switcher panel is visible again.

**Complexity:** easy

## Use Case 2: Switch the base map from Carto Light to OpenStreetMap

**Description:** The user changes the active base map in the layer switcher.

**Preconditions:**

- The app is loaded successfully.
- The Carto Light base map is active by default.
- The layer switcher (TOC) is visible.

**Steps:**

1. The user opens the base map selector in the layer switcher.
2. The user selects 'OpenStreetMap' as the base map.

**Expected results:**

- The OpenStreetMap base map is selected.
- The Carto Light base map is no longer selected.

**Complexity:** easy

## Use Case 3: Zoom in and out using the zoom buttons

**Description:** The user changes the map zoom level using the zoom in and zoom out buttons.

**Preconditions:**

- The app is loaded successfully.
- The zoom in and zoom out buttons are visible on the map.

**Steps:**

1. The user clicks the 'Zoom in' button to increase the zoom level.
2. The user clicks the 'Zoom out' button to decrease the zoom level.

**Expected results:**

- After clicking the 'Zoom in' button, the map zoom level is higher than before.
- After clicking the 'Zoom out' button, the map zoom level is lower than after zooming in.

**Complexity:** easy

## Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map

**Description:** The user activates the initially hidden UV-Index overlay and verifies that the layer is requested and rendered on the map.

**Preconditions:**

- The app is loaded successfully.
- The layer switcher (TOC) is visible.
- The UV-Index overlay layer is initially hidden.

**Steps:**

1. The user clicks the visibility toggle of the UV-Index overlay layer to show it.
2. The user waits for the map to load the layer tiles.

**Expected results:**

- The UV-Index overlay layer toggle is in the enabled (checked) state.
- The UV-Index overlay tiles are rendered on the map canvas.

**Complexity:** medium

## Use Case 5: Activate the Precipitation overlay and verify the legend updates

**Description:** The user activates the Precipitation overlay and checks that the legend reflects the newly active layer.

**Preconditions:**

- The app is loaded successfully.
- The layer switcher (TOC) and legend are visible.
- The Precipitation overlay layer is initially hidden.

**Steps:**

1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
2. The user views the legend.

**Expected results:**

- The Precipitation overlay layer toggle is in the enabled (checked) state.
- The legend displays an entry corresponding to the Precipitation layer.

**Complexity:** medium

## Use Case 6: Click a map position to show the weather forecast

**Description:** The user clicks a position on the map and checks that the weather forecast appears in the info panel.

**Preconditions:**

- The app is loaded successfully.
- The info panel is visible.
- The map canvas is interactive.

**Steps:**

1. The user clicks on a position on the map canvas.
2. The user waits for the info panel to load the forecast.

**Expected results:**

- The clicked position is highlighted on the map.
- The info panel displays a weather forecast section.
- The forecast contains 24 entries.

**Complexity:** hard

## Use Case 7: Click both point station layers to show feature info

**Description:** The user clicks on a location where both a UV-Index Station (WMS) and an EUCOS Ground Station (WFS) are located and checks that the feature info for both point layers appears in the info panel.

**Preconditions:**

- The app is loaded successfully.
- The info panel is visible.
- The UV-Index Stations layer (WMS) is active.
- The EUCOS Ground Stations layer (WFS) is active.
- Both a UVI station and an EUCOS ground station are located at map coordinates [1188692.84, 6767643.28] (EPSG:3857).
- No measurement tool is active.

**Steps:**

1. The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
2. The user waits for the info panel to load the station info for both layers.

**Expected results:**

- The info panel displays a 'UV-Index Station' section with feature information.
- The info panel displays an 'EUCOS Ground Station' section with feature information.

**Complexity:** hard

## Use Case 8: Measure a distance by drawing a line on the map

**Description:** The user activates the measurement tool, draws a line on the map and checks that a measurement result is shown.

**Preconditions:**

- The app is loaded successfully.
- The measurement tool is accessible via the toolbar.
- The map canvas is interactive.

**Steps:**

1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
2. The user clicks several points on the map canvas to draw a line.
3. The user double-clicks to finish the measurement.

**Expected results:**

- The measurement panel is visible.
- The measurement panel displays a length value with a unit.

**Complexity:** hard

## Use Case 9: Print the current map view as a PNG

**Description:** The user opens the printing panel, enters a title, selects the PNG format and triggers the export of the current map view.

**Preconditions:**

- The app is loaded successfully.
- The printing tool is accessible via the toolbar.
- At least one base map and one overlay layer are visible on the map.

**Steps:**

1. The user clicks the 'Print Map' button in the toolbar to open the printing panel.
2. The user enters a title for the printout.
3. The user selects the PNG file format.
4. The user clicks the export/print button.

**Expected results:**

- The printing panel is visible.
- A PNG file containing the current map view is generated and downloaded.
- The printed image shows the visible base map and overlay layers as well as the scale bar.

**Complexity:** hard

## Use Case 10: Configure layers, search for a location and load the weather forecast

**Description:** The user reconfigures the layer visibility, searches for a location using the geocoder, navigates the map to the selected result, and loads the weather forecast for that position.

**Preconditions:**

- The app is loaded successfully.
- The layer switcher (TOC) is visible.
- The Temperature overlay layer is initially visible.
- The Precipitation overlay layer is initially hidden.
- The search field (geocoder) is accessible.
- The info panel is visible.
- No measurement tool is active.

**Steps:**

1. The user clicks the visibility toggle of the Temperature overlay layer to hide it.
2. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
3. The user clicks the search field and types a place name (e.g. 'Münster').
4. The user waits for the result list to appear and selects the first result.
5. The user waits for the map to navigate to the selected location.
6. The user waits for the info panel to load the forecast.

**Expected results:**

- The Precipitation overlay layer toggle is in the disabled state.
- The Temperature overlay layer toggle is in the enabled state.
- After selecting the search result, the map navigates to the searched location.
- The info panel displays a weather forecast section with 24 entries.

**Complexity:** hard
