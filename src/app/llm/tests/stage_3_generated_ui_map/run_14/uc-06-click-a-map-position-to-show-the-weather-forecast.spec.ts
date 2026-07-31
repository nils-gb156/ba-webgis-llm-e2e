// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Click on the map to trigger GetFeatureInfo / weather forecast
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });

  // Wait for the info panel to load the forecast
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert: The clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Assert: The info panel displays a weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert: The forecast contains 24 entries
  const forecastEntries = page.getByTestId(/weather-forecast-entry-\d+/);
  await expect.poll(() => forecastEntries.count()).toBe(24);
});
