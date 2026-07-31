// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // 1. Click the measurement button to open the measurement panel
  // The panel is not visible by default, so we click the toggle to open it.
  await page.getByTestId('measurement-toggle').click();

  // Assert the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  // We click at three distinct positions to create a simple polyline.
  const mapContainer = page.getByTestId('map-container');

  // First point (center-ish)
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Second point
  await mapContainer.click({ position: { x: 300, y: 200 } });
  // Third point
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 300, y: 300 } });

  // Expected results:
  // - The measurement panel is visible (already asserted above)
  // - The measurement panel displays a length value with a unit.

  // Wait for the measurement result to appear.
  // The measurement element should contain text that looks like a number followed by a unit (e.g., "1.23 km").
  const measurementElement = page.getByTestId('measurement');
  
  await expect.poll(async () => {
    const text = await measurementElement.innerText();
    // Check if the text contains a number and a unit (simple pattern matching)
    return /\d+(\.\d+)?\s*(m|km|mi|ft)/i.test(text);
  }).toBe(true);
});
