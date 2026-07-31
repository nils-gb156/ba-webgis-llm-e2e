// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay visibility toggle.
  // Assuming the toggle is a checkbox within the layer switcher associated with the "UV-Index" label.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });

  // Verify initial state: the layer should be hidden (unchecked)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index overlay
  await uvIndexToggle.click();

  // Verify that the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since we cannot assert on the canvas directly, we wait for the network request
  // that loads the UV-Index layer tiles to complete.
  // We assume the WMS endpoint or tile URL contains "UV-Index" or similar identifier.
  // A common pattern for WMS GetMap requests includes the layer name.
  const uvIndexRequestPromise = page.waitForResponse(
    (response) => {
      const url = response.url();
      // Check if the response URL contains indicators of the UV-Index layer request
      // This might be a WMS GetMap request with the UV-Index layer parameter
      return url.includes('UV-Index') || url.includes('uv-index');
    }
  );

  // Wait for the response to ensure the layer tiles are requested and loaded
  await uvIndexRequestPromise;

  // Verify that the map canvas exists and is visible
  await expect(page.locator('canvas.ol-layer')).toBeVisible();
});
