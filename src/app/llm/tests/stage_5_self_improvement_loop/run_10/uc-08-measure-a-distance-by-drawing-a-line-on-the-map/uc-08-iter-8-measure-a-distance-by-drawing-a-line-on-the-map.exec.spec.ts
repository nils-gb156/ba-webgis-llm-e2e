// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool.
  // The toggle button is already in the pressed state visually, but we need to ensure
  // the measurement mode is active. Clicking it ensures the tool is engaged.
  await page.getByTestId('measurement-toggle').click({ force: true });

  // Verify the measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  const mapContainer = page.getByTestId('map-container');

  // Click three points to form a line segment.
  await mapContainer.click({ position: { x: 200, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 200 } });
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Step 3: Double-click to finish the measurement.
  await mapContainer.dblclick({ position: { x: 300, y: 300 } });

  // Expected result: The measurement panel displays a length value with a unit.
  // We poll the measurement panel for text matching a number followed by a unit.
  await expect.poll(() =>
    page
      .getByTestId('measurement-panel')
      .locator('text=/\\d+\\s*(m|km|mi|ft)/i')
      .count()
  ).toBeGreaterThan(0);
});
