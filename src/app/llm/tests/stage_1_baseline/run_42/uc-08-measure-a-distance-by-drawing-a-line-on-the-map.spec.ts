// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive before proceeding
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // We use force: true as toolbar buttons might be Chakra UI controlled elements.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await measurementButton.click({ force: true });

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Get the map canvas element for interaction
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Get the bounding box of the map canvas to calculate click positions
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box not found');
  }

  // Calculate center point and a point offset to draw a line
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const offsetX = 100;
  const offsetY = 100;

  // Step 2: Click several points on the map canvas to draw a line.
  // Click first point
  await page.mouse.click(centerX, centerY);
  // Click second point
  await page.mouse.click(centerX + offsetX, centerY + offsetY);
  // Click third point to make it a polyline
  await page.mouse.click(centerX + offsetX * 2, centerY);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(centerX + offsetX * 2, centerY);

  // Expected results: The measurement panel displays a length value with a unit.
  // We poll for the length value to appear in the panel.
  const lengthValueLocator = measurementPanel.locator('.measurement-result-length');
  
  // Try to find the length value. It might be inside a specific element or just text in the panel.
  // Assuming the panel has a specific structure for results, we look for text that looks like a number with a unit.
  // Since we don't know the exact class, we'll check for any text in the panel that matches a length pattern.
  await expect.poll(async () => {
    const text = await measurementPanel.textContent();
    // Look for a pattern like "123.45 m" or similar
    return text ? /[\d.]+\s*(m|km|ft|mi)/i.test(text) : false;
  }).toBeTruthy();
});
