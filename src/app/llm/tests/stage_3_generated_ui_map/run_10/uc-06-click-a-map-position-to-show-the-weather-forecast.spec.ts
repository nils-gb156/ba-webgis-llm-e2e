// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it is visible by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map canvas to trigger the forecast for that position
  // We click near the center of the map container
  const mapBox = await page.getByTestId('map-container').boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found');
  }
  const clickX = mapBox.x + mapBox.width / 2;
  const clickY = mapBox.y + mapBox.height / 2;
  await page.getByTestId('map-container').click({ position: { x: clickX, y: clickY } });

  // Wait for the highlight to appear on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Wait for the weather forecast section to appear in the info panel
  await expect(page.getByTestId('weather-forecast-section')).toBeVisible();

  // Wait for the forecast entries to load (expecting 24 entries)
  await expect.poll(() => page.getByTestId('weather-forecast-entry').count()).toBe(24);
});
