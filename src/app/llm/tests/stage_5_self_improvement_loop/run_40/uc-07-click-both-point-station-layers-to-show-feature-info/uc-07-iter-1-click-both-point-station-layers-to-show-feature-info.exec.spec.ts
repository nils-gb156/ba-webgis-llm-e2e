// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered, getMapCenter, getMapZoomLevel } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure both layers are rendered and ready before clicking
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // The target coordinates are in EPSG:3857, but the map click() method expects
  // pixel offsets within the map container. We must first pan/zoom the map so that
  // the target coordinates fall within the visible viewport, then convert them
  // to pixel offsets.

  // Step 1: Pan the map to the target coordinates so they are visible.
  // We use the map model helper to set the center to the target coordinates.
  await page.evaluate(
    ([x, y]) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { setCenter: (c: [number, number]) => void } } } }).__openPioneerMap;
      if (map?.olMap?.getView) {
        map.olMap.getView().setCenter([x, y] as [number, number]);
      }
    },
    [1188692.84, 6767643.28],
  );

  // Wait for the map view to settle after panning
  await expect.poll(async () => {
    const center = await getMapCenter(page);
    return center !== undefined;
  }).toBeTruthy();

  // Step 2: Zoom in sufficiently so the stations are clearly visible and clickable.
  // The initial zoom is very low (around 1). We'll zoom in to level 10 for better precision.
  await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { setZoom: (z: number) => void } } } }).__openPioneerMap;
    if (map?.olMap?.getView) {
      map.olMap.getView().setZoom(10);
    }
  });

  // Wait for the zoom level to settle
  await expect.poll(() => getMapZoomLevel(page)).toBe(10);

  // Step 3: Convert the target EPSG:3857 coordinates to pixel offsets within the map container.
  const pixelOffsets = await page.evaluate(
    ([x, y]) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate: (c: [number, number]) => [number, number] } } }).__openPioneerMap;
      if (map?.olMap?.getPixelFromCoordinate) {
        return map.olMap.getPixelFromCoordinate([x, y] as [number, number]);
      }
      return null;
    },
    [1188692.84, 6767643.28],
  );

  // If we couldn't get pixel offsets, we can't proceed reliably.
  if (!pixelOffsets) {
    throw new Error('Could not convert coordinates to pixel offsets.');
  }

  // Step 4: Click on the map at the calculated pixel offsets.
  // We use force: true because the map canvas might have overlays or the container
  // might have pointer-events issues. The canvas itself should receive the click.
  await page.getByTestId('map-container').click({
    position: { x: pixelOffsets[0], y: pixelOffsets[1] },
    force: true,
  });

  // Step 5: Wait for the info panel to load the station info for both layers.
  // The info panel should now contain sections for both 'UV-Index Station' and 'EUCOS Ground Station'.
  // We use expect.poll to wait for the content to appear asynchronously.
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUviHeading = await infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible().catch(() => false);
    const hasEcosHeading = await infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible().catch(() => false);
    return { hasUviHeading, hasEcosHeading };
  }).toEqual({ hasUviHeading: true, hasEcosHeading: true });
});
