// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, getMapCenter } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is visible by default, but let's be explicit if needed)
  // The ui-map says info-panel is visibleByDefault: true, but toggledBy info-panel-toggle.
  // Usually "visibleByDefault" in this context means it's part of the layout, but might be collapsed.
  // However, the description says "The info panel is visible" as a precondition.
  // Let's assume it's already visible or ensure it is.
  // Looking at the ui-map, info-panel has toggledBy: info-panel-toggle.
  // If it's visibleByDefault: true, it might just mean it's rendered.
  // Let's click the map directly as per the steps.

  // Step 1: The user clicks on a position on the map canvas.
  // We need to click on the map container.
  // We should pick a position that is likely to be valid and not on an edge.
  // Let's get the map container locator.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to click in the center
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or not visible');
  }

  const clickX = box.x + box.width / 2;
  const clickY = box.y + box.height / 2;

  await mapContainer.click({ position: { x: box.width / 2, y: box.height / 2 } });

  // Step 2: The user waits for the info panel to load the forecast.
  // Expected results:
  // - The clicked position is highlighted on the map.
  // - The info panel displays a weather forecast section.
  // - The forecast contains 24 entries.

  // Wait for highlight to appear
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for weather forecast section to become visible
  const weatherForecastSection = page.getByTestId('weather-forecast-section');
  await expect(weatherForecastSection).toBeVisible();

  // Wait for the actual forecast data to appear
  const weatherForecast = page.getByTestId('weather-forecast');
  await expect(weatherForecast).toBeVisible();

  // Assert that the forecast contains 24 entries
  // The entries are dynamic with test-id weather-forecast-entry
  const entries = page.getByTestId('weather-forecast-entry');
  await expect(entries).toHaveCount(24);
});
