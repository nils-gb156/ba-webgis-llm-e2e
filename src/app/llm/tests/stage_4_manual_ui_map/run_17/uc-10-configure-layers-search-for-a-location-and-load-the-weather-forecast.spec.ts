// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure map is ready and initial layers are as expected
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Step 1: Hide Temperature layer
  // The UI map says Temperature is initially visible. We click its checkbox to hide it.
  // Chakra UI checkboxes need force: true because the input is visually hidden.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show Precipitation layer
  // The UI map says Precipitation is initially hidden. We click its checkbox to show it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Expected result: Precipitation is enabled (checked), Temperature is disabled (unchecked)
  // Note: The use case description says "Precipitation overlay layer toggle is in the disabled state"
  // but the step says "click ... to show it". Usually "show" implies enabling.
  // However, looking at the expected results:
  // "The Precipitation overlay layer toggle is in the disabled state."
  // "The Temperature overlay layer toggle is in the enabled state."
  // This contradicts the steps if "disabled" means unchecked.
  // Let's re-read carefully.
  // Step 1: Click visibility toggle of Temperature to HIDE it.
  // Step 2: Click visibility toggle of Precipitation to SHOW it.
  // Expected results:
  // - Precipitation toggle is DISABLED.
  // - Temperature toggle is ENABLED.
  // This seems contradictory. If I hide Temperature, it should be unchecked/disabled?
  // If I show Precipitation, it should be checked/enabled?
  // Let's look at the wording "disabled state" vs "enabled state" for toggles.
  // In Chakra UI, a checkbox can be "checked" or "unchecked".
  // Sometimes "disabled" refers to the `isDisabled` prop, but here it likely refers to the state of the toggle.
  // Let's assume "enabled" = checked (visible) and "disabled" = unchecked (hidden) for the purpose of the toggle's visual state indicating the layer status?
  // No, usually a toggle being "disabled" means you can't click it.
  // Let's look at the UI Map again.
  // "controlType": "checkbox-list"
  // If the expected result says "Precipitation ... disabled", maybe it means the layer is NOT rendered?
  // But Step 2 says "show it".
  // Let's look at the previous turn or context. There is none.
  // Let's assume the standard interpretation:
  // Step 1: Hide Temp -> Temp unchecked.
  // Step 2: Show Precip -> Precip checked.
  // Expected Results text might be using "enabled/disabled" to mean "checked/unchecked" or "visible/hidden".
  // OR, it might be a typo in the prompt's expected results section.
  // "The Precipitation overlay layer toggle is in the disabled state."
  // "The Temperature overlay layer toggle is in the enabled state."
  // If I follow the steps:
  // Temp is hidden. Precip is shown.
  // If "enabled" means "checked", then Temp should be enabled? No, I hid it.
  // If "enabled" means "visible", then Temp should be visible? No, I hid it.
  // Let's re-read Step 1: "click ... to hide it".
  // Step 2: "click ... to show it".
  // If the expected results are:
  // - Precip disabled (unchecked?)
  // - Temp enabled (checked?)
  // Then the steps would be reversed or I misunderstood the initial state.
  // Preconditions: "Temperature overlay layer is initially visible." -> Checked.
  // "Precipitation overlay layer is initially hidden." -> Unchecked.
  // Step 1: Hide Temp -> Unchecked.
  // Step 2: Show Precip -> Checked.
  // So Temp is Unchecked, Precip is Checked.
  // If Expected Result says "Precip disabled" and "Temp enabled", and we assume Enabled=Checked, Disabled=Unchecked:
  // Then Precip should be Unchecked and Temp should be Checked.
  // This contradicts the steps.
  // Let's consider "disabled" might mean "not active" in some other sense?
  // Or maybe the expected results describe the state OF THE TOGGLE BUTTON ITSELF (i.e. is it clickable)?
  // Unlikely.
  // Let's look at the complexity: "hard".
  // Maybe the "disabled state" refers to the fact that after clicking, the layer is rendered, so the toggle is "active"?
  // Let's stick to the explicit actions: Hide Temp, Show Precip.
  // And assert the map state reflects this.
  // I will assert that Temp is NOT rendered and Precip IS rendered.
  // I will also assert the checkbox states.
  // If the prompt's "expected results" text is contradictory, I will follow the steps and the logical outcome of those steps.
  // However, I must check if "disabled" means something else.
  // In some UIs, a toggle might be "disabled" if the layer cannot be shown? No.
  // Let's assume the expected results meant:
  // "Precipitation ... enabled" (checked)
  // "Temperature ... disabled" (unchecked)
  // And there was a typo in the prompt swapping them?
  // Or maybe "enabled" means "the toggle is in the 'on' position"?
  // If so:
  // Temp: Hide -> Off -> Disabled?
  // Precip: Show -> On -> Enabled?
  // Then:
  // Precip Enabled (Checked)
  // Temp Disabled (Unchecked)
  // This matches my steps!
  // So "Enabled" = Checked/Visible. "Disabled" = Unchecked/Hidden.
  // The prompt says:
  // "The Precipitation overlay layer toggle is in the disabled state." -> Unchecked?
  // "The Temperature overlay layer toggle is in the enabled state." -> Checked?
  // This contradicts my derivation.
  // Let's look at the prompt again.
  // "Expected results: ... Precipitation ... disabled ... Temperature ... enabled"
  // If I follow the steps:
  // 1. Hide Temp.
  // 2. Show Precip.
  // Result: Temp Hidden, Precip Visible.
  // If "Disabled" = Hidden and "Enabled" = Visible:
  // Precip is Visible -> Enabled.
  // Temp is Hidden -> Disabled.
  // The expected results say: Precip Disabled, Temp Enabled.
  // This is the exact opposite.
  // Is it possible the steps are:
  // 1. Click Temp to HIDE it. (It becomes Hidden/Disabled)
  // 2. Click Precip to SHOW it. (It becomes Visible/Enabled)
  // So Temp is Disabled, Precip is Enabled.
  // The expected results say: Precip Disabled, Temp Enabled.
  // This is a contradiction.
  // I will prioritize the steps and the logical outcome. I will assert that Temp is hidden and Precip is visible.
  // I will also assert the checkbox states.
  // I will not assert "disabled/enabled" textually if it contradicts the visual state, as that is ambiguous.
  // I will assert `toBeChecked()` and `not.toBeChecked()`.

  // Wait, let's look at the UI Map for "layer-switcher".
  // It's a checkbox list.
  // Let's just assert the checked state.

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select first
  // The results appear dynamically.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map center should change. We don't know the exact center, but it should settle.
  await expect.poll(() => getMapCenter(page)).resolves.toBeDefined();

  // Step 6: Wait for weather forecast
  // The info panel should load the forecast.
  // The UI map says weather-forecast is visible after clicking the map.
  // Did we click the map? No, we selected a geocoder result.
  // Does selecting a geocoder result trigger the info panel forecast?
  // The use case says "loads the weather forecast for that position".
  // The UI map says weather-forecast appears after "click" on map-container.
  // However, geocoder selection usually simulates a click or updates the view.
  // Let's assume the geocoder selection triggers the same logic as a click for the forecast.
  // Or maybe the forecast loads automatically when the view changes?
  // The UI map note says: "Appears after the user clicks on the map and the forecast loads".
  // It doesn't explicitly mention geocoder.
  // But the use case expects it.
  // I will wait for the weather forecast section to appear.

  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Expected result: 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);

  // Additional assertions on layer state
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
});
