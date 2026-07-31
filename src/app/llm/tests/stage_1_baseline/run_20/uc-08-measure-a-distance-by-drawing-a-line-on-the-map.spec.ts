// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Get the bounding box of the map canvas to click within it
  const mapBoundingBox = await mapCanvas.boundingBox();
  if (!mapBoundingBox) {
    throw new Error('Map canvas bounding box not found');
  }

  const mapCenterX = mapBoundingBox.x + mapBoundingBox.width / 2;
  const mapCenterY = mapBoundingBox.y + mapBoundingBox.height / 2;

  // Step 2: Click several points on the map canvas to draw a line.
  // Click the first point (center)
  await page.mouse.click(mapCenterX, mapCenterY);
  // Click the second point (offset to create a line)
  await page.mouse.click(mapCenterX + 100, mapCenterY + 100);
  // Click the third point (further offset)
  await page.mouse.click(mapCenterX + 200, mapCenterY + 50);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(mapCenterX + 200, mapCenterY + 50);

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // Wait for the measurement result to appear in the panel.
  // Assuming the result is displayed in a specific element within the panel.
  const measurementResult = measurementPanel.getByTestId('measurement-result');
  await expect(measurementResult).toBeVisible();

  // Verify that the measurement result contains a length value with a unit (e.g., "123.45 m")
  const resultText = await measurementResult.textContent();
  expect(resultText).toMatch(/\d+\.?\d*\s*(m|km|ft|mi)/i);
});
