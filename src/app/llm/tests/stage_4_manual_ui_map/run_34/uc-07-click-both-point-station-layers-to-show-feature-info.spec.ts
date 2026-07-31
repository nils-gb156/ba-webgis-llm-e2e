// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC-7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible (it is visible by default, but ensure it's not toggled off)
  const infoPanel = page.getByTestId('info-panel');
  await expect(infoPanel).toBeVisible();

  // Ensure measurement tool is not active (it is hidden by default)
  const measurementPanel = page.getByTestId('measurement-panel');
  await expect(measurementPanel).not.toBeVisible();

  // Step 1: Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 0, y: 0 }, // Clicking the container itself; we need to calculate position relative to the map element
  });

  // Since we need to click at specific map coordinates [1188692.84, 6767643.28],
  // we must convert them to pixel coordinates relative to the map container.
  // However, Playwright's click with position is relative to the top-left of the element.
  // We need to find the center of the map or use page.mouse.click with page coordinates.
  // Let's use page.mouse.click which allows absolute page coordinates.
  // First, get the bounding box of the map container to convert map coords to page coords.
  // But wait, the helper functions use page.evaluate, so we can do the conversion inside evaluate too.
  
  // Actually, a simpler way for E2E is to use the map's view to convert coordinates to pixels.
  // We can use the map model helper to get the center and zoom, then calculate, but that's complex.
  // Alternatively, we can use the `page.mouse.click(x, y)` with coordinates derived from the map.
  
  // Let's use the map's `getPixelFromCoordinate` method via evaluate.
  const pixelCoords = await page.evaluate(() => {
    const map = (globalThis as { __openPioneerMap?: any }).__openPioneerMap;
    if (!map) return null;
    const pixel = map.olMap.getPixelFromCoordinate([1188692.84, 6767643.28]);
    return pixel;
  });

  if (!pixelCoords) {
    throw new Error('Map model not ready or coordinates invalid');
  }

  // Get the bounding box of the map container to determine the offset
  const mapBoundingBox = await mapContainer.boundingBox();
  if (!mapBoundingBox) {
    throw new Error('Map container bounding box not found');
  }

  // Calculate the page coordinates for the click
  const clickX = mapBoundingBox.x + pixelCoords[0];
  const clickY = mapBoundingBox.y + pixelCoords[1];

  // Click at the calculated page coordinates
  await page.mouse.click(clickX, clickY);

  // Step 2: Wait for the info panel to load the station info for both layers
  // The info panel should show sections for both UVI and EUCOS stations
  const uviStationSection = page.getByTestId('uvi-station-section');
  const eucosStationSection = page.getByTestId('eucos-station-section');

  // Wait for both sections to be visible
  await expect(uviStationSection).toBeVisible({ timeout: 10000 });
  await expect(eucosStationSection).toBeVisible({ timeout: 10000 });

  // Verify that the sections contain feature information
  // The sections themselves are visible, and they contain info elements
  const uviStationInfo = page.getByTestId('uvi-station-info');
  const eucosStationInfo = page.getByTestId('eucos-station-info');

  await expect(uviStationInfo).toBeVisible();
  await expect(eucosStationInfo).toBeVisible();
});
