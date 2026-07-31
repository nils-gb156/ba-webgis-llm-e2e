// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate the measurement tool
  await page.getByRole('button', { name: 'Measurement' }).click();

  // 2. Click several points on the map canvas to draw a line
  const center = await getMapCenter(page);
  expect(center).toBeDefined();

  if (center) {
    // Click a few points around the center to draw a line
    await page.locator('#map-container').click({
      position: { x: center[0] - 100, y: center[1] - 100 },
    });
    await page.locator('#map-container').click({
      position: { x: center[0], y: center[1] + 100 },
    });
    await page.locator('#map-container').click({
      position: { x: center[0] + 100, y: center[1] },
    });

    // 3. Double-click to finish the measurement
    await page.locator('#map-container').dblclick({
      position: { x: center[0] + 100, y: center[1] },
    });
  }

  // Expected results
  // The measurement panel is visible
  await expect(page.locator('#map-controls-panel')).toBeVisible();

  // The measurement panel displays a length value with a unit
  await expect.poll(() => page.locator('#map-controls-panel').textContent()).toMatch(/[\d.,]+\s*(m|km|mi|ft)/);
});
