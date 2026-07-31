// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure required layers are active and visible
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the coordinates where both stations are located
  const targetX = 1188692.84;
  const targetY = 6767643.28;
  await page.locator('[data-testid="map-container"]').click({
    position: { x: targetX, y: targetY },
  });

  // Wait for the feature info to load for both station types
  await expect.poll(() => page.getByTestId('uvi-station-info').isVisible()).toBe(true);
  await expect.poll(() => page.getByTestId('eucos-station-info').isVisible()).toBe(true);

  // Verify the info panel contains the expected sections
  await expect(page.getByTestId('uvi-station-section')).toBeVisible();
  await expect(page.getByTestId('eucos-station-section')).toBeVisible();
});
