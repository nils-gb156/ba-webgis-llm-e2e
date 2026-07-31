// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the layer switcher to be visible
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();

  // Locate the UV-Index layer toggle in the layer switcher
  // Assuming the layer switcher has a test id or is accessible via role
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Find the UV-Index layer toggle. It should be a checkbox or switch.
  // We look for a checkbox associated with the text "UV-Index"
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await expect(uvIndexToggle).toBeVisible();

  // The layer is initially hidden, so the checkbox should be unchecked
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the layer
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now in the checked state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we cannot directly assert on the canvas content, we wait for a reasonable time
  // or check for a network response if we knew the specific WMS request.
  // However, the prompt implies we should verify it is rendered.
  // Without helper functions for map state, we can assert the UI state (checked toggle)
  // and potentially wait for the map to be idle or for a specific network request.
  // Let's assume there's a WMS request for the UV-Index layer.
  
  // Register a listener for the WMS GetMap request for the UV-Index layer
  let uvIndexRequestCaptured = false;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('UV-Index') && url.includes('GetMap')) {
      uvIndexRequestCaptured = true;
    }
  });

  // Wait for the request to be sent
  await expect.poll(() => uvIndexRequestCaptured).toBe(true);

  // Additionally, we can wait for the response to ensure the tile is loaded
  const responsePromise = page.waitForResponse((response) => {
    return response.url().includes('UV-Index') && response.url().includes('GetMap') && response.status() === 200;
  });
  await responsePromise;

  // The map canvas should now contain the UV-Index tiles.
  // Since we cannot directly inspect the canvas, we rely on the successful network request
  // and the UI state change as indicators that the layer is active and rendered.
  // In a real-world scenario with helper functions, we would check the map state.
  // Here, we assert the UI state which is the primary verification point available.
  await expect(uvIndexToggle).toBeChecked();
});
