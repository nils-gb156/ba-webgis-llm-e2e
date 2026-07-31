// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  // The accessibility tree shows "button Measurement", which maps to the measurement-toggle test id.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible.
  // The map-controls-panel likely contains the measurement results UI.
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the map container. We'll pick points roughly in the center area.
  const mapContainer = page.getByTestId('map-container');
  
  // Get the bounding box of the map to calculate click positions
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container not found or has no bounding box');
  }

  // Calculate center point
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click first point (center)
  await page.mouse.click(centerX, centerY);
  
  // Click second point (slightly offset to create a line)
  await page.mouse.click(centerX + 100, centerY + 100);

  // Click third point (further offset)
  await page.mouse.click(centerX + 200, centerY);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(centerX + 200, centerY);

  // Expected results:
  // - The measurement panel is visible (already asserted).
  // - The measurement panel displays a length value with a unit.
  
  // The measurement result is likely displayed within the map-controls-panel or a specific measurement result element.
  // Since there's no specific test id for the measurement result text, we look for text matching a length pattern (e.g., "123 m", "1.2 km")
  // inside the map-controls-panel.
  
  // Use expect.poll to wait for the measurement result to appear and settle
  await expect.poll(async () => {
    const panel = page.getByTestId('map-controls-panel');
    // Look for text that resembles a distance measurement (number followed by unit like m, km, mi)
    // We'll get all text content and check if it matches the pattern
    const text = await panel.textContent();
    if (!text) return false;
    return /[\d.]+\s*(m|km|mi|ft)/i.test(text);
  }).toBeTruthy();
});
