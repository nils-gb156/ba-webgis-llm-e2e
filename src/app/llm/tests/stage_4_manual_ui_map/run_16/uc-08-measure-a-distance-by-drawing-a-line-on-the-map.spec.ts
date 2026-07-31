// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the measurement button to open the measurement panel.
  // The toggle button should start in an inactive state (not pressed).
  // We assert visibility first to ensure the panel is not already open.
  await expect(page.getByTestId('measurement-panel')).not.toBeVisible();
  
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is now visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Get the map container for clicking.
  const mapContainer = page.getByTestId('map-container');

  // Step 2: Click several points on the map canvas to draw a line.
  // We use the center of the map container as a reference, then click around it.
  // Coordinates are relative to the element.
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found or has no bounding box');
  }

  // Click first point (center-ish)
  await mapContainer.click({ position: { x: mapBox.width / 2, y: mapBox.height / 2 } });
  
  // Click second point (offset)
  await mapContainer.click({ position: { x: mapBox.width / 2 + 100, y: mapBox.height / 2 - 50 } });
  
  // Click third point (further offset)
  await mapContainer.click({ position: { x: mapBox.width / 2 + 150, y: mapBox.height / 2 + 50 } });

  // Step 3: Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: mapBox.width / 2 + 150, y: mapBox.height / 2 + 50 } });

  // Expected results:
  // The measurement panel is visible (already asserted).
  // The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear in the measurement panel.
  // The panel contains a 'measurement' element which should contain text with a number and unit.
  const measurementElement = page.getByTestId('measurement');
  
  // Use expect.poll to wait for the measurement value to settle.
  await expect.poll(async () => {
    const text = await measurementElement.textContent();
    return text;
  }).toMatch(/[\d,.]+\s*(m|km|mi|ft)/i);
});
