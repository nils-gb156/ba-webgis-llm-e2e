// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByPlaceholder('Search');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate (poll map center via helper if available, otherwise assume navigation happens)
  // Since no map helper is provided in the prompt, we rely on the info panel loading as the primary indicator of navigation.
  // However, we can wait for a network response to a geocoding or feature request if needed.
  // For now, we proceed to step 6 which implies the map has navigated.

  // Step 6: Wait for info panel to load the forecast
  // The info panel should display a weather forecast section with 24 entries.
  // We look for a container that holds the forecast entries.
  const forecastContainer = page.getByTestId('weather-forecast-container');
  await expect(forecastContainer).toBeVisible();

  // Assert that there are 24 entries in the forecast
  const forecastEntries = forecastContainer.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);
});
