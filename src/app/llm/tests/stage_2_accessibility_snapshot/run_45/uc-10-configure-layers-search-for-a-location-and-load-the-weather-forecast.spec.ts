// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay layer
  // The layer switcher is already open and the Temperature checkbox is checked.
  // We need to click it to uncheck it.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show Precipitation overlay layer
  // The Precipitation checkbox is currently unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Expected results:
  // - The Precipitation overlay layer toggle is in the enabled state (checked).
  // - The Temperature overlay layer toggle is in the disabled state (unchecked).
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 3: Click the search field and type a place name.
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder panel contains the results.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the first result item to be visible. Assuming the first result is a list item within the panel.
  await expect(geocoderPanel.getByRole('option', { name: 'Münster' })).toBeVisible();
  // Select the first result.
  await geocoderPanel.getByRole('option', { name: 'Münster' }).first().click();

  // Step 5: Wait for the map to navigate to the selected location.
  // We can verify this by checking that the info panel has started loading or that the map view has changed.
  // Since we don't have map helpers, we wait for the info panel to show the weather forecast section.
  // The info panel is visible and contains the "Weather Forecast" heading.
  await expect(page.getByRole('heading', { name: 'Weather Forecast' })).toBeVisible();

  // Step 6: Wait for the info panel to load the forecast.
  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // The weather forecast section is identified by data-testid 'weather-forecast-section'.
  // We expect 24 entries (likely list items or similar structure) within this section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  // Wait for the forecast entries to appear. Assuming each entry is a list item or similar.
  // We poll to ensure the entries are loaded asynchronously.
  await expect.poll(async () => {
    const entries = weatherForecastSection.locator('li');
    return await entries.count();
  }).toBe(24);
});
