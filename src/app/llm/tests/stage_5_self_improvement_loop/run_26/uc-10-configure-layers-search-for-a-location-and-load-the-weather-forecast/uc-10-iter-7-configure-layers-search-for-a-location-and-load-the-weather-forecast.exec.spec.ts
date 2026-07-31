// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

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
  // The geocoder panel contains the results; we look for a clickable result item inside it.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  // Wait for the panel to appear and contain at least one result item.
  // The exact test-id for result items is not guaranteed, so we wait for the panel
  // to become visible and then click the first result inside it.
  await expect(geocoderPanel).toBeVisible({ timeout: 10000 });

  // Click the first result inside the geocoder panel.
  // We use a general selector for the first clickable item inside the panel that isn't the input or clear button.
  const firstResult = geocoderPanel.locator('button, [role="option"]').first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the searched location.
  // Münster is roughly at [770000, 6150000] in EPSG:3857.
  // The initial extent is much further north/east (around [1000000, 6500000]).
  // We wait until the x-coordinate drops below 800000.
  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return center && center[0] < 800000;
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible({ timeout: 15000 });

  // Verify the info panel displays 24 entries (forecast items)
  // The test ids for individual entries are 'weather-forecast-entry'.
  const forecastEntries = weatherForecastSection.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
