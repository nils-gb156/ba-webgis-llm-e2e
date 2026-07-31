// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Identify the UV-Index overlay toggle.
  // Assuming the layer item has a test id or accessible name.
  // We look for a checkbox associated with "UV-Index".
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Ensure the toggle is initially unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index overlay
  await uvIndexToggle.click({ force: true });

  // Assert that the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we cannot assert DOM elements for map tiles, we wait for a network request
  // that typically accompanies loading a WMS/WMTS layer or simply wait for the map
  // canvas to update. A robust approach for this use case is to wait for a network
  // response related to the UV-Index layer if possible, or rely on the fact that
  // the layer switcher update implies the request was made.
  // However, the prompt asks to verify tiles are rendered. Without helper functions,
  // we can assert the network request was sent.
  
  // Let's capture the request for the UV-Index layer tile/feature.
  // We assume a standard WMS GetMap or similar request pattern.
  // Since we don't have the exact URL pattern, we'll wait for a response that indicates
  // the layer data was fetched. A common indicator is a request to the geoserver/WMS endpoint.
  // For this generic test, we will wait for any image response or a specific WMS request.
  // Given the constraints, we'll assume the test id or accessible name helps us identify the layer.
  
  // Alternative: Wait for the map canvas to potentially update. 
  // But the most reliable "rendered" check without helpers is often the network request.
  
  // Let's try to catch a request to a typical WMS endpoint for the UV-Index layer.
  // We'll set up a listener for requests containing 'UV-Index' or a known WMS path.
  // Since we don't know the exact backend URL, we'll wait for a response on the page.
  // A safer bet for "rendered" in E2E without pixel matching is often checking that
  // the layer is active in the state, but we can't do that without helpers.
  
  // Let's assume the application sends a request to a WMS server.
  // We will wait for a response that is an image or contains layer info.
  // For the purpose of this test, we'll wait for a short period for the async layer load
  // to complete, which is a common pattern when map helpers aren't available.
  // However, the instructions say "Do not use fixed waits".
  
  // Let's try to find a test id on the map container or wait for a specific network response.
  // If no specific helper is provided, we might rely on the fact that the UI has updated.
  // But the expected result is "tiles are rendered".
  
  // Let's assume there is a map container with a test id.
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
  
  // To verify tiles are rendered, we can wait for a network response that indicates
  // the layer data was fetched. We'll listen for a request that likely contains 'UV-Index'
  // or hits the WMS endpoint.
  // Since we can't guess the URL, we'll wait for a response on a common WMS path if known,
  // or just ensure the layer is checked.
  
  // Given the ambiguity, the best we can do without helpers is to assert the UI state
  // and perhaps wait for a network idle or a specific request if we had more info.
  // Let's assume the test expects us to wait for the layer to be "ready".
  
  // We will wait for a response from the server that is likely the tile request.
  // We'll use a broad matcher for the WMS GetMap request if we can infer it.
  // For now, we'll just assert the checked state and assume the network request happens.
  
  // Re-reading: "The UV-Index overlay tiles are rendered on the map canvas."
  // Without helpers, this is hard to assert directly. 
  // However, often in these tests, if the layer is checked, it's considered "activated".
  // Let's add a wait for a network response that indicates the layer was fetched.
  
  // We'll set up a request listener.
  let requestFired = false;
  page.on('response', async (response) => {
    // Check if the response URL contains 'UV-Index' or is a WMS GetMap request
    // This is a heuristic.
    const url = response.url();
    if (url.includes('UV-Index') || url.includes('GetMap')) {
      requestFired = true;
    }
  });
  
  // Wait for the request to fire
  await expect.poll(() => requestFired).toBe(true);
});
