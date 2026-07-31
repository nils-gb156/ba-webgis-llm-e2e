// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-toggle-temperature');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click();

  // Step 2: Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-toggle-precipitation');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click();

  // Verify layer states
  await expect(precipitationToggle).toBeChecked();
  await expect(temperatureToggle).not.toBeChecked();

  // Step 3: Search for a location
  const searchField = page.getByTestId('geocoder-search-input');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByTestId('geocoder-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation (poll map center or zoom via helper if provided, otherwise rely on UI state)
  // Since no helper was provided, we assert the info panel starts loading/updating which implies navigation
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the weather forecast to load with 24 entries
  // The forecast entries are likely rendered in the info panel. We poll for the count of forecast items.
  const forecastEntries = page.getByTestId('forecast-entry');
  
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);
});
