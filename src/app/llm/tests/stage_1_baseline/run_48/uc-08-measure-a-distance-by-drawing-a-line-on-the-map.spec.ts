// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapLocator = page.locator('canvas.ol-map');
  await expect(mapLocator).toBeVisible();

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel
  // Using force: true as Chakra UI toggles can be tricky with pointer events
  const measurementToggle = page.getByRole('button', { name: 'Measurement', exact: true });
  await measurementToggle.click({ force: true });

  // 2. Click several points on the map canvas to draw a line
  // We need to click on the map canvas. We'll use approximate coordinates relative to the viewport
  // or get the bounding box. Let's get the bounding box for accuracy.
  const mapBox = await mapLocator.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Define points for a line. Start near the center, go right, then down-right.
  const startX = mapBox.x + mapBox.width * 0.3;
  const startY = mapBox.y + mapBox.height * 0.5;
  const endX = mapBox.x + mapBox.width * 0.7;
  const endY = mapBox.y + mapBox.height * 0.5;
  const finalX = mapBox.x + mapBox.width * 0.8;
  const finalY = mapBox.y + mapBox.height * 0.8;

  // Click first point
  await page.mouse.click(startX, startY);
  // Click second point
  await page.mouse.click(endX, endY);

  // 3. Double-click to finish the measurement
  await page.mouse.dblclick(finalX, finalY);

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.

  // Assert the measurement panel is visible
  // Assuming the panel has a test id or is identified by role/text.
  // Common pattern: a panel/dialog/aside with "Measurement" in title or role.
  // Let's try getting the panel by role 'region' or 'dialog' with name 'Measurement'
  // or by a test id if known. Since no test id is provided in prompt, we rely on accessible name.
  
  const measurementPanel = page.getByRole('region', { name: /Measurement/i }).first();
  // Fallback: if region doesn't work, try dialog or just look for text "Length" or similar in a container
  // Often measurement results are in a specific container. Let's look for the result text directly.
  
  // Wait for the measurement result to appear. It usually contains a number and a unit like "m" or "km".
  // Let's assert that the measurement panel is visible first.
  await expect(measurementPanel).toBeVisible({ timeout: 10000 });

  // Assert that the measurement panel displays a length value with a unit.
  // The text might look like "Length: 123.45 m" or just "123.45 m".
  // We look for a pattern of digits followed by a unit.
  const lengthValue = measurementPanel.locator('text=/\d+\.?\d*\s*(m|km|mi|ft)/i');
  await expect(lengthValue).toBeVisible({ timeout: 10000 });
});
