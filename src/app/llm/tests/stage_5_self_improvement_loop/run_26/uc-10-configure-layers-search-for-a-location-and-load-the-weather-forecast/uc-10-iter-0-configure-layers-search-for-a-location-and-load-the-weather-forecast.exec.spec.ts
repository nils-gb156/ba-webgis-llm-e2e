// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature' });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Verify layer visibility state
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByRole('option').first();
  await expect(firstResult).toBeVisible({ timeout: 10000 });
  await firstResult.click();

  // Step 5: Wait for the map to navigate
  // The map center should change from the initial extent to Münster's coordinates.
  await expect.poll(async () => {
    const center = await page.evaluate(() => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      if (!map) return undefined;
      const c = map.olMap.getView().getCenter();
      return c;
    });
    // Münster is roughly at [770000, 6150000] in EPSG:3857.
    // The initial extent is much further north/east (around [1000000, 6500000]).
    // If the map hasn't moved yet, center[0] will be > 1000000.
    // We wait until the x-coordinate drops below 800000.
    return center && center[0] < 800000;
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible({ timeout: 15000 });

  // Verify the info panel displays 24 entries (forecast items)
  const forecastEntries = weatherForecastSection.getByRole('listitem');
  await expect(forecastEntries).toHaveCount(24);
});
