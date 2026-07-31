// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
  // Using force: true as Chakra UI icons often intercept pointer events
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click({ force: true });

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  // We need to click on the map canvas. We'll get the bounding box of the canvas.
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box not found');
  }

  // Define points for a line (relative to the canvas)
  // Point 1
  await page.mouse.click(box.x + 100, box.y + 100);
  // Point 2
  await page.mouse.click(box.x + 200, box.y + 200);
  // Point 3
  await page.mouse.click(box.x + 300, box.y + 300);

  // 3. Double-click to finish the measurement.
  await page.mouse.dblclick(box.x + 300, box.y + 300);

  // Expected results:
  // - The measurement panel is visible. (Already asserted above, but ensure it remains visible)
  await expect(measurementPanel).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // We look for text that matches a number followed by a unit like "m", "km", "ft", etc.
  const lengthValueLocator = measurementPanel.getByText(/(\d+(\.\d+)?\s*(m|km|ft|mi|miles|feet))/);
  await expect(lengthValueLocator).toBeVisible();
});
