// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // Use force: true because Chakra UI renders the real input visually hidden.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer state via the map model (DOM checkbox state may not reflect actual rendering).
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster' using the geocoder.
  await page.getByTestId('geocoder-input').fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  await page.getByRole('option', { name: 'Münster' }).first().click();

  // Step 5: Wait for the map to navigate to the selected location.
  // The map view settles after the geocoder result is selected.
  await expect.poll(() => page.evaluate(() => globalThis.__openPioneerMap?.olMap.getView().getAnimating())).toBe(false);

  // Step 6: Wait for the info panel to load the forecast.
  // The forecast section should appear with entries.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // Count the forecast entries (typically list items or cards within the section).
  const forecastEntries = page.getByTestId('weather-forecast-section').locator('[class*="ForecastEntry"], [class*="forecast-entry"], div[class*="Card"]');
  await expect(forecastEntries).toHaveCount(24);
});
