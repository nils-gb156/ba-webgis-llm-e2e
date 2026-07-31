// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');

  // The toggle may already be pressed (active) from a previous run or initial state.
  // We only need to click if it's not already active.
  const isPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isPressed !== 'true') {
    await measurementToggle.click();
  }

  // Verify the measurement panel is visible.
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. The user clicks several points on the map canvas to draw a line.
  // Use the map-container test id and click at specific positions relative to the viewport center.
  const mapContainer = page.getByTestId('map-container');

  // Click the first point.
  await mapContainer.click({ position: { x: 300, y: 300 } });
  // Click the second point.
  await mapContainer.click({ position: { x: 500, y: 300 } });
  // Click the third point.
  await mapContainer.click({ position: { x: 500, y: 500 } });

  // 3. The user double-clicks to finish the measurement.
  await mapContainer.dblclick({ position: { x: 500, y: 500 } });

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // The dialog contains the measurement result.
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect.poll(() => measurementPanel.textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
