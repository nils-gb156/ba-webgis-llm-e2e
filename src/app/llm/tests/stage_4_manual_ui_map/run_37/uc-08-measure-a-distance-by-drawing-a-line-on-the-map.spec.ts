// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the 'Measurement' button to open the measurement panel
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Get the map container to click on it for drawing the line
  const mapContainer = page.getByTestId('map-container');

  // Step 2: Click several points on the map canvas to draw a line.
  // We need to click on the canvas element inside the map-container.
  // Since the map is a canvas, we click relative positions on the container.
  // First point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Third point
  await mapContainer.click({ position: { x: 300, y: 150 } });

  // Step 3: Double-click to finish the measurement
  // We double-click on the last point or near it to finish.
  await mapContainer.dblclick({ position: { x: 300, y: 150 } });

  // Expected results:
  // The measurement panel is visible (already checked)
  // The measurement panel displays a length value with a unit.
  // We look for text inside the measurement panel that looks like a measurement result.
  // It might be a number followed by a unit like "m" or "km".
  const measurementPanel = page.getByTestId('measurement-panel');
  
  // Wait for the measurement result to appear. It might take a moment to calculate.
  await expect.poll(async () => {
    const text = await measurementPanel.textContent();
    return text;
  }).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
