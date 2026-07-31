// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure measurement tool is not active (it intercepts clicks)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Wait for measurement panel to close before clicking on the map
  await expect(page.getByRole('dialog', { name: 'Measurement' })).not.toBeVisible();

  // Click on the map at the specified coordinates
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857.
  // We need to convert these to pixel coordinates relative to the map container.
  // Since we can't easily do this conversion in the test without knowing the map's current view,
  // we will use the map model helpers to get the current view and then convert.
  // However, a simpler approach is to click on the map and then check if the feature info appears.
  // The problem is that we need to click at a specific location where both stations are present.
  // Let's use the map model to get the center and zoom, and then click at the center.
  // But the coordinates [1188692.84, 6767643.28] are not the center of the map.
  // We need to find a way to click at the specific coordinates.

  // Since the map is rendered on a canvas, we can't directly click at a specific coordinate.
  // We need to use the map model to convert the coordinate to a pixel position.
  // Let's use page.evaluate to do this conversion.

  const pixelPosition = await page.evaluate(
    ({ x, y }: { x: number; y: number }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate?: (coord: [number, number]) => [number, number] } } }).__openPioneerMap;
      if (!map?.olMap?.getPixelFromCoordinate) {
        return null;
      }
      const pixel = map.olMap.getPixelFromCoordinate([x, y]);
      return pixel;
    },
    { x: 1188692.84, y: 6767643.28 }
  );

  if (pixelPosition) {
    await page.getByTestId('map-container').click({
      position: { x: pixelPosition[0], y: pixelPosition[1] },
    });
  } else {
    // Fallback: click at the center of the map if conversion fails
    await page.getByTestId('map-container').click({
      position: { x: 0, y: 0 },
      force: true,
    });
  }

  // Wait for the info panel to show feature info for both layers
  // The info panel contains the feature info sections after a click
  // We need to wait for the feature info to be loaded, which might take some time
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').textContent()).toContain('EUCOS Ground Station');
});
