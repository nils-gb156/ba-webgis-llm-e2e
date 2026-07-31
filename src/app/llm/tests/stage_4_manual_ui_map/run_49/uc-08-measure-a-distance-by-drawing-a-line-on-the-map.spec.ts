// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  await page.getByTestId('measurement-toggle').click();

  // Wait for the measurement panel to become visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Get the map container for interaction
  const mapContainer = page.getByTestId('map-container');

  // 2. The user clicks several points on the map canvas to draw a line.
  // Click the first point
  await mapContainer.click({ position: { x: 100, y: 100 } });
  // Click the second point
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Click the third point
  await mapContainer.click({ position: { x: 300, y: 150 } });

  // 3. The user double-clicks to finish the measurement.
  // Double-click at the last point location to finish
  await mapContainer.dblclick({ position: { x: 300, y: 150 } });

  // Expected results:
  // - The measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // - The measurement panel displays a length value with a unit.
  // The measurement panel contains a 'measurement' element which should display the result.
  // We look for text that matches a number followed by a unit (e.g., "1.5 km", "200 m").
  const measurementResult = page.getByTestId('measurement').getByText(/^[0-9,.]+\s*(m|km|mi|ft)/i);
  await expect(measurementResult).toBeVisible();
});
