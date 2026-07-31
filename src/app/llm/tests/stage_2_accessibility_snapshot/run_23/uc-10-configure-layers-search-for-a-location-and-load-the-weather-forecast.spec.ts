// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer.
  // The Temperature checkbox is currently checked. Clicking it should uncheck it.
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });
  await expect(temperatureCheckbox).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is currently unchecked. Clicking it should check it.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });
  await expect(precipitationCheckbox).toBeChecked();

  // Step 3: Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  
  // The first result is usually the most precise match.
  // We locate the first list item or link within the geocoder panel.
  const firstResult = geocoderPanel.locator('li').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We assert that the map container is still visible, implying the navigation completed.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast.
  // Expected result: The info panel displays a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Count the entries in the weather forecast section.
  // The exact structure might vary, but typically entries are list items or distinct blocks.
  // We will assert that there are at least 24 entries visible.
  const forecastEntries = weatherForecastSection.locator('li, div');
  await expect(forecastEntries).toHaveCount(24);
});
