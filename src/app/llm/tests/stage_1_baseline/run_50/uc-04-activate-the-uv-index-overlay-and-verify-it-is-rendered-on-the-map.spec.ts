// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Locate the UV-Index overlay toggle in the layer switcher.
  // Assuming the layer switcher uses test ids for layers or we can find it by text.
  // Since we don't have specific test ids from the prompt, we use getByRole with exact name.
  // We need to find the checkbox/switch for "UV-Index".
  const uvIndexLayerToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true })
    .or(page.getByRole('switch', { name: 'UV-Index', exact: true }));

  // It's possible the element is a custom Chakra control, so we might need to force click if it's a switch/checkbox rendered visually hidden.
  // However, first check if it's already visible and unchecked.
  // If getByRole finds it, we can try to click it.
  
  // Let's assume the layer is initially hidden as per preconditions.
  // We need to ensure the toggle is present.
  await expect(uvIndexLayerToggle).toBeVisible();

  // Click the toggle to enable the layer
  // Using force: true because Chakra UI controls often intercept clicks
  await uvIndexLayerToggle.click({ force: true });

  // Verify the toggle is now in the checked/enabled state
  await expect(uvIndexLayerToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map state is not in DOM, we rely on network requests for WMS tiles.
  // We can listen for a request to the WMS service for the UV-Index layer.
  // Assuming a typical WMS endpoint or tile server. Without specific URL patterns,
  // we might wait for a general map interaction or a specific resource.
  // However, Playwright's waitForResponse is good for this.
  // Let's assume the WMS service is known or we can filter by URL pattern if known.
  // If no specific helper is provided, we might just wait for a short time or assume
  // the visual rendering happens. But the prompt says "verify that the layer is requested".
  // We'll try to capture a request to a likely WMS endpoint.
  
  // Since we don't have the exact WMS URL, we'll wait for any network activity that might indicate loading,
  // or specifically look for a request to a map server if we can guess it.
  // A safer bet for "rendered on map canvas" without DOM representation is to wait for a response
  // that looks like a map tile or WMS GetMap request.
  
  // Let's try to wait for a response from a common WMS path or tile path.
  // If the app uses a specific base URL for WMS, we'd filter by that.
  // For now, let's assume a generic wait for a map-related resource if possible,
  // or simply rely on the fact that the layer was toggled and the app is responsive.
  // However, to strictly verify "requested and rendered", we should check network.
  
  // Let's assume the WMS service is at a known endpoint, e.g., /wms or similar.
  // If we can't determine it, we might skip the network assertion or use a broad one.
  // Given the constraints, let's wait for a response that contains 'UV-Index' or similar in the URL if possible.
  
  // Alternative: Since we can't assert map canvas content directly, and no helper is provided,
  // we verify the UI state (checked) and assume the map updates.
  // But the prompt asks to verify it is rendered.
  // Let's try to wait for a response to a WMS GetMap request.
  
  const wmsResponse = page.waitForResponse(response => {
    const url = response.url();
    // Check for WMS GetMap request, possibly containing the layer name
    return url.includes('GetMap') && url.toLowerCase().includes('uv-index');
  }, { timeout: 10000 });

  await wmsResponse;

  // Final verification: ensure the toggle is still checked
  await expect(uvIndexLayerToggle).toBeChecked();
});
