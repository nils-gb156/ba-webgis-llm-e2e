// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  // The toggle button is already pressed in the initial state, so clicking it would close the panel.
  // We assert the panel is visible and only click if it is not.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });

  if (!(await measurementPanel.isVisible())) {
    await measurementToggle.click();
  }

  await expect(measurementPanel).toBeVisible();

  // 2. Draw a line by clicking several points on the map
  const mapContainer = page.getByTestId('map-container');

  // Click the first point
  await mapContainer.click({ position: { x: 300, y: 300 } });

  // Click the second point to form a line segment
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Verify measurement result is displayed in the measurement panel
  // The measurement panel should display a length value with a unit (e.g., "12.5 km")
  // Use expect.poll with toMatch to assert on the text content of the panel
  await expect.poll(() => measurementPanel.textContent()).toMatch(/[0-9]+\.?[0-9]*\s*(km|m|mi|ft)/);
});
