// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Expected result: The measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2 & 3: Click several points on the map canvas to draw a line, then double-click to finish.
  // The map container is typically the canvas element or a div containing it.
  // We need to find the map container to click on it.
  const mapContainer = page.locator('canvas').first();
  
  // Get the bounding box of the map to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found');
  }

  // Define points to draw a line (e.g., a simple zig-zag or just a few points)
  // Center of the map
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  
  // Point 1: slightly left and up
  const point1X = centerX - 50;
  const point1Y = centerY - 50;
  
  // Point 2: slightly right and down
  const point2X = centerX + 50;
  const point2Y = centerY + 50;

  // Point 3: slightly left and down
  const point3X = centerX - 50;
  const point3Y = centerY + 50;

  // Click first point
  await page.mouse.click(point1X, point1Y);
  
  // Click second point
  await page.mouse.click(point2X, point2Y);

  // Click third point
  await page.mouse.click(point3X, point3Y);

  // Double-click to finish measurement
  await page.mouse.dblclick(centerX, centerY);

  // Expected result: The measurement panel displays a length value with a unit.
  // We poll for the length text to appear in the measurement panel.
  await expect.poll(async () => {
    const panel = page.getByTestId('measurement-panel');
    const lengthText = await panel.locator('[data-testid="measurement-length"]').textContent();
    return lengthText;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/i);
});
