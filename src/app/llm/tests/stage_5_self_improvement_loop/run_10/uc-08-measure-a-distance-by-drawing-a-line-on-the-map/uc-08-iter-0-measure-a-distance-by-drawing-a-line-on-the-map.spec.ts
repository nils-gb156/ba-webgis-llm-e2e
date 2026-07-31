// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the measurement tool.
  // The Measurement button is in the toolbar at the bottom.
  await page.getByTestId('measurement-toggle').click();

  // Verify the measurement panel is visible.
  await expect(page.getByTestId('map-controls-panel')).toBeVisible();

  // Step 2: Click several points on the map canvas to draw a line.
  // We click three distinct points on the map to form a line.
  const center = await getMapCenter(page);
  if (!center) {
    throw new Error('Map center is not available');
  }
  const mapContainer = page.getByTestId('map-container');
  // Approximate pixel positions relative to the center of the map viewport.
  // We'll click three points to form a simple line.
  const clickPoints = [
    { x: center[0] - 100, y: center[1] - 100 },
    { x: center[0], y: center[1] },
    { x: center[0] + 100, y: center[1] + 100 },
  ];

  for (const point of clickPoints) {
    await mapContainer.click({
      position: { x: point.x, y: point.y },
    });
  }

  // Step 3: Double-click to finish the measurement.
  await mapContainer.dblclick({
    position: { x: clickPoints[clickPoints.length - 1].x, y: clickPoints[clickPoints.length - 1].y },
  });

  // Expected result: The measurement panel displays a length value with a unit.
  // We check the map-controls-panel for text that looks like a measurement (e.g., "100 m", "1.5 km").
  await expect.poll(() =>
    page.getByTestId('map-controls-panel').locator('text=/\\d+\\s*(m|km|mi|ft)/i').count()
  ).toBeGreaterThan(0);
});
