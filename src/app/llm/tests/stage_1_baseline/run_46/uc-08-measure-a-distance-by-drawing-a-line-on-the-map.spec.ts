// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to load and map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // Assuming the measurement button has a test id or accessible name.
  // If not, we might need to use a role-based locator.
  // Let's assume a test id for the measurement tool button for stability.
  const measurementButton = page.getByTestId('measurement-tool-button');
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to be visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // The map canvas is an HTML <canvas> element.
  // We need to find the map container to click on it.
  const mapContainer = page.locator('canvas').first(); // Assuming the first canvas is the map
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map canvas to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas bounding box not found');
  }

  // Define points to click to draw a line
  // Point 1: Center of the map
  const point1 = { x: mapBox.x + mapBox.width / 2, y: mapBox.y + mapBox.height / 2 };
  // Point 2: Slightly to the right and down
  const point2 = { x: mapBox.x + mapBox.width * 0.7, y: mapBox.y + mapBox.height * 0.7 };
  // Point 3: Further right and down
  const point3 = { x: mapBox.x + mapBox.width * 0.9, y: mapBox.y + mapBox.height * 0.9 };

  // Click the first point
  await page.mouse.click(point1.x, point1.y);

  // Click the second point
  await page.mouse.click(point2.x, point2.y);

  // Click the third point
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement.
  // Double-click at the last point to finish the line
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // The measurement panel is visible.
  await expect(measurementPanel).toBeVisible();

  // The measurement panel displays a length value with a unit.
  // Assuming the result is displayed in an element with a specific test id or text pattern.
  // Let's look for text that looks like a measurement result (e.g., "123.45 m")
  const measurementResultText = page.getByTestId('measurement-result-text');
  
  // Use expect.poll to wait for the result to appear and match the pattern
  await expect.poll(async () => {
    const text = await measurementResultText.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|ft|mi)/i);
});
