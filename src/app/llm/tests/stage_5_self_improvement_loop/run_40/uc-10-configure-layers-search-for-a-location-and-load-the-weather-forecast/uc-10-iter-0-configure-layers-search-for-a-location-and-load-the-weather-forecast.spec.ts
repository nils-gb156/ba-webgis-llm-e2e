// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // 2. Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 3. Wait for the layer state changes to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 4. Click the search field and type a place name
  const geocoderInput = page.getByRole('textbox', { name: 'Geocoder search' });
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 5. Wait for the result list to appear and select the first result
  await page.getByRole('option', { name: 'Münster' }).first().click();

  // 6. Wait for the map to navigate to the selected location (center should change)
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap?.olMap.getView().getCenter())).toBeTruthy();

  // 7. Wait for the info panel to load the forecast (24 entries)
  await expect.poll(() => page.getByRole('list', { name: 'Weather Forecast' }).locator('li').count()).toBe(24);
});
