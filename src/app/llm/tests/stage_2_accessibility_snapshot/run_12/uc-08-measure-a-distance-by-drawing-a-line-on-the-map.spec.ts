// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible before interacting
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Step 1: Click the Measurement button to open the measurement panel
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  // The panel is likely part of the map-controls-panel or a floating panel.
  // We check for the presence of the measurement tool UI elements.
  // Since there isn't a specific test-id for the measurement panel content,
  // we assert that the toggle button is in the pressed state, indicating the tool is active.
  await expect(measurementToggle).toBeChecked();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to click on the map canvas. We will use the map-container locator.
  // We assume the map is centered and visible. We'll click a few points in a rough line.
  // Coordinates are relative to the map container element.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Define points for a simple line drawing (e.g., top-left to bottom-right)
  const points = [
    { x: mapBox.x + 100, y: mapBox.y + 100 },
    { x: mapBox.x + 200, y: mapBox.y + 200 },
    { x: mapBox.x + 300, y: mapBox.y + 300 },
  ];

  for (const point of points) {
    await page.mouse.click(point.x, point.y);
  }

  // Step 3: Double-click to finish the measurement
  await page.mouse.dblclick(points[points.length - 1].x, points[points.length - 1].y);

  // Expected results:
  // 1. The measurement panel is visible.
  // 2. The measurement panel displays a length value with a unit.
  
  // The measurement result is typically displayed in a panel. 
  // We look for text that resembles a measurement result (number followed by unit like 'm' or 'km').
  // We use expect.poll to wait for the asynchronous calculation and UI update.
  await expect.poll(async () => {
    // Try to find the measurement result text. 
    // It might be in a specific element or just visible on the page.
    // Let's look for a pattern like "123.45 m" or "1.23 km" in the page content.
    // We'll search for common measurement units.
    const bodyText = await page.locator('body').textContent();
    // Regex for a number (integer or float) followed by a space and a unit (m, km, mi, ft)
    const measurementRegex = /\d+(\.\d+)?\s+(m|km|mi|ft|cm|mm)/i;
    return measurementRegex.test(bodyText ?? '');
  }).toBeTruthy();

  // Additionally, verify the measurement toggle is still active or that a result container is visible.
  // Since the tool might close or stay open depending on implementation, we rely on the text assertion.
  // We can also check if the map still shows the drawn line, but that's hard to assert without image diff.
  // The text assertion covers the core requirement.
});
