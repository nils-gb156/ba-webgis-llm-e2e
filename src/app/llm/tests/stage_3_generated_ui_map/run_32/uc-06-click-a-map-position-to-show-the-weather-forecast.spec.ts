// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for map to be ready and initial layers to render
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => getHighlightedCoordinate(page)).toBe(undefined);
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Click a position on the map canvas to trigger the weather forecast
  // Using center of the viewport as a safe position
  const mapContainer = page.getByTestId('map-container');
  const box = await mapContainer.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the highlighted coordinate to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Wait for the info panel to load the weather forecast section
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Verify the forecast contains 24 entries
  const forecastEntries = page.getByTestId(/weather-forecast-entry-\d+/);
  await expect(forecastEntries).toHaveCount(24);
});
