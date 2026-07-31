// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure initial state.
  // The prompt states Temperature is initially visible and Precipitation is initially hidden.
  // We verify this implicitly by the actions we take next, but let's ensure the map is ready.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the Temperature overlay layer to hide it.
  // The layer switcher is visible by default. We need to find the Temperature checkbox.
  // Based on the UI map, operational layers are a checkbox-list.
  // We look for the label "Temperature" within the layer switcher.
  const temperatureToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureToggle).toBeChecked(); // Verify it starts checked
  await temperatureToggle.click({ force: true });

  // Step 2: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  const precipitationToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked(); // Verify it starts unchecked
  await precipitationToggle.click({ force: true });

  // Step 3: The user clicks the search field and types a place name (e.g. 'Münster').
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: The user waits for the result list to appear and selects the first result.
  // The results appear after typing. We wait for the first result item to be visible.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: The user waits for the map to navigate to the selected location.
  // We poll the map center to ensure it has changed from the default (likely Stuttgart or similar)
  // to the coordinates of Münster. We don't know the exact coords, so we just check that it's no longer undefined
  // and potentially that the zoom level is appropriate for a city view (e.g. > 10).
  // A more robust check is to wait for the highlight or just assume navigation happens if the result is selected.
  // Let's wait for the map center to settle to a non-default value.
  // Default center is likely roughly [4369000, 3450000] (Stuttgart area). Münster is roughly [5800000, 5600000].
  // We can just wait for the zoom level to be reasonable for a city.
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(10);

  // Step 6: The user waits for the info panel to load the forecast.
  // The info panel is visible by default. The weather forecast section appears after clicking the map or navigating.
  // The use case description says "loads the weather forecast for that position".
  // Usually, navigating via geocoder triggers a map click or similar event that loads the forecast.
  // We expect the weather-forecast element to become visible.
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Expected results verification:
  // - The Precipitation overlay layer toggle is in the disabled state.
  //   Note: "Disabled" usually means unchecked in this context (layer not shown), or literally disabled attribute.
  //   Given the previous step, we checked it. Let's verify it is checked (enabled/visible).
  //   Wait, the expected result says "disabled state". In UI terms, a checkbox being "disabled" means you can't click it.
  //   However, the context says "visibility toggle". Usually, these are just checked/unchecked.
  //   Let's re-read carefully: "The Precipitation overlay layer toggle is in the disabled state."
  //   This might mean the layer is NOT rendered? Or the toggle is disabled?
  //   Looking at the "Expected results" again:
  //   "The Precipitation overlay layer toggle is in the disabled state."
  //   "The Temperature overlay layer toggle is in the enabled state."
  //   This phrasing is ambiguous. "Enabled state" for a toggle usually means it's active/checked.
  //   "Disabled state" for a toggle usually means it's inactive/unchecked OR the input is disabled.
  //   Given Step 1 hides Temperature and Step 2 shows Precipitation:
  //   Temperature should be unchecked (hidden).
  //   Precipitation should be checked (visible).
  //   If "enabled state" means "checked", then Temperature should be checked? That contradicts Step 1.
  //   Let's look at the "Preconditions": "Temperature overlay layer is initially visible." -> Checked.
  //   Step 1: Hide Temperature. -> Unchecked.
  //   Step 2: Show Precipitation. -> Checked.
  //   Expected Result: "Temperature ... enabled state", "Precipitation ... disabled state".
  //   This seems reversed if "enabled" = "checked".
  //   Alternative interpretation: "Enabled" means the toggle button itself is enabled (not disabled attribute).
  //   But both are likely enabled buttons.
  //   Let's look at the wording again. Maybe "enabled state" means the layer is active/visible?
  //   If so, Temperature should be disabled (hidden) and Precipitation enabled (visible).
  //   But the expected result says Temperature is "enabled" and Precipitation is "disabled".
  //   This contradicts the steps if "enabled" = "visible".
  //   Let's reconsider. Maybe the use case description implies a different outcome?
  //   No, the steps are clear.
  //   Let's assume "enabled state" means the checkbox is CHECKED (active) and "disabled state" means UNCHECKED (inactive).
  //   If so, the expected results contradict the steps.
  //   However, often "disabled" in test specs for checkboxes means "unchecked".
  //   Let's look at the prompt's "UI Map": `controlType: "checkbox-list"`.
  //   Let's assume the Expected Results describe the FINAL state of the TOGGLE BUTTONS' VISIBILITY/STATE.
  //   If the expected result says Temperature is "enabled", maybe it means the toggle is clickable?
  //   Let's look at the previous sentence: "The Precipitation overlay layer toggle is in the disabled state."
  //   If I had to guess, the test generator might have swapped the names or I am misinterpreting "disabled".
  //   Let's look at the "Preconditions": Temperature is visible. Precipitation is hidden.
  //   Step 1: Hide Temperature.
  //   Step 2: Show Precipitation.
  //   Final: Temperature Hidden, Precipitation Visible.
  //   If "Enabled" = Visible/Checked, then Temperature should be Disabled/Unchecked.
  //   The expected result says Temperature is Enabled.
  //   This is a contradiction.
  //   Let's look at the "Complexity: hard". This suggests there might be a trick.
  //   Is it possible the user clicks the TOGGLE BUTTON to hide/show, but the "toggle" refers to the button itself?
  //   Let's assume the Expected Results are correct and my interpretation of the steps is wrong?
  //   No, the steps are explicit.
  //   Let's assume "enabled state" means the layer is RENDERED?
  //   If so, Temperature (hidden) should be disabled. Precipitation (visible) should be enabled.
  //   Expected: Temperature Enabled, Precipitation Disabled.
  //   This is the opposite.
  //   Could it be that the "Temperature" and "Precipitation" names in the Expected Results are swapped?
  //   Or maybe the "enabled/disabled" refers to the *layer's* status in the backend?
  //   Let's stick to the DOM assertions that are unambiguous.
  //   I will assert that the Temperature checkbox is NOT checked and Precipitation IS checked.
  //   I will also assert the weather forecast entries.

  // Re-evaluating "Expected results":
  // "The Precipitation overlay layer toggle is in the disabled state."
  // "The Temperature overlay layer toggle is in the enabled state."
  // If this is a mistake in the prompt's expected results vs steps, I should follow the steps.
  // However, I must generate assertions.
  // Let's try to interpret "disabled state" as "unchecked" and "enabled state" as "checked".
  // If so, the expected results are: Temperature Checked, Precipitation Unchecked.
  // This contradicts the steps.
  // Let's try to interpret "disabled state" as "the toggle button is disabled" (grayed out).
  // And "enabled state" as "the toggle button is enabled".
  // This doesn't change visibility.
  // Let's assume the prompt meant:
  // "The Precipitation overlay layer is rendered (enabled)."
  // "The Temperature overlay layer is not rendered (disabled)."
  // And the text "toggle is in the ... state" is just poor phrasing.
  // But it says "toggle".
  // Let's look at the Chakra UI checkbox. When checked, it has `aria-checked="true"`.
  // When unchecked, `aria-checked="false"`.
  // I will assert the checked state based on the steps.
  // Step 1: Hide Temperature -> Unchecked.
  // Step 2: Show Precipitation -> Checked.
  
  await expect(temperatureToggle).not.toBeChecked();
  await expect(precipitationToggle).toBeChecked();

  // Verify weather forecast has 24 entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
