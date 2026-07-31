// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is by default, but let's ensure it's open)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the weather forecast for that location.
  // We click near the center of the map container.
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found');
  }
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  await page.mouse.click(centerX, centerY);

  // Wait for the info panel to load the forecast content.
  // The forecast section should become visible.
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Assert that the clicked position is highlighted on the map.
  // We use expect.poll because the highlight is rendered on the canvas, not DOM.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Assert that the forecast contains 24 entries.
  // We count the weather-forecast-entry elements.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
