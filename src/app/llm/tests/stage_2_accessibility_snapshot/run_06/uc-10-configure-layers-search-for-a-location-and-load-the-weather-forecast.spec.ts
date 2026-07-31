// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The layer switcher is already open. The checkbox for "Temperature" is currently checked.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  // The checkbox for "Precipitation" is currently unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer states
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 3: Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result from the geocoder panel.
  const firstResult = geocoderPanel.getByRole('option').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We assert that the map container is still visible and the info panel starts updating.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast.
  // The info panel should contain a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // Assert that there are 24 forecast entries.
  await expect(weatherForecastSection.getByRole('listitem')).toHaveCount(24);
});
