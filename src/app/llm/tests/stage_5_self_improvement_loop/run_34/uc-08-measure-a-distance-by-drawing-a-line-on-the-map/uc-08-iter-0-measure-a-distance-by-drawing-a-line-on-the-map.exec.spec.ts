// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Activate measurement tool
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  await measurementToggle.click({ force: true });

  // Verify measurement panel is visible
  await expect(page.getByTestId('measurement-panel')).toBeVisible();

  // 2. Click several points on the map to draw a line
  // Get the initial center of the map to use as a reference point for clicks
  const initialCenter = await getMapCenter(page);
  expect(initialCenter).toBeDefined();
  const center = initialCenter!;

  // Click a few points on the map to create a line
  // Point 1: near center
  await page.getByTestId('map-container').click({
    position: { x: center[0], y: center[1] }
  });

  // Point 2: offset from center
  await page.getByTestId('map-container').click({
    position: { x: center[0] + 100, y: center[1] - 100 }
  });

  // Point 3: further offset
  await page.getByTestId('map-container').click({
    position: { x: center[0] + 200, y: center[1] - 50 }
  });

  // 3. Double-click to finish the measurement
  await page.getByTestId('map-container').dblclick({
    position: { x: center[0] + 200, y: center[1] - 50 }
  });

  // Wait for the measurement result to settle
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Verify measurement panel displays a length value with a unit
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).toBeVisible();
  
  // Check that the panel contains a length value with a unit (e.g., "12.5 km" or similar)
  const measurementText = await measurementPanel.locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/').textContent();
  expect(measurementText).toBeTruthy();
});
