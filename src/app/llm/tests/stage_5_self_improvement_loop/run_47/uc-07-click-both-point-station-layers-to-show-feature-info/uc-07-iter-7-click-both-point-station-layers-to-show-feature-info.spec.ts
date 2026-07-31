// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition checks: verify both station layers are active/rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Precondition: info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Precondition: no measurement tool is active
  const measurementToggle = page.getByTestId('measurement-toggle');
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Step 1: Click at the specified map coordinates on the map canvas
  // Convert EPSG:3857 coordinates to pixel positions relative to the map container.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Use page.evaluate to convert EPSG:3857 coordinates to pixel positions within the map container.
  const pixelPos = await page.evaluate(
    ({ mapBox, x, y }: { mapBox: { x: number; y: number; width: number; height: number }; x: number; y: number }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
      if (!map) return null;
      const pixel = map.olMap.getPixelFromCoordinate([x, y]);
      if (!pixel) return null;
      // Return position relative to the map container's top-left corner
      return {
        x: pixel[0] - mapBox.x,
        y: pixel[1] - mapBox.y
      };
    },
    { mapBox, x: 1188692.84, y: 6767643.28 }
  );

  if (!pixelPos) {
    throw new Error('Could not convert map coordinates to pixel position');
  }

  // Click the map at the calculated pixel position relative to the map container
  await mapContainer.click({ position: { x: pixelPos.x, y: pixelPos.y } });

  // Wait for the map highlight to appear at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Step 2: Wait for the info panel to load feature info for both layers
  const infoPanel = page.getByTestId('info-panel');

  // Wait for the UV-Index Station section to appear
  await expect.poll(() =>
    infoPanel.getByText('UV-Index Station', { exact: false }).isVisible()
  ).toBe(true);

  // Wait for the EUCOS Ground Station section to appear
  await expect.poll(() =>
    infoPanel.getByText('EUCOS Ground Station', { exact: false }).isVisible()
  ).toBe(true);
});
