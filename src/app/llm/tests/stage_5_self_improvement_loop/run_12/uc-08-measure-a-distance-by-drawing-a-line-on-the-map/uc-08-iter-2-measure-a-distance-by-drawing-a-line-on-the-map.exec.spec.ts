// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  // The toggle button is already pressed (active) in the initial state.
  // Clicking it again would close the panel. Since the desired end state is
  // that the panel IS open, and it already is, we do NOT click the toggle.
  await expect(measurementToggle).toBeChecked();

  // Verify the measurement panel is visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // 2. Draw a line on the map
  // Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: 100, y: 100 } });
  await mapContainer.click({ position: { x: 200, y: 100 } });

  // 3. Finish the measurement by double-clicking
  await mapContainer.dblclick({ position: { x: 200, y: 100 } });

  // 4. Verify the measurement result is displayed
  // The measurement panel should still be visible
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();

  // The measurement result is displayed in a tooltip (e.g. "0 m", "123.45 m")
  // We poll for the tooltip to appear and match a numeric value followed by a unit.
  await expect.poll(() => page.locator('[role="tooltip"]').textContent()).toMatch(/[\d.]+\s*m/);
});
