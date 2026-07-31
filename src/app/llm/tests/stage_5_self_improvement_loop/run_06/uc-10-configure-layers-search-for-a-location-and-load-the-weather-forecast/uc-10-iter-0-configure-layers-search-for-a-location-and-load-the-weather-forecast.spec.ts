// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // 1. Hide the Temperature overlay layer
  const temperatureCheckbox = page.getByRole('checkbox', { name: 'Temperature', exact: true });
  await expect(temperatureCheckbox).toBeChecked();
  await temperatureCheckbox.click({ force: true });

  // Verify Temperature is no longer rendered
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationCheckbox).not.toBeChecked();
  await precipitationCheckbox.click({ force: true });

  // Verify Precipitation is now rendered
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result
  // The geocoder panel usually appears near the input.
  const geocoderPanel = page.getByTestId('geocoder-panel');
  await expect(geocoderPanel).toBeVisible();

  // Select the first result (typically the most relevant match)
  const firstResult = geocoderPanel.getByRole('option').first();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location
  // We use the center of the map to verify navigation.
  const centerBefore = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return undefined;
    const center = map.olMap.getView().getCenter();
    return center ? [center[0], center[1]] : undefined;
  });

  // Wait for the center to change, indicating navigation
  await expect.poll(async () => {
    const center = await page.evaluate(() => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      if (!map) return undefined;
      const c = map.olMap.getView().getCenter();
      return c ? [c[0], c[1]] : undefined;
    });
    // Return true if center changed from the initial value
    return center !== undefined && (center[0] !== centerBefore?.[0] || center[1] !== centerBefore?.[1]);
  }).toBe(true);

  // 6. Wait for the info panel to load the forecast
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Expected result: The info panel displays a weather forecast section with 24 entries.
  // We assume each entry is a row or item in the section.
  const forecastEntries = weatherForecastSection.getByRole('row').or(weatherForecastSection.getByRole('listitem'));
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBeGreaterThanOrEqual(24);
});
