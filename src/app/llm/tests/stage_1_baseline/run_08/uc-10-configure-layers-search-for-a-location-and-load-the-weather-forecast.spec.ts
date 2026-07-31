// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  // The Temperature layer is initially visible (enabled). We click its toggle to hide it.
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });
  await expect(temperatureToggle).not.toBeChecked();

  // Step 2: Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden (disabled). We click its toggle to show it.
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Click the search field and type a place name
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The first result usually has a specific test id or can be targeted by index
  const firstResult = page.getByTestId('geocoder-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We assume there's a map container or a specific indicator that the map has moved.
  // Since map state is not in DOM, we wait for the info panel to update, which implies navigation.
  // Alternatively, we can wait for a short period or a specific map interaction event if available.
  // Here we wait for the info panel to show content related to the location or forecast.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  // We poll for the presence of 24 forecast entries in the info panel.
  await expect.poll(async () => {
    const forecastEntries = page.locator('[data-testid="weather-forecast-entry"]');
    return await forecastEntries.count();
  }).toBe(24);
});
