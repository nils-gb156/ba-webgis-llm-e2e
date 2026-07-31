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
  // We need to click on the map container. The map is a canvas, so we click at specific coordinates.
  // We'll click a few points to draw a line.
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Click third point
  await mapContainer.click({ position: { x: 300, y: 100 } });

  // Step 3: The user double-clicks to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 100 } });

  // Expected results:
  // - The measurement panel is visible. (Already verified above)
  // - The measurement panel displays a length value with a unit.
  
  // Wait for the measurement result to appear in the panel.
  // The measurement panel contains a 'measurement' element which should display the result.
  const measurementPanel = page.getByTestId('measurement-panel');
  const measurementElement = measurementPanel.getByTestId('measurement');
  
  // Poll for the measurement element to be visible and contain text that looks like a length value with a unit (e.g., "100 m", "1.5 km")
  await expect.poll(async () => {
    const text = await measurementElement.innerText();
    return text;
  }).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
