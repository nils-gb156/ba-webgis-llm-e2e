// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the canvas
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Wait for the measurement panel to become visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to get the bounding box of the canvas to click relative positions
  const box = await mapCanvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas not found or has no bounding box');
  }

  // Click first point (center of the map)
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  await page.mouse.click(centerX, centerY);

  // Click second point (offset from center)
  await page.mouse.click(centerX + 100, centerY + 100);

  // Click third point (further offset)
  await page.mouse.click(centerX + 200, centerY + 50);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(centerX + 200, centerY + 50);

  // Expected result: The measurement panel displays a length value with a unit
  // We poll for the length value to appear, as it might take a moment to calculate and render
  await expect.poll(async () => {
    // Try to find text that looks like a measurement (e.g., "123.45 m", "1.2 km")
    // Since we don't have a specific test id for the result, we look for common units
    const bodyText = await page.locator('body').innerText();
    // Regex to match a number followed by a unit like m, km, ft, mi
    const measurementRegex = /\d+(\.\d+)?\s*(m|km|ft|mi|cm|mm)/i;
    return measurementRegex.test(bodyText);
  }).toBeTruthy();
});
