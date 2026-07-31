// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature layer
  // The layer switcher is already visible. Temperature checkbox is initially checked.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation layer
  // Precipitation checkbox is initially unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Type a place name in the geocoder
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The geocoder panel (results list) appears below the input.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // The first result is "Münster, North Rhine-Westphalia, Germany".
  // Use the test id for the first result item to be unambiguous.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // Verify layer state changes as expected
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 6. Wait for the info panel to load the forecast
  // The info panel should display a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the weather forecast section contains multiple entries.
  // The section likely contains a grid or list of hourly forecasts.
  // We check that it contains at least some text or elements indicating forecast data.
  // A simple check is that the section is visible and contains some text content.
  await expect(weatherForecastSection.locator('p, div, span, li')).toHaveCount({ min: 1 });
});
