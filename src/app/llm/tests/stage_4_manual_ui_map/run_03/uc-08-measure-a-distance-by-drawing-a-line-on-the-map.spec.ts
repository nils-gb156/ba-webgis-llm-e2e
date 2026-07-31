// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the measurement button to open the measurement panel
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map container. We'll use approximate positions within the map area.
  // Assuming the map takes up most of the viewport, let's pick some coordinates.
  // We'll click 3 points to form a simple line/shape.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define some relative points within the map container
  // Point 1: Top-leftish
  const point1 = { x: mapBox.x + 100, y: mapBox.y + 100 };
  // Point 2: Middle-right
  const point2 = { x: mapBox.x + mapBox.width / 2, y: mapBox.y + mapBox.height / 2 };
  // Point 3: Bottom-leftish
  const point3 = { x: mapBox.x + 100, y: mapBox.y + mapBox.height - 100 };

  // Click point 1
  await page.mouse.click(point1.x, point1.y);
  // Click point 2
  await page.mouse.click(point2.x, point2.y);
  // Click point 3
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // The measurement panel should still be visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Wait for the measurement result to appear in the measurement panel
  // The measurement result is inside the 'measurement' element within the 'measurement-panel'
  const measurementResult = page.getByTestId('measurement').locator('text=/\\d+\\.?\\d*\\s*(km|m|cm|mm|mi|ft|in)/');
  
  // Use poll to wait for the measurement result to appear
  await expect.poll(async () => {
    const isVisible = await measurementResult.isVisible();
    return isVisible;
  }).toBeTruthy();

  // Assert that the measurement result contains a number and a unit
  await expect(measurementResult).toBeVisible();
});
