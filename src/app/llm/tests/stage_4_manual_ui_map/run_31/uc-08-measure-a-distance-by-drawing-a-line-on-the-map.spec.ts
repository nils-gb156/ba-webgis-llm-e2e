// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool
  // The toggle button should not be pressed initially.
  // We click it to open the measurement panel.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map to draw a line
  // We need to click on the map container. The map is centered roughly in the middle of the viewport.
  // We'll pick a few distinct coordinates relative to the map container.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or not visible');
  }

  // Define points to click on the map (relative to the container)
  // Point 1: Center-ish
  const point1 = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
  // Point 2: Offset from point 1
  const point2 = { x: box.x + box.width * 0.6, y: box.y + box.height * 0.4 };
  // Point 3: Offset from point 2
  const point3 = { x: box.x + box.width * 0.7, y: box.y + box.height * 0.6 };

  // Click the first point
  await page.mouse.click(point1.x, point1.y);
  // Click the second point
  await page.mouse.click(point2.x, point2.y);
  // Click the third point
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement
  // Double-click at the last point or nearby to finish the line
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // The measurement panel is visible (already checked)
  // The measurement panel displays a length value with a unit.
  // We look for text inside the measurement panel that looks like a number followed by a unit (e.g., "1.23 km", "500 m")
  const measurementPanel = page.getByTestId('measurement-panel');
  
  // Use expect.poll to wait for the measurement result to appear and settle
  await expect.poll(async () => {
    const content = await measurementPanel.textContent();
    // Regex to match a number (int or float) followed by optional whitespace and a unit like km, m, mi, ft
    return /[\d.]+\s*(km|m|mi|ft)/i.test(content ?? '');
  }).toBe(true);
});
