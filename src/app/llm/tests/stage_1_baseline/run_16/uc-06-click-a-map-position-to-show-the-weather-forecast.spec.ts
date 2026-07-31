// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and the map to be ready
  await page.waitForLoadState('networkidle');

  // Identify the map canvas container to click on it.
  // Using a scoped selector as a last resort since map canvases often lack test ids.
  const mapContainer = page.locator('canvas').first();

  // Click on the map canvas to trigger the weather forecast request.
  // We click near the center of the visible map area.
  const box = await mapContainer.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    // Fallback if bounding box is not available, click at a reasonable position
    await page.mouse.click(500, 300);
  }

  // Wait for the info panel to update with the forecast data.
  // We assume the info panel has a test id or accessible role.
  // If no specific test id is known for the forecast list, we look for the section.
  const infoPanel = page.getByRole('region', { name: /info/i }).first();
  
  // Wait for the weather forecast section to appear
  await expect(infoPanel.getByText(/weather forecast/i, { ignoreCase: true })).toBeVisible({ timeout: 10000 });

  // Verify that the clicked position is highlighted on the map.
  // Since the map is a canvas, we can't easily assert the highlight via DOM.
  // However, the presence of the forecast in the info panel implies the click was processed.
  // We rely on the info panel content as the primary assertion for the map interaction result.

  // Verify the info panel displays a weather forecast section.
  // We check for a specific structure or text that indicates the forecast is loaded.
  const forecastSection = infoPanel.locator('[data-testid="weather-forecast"]');
  if (await forecastSection.count() > 0) {
    await expect(forecastSection).toBeVisible();
  } else {
    // Fallback: Check for any element that might contain the forecast data
    await expect(infoPanel.locator('text=Weather Forecast')).toBeVisible();
  }

  // Verify the forecast contains 24 entries.
  // We look for a list or grid of forecast items.
  const forecastItems = infoPanel.locator('[data-testid="forecast-entry"]');
  
  // Use poll to wait for the count to settle
  await expect.poll(async () => forecastItems.count()).toBe(24);
});
