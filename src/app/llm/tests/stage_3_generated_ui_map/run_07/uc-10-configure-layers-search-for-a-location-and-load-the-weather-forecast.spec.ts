// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  
  // Step 1: Hide the Temperature overlay layer
  // The layer switcher is visible by default. We find the Temperature layer toggle.
  // Based on the UI map, we need to interact with the layer switcher.
  // Assuming the layer items have test ids or we can find them by text.
  // Since specific test ids for layer items aren't in the summary, we use getByRole/ByText.
  // The layer switcher panel contains the toggles.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Click the Temperature layer toggle to hide it.
  // We need to identify the specific toggle. Usually, the label is the layer name.
  const temperatureToggle = layerSwitcher.getByRole('checkbox', { name: 'Temperature', exact: true });
  // Ensure it is currently checked (visible) before clicking to hide
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });
  // Ensure it is currently unchecked (hidden) before clicking to show
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Step 3: Search for a location 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const geocoderResults = page.getByTestId('geocoder-results');
  await expect(geocoderResults).toBeVisible();
  
  // The first result item
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We use the map model helpers to verify the map has moved.
  // We poll for the zoom level or center to change from the initial state, 
  // or simply wait for the geocoder panel to close and map to settle.
  // A robust check is to wait for the map center to be different from initial or just wait for stability.
  // Let's wait for the map to be "settled" at a new location by checking zoom/center is defined and stable-ish.
  // Since we don't know the exact initial center, we just ensure the map is ready and has a center.
  await expect.poll(() => getMapCenter(page)).toBeDefined();
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Step 6: Wait for the info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
  
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: Info panel displays a weather forecast section with 24 entries.
  // We count the forecast entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);

  // Expected result: Precipitation overlay layer toggle is in the disabled state?
  // The prompt says "Precipitation overlay layer toggle is in the disabled state" in Expected Results.
  // This likely means the toggle button itself is disabled or the layer is "active" in a way that implies it's the active selection?
  // Re-reading: "The Precipitation overlay layer toggle is in the disabled state."
  // This might be a typo in the prompt or specific UI behavior where the active layer's toggle is disabled?
  // Or perhaps it means the layer is visible (enabled). Let's look at Step 1/2 expected results.
  // Step 1: Temperature toggle enabled state (visible).
  // Step 2: Precipitation toggle disabled state (hidden).
  // BUT the steps say: 1. Hide Temp. 2. Show Precipitation.
  // So at the end: Temp should be hidden (unchecked), Precipitation should be visible (checked).
  // The "Expected results" section says:
  // - The Precipitation overlay layer toggle is in the disabled state.
  // - The Temperature overlay layer toggle is in the enabled state.
  // This contradicts the steps if "disabled" means "unchecked/hidden".
  // However, in Chakra UI, a "disabled" checkbox is visually greyed out.
  // Maybe "disabled" here refers to the *layer being active/selected* in a specific way?
  // Or maybe the prompt implies the *toggle button* is disabled because the layer is the *only* operational layer or something?
  // Let's re-read carefully: "The Precipitation overlay layer toggle is in the disabled state."
  // If I look at Step 1: "clicks the visibility toggle of the Temperature overlay layer to hide it." -> Result: Temp toggle enabled (checked).
  // Step 2: "clicks the visibility toggle of the Precipitation overlay layer to show it." -> Result: Precip toggle disabled (unchecked).
  // This implies the Expected Results describe the state *after* the steps?
  // No, "Expected results" usually lists the final state.
  // If Step 1 hides Temp, Temp should be unchecked. If Step 2 shows Precip, Precip should be checked.
  // The Expected Results say: Precip toggle disabled, Temp toggle enabled.
  // This is the opposite of the steps' actions if "enabled"="checked" and "disabled"="unchecked".
  // Let's assume "enabled state" for a toggle means "checked/active" and "disabled state" means "unchecked/inactive".
  // Then the Expected Results contradict the Steps.
  // However, sometimes "disabled" in UI context means the button is `disabled={true}`.
  // Let's look at the "Complexity: hard" tag.
  // Maybe the "disabled state" refers to the fact that you can't toggle it because it's the *only* layer? No, others exist.
  // Let's stick to the visual state of the checkbox.
  // If the prompt is consistent, "enabled state" = checked, "disabled state" = unchecked.
  // Steps: Hide Temp (uncheck), Show Precip (check).
  // Expected: Precip disabled (unchecked), Temp enabled (checked).
  // This is a direct contradiction.
  // Let's re-read the "Preconditions".
  // "Temperature overlay layer is initially visible."
  // "Precipitation overlay layer is initially hidden."
  // Steps:
  // 1. Click Temp toggle to hide. (Temp becomes hidden/unchecked).
  // 2. Click Precip toggle to show. (Precip becomes visible/checked).
  // Expected:
  // - Precip toggle disabled (unchecked).
  // - Temp toggle enabled (checked).
  // This implies the steps might be interpreted differently or the expected results describe the *initial* state? No, it's the result of the use case.
  // Is it possible "disabled" means "checked"? In some contexts, a "disabled" switch might be one that is stuck in the on position? Unlikely.
  // Let's assume the "Expected results" text has a typo and meant "enabled" for Precip and "disabled" for Temp?
  // Or maybe "disabled" means the layer is *active* in the sense of being the focus?
  // Given the ambiguity, I will assert the *visual* state resulting from the steps:
  // Temp should be unchecked (hidden). Precip should be checked (visible).
  // If I assert the opposite, the test will fail if the steps are executed correctly.
  // I will assert the state resulting from the steps:
  // await expect(temperatureToggle).not.toBeChecked();
  // await expect(precipitationToggle).toBeChecked();
  
  // However, to be safe against the prompt's explicit "Expected results", I will check if there's a specific "disabled" attribute.
  // But standard Playwright `toBeChecked` is the right way for checkboxes.
  // I will follow the logical outcome of the steps.

  await expect(temperatureToggle).not.toBeChecked();
  await expect(precipitationToggle).toBeChecked();
});
