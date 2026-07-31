// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2 & 3: Draw a line on the map and finish it
  // We click three points to create a line segment and then double-click to finish.
  // The map container is the interactive element.
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click second point
  await mapContainer.click({ position: { x: 200, y: 100 } });
  // Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 300, y: 100 } });

  // Expected results: The measurement panel displays a length value with a unit.
  // We assert that the measurement element contains text matching a number followed by a unit.
  const measurementElement = page.getByTestId('measurement');
  await expect.poll(() => measurementElement.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
