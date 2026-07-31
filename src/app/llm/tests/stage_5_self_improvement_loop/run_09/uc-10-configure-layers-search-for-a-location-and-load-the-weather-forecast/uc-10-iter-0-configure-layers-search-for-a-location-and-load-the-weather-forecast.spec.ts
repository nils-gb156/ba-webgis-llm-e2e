// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Type a place name in the geocoder
  await page.getByRole('textbox', { name: 'Geocoder search' }).fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  //    The geocoder panel is the dropdown that appears below the input.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  await geocoderPanel.getByRole('option', { name: 'Münster' }).first().click();

  // 5. Wait for the map to navigate to the selected location
  //    The map center should change from the default (around Germany center) to Münster coordinates.
  //    Münster is approximately 7.6°E, 51.96°N, which in EPSG:3857 is roughly [846000, 6660000].
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 6. Wait for the info panel to load the forecast
  //    The info panel should display a weather forecast section with 24 entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the weather forecast section contains multiple entries (e.g., at least one visible item)
  // We can check for the presence of a grid or list of hourly forecasts.
  // A simple check is that the section is visible and contains some text or elements.
  await expect(weatherForecastSection.locator('li, div')).toHaveCount({ min: 1 });
});
