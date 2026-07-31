// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  // We need to click on the map container. The map is rendered on a canvas inside #map-container.
  // We will click distinct points to simulate drawing a line.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define points for drawing a line (relative to the map container)
  // Point 1: Center-ish
  const point1 = { x: mapBox.x + mapBox.width / 2, y: mapBox.y + mapBox.height / 2 };
  // Point 2: Top-Right
  const point2 = { x: mapBox.x + mapBox.width * 0.7, y: mapBox.y + mapBox.height * 0.3 };
  // Point 3: Bottom-Left
  const point3 = { x: mapBox.x + mapBox.width * 0.3, y: mapBox.y + mapBox.height * 0.7 };

  // Click point 1
  await page.mouse.click(point1.x, point1.y);
  
  // Click point 2
  await page.mouse.click(point2.x, point2.y);
  
  // Click point 3
  await page.mouse.click(point3.x, point3.y);

  // 3. Double-click to finish the measurement.
  await page.mouse.dblclick(point3.x, point3.y);

  // Wait for the measurement result to appear. The measurement panel should contain the length value.
  // The measurement panel is visibleByDefault: false, but toggled by the button.
  // The measurement result is inside the measurement panel.
  
  // Check if the measurement panel is still visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Check if a measurement result (length value with unit) is displayed.
  // The exact structure of the result isn't specified in the UI map, but it should be inside the measurement panel.
  // We'll look for text that looks like a measurement result (e.g., "1.23 km" or similar).
  // Since we don't have a specific test id for the result, we'll check for common units or patterns.
  // However, the UI map says: "measurement-panel" -> "measurement" (visibleByDefault: false).
  // Let's assume the result appears inside the "measurement" element.
  
  const measurementResult = page.getByTestId('measurement');
  
  // Wait for the measurement result to appear. It might take a moment to calculate and display.
  await expect.poll(async () => {
    const text = await measurementResult.textContent();
    // Check if the text contains a number and a unit (km, m, etc.)
    return text && /\d+(\.\d+)?\s*(km|m|mi|ft)/i.test(text);
  }).toBeTruthy();

  // Verify that the measurement panel displays a length value with a unit.
  const measurementText = await measurementResult.textContent();
  expect(measurementText).toMatch(/\d+(\.\d+)?\s*(km|m|mi|ft)/i);
});
