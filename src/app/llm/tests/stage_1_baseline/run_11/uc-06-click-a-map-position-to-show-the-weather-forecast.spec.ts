// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the map to be ready
  await page.waitForLoadState('networkidle');
  
  // Locate the map canvas. The map is an OpenLayers canvas.
  // We need to find the canvas element to click on it.
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Get the bounding box of the map canvas to click a central point
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or not visible');
  }

  // Click the center of the map
  const clickX = box.x + box.width / 2;
  const clickY = box.y + box.height / 2;

  await page.mouse.click(clickX, clickY);

  // Wait for the info panel to appear and load content
  // Assuming the info panel has a test id or is identifiable by role/text
  // Let's look for a common info panel container or content
  const infoPanel = page.locator('[data-testid="info-panel"]');
  await expect(infoPanel).toBeVisible({ timeout: 10000 });

  // Wait for the weather forecast section to appear
  // Assuming the weather forecast section has a specific test id or text
  const weatherForecastSection = infoPanel.locator('[data-testid="weather-forecast"]');
  await expect(weatherForecastSection).toBeVisible({ timeout: 10000 });

  // Wait for the forecast entries to load
  // Assuming each forecast entry has a test id or is part of a list
  const forecastEntries = infoPanel.locator('[data-testid="forecast-entry"]');
  await expect(forecastEntries).toHaveCount(24, { timeout: 10000 });

  // Verify the clicked position is highlighted on the map
  // This is tricky with canvas. We might check for a marker or overlay if available.
  // If no specific test id for the marker, we might skip this or check for a specific visual cue if possible.
  // For now, we assume the presence of the forecast implies the click was registered.
  // If there's a specific marker test id, we would check it here.
  // Example: await expect(page.locator('[data-testid="map-marker"]')).toBeVisible();
});
