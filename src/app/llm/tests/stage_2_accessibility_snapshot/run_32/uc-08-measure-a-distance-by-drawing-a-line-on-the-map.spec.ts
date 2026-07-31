// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the Measurement button to open the measurement panel
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Wait for the measurement panel to become visible
  const mapControlsPanel = page.getByTestId('map-controls-panel');
  await expect(mapControlsPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  
  // Get the center of the map container to click relative to it
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;

  // Click first point (center)
  await page.mouse.click(centerX, centerY);
  
  // Click second point (offset to the right)
  await page.mouse.click(centerX + 100, centerY);

  // Click third point (offset further right and down)
  await page.mouse.click(centerX + 200, centerY + 100);

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(centerX + 200, centerY + 100);

  // Expected results: The measurement panel displays a length value with a unit
  // The result is likely inside the map-controls-panel or a specific result container
  // We look for text that resembles a measurement (e.g., "1.5 km", "500 m", etc.)
  await expect.poll(async () => {
    const content = await mapControlsPanel.textContent();
    return content || '';
  }).toMatch(/\d+(\.\d+)?\s*(km|m|cm|mm)/i);
});
