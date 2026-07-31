// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: Required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click on the map at the specific coordinates where both stations are located
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: { x: 100, y: 100 }, // Click on the map canvas
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // The info panel is visible by default, but the specific sections appear after feature info loads
  const uviStationInfo = page.getByTestId('uvi-station-info');
  const eucosStationInfo = page.getByTestId('eucos-station-info');

  await expect(uviStationInfo).toBeVisible();
  await expect(eucosStationInfo).toBeVisible();
});
