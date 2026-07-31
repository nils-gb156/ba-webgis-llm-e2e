// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getMapCenter, getMapZoomLevel, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure info panel is visible (it is by default)
  await expect(page.getByTestId('info-panel')).toBeVisible();

  // Ensure no measurement tool is active (it is by default)
  const measurementToggle = page.getByRole('button', { name: 'Measurement' });
  const isMeasurementPressed = await measurementToggle.getAttribute('aria-pressed');
  if (isMeasurementPressed === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Ensure the required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);

  // Convert EPSG:3857 coordinates to pixel coordinates on the map canvas
  const targetX = 1188692.84;
  const targetY = 6767643.28;

  const pixelCoords = await page.evaluate(
    ([targetX, targetY]: [number, number]) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getView: () => { getResolution: () => number; getCenter: () => [number, number] } } } }).__openPioneerMap?.olMap?.getView();
      if (!map) {
        return null;
      }
      const center = map.getCenter();
      const resolution = map.getResolution();
      // Get the map container's dimensions
      const mapContainer = document.querySelector('[data-testid="map-container"]') as HTMLElement;
      if (!mapContainer) {
        return null;
      }
      const width = mapContainer.offsetWidth;
      const height = mapContainer.offsetHeight;
      // Convert EPSG:3857 coordinates to pixel coordinates relative to the map container
      const pixelX = (targetX - center[0]) / resolution + width / 2;
      const pixelY = -(targetY - center[1]) / resolution + height / 2;
      return [pixelX, pixelY];
    },
    [targetX, targetY]
  );

  if (!pixelCoords) {
    throw new Error('Failed to get pixel coordinates for the map click');
  }

  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({ position: { x: pixelCoords[0], y: pixelCoords[1] } });

  // Wait for the info panel to load the station info for both layers
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const hasUVIStation = await infoPanel.getByRole('heading', { name: 'UV-Index Station', exact: true }).isVisible();
    const hasEUCOSStation = await infoPanel.getByRole('heading', { name: 'EUCOS Ground Station', exact: true }).isVisible();
    return { hasUVIStation, hasEUCOSStation };
  }).toEqual({ hasUVIStation: true, hasEUCOSStation: true });

  // Verify that the info panel displays a 'UV-Index Station' section with feature information
  await expect(page.getByTestId('info-panel').getByRole('heading', { name: 'UV-Index Station', exact: true })).toBeVisible();

  // Verify that the info panel displays an 'EUCOS Ground Station' section with feature information
  await expect(page.getByTestId('info-panel').getByRole('heading', { name: 'EUCOS Ground Station', exact: true })).toBeVisible();
});
