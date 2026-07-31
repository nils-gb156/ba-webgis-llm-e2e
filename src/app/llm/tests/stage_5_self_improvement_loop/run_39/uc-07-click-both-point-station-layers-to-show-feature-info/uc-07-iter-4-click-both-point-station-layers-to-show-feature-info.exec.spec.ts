// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: UV-Index Stations and EUCOS Ground Stations layers are active and rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Convert EPSG:3857 coordinates to pixel coordinates on the map canvas
  const targetCoords = { x: 1188692.84, y: 6767643.28 };
  const pixelCoords = await page.evaluate(
    ({ x, y }) => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      if (!map) return null;
      const olMap = map.olMap;
      const view = olMap.getView();
      const resolution = view.getResolution();
      const center = view.getCenter();
      if (!center) return null;

      // Convert EPSG:3857 to pixel
      const pixelX = ((x - center[0]) / resolution) + olMap.getSize()[0] / 2;
      const pixelY = ((center[1] - y) / resolution) + olMap.getSize()[1] / 2;
      return { x: pixelX, y: pixelY };
    },
    targetCoords
  );

  if (!pixelCoords) {
    throw new Error('Map model not available or could not convert coordinates');
  }

  // Click on the map canvas at the calculated pixel position.
  await page.getByTestId('map-container').click({
    position: { x: pixelCoords.x, y: pixelCoords.y },
  });

  // Wait for the info panel to load the feature information for both layers.
  await expect.poll(async () => {
    const panel = page.getByTestId('info-panel');
    const hasUvi = await panel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible();
    const hasEcos = await panel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible();
    return { hasUvi, hasEcos };
  }).toEqual({ hasUvi: true, hasEcos: true });
});
