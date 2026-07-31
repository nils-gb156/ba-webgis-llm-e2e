// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();

  // Ensure both station layers are rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Ensure the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates
  await page.locator('[data-testid="map-container"]').click({
    position: { x: 500, y: 300 },
  });

  // Wait for the info panel to load the station info for both layers
  await expect(page.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
