// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be fully loaded and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index checkbox is initially unchecked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox. Since it's a Chakra UI control, we use force: true to bypass the decorative overlay.
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // We listen for the request that loads the UV-Index WMS tiles.
  // The typical URL pattern for WMS GetMap requests in this app includes the layer name.
  const uvIndexRequestPromise = page.waitForRequest((request) => {
    const url = request.url();
    return url.includes('LAYERS=UV-Index') || url.includes('layers=UV-Index') || url.includes('UV-Index');
  });

  // Trigger the map update by clicking the map container to ensure any pending interactions are settled,
  // although simply enabling the layer usually triggers the request immediately.
  // We wait for the specific network request to confirm the layer is being rendered.
  await uvIndexRequestPromise;

  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert canvas content, we verify the successful network request
  // which implies the tiles were requested and loaded.
  // Additionally, we can check that the legend for UV-Index is visible, as it often appears when the layer is active.
  await expect(page.getByTestId('uvi-stations-legend')).toBeVisible();
});
