// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the visibility toggle of the Temperature overlay layer to hide it.
  // The Temperature checkbox is checked [checked] in the initial state.
  // Using force: true because Chakra UI wraps the input in a decorative control.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation checkbox is unchecked in the initial state.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Assert layer states via the map model helper (layers are rendered asynchronously)
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. The user clicks the search field and types a place name (e.g. 'Münster').
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. The user waits for the result list to appear and selects the first result.
  // The geocoder panel is visible after typing.
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();

  // Select the first result from the geocoder panel using the specific test id.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await firstResult.click();

  // 5. The user waits for the map to navigate to the selected location.
  // This is implicit in the next step as the info panel will load the forecast
  // based on the new map center.

  // 6. The user waits for the info panel to load the forecast.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // The forecast entries are rendered with the test id 'weather-forecast-entry'.
  // We count them to verify the expected number of entries.
  const forecastItems = page.getByTestId('weather-forecast-entry');
  await expect(forecastItems).toHaveCount(24);
});
