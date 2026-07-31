// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel.getByRole('option')).toHaveCount({ gt: 0 });
  await geocoderPanel.getByRole('option').first().click();

  // Step 5: Wait for the map to navigate to the selected location
  const initialCenter = await getMapCenter(page);
  const initialZoom = await getMapZoomLevel(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);
  await expect.poll(() => getMapZoomLevel(page)).not.toEqual(initialZoom);

  // Step 6: Wait for the info panel to load the forecast
  await expect.poll(() => page.getByTestId('weather-forecast-section').locator('li').count()).toBe(
    24,
  );

  // Verify expected results

  // The Precipitation overlay layer toggle is in the disabled state (checked)
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // The Temperature overlay layer toggle is in the enabled state (unchecked)
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();

  // The Precipitation layer is rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // The Temperature layer is not rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
});
