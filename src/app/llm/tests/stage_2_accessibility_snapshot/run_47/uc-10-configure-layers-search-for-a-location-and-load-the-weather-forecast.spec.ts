// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result
  const firstResult = geocoderPanel.getByRole('option').first();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We wait for the info panel to start updating, indicating navigation/selection
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast with 24 entries
  // The weather forecast section should appear and contain 24 items
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  
  // Poll for the weather forecast section to appear and contain 24 entries
  await expect.poll(async () => {
    const section = page.getByTestId('weather-forecast-section');
    const isVisible = await section.isVisible();
    if (!isVisible) return 0;
    // Count the number of forecast entries (typically list items or similar structure)
    // Assuming the forecast entries are direct children or have a specific structure.
    // Based on "24 entries", we look for a list or set of items.
    // Let's assume the entries are wrapped in a container or are distinct elements.
    // A common pattern is a list of 24 items.
    const entries = page.getByTestId('weather-forecast-section').locator('li');
    const count = await entries.count();
    return count;
  }).toBe(24);

  // Final verification of layer states
  await expect(precipitationCheckbox).toBeChecked();
  await expect(temperatureCheckbox).not.toBeChecked();
});
