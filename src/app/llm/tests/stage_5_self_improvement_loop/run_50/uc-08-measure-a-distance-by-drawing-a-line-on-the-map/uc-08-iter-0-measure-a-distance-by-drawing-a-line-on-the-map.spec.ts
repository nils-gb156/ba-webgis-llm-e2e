// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the 'Measurement' button in the toolbar to open the measurement panel.
  await page.getByRole('button', { name: 'Measurement' }).click();

  // Assert: The measurement panel is visible.
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Get the map center to use as a reference point for drawing the line.
  const center = await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // Step 2: The user clicks several points on the map canvas to draw a line.
  // We click three points to create a simple multi-segment line.
  const clickPoints = [
    center,
    [center[0] + 100000, center[1] + 100000],
    [center[0] + 200000, center[1] + 50000],
  ];

  for (const point of clickPoints) {
    await page.locator('[data-testid="map-container"]').click({
      position: { x: point[0], y: point[1] },
    });
  }

  // Step 3: The user double-clicks to finish the measurement.
  await page.locator('[data-testid="map-container"]').dblclick({
    position: clickPoints[clickPoints.length - 1],
  });

  // Assert: The measurement panel displays a length value with a unit.
  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('paragraph').textContent()
  ).toMatch(/length.*km|km.*length/i);
});
