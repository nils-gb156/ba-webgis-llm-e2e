// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the map is ready and both relevant operational layers are rendered.
  // UV-Index Stations and EUCOS Ground Stations are active by default per the UI Map.
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Ensure measurement tool is not active (it is inactive by default).
  // We assert the measurement panel is not visible to confirm the state.
  await expect(page.getByTestId('measurement-panel')).not.toBeVisible();

  // Step 1: Click at the specific map coordinates where both stations are located.
  // The coordinates are in EPSG:3857. We need to convert them to pixel coordinates
  // relative to the map canvas to click on them.
  // However, Playwright's click on a canvas element usually expects pixel offsets.
  // Since we don't have a direct pixel-to-coordinate converter helper in the prompt,
  // we will use the map container's bounding box and the map's view to calculate the click position.
  // Alternatively, we can rely on the fact that the map model exposes the OL map.
  // Let's use page.evaluate to get the pixel coordinates from the map model.
  const pixelCoordinates = await page.evaluate(
    ([x, y]: [number, number]) => {
      const map = (globalThis as { __openPioneerMap?: { olMap: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap;
      if (!map) {
        throw new Error('Map model not available');
      }
      return map.olMap.getPixelFromCoordinate([x, y]);
    },
    [1188692.84, 6767643.28]
  );

  // Get the bounding box of the map container to calculate the absolute click position
  const mapBox = await page.getByTestId('map-container').boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found');
  }

  const clickX = mapBox.x + pixelCoordinates[0];
  const clickY = mapBox.y + pixelCoordinates[1];

  await page.mouse.click(clickX, clickY);

  // Step 2: Wait for the info panel to load the station info for both layers.
  // The info panel is visible by default. We need to wait for the content to appear.
  // We look for the specific sections in the info panel.
  // Since the exact test ids for the feature info sections are not provided,
  // we will look for the text content within the info panel.
  // We use expect.poll to wait for the content to settle.
  await expect.poll(async () => {
    const infoPanel = page.getByTestId('info-panel');
    const uviText = await infoPanel.getByText('UV-Index Station').first().isVisible();
    const eucosText = await infoPanel.getByText('EUCOS Ground Station').first().isVisible();
    return { uvi: uviText, eucos: eucosText };
  }).toEqual({ uvi: true, eucos: true });

  // Verify the info panel is visible
  await expect(page.getByTestId('info-panel')).toBeVisible();
});
