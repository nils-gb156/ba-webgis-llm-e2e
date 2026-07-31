// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure both station layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Click on the map at the specified coordinates.
  // The coordinates are in EPSG:3857; convert to pixel coordinates for the click.
  // We use page.evaluate to convert the map projection coordinates to pixel positions
  // relative to the map container, since the map is a canvas and we need to click
  // at the correct visual position.
  const pixelCoords = await page.evaluate(
    async ({ x, y }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getView?: () => { getResolution?: () => number; getCenter?: () => number[]; getProjection?: () => { getUnits?: () => string } } } } }).__openPioneerMap;
      if (!map?.olMap?.getView) return null;
      const view = map.olMap.getView();
      const resolution = view.getResolution();
      const center = view.getCenter();
      if (!center || !resolution) return null;
      // Simple conversion: pixel = (coord - center) / resolution + halfSize
      // We need the map container size. We'll get it via a separate eval or assume
      // a reasonable approach. Actually, Playwright's click with position is relative
      // to the element's top-left. We need to convert EPSG:3857 to pixel offset.
      // A simpler approach: use the map's getPixelFromCoordinate if available,
      // but we are in evaluate. Let's use the olMap's getPixelFromCoordinate.
      const pixel = map.olMap.getPixelFromCoordinate([x, y]);
      return pixel;
    },
    { x: 1188692.84, y: 6767643.28 }
  );

  if (!pixelCoords) {
    throw new Error('Could not get map coordinates for click');
  }

  const [clickX, clickY] = pixelCoords;

  // Click on the map container at the calculated pixel coordinates
  await page.getByTestId('map-container').click({
    force: true,
    position: { x: clickX, y: clickY },
  });

  // Wait for the info panel to display feature information for both station types.
  // The headings in the info panel might be "UV-Index Station" and "EUCOS Ground Station".
  // We'll look for these headings within the info panel.
  const infoPanel = page.getByTestId('info-panel');

  // Wait for the UV-Index Station info
  await expect(infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible({ timeout: 10000 });

  // Wait for the EUCOS Ground Station info
  await expect(infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible({ timeout: 10000 });
});
