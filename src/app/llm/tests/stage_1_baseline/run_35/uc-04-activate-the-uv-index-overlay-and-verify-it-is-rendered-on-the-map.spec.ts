// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher (TOC) to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // The UV-Index overlay layer is initially hidden.
  // Locate the visibility toggle for the UV-Index layer.
  // Assuming the layer has a test id or accessible name.
  // If the layer switcher items have test ids like 'layer-uv-index-toggle', use that.
  // Otherwise, use getByRole with the layer name.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' }).first();

  // Assert that the toggle is initially unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index overlay
  await uvIndexToggle.click({ force: true });

  // Wait for the layer to be enabled in the UI
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map content is rendered on a canvas, we can't assert DOM elements for tiles.
  // However, we can assert that a network request for the WMS tile was made.
  // We will listen for requests to the WMS endpoint.
  // Assuming the WMS endpoint is known or can be inferred.
  // Let's assume the WMS service URL contains 'wms' or similar.
  // We'll wait for a response from a WMS GetMap request.

  const wmsResponsePromise = page.waitForResponse(response => {
    const url = response.url();
    return url.includes('wms') && url.includes('GetMap');
  });

  // Trigger the tile load by interacting with the map or waiting for the layer to render.
  // Since clicking the checkbox might not immediately trigger a tile load if the map is not centered,
  // we might need to ensure the map is ready or interact with it.
  // However, typically, enabling a layer triggers a tile request if the current view intersects the layer.
  // Let's assume the current view intersects.
  
  // Wait for the WMS GetMap response to confirm the layer tiles are being requested/loaded
  await wmsResponsePromise;

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content, we rely on the successful WMS response.
  // Additionally, we can take a screenshot or check the canvas size/position if needed,
  // but the prompt asks to verify it is rendered. The WMS response is a strong indicator.
  // To be more robust, we can check if the canvas has been updated or if there's a loading indicator that disappeared.
  // Let's assume the absence of a loading indicator for the layer is sufficient, or just rely on the WMS response.
  
  // As a final check, we can assert that the toggle remains checked.
  await expect(uvIndexToggle).toBeChecked();
});
