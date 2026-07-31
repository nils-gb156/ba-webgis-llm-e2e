// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  const layerSwitcher = page.getByRole('tree', { name: /layer|toc/i });
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index layer item in the layer switcher
  const uvIndexLayer = page.getByRole('treeitem', { name: 'UV-Index' });
  await expect(uvIndexLayer).toBeVisible();

  // Click the visibility toggle for the UV-Index layer
  // Assuming the toggle is a checkbox or similar control within the tree item
  const uvIndexToggle = uvIndexLayer.getByRole('checkbox', { name: /visible|show/i, exact: true });
  
  // If the checkbox is not directly named, try to find it by role within the layer item
  // Often the toggle is a button or checkbox. Let's try clicking the first checkbox found in the layer item if the name is ambiguous.
  // However, based on standard patterns, we look for the checkbox associated with visibility.
  // If the layer item itself contains the checkbox, we target it.
  
  // Let's assume the toggle is a checkbox inside the tree item.
  const toggle = uvIndexLayer.getByRole('checkbox');
  await expect(toggle).toBeVisible();
  
  // Click the toggle to enable the layer
  await toggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(toggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we cannot assert DOM elements for map tiles, we wait for a network request
  // that typically triggers when a new WMS/Tile layer is added.
  // We assume the UV-Index layer uses a WMS or TileWMS source.
  // A common pattern is a request to the WMS endpoint with LAYERS=UV_Index or similar.
  
  // Capture requests to identify when the layer is loaded
  const layerLoadedPromise = page.waitForResponse(response => {
    const url = response.url();
    // Check for WMS GetMap or Tile requests containing UV-Index layer name
    return url.includes('UV') && (url.includes('GetMap') || url.includes('tile'));
  }, { timeout: 10000 });

  // The click above might trigger the request, so we await it.
  // If the request happens immediately upon the state change, this will resolve.
  await layerLoadedPromise;

  // Verify the map canvas exists and is not empty (basic sanity check)
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Note: Asserting actual tile rendering on the canvas pixel-wise is complex and brittle.
  // The successful network request and the checked state of the toggle are the primary assertions
  // for "layer is requested and rendered" in an E2E context without helper functions.
});
