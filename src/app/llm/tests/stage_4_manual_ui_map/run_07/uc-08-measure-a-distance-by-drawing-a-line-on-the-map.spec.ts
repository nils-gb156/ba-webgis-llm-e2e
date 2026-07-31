// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the measurement button to open the measurement panel.
  // The toggle is initially inactive, so clicking it opens the panel.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  // We need to click inside the map container.
  const mapContainer = page.getByTestId('map-container');

  // Click first point (approximate center-left)
  await mapContainer.click({ position: { x: 200, y: 200 } });
  // Click second point (approximate center-right)
  await mapContainer.click({ position: { x: 400, y: 200 } });
  // Click third point (approximate bottom-center)
  await mapContainer.click({ position: { x: 300, y: 400 } });

  // 3. Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 200 } });

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // We poll for the measurement element to be visible and contain text that looks like a number followed by a unit.
  await expect.poll(() => page.getByTestId('measurement').textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/i);
});
