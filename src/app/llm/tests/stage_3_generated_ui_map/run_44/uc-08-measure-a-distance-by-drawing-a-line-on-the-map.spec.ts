// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and rendered
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Activate the measurement tool
  // The measurement toggle button is not pressed by default.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map to draw a line
  // We click at distinct positions to form a line segment.
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point (center-ish)
  await mapContainer.click({ position: { x: 300, y: 300 } });
  
  // Click second point
  await mapContainer.click({ position: { x: 400, y: 400 } });
  
  // Click third point
  await mapContainer.click({ position: { x: 500, y: 300 } });

  // Step 3: Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 500, y: 300 } });

  // Expected result: The measurement panel displays a length value with a unit.
  // We poll the measurement element to ensure the result has settled after the async drawing operation.
  await expect.poll(() => page.getByTestId('measurement').textContent()).toMatch(/[\d.]+\s*m/);
});
