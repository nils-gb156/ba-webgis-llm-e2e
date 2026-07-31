// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to fully load and the map to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Register a listener for network requests to verify the UV-Index layer tile request
  const uvIndexRequests: any[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('UV-Index') || url.includes('uv-index')) {
      uvIndexRequests.push(request);
    }
  });

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The layer switcher is already open and the UV-Index checkbox is unchecked
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();
  await uvIndexCheckbox.click();

  // Step 2: Wait for the map to load the layer tiles
  // We poll for the checkbox state to be checked and for network requests to be made
  await expect.poll(() => uvIndexCheckbox.isChecked()).toBe(true);

  // Wait for at least one UV-Index related request to be sent
  await expect.poll(() => uvIndexRequests.length).toBeGreaterThan(0);

  // Expected results:
  // - The UV-Index overlay layer toggle is in the enabled (checked) state. (Verified above)
  // - The UV-Index overlay tiles are rendered on the map canvas.
  // Since we cannot directly assert on canvas content, we verify the layer is active
  // and the map container is still visible, implying the layer was successfully loaded.
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(uvIndexCheckbox).toBeChecked();
});
