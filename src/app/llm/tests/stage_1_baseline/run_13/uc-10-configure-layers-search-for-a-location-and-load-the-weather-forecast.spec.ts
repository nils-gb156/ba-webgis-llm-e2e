// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Step 3: Search for a location
  const searchField = page.getByLabel('Search');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select the first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We verify navigation by checking that the map canvas has changed content
  // or by waiting for a specific indicator if available. Since we don't have
  // map helpers, we wait for the info panel to start loading which implies
  // navigation.
  await page.waitForTimeout(2000); // Allow map navigation to complete

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We look for a container that holds the forecast entries.
  const forecastContainer = page.getByTestId('weather-forecast-container');
  await expect(forecastContainer).toBeVisible();

  // Assert that there are 24 entries in the forecast
  const forecastEntries = forecastContainer.locator('[data-testid="weather-forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24);
});
