// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  // Ensure the toggle is in the pressed state to open the panel.
  // If it's already pressed, clicking it would close the panel.
  const isMeasurementPanelVisible = page.getByTestId('measurement-panel').isVisible();
  if (!isMeasurementPanelVisible) {
    await measurementToggle.click();
  }

  // Wait for the measurement panel to become visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map container to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Calculate points within the map container
  // Point 1: Top-left quadrant
  const point1X = mapBox.x + mapBox.width * 0.25;
  const point1Y = mapBox.y + mapBox.height * 0.25;
  
  // Point 2: Top-right quadrant
  const point2X = mapBox.x + mapBox.width * 0.75;
  const point2Y = mapBox.y + mapBox.height * 0.25;
  
  // Point 3: Bottom-right quadrant
  const point3X = mapBox.x + mapBox.width * 0.75;
  const point3Y = mapBox.y + mapBox.height * 0.75;

  // Click the first point
  await mapContainer.click({ position: { x: point1X - mapBox.x, y: point1Y - mapBox.y } });
  
  // Click the second point
  await mapContainer.click({ position: { x: point2X - mapBox.x, y: point2Y - mapBox.y } });
  
  // Click the third point
  await mapContainer.click({ position: { x: point3X - mapBox.x, y: point3Y - mapBox.y } });

  // 3. Double-click to finish the measurement
  // Playwright's click with clickCount=2 performs a double click
  await mapContainer.click({ position: { x: point3X - mapBox.x, y: point3Y - mapBox.y }, clickCount: 2 });

  // Expected results:
  // - The measurement panel is visible (already asserted above)
  // - The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear in the measurement panel
  const measurementResult = page.getByTestId('measurement');
  
  // Poll for the measurement result to contain a number and a unit (e.g., "1.23 km" or "1234 m")
  await expect.poll(() => measurementResult.textContent()).toMatch(/\d+(\.\d+)?\s+(m|km|mi|ft)/);
});
