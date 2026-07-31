// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure both layers are rendered and ready before clicking
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure the map is ready and the center is set before we proceed.
  await expect.poll(() => getMapCenter(page)).toBeTruthy();

  // The target coordinates are in EPSG:3857. We click the map container at those coordinates.
  // Playwright's click({ position }) takes pixel offsets relative to the element.
  // We use page.evaluate to convert the EPSG:3857 coordinates to pixel offsets on the map canvas.
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

  if (!pixelOffsets) {
    throw new Error('Could not convert coordinates to pixel offsets.');
  }

  // Click on the map at the calculated pixel offsets.
  await page.getByTestId('map-container').click({
    position: { x: pixelOffsets[0], y: pixelOffsets[1] },
    force: true,
  });

  // Wait for the info panel to load the station info for both layers.
  // The info panel should now contain sections for both 'UV-Index Station' and 'EUCOS Ground Station'.
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUviHeading = await infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible().catch(() => false);
    const hasEcosHeading = await infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible().catch(() => false);
    return { hasUviHeading, hasEcosHeading };
  }).toEqual({ hasUviHeading: true, hasEcosHeading: true });
});
