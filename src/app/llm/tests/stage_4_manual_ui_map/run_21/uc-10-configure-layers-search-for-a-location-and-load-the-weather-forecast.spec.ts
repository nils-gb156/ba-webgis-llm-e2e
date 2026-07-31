// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getMapCenter, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 10: Configure layers, search for a location and load the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready before interacting
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Hide Temperature layer
  const temperatureToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Temperature' });
  await temperatureToggle.click({ force: true });

  // Step 2: Show Precipitation layer
  const precipitationToggle = page.getByTestId('layer-switcher').getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });

  // Verify layer states
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(false);
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Search for 'Münster'
  const geocoderInput = page.getByTestId('geocoder-input');
  await geocoderInput.click();
  await geocoderInput.fill('Münster');

  // Step 4: Wait for results and select the first one
  const firstResult = page.getByTestId('geocoder-result-item-0');
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Step 5: Wait for map to navigate to the searched location
  // The map should zoom in and center on the result.
  // We check that the center has changed from the initial view or that a highlight appears.
  // Since we don't know the exact initial center, we wait for the highlight coordinate to be set
  // or for the map center to stabilize at a new position (zoomed in).
  // A zoom level > initial (usually 2-3 for world view) indicates navigation.
  await expect.poll(() => getMapZoomLevel(page)).toBeGreaterThan(5);
  
  // Also verify a highlight marker is present at the location
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Step 6: Wait for the info panel to load the forecast
  // The forecast section should become visible and contain entries
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Verify 24 entries are present
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
