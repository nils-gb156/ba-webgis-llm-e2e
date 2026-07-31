// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the Measurement button to open the measurement panel.
  // The measurement toggle is not pressed initially, so clicking it opens the panel.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We will click 3 points to form a simple line segment.
  const mapContainer = page.getByTestId('map-container');

  // Get the map container's bounding box to click within its visible area
  const box = await mapContainer.boundingBox();
  expect(box).toBeDefined();

  // Calculate click positions relative to the map container.
  // Point 1: center-left of the map container
  const point1 = { x: Math.floor(box!.width * 0.3), y: Math.floor(box!.height * 0.5) };
  // Point 2: center-right of the map container
  const point2 = { x: Math.floor(box!.width * 0.7), y: Math.floor(box!.height * 0.5) };

  // Click the first point to start the measurement
  await mapContainer.click({ position: { x: point1.x, y: point1.y } });

  // Click the second point to extend the measurement line
  await mapContainer.click({ position: { x: point2.x, y: point2.y } });

  // Step 3: Double-click to finish the measurement.
  // We double-click on the second point to finish the line.
  await mapContainer.click({ position: { x: point2.x, y: point2.y }, clickCount: 2 });

  // Expected results:
  // 1. The measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. The measurement panel displays a length value with a unit.
  // The measurement result is displayed in the panel's text content, e.g. "587.99 km".
  // We poll for the text to contain a number followed by a unit.
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });

  await expect.poll(async () => {
    const text = await measurementPanel.textContent();
    return text;
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft|in|cm|mm|nm|yd)/i);
});
