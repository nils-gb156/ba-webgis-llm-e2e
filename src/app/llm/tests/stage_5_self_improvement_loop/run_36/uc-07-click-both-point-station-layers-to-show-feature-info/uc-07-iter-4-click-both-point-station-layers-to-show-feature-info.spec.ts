// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure info panel is visible
  await expect(page.getByRole('heading', { name: 'Information', exact: true })).toBeVisible();

  // Close Layer Switcher if open
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  if (await layerSwitcherToggle.getAttribute('aria-pressed') === 'true') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Close Legend if open
  const legendToggle = page.getByTestId('legend-toggle');
  if (await legendToggle.getAttribute('aria-pressed') === 'true') {
    await legendToggle.click({ force: true });
  }

  // Step 1: Click at the specified map coordinates
  // The coordinates are in EPSG:3857 (map projection).
  // We need to convert these to pixel coordinates relative to the map container.
  // We can use the map model helpers to get the current view and calculate the pixel coordinates.
  // The map container's coordinate system is the same as the map's projection (EPSG:3857).
  // We can use page.evaluate to get the pixel coordinates from the map model.
  const pixelCoords = await page.evaluate(
    async ({ x, y }: { x: number; y: number }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
      if (!map) return undefined;
      return map.olMap.getPixelFromCoordinate([x, y]);
    },
    { x: 1188692.84, y: 6767643.28 }
  );

  if (!pixelCoords) {
    throw new Error('Map model not available or coordinates could not be converted.');
  }

  const [clickX, clickY] = pixelCoords;

  // Click on the map container at the calculated pixel coordinates
  await page.getByTestId('map-container').click({
    position: { x: clickX, y: clickY },
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // We wait for the highlights to appear, indicating the map interaction completed
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();

  // Verify that the info panel displays a 'UV-Index Station' section with feature information.
  await expect(page.getByRole('heading', { name: 'UV-Index Station' })).toBeVisible();

  // Verify that the info panel displays an 'EUCOS Ground Station' section with feature information.
  await expect(page.getByRole('heading', { name: 'EUCOS Ground Station' })).toBeVisible();
});
