// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be fully initialized and rendered
  await expect.poll(() => getMapCenter(page)).toBeTruthy();
  await expect.poll(() => getMapZoomLevel(page)).toBeTruthy();

  // 1. Activate the measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Draw a line on the map
  // Get the map container center to use as a starting point
  const center = await getMapCenter(page);
  expect(center).toBeTruthy();

  // Click several points on the map to draw a line
  await page.locator('[data-testid="map-container"]').click({ position: { x: 0, y: 0 } });
  await page.locator('[data-testid="map-container"]').click({ position: { x: 100, y: 100 } });
  await page.locator('[data-testid="map-container"]').click({ position: { x: 200, y: 50 } });

  // 3. Finish the measurement by double-clicking
  await page.locator('[data-testid="map-container"]').dblclick({ position: { x: 200, y: 50 } });

  // 4. Verify the measurement result is displayed
  // The measurement panel should still be visible and display a length value
  await expect(page.getByTestId('measurement-panel')).toBeVisible();
  
  // Look for the measurement result which typically shows distance with units
  // Using a regex to match any numeric value followed by common distance units
  await expect.poll(() => page.getByTestId('measurement-panel').textContent()).toMatch(/[\d.]+\s*(m|km|mi|ft)/);
});
