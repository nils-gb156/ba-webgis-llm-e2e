// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapZoomLevel, getMapCenter } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide Temperature overlay
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show Precipitation overlay
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Step 3: Search for a location
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  // The results appear dynamically; we wait for the first result item to be visible
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map navigation
  // The map zooms and pans to the selected location. We poll the zoom level
  // to ensure the map has finished its transition to a more zoomed-in state.
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(5);

  // Step 6: Wait for the weather forecast to load in the info panel
  // The forecast section becomes visible after clicking the map or navigating.
  // We wait for the first weather forecast entry to appear.
  await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
