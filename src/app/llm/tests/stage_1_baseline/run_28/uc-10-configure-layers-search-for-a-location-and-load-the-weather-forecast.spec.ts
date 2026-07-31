// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Hide the Temperature overlay layer
  // The Temperature layer is initially visible, so we click its toggle to hide it.
  // We use force: true because Chakra UI checkboxes/switches may have visual overlays.
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we click its toggle to show it.
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Expected results:
  // - The Precipitation overlay layer toggle is in the enabled (checked) state.
  // - The Temperature overlay layer toggle is in the disabled (unchecked) state.
  await expect(precipitationToggle).toBeChecked();
  await expect(temperatureToggle).not.toBeChecked();

  // Step 3: Click the search field and type a place name
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // We wait for the first result item to be visible
  const firstResult = page.getByTestId('geocoder-result-item').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location
  // We can assert this by checking that the info panel updates or by waiting for a map move event if available.
  // Since we don't have map helpers, we'll wait for the info panel to update with new content.
  // The info panel is visible, so we wait for it to be visible (it might already be)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast
  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We look for a container that holds the forecast entries.
  // Assuming the forecast entries have a specific test id or role.
  // Let's assume the forecast entries are list items within a forecast container.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  
  // Use expect.poll to wait for the number of forecast entries to be 24
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);
});
