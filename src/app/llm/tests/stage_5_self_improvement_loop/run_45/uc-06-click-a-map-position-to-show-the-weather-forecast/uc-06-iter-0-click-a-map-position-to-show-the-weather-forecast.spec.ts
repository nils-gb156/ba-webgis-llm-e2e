// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure the Temperature layer is rendered before clicking
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Click on a clear area on the map (center-right, away from dense station clusters)
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 800, y: 300 } });

  // Wait for the highlight to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast to load
  const weatherSection = page.getByTestId('weather-forecast-section');
  await expect(weatherSection).toBeVisible();

  // Verify that the forecast contains 24 entries
  const forecastEntries = weatherSection.locator('li');
  await expect(forecastEntries).toHaveCount(24);
});
