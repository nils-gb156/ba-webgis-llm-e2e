// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Hide the Temperature overlay layer.
  // Chakra UI checkbox control intercepts pointer events on the visual wrapper;
  // use force: true on the role locator and assert separately.
  await page.getByRole('checkbox', { name: 'Temperature' }).click({ force: true });
  await expect(page.getByRole('checkbox', { name: 'Temperature' })).not.toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);

  // 2. Show the Precipitation overlay layer.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 3. Search for a location using the geocoder.
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // 4. Wait for the result list to appear and select the first result.
  // The results are rendered as list items within the geocoder panel, each with a data-testid.
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // 5. Wait for the map to navigate to the selected location.
  // Münster is roughly at 7.62°E, 51.96°N, which is approx (848832, 6793350) in EPSG:3857.
  // Use a generous tolerance to account for minor variations in geocoder resolution.
  await expect.poll(() => getMapCenter(page)).toMatchObject([
    expect.closeTo(848832, 50000),
    expect.closeTo(6793350, 50000),
  ]);

  // 6. Wait for the info panel to load the forecast.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the forecast entries to appear (at least 24 entries).
  await expect.poll(async () => {
    const entries = await weatherForecastSection.locator('li').count();
    return entries;
  }).toBeGreaterThanOrEqual(24);
});
