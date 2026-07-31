// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from "../../../map-model-helpers";

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  
  // Check current state to avoid toggling off if already open
  const measurementPanel = page.getByTestId('measurement-panel');
  const isMeasurementPanelVisible = await measurementPanel.isVisible();
  
  if (!isMeasurementPanelVisible) {
    await measurementToggle.click();
  }

  // Assert the measurement panel is visible
  await expect(measurementPanel).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // Get initial center to calculate click positions relative to it
  const initialCenter = await expect.poll(() => getMapCenter(page)).toBeDefined();
  const mapContainer = page.getByTestId('map-container');
  
  // Calculate approximate pixel positions for clicks. 
  // Assuming a standard viewport, we click relative to the center of the map.
  // We need to click on the map canvas. The map-container is the wrapper.
  // We'll click at specific offsets from the center of the map container.
  const box = await mapContainer.boundingBox();
  if (!box) {
    throw new Error('Map container bounding box not found');
  }
  
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // Click first point (slightly left of center)
  await page.mouse.click(centerX - 100, centerY);
  
  // Click second point (slightly right of center)
  await page.mouse.click(centerX + 100, centerY);
  
  // Click third point (below center)
  await page.mouse.click(centerX, centerY + 100);

  // Step 3: Double-click to finish the measurement.
  await page.mouse.dblclick(centerX, centerY + 100);

  // Expected results:
  // The measurement panel displays a length value with a unit.
  const measurementElement = page.getByTestId('measurement');
  await expect(measurementElement).toBeVisible();
  
  // Assert that the measurement element contains text that looks like a length with a unit (e.g., "1.23 km", "500 m")
  // We poll because the calculation might take a moment after the double-click
  await expect.poll(async () => {
    const text = await measurementElement.textContent();
    return text;
  }).toMatch(/\d+\.?\d*\s*(km|m|ft|mi)/i);
});
