// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeVisible();
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).toBeVisible();
  await precipitationToggle.click();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-field');
  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select the first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We assert that the map center/zoom has changed by polling the map model helper
  // Assuming the prompt provides a helper module for map state.
  // Since no specific helper path was provided in the prompt text, we must rely on
  // general assertions or assume standard test IDs if available.
  // However, the instructions say "If the prompt provides map model helper functions...".
  // The prompt DOES NOT provide specific helper functions or their import path.
  // Therefore, we cannot use the `expect.poll(() => helper(page))` pattern.
  // We will assert based on DOM changes or general visibility if possible,
  // or simply wait for the info panel update which implies navigation.

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Check for the weather forecast section
  const forecastSection = infoPanel.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // Check for 24 entries in the forecast
  const forecastEntries = forecastSection.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);

  // Verify layer states
  // Temperature should be enabled (visible) -> toggle should be in "on" state
  // Precipitation should be disabled (hidden) -> toggle should be in "off" state
  // Note: The use case says "Temperature overlay layer toggle is in the enabled state"
  // and "Precipitation overlay layer toggle is in the disabled state".
  // Usually "enabled" for a visibility toggle means the layer IS visible (checkbox checked).
  // "disabled" might mean the toggle button itself is disabled, OR the layer is hidden (unchecked).
  // Given the context "hide it" and "show it", "enabled" likely means "checked/on" and "disabled" means "unchecked/off".
  // Let's assert the state of the toggles.
  
  // Temperature layer was hidden in step 1, so its toggle should be unchecked/off.
  // But the expected result says "Temperature overlay layer toggle is in the enabled state".
  // This is contradictory. Let's re-read carefully.
  // "The user clicks the visibility toggle of the Temperature overlay layer to hide it."
  // "Expected results: ... The Temperature overlay layer toggle is in the enabled state."
  // If "enabled" means the layer is active/visible, then the user action contradicts the expected result.
  // If "enabled" means the toggle button is clickable/active, that's always true.
  // Let's look at Precipitation: "The user clicks ... to show it." -> "Precipitation ... toggle is in the disabled state."
  // This suggests "enabled" = layer visible (checked) and "disabled" = layer hidden (unchecked).
  // But Step 1 hides Temperature, so it should be unchecked. Expected result says "enabled".
  // Step 2 shows Precipitation, so it should be checked. Expected result says "disabled".
  // This is a direct contradiction.
  // Let's re-read the Expected Results section again.
  // "- The Precipitation overlay layer toggle is in the disabled state."
  // "- The Temperature overlay layer toggle is in the enabled state."
  // Maybe "enabled" means the toggle is in the "on" position (layer visible)?
  // If so, the expected results are swapped or the steps are swapped.
  // Let's assume the Expected Results describe the STATE of the TOGGLE BUTTONS, not the layers.
  // If I click to hide Temperature, the toggle goes to "off".
  // If I click to show Precipitation, the toggle goes to "on".
  // The expected results say:
  // Precipitation toggle: disabled.
  // Temperature toggle: enabled.
  // This implies:
  // Precipitation is HIDDEN (toggle off/disabled?).
  // Temperature is VISIBLE (toggle on/enabled?).
  // But the steps say:
  // 1. Hide Temperature.
  // 2. Show Precipitation.
  // This is a complete mismatch.
  // Let's look at the Precondition:
  // "The Temperature overlay layer is initially visible."
  // "The Precipitation overlay layer is initially hidden."
  // If the user does NOTHING, Temperature is Visible (Enabled/On), Precipitation is Hidden (Disabled/Off).
  // The steps change this.
  // Perhaps the "Expected Results" are describing the INITIAL state? No, it says "Expected results" after steps.
  // Perhaps the steps are wrong? Or the expected results are wrong?
  // Let's assume the Expected Results are the source of truth for the final state.
  // Final State: Temperature Visible (Enabled), Precipitation Hidden (Disabled).
  // This means the user effectively reverted the changes or the steps are different.
  // But I must follow the steps.
  // Let's assume "enabled" means the toggle is in the "on" state (layer visible) and "disabled" means "off" (layer hidden).
  // Then the expected results are:
  // Precipitation: Off (Hidden).
  // Temperature: On (Visible).
  // But the steps do the opposite.
  // Let's assume the opposite interpretation: "enabled" means the toggle button is clickable (always true) and "disabled" means it's not? No.
  // Let's assume the expected results are simply swapped in the prompt text by mistake.
  // I will assert the state resulting from the steps:
  // Temperature: Hidden (Toggle Off).
  // Precipitation: Visible (Toggle On).
  // If the test fails, it's due to a contradiction in the prompt.
  // However, I must generate the test. I will assert what logically follows the steps.
  
  // Assert Temperature is hidden (toggle unchecked)
  await expect(temperatureToggle).not.toBeChecked();
  
  // Assert Precipitation is visible (toggle checked)
  await expect(precipitationToggle).toBeChecked();
});
