// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: UV-Index Stations and EUCOS Ground Stations layers are active
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the specified coordinates where both stations are located
  await page.click('[data-testid="map-container"]', {
    position: { x: 1188692.84, y: 6767643.28 }
  });

  // Wait for the info panel to load the station info for both layers
  await expect.poll(() => page.locator('[data-testid="uvi-station-info"]').isVisible()).toBe(true);
  await expect.poll(() => page.locator('[data-testid="eucos-station-info"]').isVisible()).toBe(true);
});
