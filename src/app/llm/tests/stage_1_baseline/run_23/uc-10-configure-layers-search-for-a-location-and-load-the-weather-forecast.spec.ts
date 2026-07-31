// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-toggle-temperature');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-toggle-precipitation');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // The map canvas is the container for the map
  const mapContainer = page.locator('canvas');
  // We wait for the map to have moved by checking if the previous center is gone or
  // simply waiting for a short period as the navigation is triggered by the selection.
  // Since we can't assert map coordinates directly without helpers, we assert the
  // info panel starts loading or showing content related to the location.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is a weather forecast section with 24 entries.
  // We look for a container that holds the forecast entries.
  const forecastContainer = page.getByTestId('weather-forecast-container');
  await expect(forecastContainer).toBeVisible();

  // Assert that the forecast section has 24 entries
  const forecastEntries = forecastContainer.locator('[data-testid="weather-forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
