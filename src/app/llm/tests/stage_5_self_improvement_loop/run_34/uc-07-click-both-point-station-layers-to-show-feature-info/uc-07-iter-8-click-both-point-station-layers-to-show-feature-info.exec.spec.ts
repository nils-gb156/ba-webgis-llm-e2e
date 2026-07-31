// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { getHighlightedCoordinate } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Ensure info panel is visible.
  // From the initial accessibility tree, the "Info Panel Switcher" button is NOT pressed,
  // so the info panel is initially hidden. Click the toggle to open it.
  const infoPanelToggle = page.getByRole('button', { name: 'Info Panel Switcher' });
  await infoPanelToggle.click({ force: true });
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Precondition: Ensure measurement tool is NOT active.
  // From the initial accessibility tree, the "Measurement" button is not pressed.
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click({ force: true });
  }

  // Precondition: Ensure UV-Index Stations and EUCOS Ground Stations are active.
  // From the initial accessibility tree, both checkboxes are already checked.
  // We assert their state to be safe, but no action is needed.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index Stations' });
  const eucosCheckbox = page.getByRole('checkbox', { name: 'EUCOS Ground Stations' });
  await expect(uvIndexCheckbox).toBeChecked();
  await expect(eucosCheckbox).toBeChecked();

  // Step 1: Click at the specified map coordinates [1188692.84, 6767643.28] (EPSG:3857).
  // The use case provides exact coordinates on the map canvas.
  // We click directly on the map container at these coordinates.
  // Note: The map canvas coordinates are in the same coordinate system as the provided EPSG:3857 values
  // relative to the top-left of the map container, assuming the map is rendered with its native resolution.
  // However, Playwright's `position` option is relative to the element's top-left corner.
  // The provided coordinates [1188692.84, 6767643.28] are in map projection units (meters), not pixels.
  // We need to convert them to pixel coordinates.
  // Since we don't have a direct conversion helper, we can use the map model to get the current center
  // and zoom, and then calculate the pixel position.
  // Alternatively, we can use the `getHighlightedCoordinate` helper to verify the click was successful.
  // Let's first try to click at a position that is likely to be near the given coordinates.
  // We will get the bounding box of the map container and calculate the position.
  const mapContainer = page.getByTestId('map-container');
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container bounding box not found');
  }

  // Get the current map center and zoom to calculate the pixel position.
  // This is a bit complex, so let's try a simpler approach first: click near the center.
  // If the test fails, we can refine the calculation.
  // However, the use case specifies exact coordinates, so we must try to click there.
  // Let's use the map model to get the center and zoom, and then calculate the pixel position.
  // We'll use `page.evaluate` to get the map model's center and zoom.
  const mapState = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return null;
    const view = map.olMap.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const resolution = view.getResolutionForZoom(zoom);
    return { center, zoom, resolution };
  });

  if (!mapState) {
    throw new Error('Map model not available');
  }

  // Calculate the pixel position from the provided coordinates.
  // The formula is: pixelX = (targetX - centerX) / resolution + mapWidth / 2
  // pixelY = (targetY - centerY) / resolution + mapHeight / 2
  const targetX = 1188692.84;
  const targetY = 6767643.28;
  const centerX = mapState.center[0];
  const centerY = mapState.center[1];
  const resolution = mapState.resolution;
  const mapWidth = mapBox.width;
  const mapHeight = mapBox.height;

  const pixelX = (targetX - centerX) / resolution + mapWidth / 2;
  const pixelY = (targetY - centerY) / resolution + mapHeight / 2;

  // Click on the map container at the calculated pixel position.
  await mapContainer.click({ position: { x: pixelX, y: pixelY } });

  // Step 2: Wait for the info panel to load the station info for both layers.
  // We expect to see sections for both UV-Index Station and EUCOS Ground Station.
  // First, wait for a highlight to appear, indicating the click was processed.
  await expect.poll(() => getHighlightedCoordinate(page)).toBeDefined();

  // Wait for and verify the UV-Index Station info section
  await expect.poll(() => infoPanel.getByRole('heading', { name: 'UV-Index Station' }).isVisible()).toBeTruthy();

  // Wait for and verify the EUCOS Ground Station info section
  await expect.poll(() => infoPanel.getByRole('heading', { name: 'EUCOS Ground Station' }).isVisible()).toBeTruthy();
});
