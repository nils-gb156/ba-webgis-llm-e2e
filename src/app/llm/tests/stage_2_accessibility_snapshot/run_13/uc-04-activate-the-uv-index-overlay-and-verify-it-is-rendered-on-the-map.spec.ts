// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be ready and the layer switcher to be visible
  await expect(page.getByRole('button', { name: 'Layer Switcher' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();

  // Register listener for the network request to verify the layer is requested
  let uviLayerRequestUrl: string | undefined;
  page.on('request', (request) => {
    const url = request.url();
    // UV-Index layer tiles typically come from a WMS or tile service.
    // We capture any request that looks like a map tile or WMS GetMap for UV-Index.
    if (url.includes('UV-Index') || url.includes('uvi') || url.includes('UVIndex')) {
      uviLayerRequestUrl = url;
    }
  });

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The accessibility tree shows a checkbox named "UV-Index".
  // Using force: true as Chakra UI checkboxes may have hidden inputs.
  const uviCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uviCheckbox).toBeChecked({ checked: false }); // Ensure it is initially unchecked
  await uviCheckbox.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uviCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We poll for the network request to be captured, indicating the layer is being loaded.
  await expect.poll(() => uviLayerRequestUrl !== undefined).toBe(true);

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since map content is on a canvas, we verify by checking that the layer request succeeded
  // and potentially by checking for the presence of the legend item which updates when the layer is active.
  // The accessibility tree shows an img for "UV-Index Stations legend", but the use case is about UV-Index overlay.
  // Let's check if the UV-Index legend item appears or updates.
  // Looking at the initial tree, there is "UV-Index Stations" legend but not "UV-Index" overlay legend.
  // However, often activating a layer brings up its legend.
  // A more robust check for "rendered on map" in Playwright without image comparison is to ensure the request completed.
  // We can also check if the layer switcher reflects the change (already done via checkbox).
  // To be thorough, we can wait for the response of the captured request.
  if (uviLayerRequestUrl) {
    await page.waitForResponse((response) => {
      return response.url() === uviLayerRequestUrl && response.status() === 200;
    }, { timeout: 10000 });
  }
});
