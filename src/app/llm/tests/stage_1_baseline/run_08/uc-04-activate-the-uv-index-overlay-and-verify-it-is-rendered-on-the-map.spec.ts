// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle.
  // Assuming the application assigns a test-id to the layer item or its toggle.
  // If not explicitly named, we might need to find it by text within the TOC.
  // Based on typical patterns, let's assume a test id like 'layer-uv-index-toggle' or find by role/text.
  // Since no specific test ids are provided in the prompt, we use getByRole with exact name if possible,
  // or getByText scoped to the layer switcher.
  
  // Attempt to find the UV-Index layer item/toggle.
  // Chakra UI checkboxes are often wrapped. We need to click the input or the control.
  // Let's try to find the checkbox associated with "UV-Index".
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Verify it is initially unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show it
  await uvIndexToggle.click({ force: true });

  // Assert the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // We can listen for network requests to the WMS or tile server for UV-Index.
  // Or we can simply wait for the map canvas to update.
  // Since map content is on canvas, we can't assert DOM.
  // We can assert that a request for the UV-Index layer was made.
  
  // Register listener for the request
  let uvIndexRequestUrl: string | undefined;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('UV-Index') || url.includes('uvindex') || url.includes('UV_Index')) {
      uvIndexRequestUrl = url;
    }
  });

  // Wait for the response to the UV-Index layer request
  // This might be a WMS GetMap or a tile request.
  // We use waitForResponse to ensure the layer data has been fetched.
  // Note: The specific URL pattern depends on the backend. 
  // A safer bet for "tiles are rendered" in a canvas map without specific helpers is to wait for a response
  // that likely corresponds to the layer activation.
  
  // If no specific URL pattern is known, we might rely on the fact that the layer is now visible in the TOC
  // and assume the map updates. However, the prompt asks to verify tiles are rendered.
  // Without map helpers, we can assert the network request.
  
  try {
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('UV-Index') || url.includes('uvindex') || url.includes('UV_Index');
      },
      { timeout: 10000 }
    );
  } catch (e) {
    // If specific URL pattern fails, we might try a broader WMS request if it's a WMS layer
    // But let's assume the name is in the URL or params.
    // If this fails, we might just assert that the layer is checked and assume rendering.
    // However, the prompt requires verifying tiles are rendered.
    // Let's try to find any request that looks like a layer request.
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        // Common WMS parameter for layer name
        return url.includes('LAYERS') && (url.includes('UV-Index') || url.includes('uvindex') || url.includes('UV_Index'));
      },
      { timeout: 10000 }
    );
  }

  // Since we cannot directly assert canvas content, we rely on the network request success
  // as a proxy for the layer being requested and rendered.
  expect(uvIndexRequestUrl).toBeTruthy();
});
