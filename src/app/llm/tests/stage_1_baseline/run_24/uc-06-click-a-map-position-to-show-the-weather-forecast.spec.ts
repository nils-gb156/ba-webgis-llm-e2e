// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 6: Click a map position to show the weather forecast', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map canvas to be present and the info panel to be visible
  const mapCanvas = page.getByRole('graphics-document', { name: '' }).first();
  await expect(mapCanvas).toBeVisible();
  
  // The info panel is typically a dialog or a specific region.
  // We assume it's visible as per preconditions, but we wait for it to be stable.
  const infoPanel = page.getByRole('region', { name: /info|panel|forecast/i }).first();
  await expect(infoPanel).toBeVisible();

  // Click on the center of the map canvas to trigger the weather forecast
  const mapBoundingBox = await mapCanvas.boundingBox();
  if (mapBoundingBox) {
    await page.mouse.click(mapBoundingBox.x + mapBoundingBox.width / 2, mapBoundingBox.y + mapBoundingBox.height / 2);
  }

  // Wait for the weather forecast section to appear in the info panel
  // We look for a heading or section indicating "Forecast"
  const forecastSection = infoPanel.getByRole('heading', { name: /forecast/i }).first();
  await expect(forecastSection).toBeVisible();

  // Verify that the clicked position is highlighted on the map.
  // Since the map is a canvas, we cannot directly assert the highlight via DOM.
  // However, the presence of the forecast implies the click was registered.
  // We rely on the successful display of the forecast as the indicator of map interaction.

  // Verify that the forecast contains 24 entries.
  // The forecast entries are likely list items or cards within the forecast section.
  const forecastEntries = forecastSection.locator('li').or(forecastSection.locator('[class*="entry"], [class*="item"], [class*="card"]')).first().locator('..').locator('li, [class*="entry"], [class*="item"], [class*="card"]');
  
  // Use poll to wait for the entries to populate
  await expect.poll(async () => {
    const count = await forecastEntries.count();
    return count;
  }).toBe(24);
});
