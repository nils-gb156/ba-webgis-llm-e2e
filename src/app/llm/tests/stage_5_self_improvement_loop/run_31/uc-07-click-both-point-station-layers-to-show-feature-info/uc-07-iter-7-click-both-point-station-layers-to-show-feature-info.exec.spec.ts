// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapZoomLevel, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready before proceeding.
  await expect.poll(() => getMapZoomLevel(page)).toBeTruthy();

  // The coordinates are in EPSG:3857. We use page.evaluate to convert them to
  // pixel positions relative to the map container, since the map is a canvas.
  const pixelCoords = await page.evaluate(
    async ({ x, y }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: number[]) => number[] } } }).__openPioneerMap;
      if (!map?.olMap?.getPixelFromCoordinate) {
        return null;
      }
      return map.olMap.getPixelFromCoordinate([x, y]);
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
