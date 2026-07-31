// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to be fully loaded and interactive
  await page.waitForLoadState('networkidle');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // We assume a test id or accessible name for the measurement tool button.
  // If a specific test id is not known, we fall back to role/text.
  const measurementButton = page.getByRole('button', { name: 'Measurement' });
  await expect(measurementButton).toBeVisible();
  await measurementButton.click();

  // Wait for the measurement panel to become visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to locate the map canvas or a container that allows interaction.
  // Assuming a test id for the map container or canvas.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map container to calculate click positions
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define some points to draw a line.
  // Point 1: Near the center-left
  const point1X = mapBox.x + mapBox.width * 0.3;
  const point1Y = mapBox.y + mapBox.height * 0.5;

  // Point 2: Near the center-right
  const point2X = mapBox.x + mapBox.width * 0.7;
  const point2Y = mapBox.y + mapBox.height * 0.5;

  // Point 3: Near the top-center
  const point3X = mapBox.x + mapBox.width * 0.5;
  const point3Y = mapBox.y + mapBox.height * 0.2;

  // Click the first point
  await page.mouse.click(point1X, point1Y);

  // Click the second point
  await page.mouse.click(point2X, point2Y);

  // Click the third point
  await page.mouse.click(point3X, point3Y);

  // Step 3: Double-click to finish the measurement.
  // Double-click at the last point or nearby to finalize the line.
  await page.mouse.dblclick(point3X, point3Y);

  // Wait for the measurement result to settle
  // Assuming the result is displayed within the measurement panel
  const measurementResult = measurementPanel.getByTestId('measurement-result');
  
  // Wait for the measurement result to be visible and contain a length value with a unit
  // The exact structure might vary, so we look for text matching a length pattern
  await expect.poll(async () => {
    const text = await measurementResult.innerText();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
