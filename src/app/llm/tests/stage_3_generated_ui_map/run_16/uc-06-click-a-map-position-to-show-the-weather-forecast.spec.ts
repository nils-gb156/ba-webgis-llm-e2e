// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the center of the map canvas
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 250, y: 250 } });

  // Wait for the info panel to load the forecast
  // The forecast section should appear
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Verify the clicked position is highlighted on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify the forecast contains 24 entries
  // The weather-forecast-entry elements represent the individual forecast items
  const forecastEntries = page.getByTestId(/weather-forecast-entry/);
  const entryCount = await forecastEntries.count();
  expect(entryCount).toBe(24);
});
