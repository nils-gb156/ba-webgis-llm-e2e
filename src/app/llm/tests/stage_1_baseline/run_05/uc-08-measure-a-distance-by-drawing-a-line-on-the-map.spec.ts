// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and interactive
  const mapLocator = page.getByTestId('map-canvas');
  await expect(mapLocator).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to become visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map canvas at different coordinates
  // Get the bounding box of the map to calculate click positions
  const mapBox = await mapLocator.boundingBox();
  if (!mapBox) {
    throw new Error('Map canvas not found or not visible');
  }

  // Click first point near the center of the map
  const firstPointX = mapBox.x + mapBox.width / 2;
  const firstPointY = mapBox.y + mapBox.height / 2;
  await page.mouse.click(firstPointX, firstPointY);

  // Click second point offset from the first
  const secondPointX = mapBox.x + mapBox.width / 3;
  const secondPointY = mapBox.y + mapBox.height / 3;
  await page.mouse.click(secondPointX, secondPointY);

  // Click third point to create a more complex line
  const thirdPointX = mapBox.x + (2 * mapBox.width) / 3;
  const thirdPointY = mapBox.y + (2 * mapBox.height) / 3;
  await page.mouse.click(thirdPointX, thirdPointY);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(firstPointX, firstPointY);

  // Wait for the measurement result to appear in the panel
  // The panel should display a length value with a unit
  // We look for text that matches a number followed by a unit like 'm' or 'km'
  await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
