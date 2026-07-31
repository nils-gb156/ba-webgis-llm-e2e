// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready
  await expect(page.getByTestId('app-root')).toBeVisible();

  // 1. Hide the Temperature overlay layer
  // The Temperature layer is initially visible, so we click its toggle to hide it.
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeVisible();
  await temperatureToggle.click();
  await expect(temperatureToggle).toHaveAttribute('aria-pressed', 'false');

  // 2. Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we click its toggle to show it.
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).toBeVisible();
  await precipitationToggle.click();
  // Verify the Precipitation layer is now enabled/visible
  await expect(precipitationToggle).toHaveAttribute('aria-pressed', 'true');

  // 3. Search for a location using the geocoder
  const searchField = page.getByTestId('geocoder-search-field');
  await expect(searchField).toBeVisible();
  await searchField.click();
  await searchField.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The search results are typically rendered in a dropdown or list below the search field
  const firstResult = page.getByTestId('geocoder-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // Since we don't have map helpers, we wait for the info panel to start loading or update
  // We assume the map navigation triggers a change in the info panel or map state.
  // We'll wait for the info panel to be visible and potentially update its content.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // 6. Wait for the info panel to load the forecast
  // The expected result is a weather forecast section with 24 entries.
  // We look for a container that holds the forecast entries.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // Verify that there are 24 forecast entries
  const forecastEntries = forecastSection.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
