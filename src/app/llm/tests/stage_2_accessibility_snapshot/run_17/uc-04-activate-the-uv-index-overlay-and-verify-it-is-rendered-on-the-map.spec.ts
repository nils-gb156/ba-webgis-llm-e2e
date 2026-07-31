// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Register listener for network requests to verify the layer tiles are requested
  const uvIndexTileRequests: any[] = [];
  page.on('request', (request) => {
    const url = request.url();
    // UV-Index tiles typically come from a WMS or tile endpoint.
    // We look for requests that are likely UV-Index related.
    // Since we don't have the exact URL pattern, we'll look for WMS GetMap or tile requests
    // and filter by the fact that the UV-Index layer was just activated.
    // A more robust way would be to check the layer name in the request parameters if it's WMS.
    // For now, we assume that activating the layer triggers tile requests.
    if (url.includes('wms') || url.includes('tiles') || url.includes('UV-Index')) {
      uvIndexTileRequests.push(request);
    }
  });

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The UV-Index checkbox is in the layer switcher
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).toBeChecked({ checked: false });
  await uvIndexCheckbox.click();

  // Step 2: Wait for the map to load the layer tiles
  // We use expect.poll to wait for the checkbox to be checked
  await expect.poll(async () => {
    return await uvIndexCheckbox.isChecked();
  }).toBe(true);

  // Wait for some network activity related to the layer
  // We'll wait for at least one request that matches our pattern
  await expect.poll(async () => {
    return uvIndexTileRequests.length;
  }).toBeGreaterThan(0);

  // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
  // This is already asserted above.

  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  // Since we can't directly assert on the canvas content, we verify that the layer
  // is active and that network requests were made for its tiles.
  // We also check that the UV-Index legend is visible, which implies the layer is loaded.
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
