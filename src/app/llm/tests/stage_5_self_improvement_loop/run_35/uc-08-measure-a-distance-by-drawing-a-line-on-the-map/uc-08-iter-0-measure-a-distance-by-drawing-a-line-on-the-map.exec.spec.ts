// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 8: Measure a distance by drawing a line on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the 'Measurement' button in the toolbar to open the measurement panel.
  await page.getByTestId('measurement-toggle').click({ force: true });

  // 2. Click several points on the map canvas to draw a line.
  const mapCenter = await getMapCenter(page);
  expect(mapCenter).toBeDefined();

  // Calculate points for a line (e.g., 3 points forming a line)
  const [baseX, baseY] = mapCenter!;
  const point1 = { x: baseX - 100000, y: baseY + 100000 };
  const point2 = { x: baseX, y: baseY };
  const point3 = { x: baseX + 100000, y: baseY - 100000 };

  // Click points on the map
  await page.locator('#map-container').click({ position: point1 });
  await page.locator('#map-container').click({ position: point2 });
  await page.locator('#map-container').click({ position: point3 });

  // 3. Double-click to finish the measurement.
  await page.locator('#map-container').dblclick({ position: point3 });

  // Expected results:
  // - The measurement panel is visible.
  // - The measurement panel displays a length value with a unit.
  
  // The measurement panel is typically part of the info panel or a dedicated panel.
  // Given the UI context, the 'info-panel' seems to be the container for such results.
  // Let's assert the info panel is visible (it was pressed in the initial state, so it should be open).
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Wait for the measurement result to appear. The result usually contains a number and a unit like "km" or "m".
  // We look for text that matches a pattern like "123.45 km" or similar within the info panel.
  // Since we don't have a specific test id for the measurement result, we'll look for text in the info panel.
  // The prompt says "The measurement panel displays a length value with a unit."
  // Let's assume the result is displayed as text within the info panel.
  await expect.poll(() => page.getByTestId('info-panel').locator('text=/\\d+\\.?\\d*\\s*(km|m|mi|ft)/i').first().textContent()).toMatch(/\\d+\\.?\\d*\\s*(km|m|mi|ft)/i);
});
