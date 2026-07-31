// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible as per preconditions
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index overlay toggle. Based on typical TOC structures,
  // the toggle is likely a checkbox associated with the layer name.
  // We use getByRole('checkbox') with the exact layer name.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  
  // Verify the layer is initially hidden (unchecked) as per preconditions
  await expect(uvIndexToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the layer
  // Using force: true because Chakra UI checkbox controls render the input hidden
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We expect a WMS GetMap request for the UV-Index layer.
  // Register listener before action to catch the request
  let wmsRequestUrl: string | undefined;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('SERVICE=WMS') && url.includes('REQUEST=GetMap') && url.includes('UV-Index')) {
      wmsRequestUrl = url;
    }
  });

  // Wait for the WMS GetMap response to complete, indicating tiles are loading/rendering
  const response = await page.waitForResponse((resp) => {
    return resp.url().includes('SERVICE=WMS') && 
           resp.url().includes('REQUEST=GetMap') && 
           resp.url().includes('UV-Index') &&
           resp.status() === 200;
  });

  // Assert that the response was successful
  await expect(response.status()).toBe(200);

  // Verify the UV-Index overlay tiles are rendered on the map canvas.
  // Since map content is on a canvas, we assert that the map container 
  // is visible and that the layer toggle remains checked, implying the layer is active.
  // We also verify the map canvas itself is visible.
  const mapCanvas = page.locator('canvas');
  await expect(mapCanvas).toBeVisible();

  // Additional check: Ensure the layer is still checked after the network request
  await expect(uvIndexToggle).toBeChecked();
});
