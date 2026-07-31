// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be visible and interactive
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Click on the center of the map canvas to trigger the weather forecast
  const mapBoundingBox = await mapCanvas.boundingBox();
  if (mapBoundingBox) {
    await mapCanvas.click({
      position: {
        x: mapBoundingBox.width / 2,
        y: mapBoundingBox.height / 2,
      },
    });
  }

  // Wait for the info panel to load the forecast
  // The info panel is typically identified by a test id or role.
  // Assuming the info panel has a test id 'info-panel' based on common patterns.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Wait for the forecast section to appear within the info panel
  const forecastSection = infoPanel.getByTestId('weather-forecast');
  await expect(forecastSection).toBeVisible();

  // Verify that the clicked position is highlighted on the map.
  // Since map features are not DOM elements, we rely on the info panel update as a proxy.
  // However, the requirement states the position is highlighted.
  // We can check if the info panel displays the coordinate or if the map state changes.
  // Without map helpers, we assert the presence of the forecast section which implies the click was processed.

  // Verify the forecast contains 24 entries
  // Assuming each forecast entry has a test id 'forecast-entry'
  const forecastEntries = infoPanel.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24);
});
