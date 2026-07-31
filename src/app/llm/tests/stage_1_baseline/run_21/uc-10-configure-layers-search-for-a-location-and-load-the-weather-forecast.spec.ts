// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and initial state to settle
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // 1. Hide the Temperature overlay layer
  // The Temperature layer is initially visible, so we click its toggle to hide it.
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked(); // Verify initial state
  await temperatureToggle.click();

  // 2. Show the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we click its toggle to show it.
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked(); // Verify initial state
  await precipitationToggle.click();

  // Verify layer states after toggles
  // Expected: Precipitation enabled (checked), Temperature disabled (unchecked)
  await expect(precipitationToggle).toBeChecked();
  await expect(temperatureToggle).not.toBeChecked();

  // 3. Search for a location
  const searchField = page.getByTestId('geocoder-search-input');
  await searchField.click();
  await searchField.fill('Münster');

  // 4. Wait for result list and select first result
  // The dropdown results appear dynamically. We wait for the first result item.
  const firstResult = page.getByRole('option', { name: 'Münster', exact: false }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for map to navigate
  // Since we don't have map helpers, we infer navigation by the info panel updating
  // or simply wait a bit for the map to pan. However, the prompt implies checking
  // the info panel for the forecast as the final step, which confirms navigation.
  // We can assert that the map canvas exists and is visible.
  await expect(page.locator('canvas.ol-viewport')).toBeVisible();

  // 6. Wait for the info panel to load the forecast with 24 entries
  // The info panel should now display weather forecast data.
  // We look for a container that holds the forecast entries.
  // Assuming the forecast entries are rendered as list items or similar within the info panel.
  const forecastContainer = page.getByTestId('weather-forecast-container');
  await expect(forecastContainer).toBeVisible();

  // Count the number of forecast entries. Expected: 24 entries.
  // We assume each entry has a consistent test id or role.
  // Let's assume entries have a test id like 'forecast-entry' or similar.
  // If not specified, we might count rows or items.
  // Using a generic approach: count elements that look like forecast items.
  // Let's assume the structure provides a way to count them.
  // Common pattern: list items or divs with a specific class/testid.
  // Since specific test ids for forecast entries aren't given, we'll try to find a list.
  const forecastEntries = page.locator('[data-testid^="forecast-entry"]');
  
  // Use poll to wait for the count to reach 24
  await expect.poll(async () => {
    return await forecastEntries.count();
  }).toBe(24);
});
