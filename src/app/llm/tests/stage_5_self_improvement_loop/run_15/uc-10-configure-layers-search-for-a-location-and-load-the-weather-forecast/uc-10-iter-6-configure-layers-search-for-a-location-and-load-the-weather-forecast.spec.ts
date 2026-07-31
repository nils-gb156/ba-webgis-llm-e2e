// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({
  page,
}) => {
  await page.goto('/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Step 2: Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify layer toggle states and rendered state
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result
  // The results are rendered as list items inside the geocoder panel
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel.getByRole('listitem', { name: 'Münster, North Rhine-Westphalia, Germany' })).toBeVisible();
  await geocoderPanel.getByRole('listitem', { name: 'Münster, North Rhine-Westphalia, Germany' }).click();

  // Step 5: Wait for the map to navigate to the selected location
  const initialCenter = await getMapCenter(page);
  await expect.poll(() => getMapCenter(page)).not.toEqual(initialCenter);

  // Step 6: Wait for the info panel to load the forecast
  // The forecast section should have 24 entries (list items)
  await expect.poll(() =>
    page.getByTestId('weather-forecast-section').locator('li').count(),
  ).toBe(24);
});
