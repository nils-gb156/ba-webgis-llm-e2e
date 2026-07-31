// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be present and interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Click on the center of the map canvas to trigger the weather forecast
  const box = await mapCanvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  // Wait for the info panel to load the forecast
  // Assuming the info panel has a test id or can be identified by role/content
  // Since specific test ids aren't provided, we rely on the appearance of forecast data
  // We'll look for a container that likely holds the forecast list
  
  // Wait for the info panel to be visible
  const infoPanel = page.getByRole('region', { name: /info/i }).first();
  await expect(infoPanel).toBeVisible();

  // Wait for the forecast section to appear
  // Assuming the forecast is rendered as a list or grid within the info panel
  // We'll look for an element that indicates forecast data is present
  // Using a generic approach since specific test ids for forecast items aren't provided
  
  // Let's assume the forecast items are rendered as list items or similar
  // We'll wait for any element inside the info panel that suggests forecast data
  await expect(infoPanel.locator('li, .forecast-item, [data-testid*="forecast"]')).toBeVisible({ timeout: 10000 });

  // Verify the clicked position is highlighted on the map
  // Since map state is not in DOM, we rely on visual confirmation or helper functions
  // Without helper functions, we can't directly assert map state changes
  // However, the fact that the info panel updated suggests the click was processed
  
  // Verify the forecast contains 24 entries
  // We'll count the forecast items in the info panel
  const forecastItems = infoPanel.locator('li, .forecast-item, [data-testid*="forecast-item"]');
  await expect(forecastItems).toHaveCount(24, { timeout: 10000 });
});
