// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Hide the Temperature overlay layer.
  // The layer switcher is open. The Temperature checkbox is checked.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });

  // Verify Temperature is no longer rendered on the map.
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // Step 2: Show the Precipitation overlay layer.
  // The Precipitation checkbox is unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify Precipitation is now rendered on the map.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for a place using the geocoder.
  await page.getByRole('textbox', { name: 'Geocoder search' }).fill('Münster');

  // Step 4: Wait for the result list to appear and select the first result.
  // The geocoder panel appears with search results.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result (e.g., "Münster, Germany").
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for the map to navigate to the selected location.
  // Verify by checking that a highlight marker appears on the map.
  await expect.poll(() => page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return false;
    const layers = map.olMap.getLayers().getArray();
    const highlightLayer = layers.find(
      (l: any) => l.getClassName?.() === "highlight-layer"
    );
    const features = highlightLayer?.getSource?.()?.getFeatures?.() ?? [];
    return features.length > 0;
  })).toBe(true);

  // Step 6: Wait for the info panel to load the forecast.
  // The info panel should now display the weather forecast section.
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Verify that the forecast contains 24 entries.
  // The forecast entries are rendered with data-testid="weather-forecast-entry"
  const forecastEntryCount = await weatherForecastSection.locator('[data-testid="weather-forecast-entry"]').count();
  expect(forecastEntryCount).toBe(24);
});
