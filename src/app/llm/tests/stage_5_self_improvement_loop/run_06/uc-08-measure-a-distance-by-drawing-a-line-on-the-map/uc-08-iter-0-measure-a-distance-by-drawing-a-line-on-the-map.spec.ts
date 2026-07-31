// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // Verify the measurement panel is visible.
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();
  await expect(page.getByText('Measurement')).toBeVisible();

  // 2. Click several points on the map canvas to draw a line.
  // Get the map center to click around it.
  const center = await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Click the first point.
  await page.getByTestId('map-container').click({ position: { x: center[0] - 100, y: center[1] - 100 } });
  // Click the second point.
  await page.getByTestId('map-container').click({ position: { x: center[0] + 100, y: center[1] - 100 } });
  // Click the third point.
  await page.getByTestId('map-container').click({ position: { x: center[0] + 100, y: center[1] + 100 } });

  // 3. Double-click to finish the measurement.
  await page.getByTestId('map-container').dblclick({ position: { x: center[0] + 100, y: center[1] + 100 } });

  // Expected results:
  // The measurement panel displays a length value with a unit.
  // Wait for the measurement result to appear and contain a number and a unit (e.g., "km").
  await expect.poll(() => page.getByTestId('map-controls-panel').textContent()).toMatch(/\d+(\.\d+)?\s*(m|km|mi|ft)/);
});
