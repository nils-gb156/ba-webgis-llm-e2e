// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible as per precondition
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle.
  // Assuming the layer item has a test id or we can find it by text.
  // Based on typical Open Pioneer Trails patterns, layer items often have test ids like 'layer-item-{name}'.
  // If not, we fall back to getByText or getByRole.
  // Let's assume a test id for the UV-Index layer item for robustness.
  const uvIndexLayerToggle = page.getByTestId('layer-item-uv-index').getByRole('checkbox');

  // Verify the layer is initially hidden (unchecked) as per precondition
  await expect(uvIndexLayerToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the UV-Index overlay
  // Using force: true because Chakra UI checkboxes might have visual overlays intercepting clicks
  await uvIndexLayerToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexLayerToggle).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We can assert that the map canvas has changed or that a WMS request was made.
  // Since we don't have specific map helper functions provided in the prompt,
  // we will assert that a WMS GetMap request was made for the UV-Index layer.
  
  // Capture the request for the UV-Index layer
  let uvIndexRequestSent = false;
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('SERVICE=WMS') && url.includes('REQUEST=GetMap') && url.includes('UV-Index')) {
      uvIndexRequestSent = true;
    }
  });

  // Poll to wait for the request to be sent
  await expect.poll(() => uvIndexRequestSent).toBe(true);

  // Additional verification: The map canvas should now contain the new tiles.
  // Since we cannot directly assert canvas content easily without taking screenshots or complex pixel comparison,
  // the successful WMS request is a strong indicator that the layer is being rendered.
  // We can also verify that the layer switcher still shows the layer as checked.
  await expect(uvIndexLayerToggle).toBeChecked();
});
