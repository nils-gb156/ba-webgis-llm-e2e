// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container. We'll use approximate positions relative to the viewport.
  // Assuming the map takes up most of the viewport, we click a few points in a line.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Get the bounding box of the map to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box not found');
  }

  // Define points for a diagonal line
  const point1 = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.2 };
  const point2 = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 };
  const point3 = { x: box.x + box.width * 0.8, y: box.y + box.height * 0.8 };

  // Click the first point
  await page.mouse.click(point1.x, point1.y);
  // Click the second point
  await page.mouse.click(point2.x, point2.y);
  // Click the third point
  await page.mouse.click(point3.x, point3.y);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(point3.x, point3.y);

  // Expected results:
  // The measurement panel is visible.
  // The measurement panel displays a length value with a unit.

  // The measurement panel might be the info panel or a specific measurement result area.
  // Based on the context, the info panel is already open and pressed.
  // Let's look for a measurement result in the info panel or a dedicated measurement panel.
  // Since there is no specific 'measurement-panel' test id, we'll check the info panel or the map for a tooltip/result.
  // Often, measurement results are shown in a small popup or in the info panel.
  // Let's check if the info panel contains measurement text.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Check for a length value with a unit (e.g., "100 m", "1.5 km")
  // We'll poll for text that looks like a measurement result.
  await expect.poll(async () => {
    const infoPanelText = await infoPanel.textContent();
    return infoPanelText || '';
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
