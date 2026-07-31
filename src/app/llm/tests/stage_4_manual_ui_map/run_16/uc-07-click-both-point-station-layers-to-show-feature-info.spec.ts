// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 7: Click both point station layers to show feature info', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify preconditions: Required layers are rendered
  await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
  await expect.poll(() => isLayerRendered(page, 'EUCOS Ground Stations')).toBe(true);

  // Step 1: Click on the map at the specific coordinates where both stations exist
  const mapContainer = page.getByTestId('map-container');
  await mapContainer.click({
    position: {
      x: 1188692.84,
      y: 6767643.28,
    },
  });

  // Step 2: Wait for the info panel to load the station info for both layers
  // The info panel is visible by default, but the specific sections appear after feature info loads
  
  // Wait for UV-Index Station info section to appear
  const uviStationInfo = page.getByTestId('uvi-station-info');
  await expect(uviStationInfo).toBeVisible();

  // Wait for EUCOS Ground Station info section to appear
  const eucosStationInfo = page.getByTestId('eucos-station-info');
  await expect(eucosStationInfo).toBeVisible();

  // Verify that the weather forecast section is NOT visible (since we clicked on a station, not a generic location)
  // Note: The prompt doesn't explicitly state this, but it's a reasonable expectation for a station click.
  // However, to stick strictly to the expected results, we just assert the presence of the station info.
});
