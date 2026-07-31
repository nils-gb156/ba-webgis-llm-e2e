// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Record the initial map center before any navigation
  const initialCenter = await getMapCenter(page);

  // Step 1: Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Expected results: Precipitation layer is rendered, Temperature layer is not
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 3: Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  await expect(page.getByTestId('geocoder-panel')).toBeVisible();
  await page.getByTestId('geocoder-result-item-0').click();

  // Step 5: Wait for the map to navigate to the selected location
  // We verify this by checking that the map center has changed from the initial extent.
  await expect.poll(async () => {
    const currentCenter = await getMapCenter(page);
    if (!initialCenter || !currentCenter) return false;
    const dx = Math.abs(currentCenter[0] - initialCenter[0]);
    const dy = Math.abs(currentCenter[1] - initialCenter[1]);
    return dx > 10000 || dy > 10000;
  }).toBe(true);

  // Step 6: Wait for the info panel to load the forecast
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // The forecast entries are rendered as separate elements with data-testid='weather-forecast-entry'.
  await expect(page.getByTestId('weather-forecast-entry')).toHaveCount(24);
});
