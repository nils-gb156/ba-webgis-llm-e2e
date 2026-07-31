// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered, getHighlightedCoordinate } from '../../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: info panel visible, both station layers rendered
  await expect(page.getByTestId('info-panel')).toBeVisible();

  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const measurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (measurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Click at the specified coordinates on the map canvas
  // The coordinates are in EPSG:3857 (map projection). The map canvas
  // expects pixel coordinates relative to the top-left of the element.
  // We use page.evaluate to convert EPSG:3857 to pixel coordinates on the map container.
  const [clickX, clickY] = await page.evaluate(
    async ([x, y]) => {
      const mapEl = document.querySelector('.map-container-root') as HTMLDivElement | null;
      if (!mapEl) return [0, 0];

      // Get the map model from globalThis (set by the application)
      const mapModel = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      if (!mapModel) return [0, 0];

      // Convert EPSG:3857 to pixel coordinates using the OL map
      const olMap = mapModel.olMap;
      const pixel = olMap.getPixelFromCoordinate([x, y] as [number, number]);
      return [pixel[0], pixel[1]];
    },
    [1188692.84, 6767643.28]
  );

  await page.getByTestId('map-container').click({
    position: { x: clickX, y: clickY },
  });

  // Wait for the info panel to load feature info for both layers
  // Use getByText for the headings as they may not have an accessible role
  await expect.poll(() =>
    page.getByTestId('info-panel').getByText('UV-Index Station', { exact: true }).isVisible()
  ).toBe(true);
  await expect.poll(() =>
    page.getByTestId('info-panel').getByText('EUCOS Ground Station', { exact: true }).isVisible()
  ).toBe(true);

  // Verify that a highlight marker was placed on the map
  await expect.poll(() => getHighlightedCoordinate(page)).toBeTruthy();
});
