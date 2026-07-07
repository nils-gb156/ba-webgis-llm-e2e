// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default, but we ensure it's not toggled off)
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  await expect(infoPanelToggle).toBeVisible();

  // Locate the map container to click on it
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Click on the map canvas to trigger the forecast request
  // We click near the center of the map container
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  await page.mouse.click(clickX, clickY);

  // Wait for the weather forecast section to appear in the info panel
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the actual forecast content to load
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Verify that the clicked position is highlighted on the map
  // We use expect.poll because the highlight might take a moment to render after the click
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify that the forecast contains 24 entries
  // The entries are dynamic elements with test-id 'weather-forecast-entry'
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
