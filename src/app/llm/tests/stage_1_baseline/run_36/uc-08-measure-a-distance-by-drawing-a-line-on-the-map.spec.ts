// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement', exact: true });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Get map canvas coordinates for drawing a line
  // We'll draw a line from the center of the viewport to a point slightly to the right and down
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box not found');
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const endX = box.x + box.width * 0.75;
  const endY = box.y + box.height * 0.75;

  // Step 2: Click several points on the map canvas to draw a line.
  // Click the first point (start)
  await page.mouse.click(startX, startY);
  
  // Click a second point to form a segment
  const midX = box.x + box.width * 0.6;
  const midY = box.y + box.height * 0.6;
  await page.mouse.click(midX, midY);

  // Step 3: Double-click to finish the measurement.
  // Double-click at the final point
  await page.mouse.dblClick(endX, endY);

  // Expected results: The measurement panel displays a length value with a unit.
  // The panel should contain text that looks like a measurement result (e.g., "123.45 m")
  const measurementResultText = measurementPanel.getByText(/^[0-9,.]+\s*[a-zA-Z]+$/);
  await expect(measurementResultText).toBeVisible();
});
