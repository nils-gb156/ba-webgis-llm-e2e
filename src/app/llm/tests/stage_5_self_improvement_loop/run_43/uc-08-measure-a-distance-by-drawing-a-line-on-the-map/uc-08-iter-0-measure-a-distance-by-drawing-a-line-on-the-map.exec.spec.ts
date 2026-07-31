// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  const measurementToggle = page.getByTestId('measurement-toggle');
  await measurementToggle.click();

  // 2. Click several points on the map to draw a line
  const mapContainer = page.getByTestId('map-container');

  // Get center of map to click near it
  const center = await getMapCenter(page);
  expect(center).toBeDefined();
  const [centerX, centerY] = center!;

  // Click first point
  await mapContainer.click({
    position: { x: centerX - 100, y: centerY - 100 },
  });

  // Click second point
  await mapContainer.click({
    position: { x: centerX, y: centerY },
  });

  // Click third point
  await mapContainer.click({
    position: { x: centerX + 100, y: centerY + 100 },
  });

  // 3. Double-click to finish measurement
  await mapContainer.dblclick({
    position: { x: centerX + 100, y: centerY + 100 },
  });

  // Expected results: measurement panel visible and displays length
  const measurementPanel = page.getByRole('dialog', { name: 'Measurement' });
  await expect(measurementPanel).toBeVisible();

  // Check that a length value with a unit is displayed
  // The panel should contain text like "Length: X km" or "X m"
  const measurementText = measurementPanel.locator('text=/Length: \\d+\\s*(km|m|mi|ft)/i');
  await expect(measurementText).toBeVisible();
});
