// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: info panel visible, both station layers active
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active (it intercepts map clicks)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: Click at the specified coordinates on the map canvas.
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  // We convert them to pixel coordinates inside the browser context using
  // the OpenLayers map model, then click at that pixel offset from the
  // map-container's top-left corner.
  const coords = { x: 1188692.84, y: 6767643.28 };
  await page.evaluate(
    async ({ x, y }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
      if (!map?.olMap) return;
      const pixel = map.olMap.getPixelFromCoordinate([x, y]);
      // Click at that pixel relative to the map container
      const box = (await page.locator('[data-testid="map-container"]').boundingBox())!;
      await page.mouse.click(box.x + pixel[0], box.y + pixel[1]);
    },
    coords,
  );

  // Step 2: Wait for the info panel to load feature info for both layers
  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible(),
  ).toBe(true);

  await expect.poll(() =>
    page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible(),
  ).toBe(true);

  // Verify that a highlight marker was placed at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([coords.x, coords.y]);
});
