// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Wait for the Temperature overlay layer to be initially visible
  await expect(page.getByTestId('layer-temperature')).toBeVisible();

  // Wait for the Precipitation overlay layer to be initially hidden (but present in DOM)
  // We check that the visibility toggle is not checked or the layer is hidden
  const precipitationToggle = page.getByTestId('layer-precipitation');
  await expect(precipitationToggle).toBeVisible();
  await expect(precipitationToggle.locator('input[type="checkbox"]')).not.toBeChecked();

  // Wait for the search field (geocoder) to be accessible
  const searchField = page.getByPlaceholder('Search');
  await expect(searchField).toBeVisible();

  // Wait for the info panel to be visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature');
  await expect(temperatureToggle.locator('input[type="checkbox"]')).toBeChecked();
  await temperatureToggle.locator('input[type="checkbox"]').check({ force: true });

  // Step 2: Show the Precipitation overlay layer
  await expect(precipitationToggle.locator('input[type="checkbox"]')).not.toBeChecked();
  await precipitationToggle.locator('input[type="checkbox"]').check({ force: true });

  // Step 3: Search for a location
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // Assuming the search results are rendered in a list within the search component or a dropdown
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // Since map state is not in DOM, we rely on the info panel loading the forecast as a proxy for navigation/completion
  // Or we can wait for a network response related to the geocoder selection if available.
  // Here we wait for the info panel to update with new content, implying navigation.

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We assume the forecast entries are rendered as list items or similar elements within the info panel.
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect.poll(async () => forecastEntries.count()).toBe(24);

  // Verify the layer states as per expected results
  // The Precipitation overlay layer toggle is in the disabled state (checked means enabled/visible in typical UI, but prompt says "disabled state" for showing it? 
  // Let's re-read: "The Precipitation overlay layer toggle is in the disabled state." 
  // Usually, a toggle being "disabled" means it cannot be clicked. However, in the context of visibility, it might mean "checked" (active).
  // But the prompt says "Temperature... initially visible" and "Precipitation... initially hidden".
  // Step 1 hides Temperature. Step 2 shows Precipitation.
  // Expected result: "Precipitation ... disabled state" and "Temperature ... enabled state".
  // This is confusing. Let's look at the toggles.
  // If "disabled state" means the checkbox is unchecked (layer hidden), that contradicts Step 2 showing it.
  // If "disabled state" means the checkbox is checked (layer visible), that matches Step 2.
  // Let's assume "enabled state" for Temperature means checked (visible) and "disabled state" for Precipitation means checked (visible).
  // Wait, the prompt says:
  // "The Precipitation overlay layer toggle is in the disabled state."
  // "The Temperature overlay layer toggle is in the enabled state."
  // This might refer to the visual state of the toggle button itself (e.g. disabled attribute).
  // However, standard Chakra UI toggles don't typically disable themselves.
  // Let's re-read carefully: "The user clicks the visibility toggle of the Temperature overlay layer to hide it." -> Temperature should be hidden.
  // "The user clicks the visibility toggle of the Precipitation overlay layer to show it." -> Precipitation should be visible.
  // Expected: "Precipitation ... disabled state" and "Temperature ... enabled state".
  // This seems contradictory if "disabled" means hidden.
  // Perhaps "disabled state" refers to the fact that it is now active/checked? No, that's usually "enabled".
  // Let's look at the initial state: Temperature visible, Precipitation hidden.
  // After steps: Temperature hidden, Precipitation visible.
  // If "enabled state" means visible, then Temperature should be enabled? But we hid it.
  // If "disabled state" means hidden, then Precipitation should be disabled? But we showed it.
  // There is a contradiction in the prompt's expected results vs steps.
  // Let's assume the expected results describe the state of the TOGGLE BUTTONS, not the layers.
  // Maybe the toggle for Temperature is now disabled because the layer is hidden? Unlikely.
  // Let's assume the prompt meant:
  // "The Precipitation overlay layer is in the enabled (visible) state."
  // "The Temperature overlay layer is in the disabled (hidden) state."
  // But it says "toggle is in the ... state".
  // Let's stick to the visual cues.
  // If the toggle for Precipitation is checked, the layer is visible.
  // If the toggle for Temperature is unchecked, the layer is hidden.
  // The prompt says: "The Precipitation overlay layer toggle is in the disabled state."
  // Maybe "disabled" means "checked" in this specific app's terminology? Or maybe it means the input is disabled?
  // Let's look at the initial state again.
  // Initial: Temp visible (checked), Precip hidden (unchecked).
  // After: Temp hidden (unchecked), Precip visible (checked).
  // If "enabled state" for Temp means "checked", that contradicts hiding it.
  // If "disabled state" for Precip means "unchecked", that contradicts showing it.
  // Perhaps the prompt has a typo and meant:
  // "The Precipitation overlay layer toggle is in the enabled state (checked)."
  // "The Temperature overlay layer toggle is in the disabled state (unchecked)."
  // This aligns with the actions.
  // Let's assert based on the actions:
  // Temperature toggle should be unchecked.
  // Precipitation toggle should be checked.

  await expect(temperatureToggle.locator('input[type="checkbox"]')).not.toBeChecked();
  await expect(precipitationToggle.locator('input[type="checkbox"]')).toBeChecked();
});
