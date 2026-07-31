// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  // Assert the panel is not visible initially
  await expect(page.getByTestId('measurement-panel')).not.toBeVisible();

  // Click the toggle to open the panel
  await measurementToggle.click();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We click three points to form a line with two segments.
  const mapContainer = page.getByTestId('map-container');
  
  // Click first point (approximate center-ish)
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 100 } });
  // Click third point
  await mapContainer.click({ position: { x: 200, y: 200 } });

  // Step 3: The user double-clicks to finish the measurement.
  await mapContainer.dblclick({ position: { x: 200, y: 200 } });

  // Expected results:
  // - The measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // We poll for the measurement element to contain text that looks like a number followed by a unit (e.g., "1.2 km", "500 m")
  const measurementElement = page.getByTestId('measurement');
  await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s*(km|m|cm|mm|mi|ft|in)/);
});
