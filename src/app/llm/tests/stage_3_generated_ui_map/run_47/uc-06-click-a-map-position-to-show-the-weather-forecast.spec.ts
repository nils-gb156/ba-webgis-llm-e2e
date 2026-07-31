// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default, but let's ensure state)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map to trigger GetFeatureInfo / forecast lookup
  // We click near the center of the map container
  const mapBox = await page.getByTestId('map-container').boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found');
  }
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;

  await page.getByTestId('map-container').click({ position: { x: clickX, y: clickY } });

  // Wait for the highlighted coordinate to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to become visible in the info panel
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the forecast entries to load
  // The expected result is 24 entries. We check for the presence of the forecast container
  // and poll for a reasonable number of entries to appear.
  const forecastEntries = page.getByTestId('weather-forecast-entry');
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBeGreaterThanOrEqual(24);
});
