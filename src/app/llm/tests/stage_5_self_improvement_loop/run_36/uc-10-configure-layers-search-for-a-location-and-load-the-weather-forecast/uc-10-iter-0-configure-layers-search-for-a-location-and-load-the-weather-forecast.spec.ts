// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer.
  // The accessibility tree shows "checkbox Temperature [checked]", so it is currently visible.
  // We click it to toggle it off.
  await page.getByRole('checkbox', { name: 'Temperature' }).click();
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer.
  // The accessibility tree shows "checkbox Precipitation" (unchecked).
  await page.getByRole('checkbox', { name: 'Precipitation' }).click();
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result.
  // The geocoder panel appears; we wait for it and then click the first item.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();
  // The first result is typically the most relevant match.
  await geocoderPanel.getByRole('option', { name: 'Münster' }).first().click();

  // 5. Wait for the map to navigate to the selected location.
  // The map zooms/panning is an asynchronous effect. We assert that the center has changed
  // from the initial extent (which is roughly central Europe) to Münster's approximate coordinates.
  // Münster is roughly at 7.62°E, 51.96°N, which is approx (848500, 6530000) in EPSG:3857.
  await expect.poll(() => page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return undefined;
    const center = map.olMap.getView().getCenter();
    return center && center.length >= 2 ? [center[0], center[1]] : undefined;
  }), {
    message: 'Map did not navigate to the searched location.'
  }).toMatchObject([expect.closeTo(848500, 50000), expect.closeTo(6530000, 50000)]);

  // 6. Wait for the info panel to load the forecast.
  // The expected result is that the info panel displays a weather forecast section with 24 entries.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();
  
  // The weather forecast section should be visible and contain entries.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();
  
  // Wait for the forecast entries to appear. We expect at least 24 entries (one for each hour).
  // The entries are likely list items or similar elements within the forecast section.
  // We'll poll for the count of forecast entries to be at least 24.
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('li').count();
    return entries;
  }).toBeGreaterThanOrEqual(24);
});
