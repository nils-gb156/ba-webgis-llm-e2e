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
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate (we assert via the info panel loading, as map canvas cannot be directly inspected)
  // The navigation is implicit in the application flow after selection

  // Step 6: Wait for info panel to load the forecast
  const forecastSection = page.getByTestId('forecast-panel');
  await expect(forecastSection).toBeVisible();

  // Expected result: Info panel displays a weather forecast section with 24 entries
  // We poll for the forecast entries to appear
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect.poll(async () => forecastEntries.count()).toBe(24);

  // Verify layer states
  // Precipitation toggle should be checked (enabled/visible)
  await expect(precipitationToggle).toBeChecked();
  // Temperature toggle should be unchecked (disabled/hidden)
  await expect(temperatureToggle).not.toBeChecked();
});
