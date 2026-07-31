// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click({ force: true });

  // The measurement panel (dialog) should now be visible.
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // 2. Click several points on the map canvas to draw a line
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 300, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 300 } });
  await mapContainer.click({ position: { x: 400, y: 400 } });

  // 3. Double-click to finish the measurement
  await mapContainer.dblclick({ position: { x: 400, y: 400 } });

  // Expected results:
  // - The measurement panel is visible. (Already asserted above)
  // - The measurement panel displays a length value with a unit.
  //
  // The dialog is identified by role="dialog" with accessible name "Measurement".
  // The result is a paragraph containing a number and a unit (e.g., "123.45 m").
  await expect(
    measurementPanel.getByText(/\d+\.?\d*\s*(m|km)/)
  ).toBeVisible();
});
