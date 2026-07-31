// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is by default, but let's ensure the toggle isn't hiding it)
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  
  // Check if info panel is currently visible. If not, toggle it on.
  // The prompt says it's visibleByDefault: true, but let's be safe.
  const isInfoPanelVisible = await infoPanel.isVisible();
  if (!isInfoPanelVisible) {
    await infoPanelToggle.click();
  }

  // Click on the map canvas. We need a position that is likely to trigger a feature info or at least a click event.
  // Using the center of the map container seems reasonable.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    throw new Error('Map container not found');
  }

  // Click near the center of the map
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  await page.mouse.click(clickX, clickY);

  // Wait for the highlight to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to become visible
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the weather forecast to load
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Wait for the forecast entries to appear and count them
  // The prompt expects 24 entries.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBe(24);
});
