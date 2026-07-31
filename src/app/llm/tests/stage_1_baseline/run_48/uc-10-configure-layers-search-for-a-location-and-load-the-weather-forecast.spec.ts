// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();

  // Step 2: Show Precipitation overlay
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();

  // Verify layer states
  await expect(precipitationToggle).not.toBeChecked();
  await expect(temperatureToggle).toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-input');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for result list and select first result
  const firstResult = page.getByTestId('geocoder-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate (poll map center or zoom if helpers were provided,
  // but here we rely on the info panel loading as the primary indicator of navigation success
  // combined with a reasonable wait for the geocoder result processing)
  // Since we don't have map helpers in the prompt, we wait for the info panel to update.

  // Step 6: Wait for info panel to load the forecast
  // The expected result is 24 entries in the forecast section.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
