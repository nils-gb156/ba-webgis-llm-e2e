// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready
  // Assuming the map canvas has a test id or we can locate it.
  // Since no specific test ids are provided in the prompt for the map container,
  // we will try to locate the canvas or a container around it.
  // Often, the map container might have a specific role or we can wait for a specific element.
  // Let's assume there is a map container with test id 'map-container' or similar.
  // If not, we might need to rely on the canvas element.
  // However, the prompt says "The map canvas is interactive" and "map canvas is identified via the context provided in the prompt".
  // Since no context is provided in the prompt text, I will assume a common test id for the map.
  // Let's try to find the map canvas.
  const mapCanvas = page.locator('canvas').first();
  await expect(mapCanvas).toBeVisible({ timeout: 10000 });

  // Get the bounding box of the map canvas to click in the middle
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click on the center of the map
  await page.mouse.click(centerX, centerY);

  // Wait for the info panel to load the forecast.
  // The info panel likely has a test id. Let's assume 'info-panel' or similar.
  // We need to wait for the forecast section to appear.
  // Let's assume the info panel has a test id 'info-panel' and the forecast section has 'weather-forecast'.
  // Or we can look for a specific element that indicates the forecast is loaded.
  // Let's assume there is a list of forecast entries.
  
  // Wait for the info panel to be visible
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible({ timeout: 10000 });

  // Wait for the weather forecast section to appear
  const forecastSection = page.getByTestId('weather-forecast');
  await expect(forecastSection).toBeVisible({ timeout: 10000 });

  // Wait for the forecast to contain 24 entries
  // Assume each entry has a test id 'forecast-entry'
  const forecastEntries = page.getByTestId('forecast-entry');
  await expect(forecastEntries).toHaveCount(24, { timeout: 10000 });

  // Verify the clicked position is highlighted on the map
  // This is hard to assert directly on a canvas without helper functions.
  // However, the prompt says "The clicked position is highlighted on the map".
  // Without helper functions, we can't easily assert this.
  // We will assume that the presence of the forecast in the info panel implies the click was successful.
  // If there is a marker test id, we could check that.
  // Let's assume there is a 'map-marker' test id for the highlighted position.
  const mapMarker = page.getByTestId('map-marker');
  await expect(mapMarker).toBeVisible({ timeout: 10000 });
});
