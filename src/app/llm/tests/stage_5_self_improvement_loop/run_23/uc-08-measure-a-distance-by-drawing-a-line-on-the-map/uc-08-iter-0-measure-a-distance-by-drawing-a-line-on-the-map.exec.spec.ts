// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('UC8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and centered
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Step 1: Click the 'Measurement' button to open the measurement panel
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click();

  // Verify the measurement panel is visible
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line
  // We need to capture the map center to click relative to it
  const mapCenter = await getMapCenter(page);
  expect(mapCenter).toBeTruthy();
  const [centerX, centerY] = mapCenter!;

  // Click a point slightly to the left
  await page.locator('[data-testid="map-container"]').click({
    position: { x: centerX - 100, y: centerY },
  });

  // Click a point slightly to the right
  await page.locator('[data-testid="map-container"]').click({
    position: { x: centerX + 100, y: centerY },
  });

  // Click a point slightly above
  await page.locator('[data-testid="map-container"]').click({
    position: { x: centerX, y: centerY - 100 },
  });

  // Step 3: Double-click to finish the measurement
  await page.locator('[data-testid="map-container"]').dblclick({
    position: { x: centerX + 50, y: centerY + 50 },
  });

  // Expected results: The measurement panel displays a length value with a unit
  // The measurement result is typically displayed in the map-controls-panel or a dedicated result area
  // We'll look for a pattern like "X.XX km" or "X.XX m" in the map controls panel
  const measurementPanel = page.getByTestId('map-controls-panel');
  await expect.poll(() => measurementPanel.textContent()).toMatch(/[\d.]+\s*(km|m|mi|ft)/);
});
