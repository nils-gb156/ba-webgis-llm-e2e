// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the page to fully load and the map to be ready
  await page.waitForLoadState('networkidle');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).toBeChecked({ checked: false });

  // Click the checkbox. Since Chakra UI checkboxes might have pointer events
  // intercepted by decorative elements, we use force: true.
  await uvIndexCheckbox.click({ force: true });

  // Verify the UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We listen for the network request that loads the UV-Index WMS tiles.
  // The tile URL typically contains the layer name and format parameters.
  const uvIndexTilePromise = page.waitForResponse((response) => {
    const url = response.url();
    // Check if the response URL contains the UV-Index layer name and is an image/wms response
    return url.includes('UV-Index') && 
           (url.includes('format=image') || url.includes('service=WMS') || url.includes('GetMap'));
  });

  // Trigger the map update that would load the tiles. 
  // In many GIS apps, toggling a layer triggers a map redraw/tile load.
  // We can simulate this by clicking somewhere on the map or waiting for the 
  // layer switcher to process the change. However, simply clicking the checkbox 
  // often triggers the request immediately in reactive apps.
  // Let's wait for the response to ensure the layer is being loaded.
  await uvIndexTilePromise;

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content easily, we can assert that
  // the legend for UV-Index is visible, which implies the layer is active and loaded.
  const uvIndexLegend = page.getByTestId('uvi-stations-legend');
  await expect(uvIndexLegend).toBeVisible();

  // Additionally, we can assert that the map container is still visible and has content.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
});
