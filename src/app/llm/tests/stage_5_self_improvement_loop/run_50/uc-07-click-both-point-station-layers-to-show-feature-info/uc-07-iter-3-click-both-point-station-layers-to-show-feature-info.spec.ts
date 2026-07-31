// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: info panel is visible (already visible on initial load)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: UV-Index Stations layer is active/rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Precondition: EUCOS Ground Stations layer is active/rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857)
  // The coordinates are in map projection (EPSG:3857), but the click position
  // must be in CSS pixels relative to the map container.
  // We'll use page.evaluate to do this conversion using the map model.
  const clickPosition = await page.evaluate(async () => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return null;
    const olMap = map.olMap;
    const view = olMap.getView();
    // Convert from EPSG:3857 to pixel coordinates
    const pixel = olMap.getPixelFromCoordinate([1188692.84, 6767643.28]);
    return pixel;
  });

  if (clickPosition) {
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
      position: { x: clickPosition[0], y: clickPosition[1] },
    });
  } else {
    // Fallback: try clicking at a reasonable position if conversion fails
    // This should not happen in normal circumstances
    const mapContainer = page.getByTestId('map-container');
    await mapContainer.click({
      position: { x: 500, y: 300 },
    });
  }

  // Step 2: Wait for the info panel to load the station info for both layers.
  // Expected results:
  // - The info panel displays a 'UV-Index Station' section with feature information.
  // - The info panel displays an 'EUCOS Ground Station' section with feature information.

  // Wait for the info panel to show UV-Index Station content
  // Use toBeVisible with a longer timeout and poll to ensure the content is loaded
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uviHeading = infoPanel.getByRole('heading', { name: 'UV-Index Station' });
    const eucosHeading = infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' });
    const uviVisible = await uviHeading.isVisible();
    const eucosVisible = await eucosHeading.isVisible();
    return { uviVisible, eucosVisible };
  }).toEqual({ uviVisible: true, eucosVisible: true });
});
