// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready by checking for the canvas element
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Click the 'Measurement' button in the toolbar to open the measurement panel
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click();

  // Wait for the measurement panel to be visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Click several points on the map canvas to draw a line
  // We need to get the bounding box of the map canvas to click on it
  const boundingBox = await mapCanvas.boundingBox();
  if (!boundingBox) {
    throw new Error('Map canvas bounding box not found');
  }

  const centerX = boundingBox.x + boundingBox.width / 2;
  const centerY = boundingBox.y + boundingBox.height / 2;

  // Click first point
  await page.mouse.click(centerX, centerY);
  // Small delay to ensure the click is registered
  await page.waitForTimeout(100);

  // Click second point
  await page.mouse.click(centerX + 50, centerY + 50);
  await page.waitForTimeout(100);

  // Click third point
  await page.mouse.click(centerX - 50, centerY + 50);
  await page.waitForTimeout(100);

  // Double-click to finish the measurement
  await page.mouse.dblclick(centerX - 50, centerY + 50);

  // Wait for the measurement result to be displayed
  // The measurement panel should display a length value with a unit
  // We'll check for any text that looks like a measurement result in the panel
  const measurementResult = measurementPanel.locator('text=/\\d+\\.?\\d*\\s*(m|km|ft|mi)/i');
  await expect(measurementResult).toBeVisible();
});
