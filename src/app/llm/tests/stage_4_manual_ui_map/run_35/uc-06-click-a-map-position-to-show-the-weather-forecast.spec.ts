// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is visible by default, but let's ensure it's toggled on)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Click on the map to trigger GetFeatureInfo for weather forecast
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the weather forecast section to appear
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the weather forecast to load and contain entries
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Wait for the highlighted coordinate to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the forecast to contain 24 entries
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
