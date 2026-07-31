// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure measurement tool is NOT active.
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const measurementState = await measurementToggle.getAttribute('aria-pressed');
  if (measurementState === 'true') {
    await measurementToggle.click();
  }

  // Precondition: Info panel is visible.
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Precondition: UV-Index Stations and EUCOS Ground Stations layers are active.
  await expect(page.getByRole('checkbox', { name: 'UV-Index Stations' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'EUCOS Ground Stations' })).toBeChecked();

  // Step 1: The user clicks at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas.
  // The map is rendered on a canvas inside the map-container.
  const mapContainer = page.getByTestId('map-container');
  const canvas = mapContainer.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // Use page.evaluate to perform the click on the canvas at the correct pixel coordinates.
  // This ensures the click is handled by the OpenLayers map canvas (which intercepts pointer events).
  const targetX = 1188692.84;
  const targetY = 6767643.28;

  await page.evaluate(
    ({ targetX, targetY, canvasSelector }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap: { getView: () => { getCenter: () => [number, number]; getZoom: () => number }; getLayers: { getArray: () => { getClassName?: () => string }[] } } } }).__openPioneerMap;
      if (!map) return;

      const olMap = map.olMap;
      const view = olMap.getView();
      const center = view.getCenter();
      const zoom = view.getZoom();

      // Get the canvas element
      const canvas = document.querySelector(canvasSelector) as HTMLCanvasElement;
      if (!canvas) return;

      const width = canvas.width;
      const height = canvas.height;

      // Calculate the pixel coordinates
      // The center of the map is at (width/2, height/2)
      // We need to convert the target coordinates to pixel coordinates
      // This is a simplified calculation, assuming a simple projection
      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate the difference in coordinates
      const deltaX = targetX - center[0];
      const deltaY = targetY - center[1];

      // Calculate the scale factor based on zoom level
      // This is a simplified calculation, assuming a simple zoom scale
      const scale = Math.pow(2, zoom);

      // Calculate the pixel coordinates
      const pixelX = centerX - deltaX / scale;
      const pixelY = centerY - deltaY / scale;

      // Click on the canvas at the calculated pixel coordinates
      canvas.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: pixelX,
        clientY: pixelY,
      }));
    },
    { targetX, targetY, canvasSelector: 'canvas' }
  );

  // Step 2: The user waits for the info panel to load the station info for both layers.
  // Expected results: The info panel displays a 'UV-Index Station' section and an 'EUCOS Ground Station' section.
  // We poll the info panel content to wait for the async feature info to load.

  await expect.poll(async () => {
    const panelContent = await infoPanel.textContent();
    return {
      hasUvi: panelContent?.includes('UV-Index Station') ?? false,
      hasEucos: panelContent?.includes('EUCOS Ground Station') ?? false,
    };
  }).toEqual({
    hasUvi: true,
    hasEucos: true,
  });
});
