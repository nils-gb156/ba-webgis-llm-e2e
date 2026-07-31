// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  // The toggle may already be pressed; click with force to ensure it enters measurement mode.
  await measurementToggle.click({ force: true });

  // Wait for the measurement panel/dialog to appear
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Click first point
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Click second point
  await mapContainer.click({ position: { x: 500, y: 400 } });

  // Click third point
  await mapContainer.click({ position: { x: 700, y: 500 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 700, y: 500 } });

  // Expected results: measurement panel visible and displays length
  await expect(measurementPanel).toBeVisible();

  // The measurement result is shown as text inside the panel (e.g. "216.05 km").
  // Use poll to wait for the async rendering of the result.
  await expect.poll(() => measurementPanel.getByText(/km|m|mi|ft/i).first().textContent()).toMatch(/\d+/);
});
