// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure info panel is visible (it is visibleByDefault, but we click the toggle to be explicit/ensure state)
  const infoPanel = page.getByTestId('info-panel');
  const infoPanelToggle = page.getByTestId('info-panel-toggle');
  
  // If the panel is not visible, click the toggle to show it
  const isPanelVisible = await infoPanel.isVisible();
  if (!isPanelVisible) {
    await infoPanelToggle.click();
    await expect(infoPanel).toBeVisible();
  }

  // Step 1: Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  const targetX = 1188692.84;
  const targetY = 6767643.28;

  // We need to convert EPSG:3857 coordinates to pixel coordinates on the canvas to click.
  // However, Playwright's click with page coordinates or locator coordinates is easier if we can find the element.
  // Since the map is a canvas, we can use page.mouse.click with calculated coordinates, 
  // but we need the map's viewport center and zoom to calculate the pixel position.
  // Alternatively, we can rely on the fact that the prompt gives us the exact coordinates and implies we should click there.
  // A robust way in Playwright for canvas maps without helper-to-pixel conversion is often tricky.
  // Let's assume we can click the map container and pass the offset if we knew it, or use page.mouse.
  // Since we don't have a helper to convert EPSG:3857 to pixel, we might need to use page.evaluate to click.
  
  await page.evaluate(({ x, y }) => {
    const map = (globalThis as any).__openPioneerMap;
    if (!map) return;
    // Convert EPSG:3857 to pixel coordinates
    const pixel = map.olMap.getPixelFromCoordinate([x, y]);
    if (pixel) {
      // Click on the canvas element
      const canvas = map.olMap.getTargetElement() as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new MouseEvent('click', {
        clientX: rect.left + pixel[0],
        clientY: rect.top + pixel[1],
        bubbles: true,
        cancelable: true
      }));
    }
  }, { x: targetX, y: targetY });

  // Step 2: Wait for the info panel to load the station info for both layers
  const uviStationSection = page.getByTestId('uvi-station-section');
  const eucosStationSection = page.getByTestId('eucos-station-section');

  // Assert that both sections are visible
  await expect(uviStationSection).toBeVisible();
  await expect(eucosStationSection).toBeVisible();

  // Assert that the info content within those sections is visible
  const uviStationInfo = page.getByTestId('uvi-station-info');
  const eucosStationInfo = page.getByTestId('eucos-station-info');

  await expect(uviStationInfo).toBeVisible();
  await expect(eucosStationInfo).toBeVisible();
});
