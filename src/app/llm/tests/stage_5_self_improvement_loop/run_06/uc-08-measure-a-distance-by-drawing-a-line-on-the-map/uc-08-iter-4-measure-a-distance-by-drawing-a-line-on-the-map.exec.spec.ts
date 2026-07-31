// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before reading its center.
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // 1. The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  // The toggle may already be pressed (active) from a previous run or initial state.
  // We only need to click if it's not already active.
  if (!(await measurementToggle.getAttribute('aria-pressed'))) {
    await measurementToggle.click();
  }

  // Verify the measurement panel is visible.
  await expect(page.getByRole('dialog', { name: 'Measurement' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Measurement' })).toBeVisible();

  // 2. The user clicks several points on the map canvas to draw a line.
  // Get the map center to click around it.
  const center = await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Click the first point.
  await page.getByTestId('map-container').click({ position: { x: center[0] - 100, y: center[1] - 100 } });
  // Click the second point.
  await page.getByTestId('map-container').click({ position: { x: center[0] + 100, y: center[1] - 100 } });
  // Click the third point.
  await page.getByTestId('map-container').click({ position: { x: center[0] + 100, y: center[1] + 100 } });

  // 3. The user double-clicks to finish the measurement.
  await page.getByTestId('map-container').dblclick({ position: { x: center[0] + 100, y: center[1] + 100 } });

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // Wait for the measurement result to appear and contain a number and a unit (e.g., "km").
  await expect.poll(() => page.getByRole('dialog', { name: 'Measurement' }).textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
