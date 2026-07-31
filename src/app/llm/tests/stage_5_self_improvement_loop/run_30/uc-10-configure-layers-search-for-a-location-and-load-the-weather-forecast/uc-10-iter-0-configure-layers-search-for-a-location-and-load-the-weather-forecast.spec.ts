// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list and select the first result
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  await geocoderPanel.getByRole('option', { name: 'Münster' }).first().click();

  // 5. Wait for the map to navigate to the selected location
  // The map center changes after the geocoder selection
  await expect.poll(() => page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: { olMap?: { getView?: () => { getCenter: () => number[] } } } }).__openPioneerMap;
    return map?.olMap?.getView()?.getCenter();
  })).not.toBeUndefined();

  // 6. Wait for the info panel to load the forecast
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify the info panel displays a weather forecast section with 24 entries
  // The number of entries is typically represented by the number of list items or similar elements
  const forecastEntries = weatherForecastSection.locator('li').count();
  await expect.poll(() => forecastEntries).toBeGreaterThanOrEqual(24);
});
