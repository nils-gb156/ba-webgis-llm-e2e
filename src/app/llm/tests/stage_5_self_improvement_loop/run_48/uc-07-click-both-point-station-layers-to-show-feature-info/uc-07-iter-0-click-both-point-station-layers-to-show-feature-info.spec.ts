// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getHighlightedCoordinate, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Info panel is visible, both layers are active
  await expect(page.getByTestId('info-panel')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click at map coordinates [1188692.84, 6767643.28] (EPSG:3857)
  const targetX = 1188692.84;
  const targetY = 6767643.28;
  const mapContainer = page.getByTestId('map-container');

  // Calculate screen position from map coordinates
  const screenPosition = await page.evaluate(
    ({ mapX, mapY }) => {
      const map = (globalThis as { __openPioneerMap?: { olMap?: { getPixelFromCoordinate: (coord: number[]) => number[] } } }).__openPioneerMap?.olMap;
      if (!map) return null;
      const pixel = map.getPixelFromCoordinate([mapX, mapY]);
      return pixel;
    },
    { mapX: targetX, mapY: targetY },
  );

  if (!screenPosition) {
    throw new Error('Could not calculate screen position from map coordinates');
  }

  await mapContainer.click({
    position: { x: screenPosition[0], y: screenPosition[1] },
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // Expected results: The info panel displays a 'UV-Index Station' section and an 'EUCOS Ground Station' section
  
  // Wait for the highlight to appear at the clicked location
  await expect.poll(() => getHighlightedCoordinate(page)).toEqual([targetX, targetY]);

  // Wait for the info panel to show content for both layers
  // The info panel should contain text indicating both station types
  await expect.poll(() => page.getByTestId('info-panel').innerText()).toContain('UV-Index Station');
  await expect.poll(() => page.getByTestId('info-panel').innerText()).toContain('EUCOS Ground Station');
});
