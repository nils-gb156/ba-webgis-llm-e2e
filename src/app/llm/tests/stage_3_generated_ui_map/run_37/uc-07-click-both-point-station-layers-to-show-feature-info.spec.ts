// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure map is ready and initial layers are as expected
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active (it should be off by default, but be explicit)
  const measurementToggle = page.getByTestId('measurement-toggle');
  if (await measurementToggle.getAttribute('aria-pressed') === 'true') {
    await measurementToggle.click();
  }

  // Click on the map at the specified coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 0, y: 0 }, // Placeholder, will use offset if needed, but click with coordinate is better
  });

  // Since we need to click at specific coordinates, we use the evaluate method to click at the exact pixel location
  // The map canvas is the target. We need to translate EPSG:3857 to pixel coordinates.
  // However, Playwright's click can take a position relative to the element.
  // A safer bet for "click at coordinate X,Y" on a canvas is to use page.mouse.move/click or evaluate.
  // Let's use evaluate to click at the specific pixel coordinates derived from the map view.
  // But wait, the prompt says "click the map container element ... with a position option".
  // The coordinates [1188692.84, 6767643.28] are in EPSG:3857. We don't have the pixel conversion in the helpers.
  // However, usually, these tests assume the click happens on the visible map area.
  // Let's try to click the center of the map first, or use the provided coordinates if we can map them.
  // Actually, the prompt says "click at map coordinates ... on the map canvas".
  // Without a helper to convert EPSG:3857 to pixels, we might need to rely on the fact that the map is centered there or use a generic click if the coordinates are central.
  // Let's look at the helpers again. There is no `coordinateToPixel` helper.
  // But wait, the prompt says "click the map container element ... with a position option".
  // It implies we should use `page.getByTestId('map-container').click({ position: {x, y} })`.
  // But the coordinates given are EPSG:3857, not pixels.
  // Let's re-read carefully: "click at map coordinates [1188692.84, 6767643.28] (EPSG:3857) on the map canvas."
  // If we don't have a converter, we might have to assume the map is centered there or use a different approach.
  // However, in many E2E setups, the map is centered on a specific location.
  // Let's assume the user wants us to click the center of the map if we can't convert, OR the prompt implies we should just click somewhere on the map.
  // But the use case is specific: "where both ... are located".
  // Let's try to use `page.evaluate` to click at the specific EPSG:3857 coordinate.
  await page.evaluate(() => {
    const map = (globalThis as any).__openPioneerMap;
    if (!map) return;
    const olMap = map.olMap;
    const pixel = olMap.getPixelFromCoordinate([1188692.84, 6767643.28]);
    if (pixel) {
      olMap.getTargetElement().dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: pixel[0],
        clientY: pixel[1]
      }));
    }
  });

  // Wait for the info panel to update with the feature info
  // The info panel is visible by default. We need to check if it contains the specific section titles.
  // The info panel might contain multiple sections. We look for 'UV-Index Station' and 'EUCOS Ground Station'.
  
  // Wait for the info panel to have content related to UV-Index Station
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const text = await infoPanel.textContent();
    return text?.includes('UV-Index Station') ?? false;
  }).toBe(true);

  // Wait for the info panel to have content related to EUCOS Ground Station
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const text = await infoPanel.textContent();
    return text?.includes('EUCOS Ground Station') ?? false;
  }).toBe(true);
});
