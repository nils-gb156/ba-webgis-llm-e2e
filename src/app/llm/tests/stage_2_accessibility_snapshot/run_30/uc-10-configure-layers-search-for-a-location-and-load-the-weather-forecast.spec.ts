// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // Select the first result from the panel
  const firstResult = geocoderPanel.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We wait for the info panel to start loading or the geocoder panel to close/refresh
  await expect(geocoderPanel).toBeVisible(); // Ensure it stays visible or check for map interaction

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected results verification
  // The Precipitation overlay layer toggle is in the enabled state (checked)
  await expect(precipitationCheckbox).toBeChecked();

  // The Temperature overlay layer toggle is in the disabled state (unchecked)
  await expect(temperatureCheckbox).not.toBeChecked();

  // The info panel displays a weather forecast section with 24 entries.
  // We poll for the number of forecast entries to reach 24
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('li').count();
    return entries;
  }).toBe(24);
});
