// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  const scaleViewer = page.getByTestId('scale-viewer');
  await expect(scaleViewer).toContainText(/1 to \d+/);

  // 1. Activate the measurement tool
  await page.getByTestId('measurement-toggle').click({ force: true });

  // Verify the measurement panel is visible
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 400, y: 300 } });
  // Click second point
  await mapContainer.click({ position: { x: 500, y: 400 } });
  // Click third point
  await mapContainer.click({ position: { x: 600, y: 350 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 600, y: 350 } });

  // Wait for the measurement result to appear in the measurement panel
  await expect(measurementPanel).toBeVisible();

  // Assert that the measurement panel displays a length value with a unit
  // The result is usually in a format like "83.81 km" or "123.45 m"
  // Using a regex to match the measurement result text
  const measurementResult = measurementPanel.getByRole('paragraph', { name: /83\.81 km/ });
  await expect(measurementResult).toBeVisible();
});
