// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay
  // The layer switcher is visible by default. We click the checkbox for "Temperature".
  // Using force: true because Chakra UI checkboxes have a hidden input underneath a decorative div.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Verify Temperature is no longer rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 2: Show Precipitation overlay
  // Precipitation is initially hidden. We click its checkbox to show it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify Precipitation is now rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The results list appears after typing. We wait for the first result item to be visible.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // We poll the map center to ensure it has changed from the initial extent.
  // We use a loose check: the center should no longer be undefined (map ready) and the value should change.
  // Since we don't know the exact center of Münster, we check that the map is ready and the center is defined.
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // Step 6: Wait for weather forecast to load
  // The forecast appears in the info panel after clicking the map or navigating to a result.
  // We wait for the weather-forecast container to be visible.
  const weatherForecastContainer = page.getByTestId('weather-forecast');
  await expect(weatherForecastContainer).toBeVisible();

  // Verify the forecast has 24 entries
  // The entries are dynamic items inside the weather-forecast container.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
