// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: UV-Index Stations and EUCOS Ground Stations layers are active
  await expect.poll(() => getMapZoomLevel(page)).toBeDefined();
  await expect.poll(() => getMapCenter(page)).toBeDefined();
  await expect.poll(() => page.evaluate(() => getMapZoomLevel())).resolves.toBeDefined();
  await expect.poll(() => page.evaluate(() => getMapCenter())).resolves.toBeDefined();
  
  // Wait for layers to be rendered
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap?.layers.getOperationalLayers().some((l: any) => l.title === 'UV-Index Stations' && l.visible))).toBe(true);
  await expect.poll(() => page.evaluate(() => (globalThis as any).__openPioneerMap?.layers.getOperationalLayers().some((l: any) => l.title === 'EUCOS Ground Stations' && l.visible))).toBe(true);

  // Convert EPSG:3857 coordinates to pixel coordinates on the map canvas
  const targetCoords = { x: 1188692.84, y: 6767643.28 };
  const pixelCoords = await page.evaluate(
    async ({ x, y }) => {
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
  // Use .first() to resolve the strict mode violation caused by multiple canvases.
  // The highlight layer canvas might intercept pointer events, so we use force: true
  // to ensure the click goes through to the underlying map canvas.
  await page.locator('canvas').first().click({
    position: { x: pixelCoords.x, y: pixelCoords.y },
    force: true,
  });

  // Wait for the info panel to load the feature information for both layers.
  await expect.poll(async () => {
    const panel = page.getByTestId('info-panel');
    const hasUvi = await panel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible();
    const hasEcos = await panel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible();
    return { hasUvi, hasEcos };
  }).toEqual({ hasUvi: true, hasEcos: true });
});
