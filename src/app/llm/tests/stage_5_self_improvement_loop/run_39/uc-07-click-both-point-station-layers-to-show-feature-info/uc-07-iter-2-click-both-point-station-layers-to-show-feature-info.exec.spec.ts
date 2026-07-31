// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the info panel is visible (it appears pressed in the initial state)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Click on the map at the specified coordinates where both stations are located.
  // The map-container has two canvas elements (OpenLayers map + highlight layer),
  // so we must use .first() to resolve the strict mode violation.
  // Note: The coordinates provided are in EPSG:3857 (map units), not pixel positions.
  // Since we cannot directly click by EPSG:3857 coordinates via Playwright's position option,
  // we first need to convert these coordinates to pixel positions on the canvas.
  // However, looking at the error, the issue is simply that there are 2 canvas elements.
  // The actual click coordinates (pixel positions) are unknown without conversion.
  // Let's re-read the prompt: "Click on the map at the specified coordinates...".
  // The prompt says: "To interact with the map, click the map container element (identified via the context provided in the prompt) with a position option."
  // And: "The map renders on a canvas inside the map-container; use the canvas element directly with the EPSG:3857 coordinates as pixel positions via the position option."
  // This implies the test generator should have converted the coordinates. But it didn't.
  // Since I cannot convert coordinates without knowing the map view (zoom, center), I must assume the provided coordinates are pixel coordinates for the purpose of this fix, or that the map is in a known state.
  // Wait, the error is about strict mode, not about the coordinates being wrong.
  // The previous code used `locator('canvas')` which found 2 canvases.
  // I will use `.first()` to select the first canvas.
  // The coordinates 1188692.84, 6767643.28 are definitely EPSG:3857 values (they are large).
  // Using them as pixel coordinates will click way off-screen.
  // However, the instructions say: "The map renders on a canvas inside the map-container; use the canvas element directly with the EPSG:3857 coordinates as pixel positions via the position option."
  // This is a contradiction in the instructions if the coordinates are indeed EPSG:3857.
  // But looking at the error, the failure is strictly about strict mode.
  // Let's look at the screenshot. The map is visible.
  // If I use `.first()`, I solve the strict mode issue.
  // But will the click land on the stations?
  // The stations are at [1188692.84, 6767643.28].
  // If the map center is around Berlin (approx 4.5e6, 5.8e6), these coordinates are far away.
  // Let's check the initial extent. The screenshot shows Germany/Poland/Netherlands.
  // Berlin is approx 4.5e6, 5.8e6.
  // 1.1e6, 6.7e6 is in the North Sea / Denmark area.
  // The screenshot shows blue dots everywhere.
  // Let's assume the test generator made a mistake in the coordinate interpretation or the map is centered differently.
  // But my job is to fix the *test* so it *passes*.
  // If I click at pixel (1188692, 6767643), it will likely click outside the canvas if the canvas is 1920x1039.
  // Playwright will throw an error if the position is outside the element.
  // So I must convert the coordinates.
  // I can use the map model helpers to get the current view and convert.
  // Or, I can use `page.locator('canvas').first().click({ position: { x: ..., y: ... } })` but I need pixel coords.
  // Let's use `page.evaluate` to convert the EPSG:3857 coordinates to pixel coordinates on the canvas.
  // Then click.

  // Step 1: Convert EPSG:3857 coordinates to pixel coordinates on the map canvas.
  const pixelCoords = await page.evaluate(
    async ({ x, y }) => {
      const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
      if (!map) return null;
      const olMap = map.olMap;
      const view = olMap.getView();
      const resolution = view.getResolution();
      const center = view.getCenter();
      if (!center) return null;

      // Convert EPSG:3857 to pixel
      const pixelX = ((x - center[0]) / resolution) + olMap.getSize()[0] / 2;
      const pixelY = ((center[1] - y) / resolution) + olMap.getSize()[1] / 2;
      return { x: pixelX, y: pixelY };
    },
    { x: 1188692.84, y: 6767643.28 }
  );

  if (!pixelCoords) {
    throw new Error('Map model not available or could not convert coordinates');
  }

  // Step 2: Click on the map canvas at the calculated pixel position.
  // Use .first() to resolve the strict mode violation caused by multiple canvases.
  await page.locator('canvas').first().click({
    position: { x: pixelCoords.x, y: pixelCoords.y },
  });

  // Step 3: Wait for the info panel to load the feature information for both layers.
  // Use expect.poll to wait for the content to appear.
  await expect.poll(async () => {
    const panel = page.getByTestId('info-panel');
    const hasUvi = await panel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible();
    const hasEcos = await panel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible();
    return { hasUvi, hasEcos };
  }).toEqual({ hasUvi: true, hasEcos: true });
});
