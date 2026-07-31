// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to be fully loaded and interactive
  await page.waitForLoadState('networkidle');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  // Assuming a test-id for the measurement tool button based on common patterns.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to locate the map canvas. Assuming a test-id for the map container.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to click within it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found');
  }

  // Define points to draw a line. We'll pick three points within the map area.
  // Point 1: Start point (e.g., 10% from left, 10% from top)
  const point1 = {
    x: mapBox.x + mapBox.width * 0.1,
    y: mapBox.y + mapBox.height * 0.1
  };

  // Point 2: Middle point (e.g., 50% from left, 50% from top)
  const point2 = {
    x: mapBox.x + mapBox.width * 0.5,
    y: mapBox.y + mapBox.height * 0.5
  };

  // Point 3: End point (e.g., 90% from left, 90% from top)
  const point3 = {
    x: mapBox.x + mapBox.width * 0.9,
    y: mapBox.y + mapBox.height * 0.9
  };

  // Click the first point
  await page.mouse.click(point1.x, point1.y);
  
  // Click the second point
  await page.mouse.click(point2.x, point2.y);
  
  // Click the third point
  await page.mouse.click(point3.x, point3.y);

  // Step 3: The user double-clicks to finish the measurement.
  // Double-click at the last point or slightly offset to ensure it's registered as a double click on the map.
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // - The measurement panel is visible.
  // Assuming a test-id for the measurement panel.
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // Assuming the panel contains text with the measurement result, e.g., "1.5 km" or "234 m".
  // We'll look for text that matches a number followed by a unit.
  const measurementResultText = page.getByTestId('measurement-result');
  await expect(measurementResultText).toBeVisible();
  
  // Check if the text contains a number and a unit (m, km, mi, ft, etc.)
  // Using a regex to match a number (integer or decimal) followed by a unit.
  const measurementText = await measurementResultText.textContent();
  expect(measurementText).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft|in|cm|mm)/i);
});
