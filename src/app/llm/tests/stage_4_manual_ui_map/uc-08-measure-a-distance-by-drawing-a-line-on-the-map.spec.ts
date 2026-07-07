// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map container. The map is a canvas, so we click on the container.
  // We'll pick a few distinct coordinates within the map container to simulate drawing a line.
  // First, let's get the bounding box of the map container to ensure we click inside.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    throw new Error('Map container not found or not visible');
  }

  // Define points for a simple line (e.g., top-left, center, bottom-right relative to map)
  // Using relative coordinates to be robust against resizing
  const points = [
    { x: mapBox.x + mapBox.width * 0.2, y: mapBox.y + mapBox.height * 0.2 },
    { x: mapBox.x + mapBox.width * 0.5, y: mapBox.y + mapBox.height * 0.5 },
    { x: mapBox.x + mapBox.width * 0.8, y: mapBox.y + mapBox.height * 0.8 },
  ];

  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    // Small delay to ensure click is registered and map updates
    await page.waitForTimeout(100);
  }

  // Step 3: Double-click to finish the measurement
  // Double-click on the last point or a nearby point to finish
  const lastPoint = points[points.length - 1];
  await page.mouse.dblclick(lastPoint.x, lastPoint.y);

  // Expected result: The measurement panel displays a length value with a unit
  // The measurement panel should be visible and contain text indicating a length
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // Wait for the measurement result to appear. It might take a moment to calculate.
  // We look for text that resembles a number followed by a unit (e.g., "123.45 m", "1.2 km")
  // Since the exact text might vary, we check for the presence of a measurement entry or value.
  // The UI map mentions "measurement" element inside "measurement-panel".
  const measurementElement = page.getByTestId('measurement');
  
  // Use poll to wait for the measurement value to appear
  await expect.poll(async () => {
    const text = await measurementElement.textContent();
    // Check if the text contains a number and a unit (m, km, mi, ft)
    return text && /\d+(\.\d+)?\s*(m|km|mi|ft)/i.test(text);
  }).toBeTruthy();
});
