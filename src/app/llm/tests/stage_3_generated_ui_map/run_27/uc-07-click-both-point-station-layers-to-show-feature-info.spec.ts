// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getMapCenter, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure UV-Index Stations layer is rendered (active and visible)
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Ensure EUCOS Ground Stations layer is rendered (active and visible)
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible (it is visible by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specific coordinates where both stations are located
  // Coordinates are in EPSG:3857
  await page.locator('[data-testid="map-container"]').click({
    position: {
      x: 1188692.84,
      y: 6767643.28
    }
  });

  // Wait for the info panel to update with feature information for both layers
  // The info panel should display sections for both UV-Index Station and EUCOS Ground Station
  
  // Wait for UV-Index Station section to appear
  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: false })).toBeVisible();
  
  // Wait for EUCOS Ground Station section to appear
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: false })).toBeVisible();
});
