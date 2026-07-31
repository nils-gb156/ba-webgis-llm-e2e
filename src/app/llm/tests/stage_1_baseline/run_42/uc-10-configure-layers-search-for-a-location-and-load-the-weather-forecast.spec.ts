// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-switcher-temperature');
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-switcher-precipitation');
  await precipitationToggle.click();

  // Step 3: Search for a location using the geocoder
  const searchField = page.getByLabel('Search');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const firstResult = page.getByRole('option', { name: 'Münster', exact: true }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We assert that the info panel updates, which implies the map has navigated
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // The forecast entries are likely rendered in a list or grid within the info panel
  const forecastEntries = infoPanel.getByRole('listitem').or(infoPanel.getByTestId('forecast-entry'));
  
  // Use polling to wait for the forecast data to load and render 24 entries
  await expect.poll(async () => {
    const count = await infoPanel.getByRole('listitem').count();
    return count;
  }).toBeGreaterThanOrEqual(24);

  // Step 7: Verify the layer states
  // The Precipitation toggle should be in a "disabled" or "checked" state indicating it is visible/active
  // The Temperature toggle should be in an "enabled" or "unchecked" state indicating it is hidden/inactive
  // Note: The prompt says "disabled state" for Precipitation and "enabled state" for Temperature.
  // In Chakra UI, a checked checkbox might be visually distinct. We check the aria-checked or class state.
  // Assuming "disabled" means the layer is ON (and thus the toggle might be in a specific state)
  // and "enabled" means the layer is OFF. Let's check the aria-checked attribute.
  
  // If Precipitation is visible, its checkbox should be checked.
  await expect(precipitationToggle).toBeChecked();

  // If Temperature is hidden, its checkbox should be unchecked.
  await expect(temperatureToggle).not.toBeChecked();
});
