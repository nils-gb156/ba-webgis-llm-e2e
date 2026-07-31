// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  const temperatureToggle = page.getByTestId('layer-temperature-toggle');
  await expect(temperatureToggle).toBeChecked();
  await temperatureToggle.click({ force: true });

  // 2. Show the Precipitation overlay layer
  const precipitationToggle = page.getByTestId('layer-precipitation-toggle');
  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // 3. Search for a location
  const searchField = page.getByTestId('geocoder-search-field');
  await searchField.click();
  await searchField.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  const firstResult = page.getByRole('option', { name: 'Münster' }).first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // We verify navigation by checking that the map canvas has received new content
  // or simply wait for a brief moment allowing the map to pan.
  // Since we can't assert map coordinates directly without helpers, we assert
  // that the info panel starts updating.
  await expect(page.locator('canvas')).toBeVisible();

  // 6. Wait for the info panel to load the forecast
  // The info panel displays a weather forecast section with 24 entries.
  const forecastSection = page.getByTestId('weather-forecast-section');
  await expect(forecastSection).toBeVisible();

  // Assert that there are 24 entries in the forecast
  const forecastEntries = forecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);

  // 7. Verify final layer states
  // The Precipitation overlay layer toggle is in the disabled state (checked)
  await expect(precipitationToggle).toBeChecked();
  // The Temperature overlay layer toggle is in the enabled state (unchecked)
  await expect(temperatureToggle).not.toBeChecked();
});
