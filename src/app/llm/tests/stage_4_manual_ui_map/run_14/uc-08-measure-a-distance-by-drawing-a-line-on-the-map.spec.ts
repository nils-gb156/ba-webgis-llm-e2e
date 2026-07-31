// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We need to click on the map container. We'll use approximate coordinates relative to the viewport.
  // First, let's get the map container's bounding box to ensure we click within it.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Calculate points within the map container for drawing a line
  // Point 1: Center-ish
  const point1X = mapBox.x + mapBox.width * 0.3;
  const point1Y = mapBox.y + mapBox.height * 0.3;
  
  // Point 2: Further away
  const point2X = mapBox.x + mapBox.width * 0.7;
  const point2Y = mapBox.y + mapBox.height * 0.7;

  // Point 3: Even further
  const point3X = mapBox.x + mapBox.width * 0.5;
  const point3Y = mapBox.y + mapBox.height * 0.2;

  await page.mouse.click(point1X, point1Y);
  await page.mouse.click(point2X, point2Y);
  await page.mouse.click(point3X, point3Y);

  // Step 3: The user double-clicks to finish the measurement.
  await page.mouse.dblclick(point3X, point3Y);

  // Expected results:
  // - The measurement panel is visible. (Already checked, but re-asserting for flow)
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // The measurement element inside the panel should contain text indicating length.
  // We use expect.poll because the measurement calculation might take a moment after the double-click.
  await expect.poll(async () => {
    const measurementElement = page.getByTestId('measurement');
    const text = await measurementElement.textContent();
    return text;
  }).toMatch(/[\d.,]+\s*(m|km|mi|ft)/); // Match a number followed by a unit
});
