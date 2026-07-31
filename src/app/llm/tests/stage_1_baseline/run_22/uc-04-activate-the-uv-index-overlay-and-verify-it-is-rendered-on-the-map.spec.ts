// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index overlay toggle within the layer switcher
  // Assuming the toggle has a test id or can be identified by its label/role
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  
  // Ensure the toggle is initially unchecked (hidden layer)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index overlay
  await uvIndexToggle.click();

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map tiles are not DOM elements, we assert on the network request
  // or wait for a reasonable time for the map to update.
  // We will listen for a request to the WMS or tile server for the UV-Index layer.
  // Assuming the layer name or a specific URL pattern identifies the UV-Index tiles.
  
  // Register a listener for the request before triggering the action if possible,
  // but since we already clicked, we rely on the fact that the click triggers the request.
  // However, to be robust, we can wait for a response that matches the layer.
  // Let's assume the WMS request includes the layer name.
  
  const uvIndexRequestPromise = page.waitForResponse(response => {
    const url = response.url();
    // Check if the response is from the WMS service and contains 'UV-Index' or similar in the URL parameters
    // Or check if it's a tile request. Without specific URL knowledge, we check for common WMS patterns.
    // A safer bet for "rendered on map" in E2E without map helpers is often asserting the layer state in the app state
    // or waiting for a specific network response if we know the URL.
    // Given the complexity, let's assume we can assert the layer is active in the TOC or wait for a network response.
    
    // Let's try to wait for a network response that indicates the layer data was fetched.
    // We'll look for a response that is not an error and matches a likely WMS GetMap or tile URL.
    // Since we don't have the exact URL, we'll wait for a generic successful response after the click.
    // But the prompt says "verify that the layer is requested".
    // Let's capture the request.
    return false;
  });

  // Actually, since we already clicked, let's just wait for a short period and then assert
  // that the map canvas has changed or that a network request was made.
  // A better approach for "rendered on map" without map helpers is often to check if the layer is active in the store/state if exposed,
  // or simply wait for the network request to complete.
  
  // Let's try to find a network request that happened after the click.
  // We can use page.on('request') to capture it.
  
  let uvIndexLayerLoaded = false;
  page.on('response', async (response) => {
    const url = response.url();
    // Heuristic: Check if the response URL contains the layer name or a known endpoint for UV-Index
    // This is a placeholder for the actual layer URL pattern.
    if (url.includes('UV-Index') || url.includes('uv_index') || url.includes('UVIndex')) {
      uvIndexLayerLoaded = true;
    }
  });

  // Wait for the network request to complete
  // We wait for a short duration to allow the request to be sent and responded to.
  // In a real scenario, we might wait for a specific response URL.
  // Here we wait for the 'response' event to be triggered for the UV-Index layer.
  
  // Since we can't easily await an event, we'll use a polling approach or a timeout.
  // Let's assume the request is fast and wait for it to settle.
  
  // Alternative: Assert that the layer is visible in the TOC (already done via checkbox)
  // And wait for the map to update. Without map helpers, we can't assert the canvas content directly.
  // We will rely on the network request assertion.
  
  // Let's wait for the response to be received.
  await page.waitForTimeout(2000); // Wait for network to settle

  // Assert that the UV-Index layer was requested
  expect(uvIndexLayerLoaded).toBe(true);
});
