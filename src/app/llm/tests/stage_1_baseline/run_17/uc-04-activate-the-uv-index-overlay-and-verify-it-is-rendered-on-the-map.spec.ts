// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle in the layer switcher
  // Assuming the UV-Index layer has a test id or accessible name
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });

  // Verify the toggle is initially unchecked (hidden)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index layer
  await uvIndexToggle.click();

  // Wait for the toggle to be in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map canvas to be present
  const mapCanvas = page.locator('canvas.ol-layer');
  await expect(mapCanvas).toBeVisible();

  // Verify that the UV-Index overlay tiles are rendered on the map.
  // Since map content is on a canvas, we assert that the map is interactive/loaded
  // and that the layer request was made. We can check for network requests to the WMS service.
  const uvIndexRequest = page.waitForRequest((request) => {
    const url = request.url();
    return url.includes('UV-Index') || url.includes('uv-index');
  });

  // Trigger a map interaction or wait for the layer to load if not already triggered by the click.
  // Often, clicking the toggle triggers the request immediately.
  // We wait for the request to ensure the layer data was fetched.
  await uvIndexRequest;

  // Additional verification: The map should still be visible and responsive.
  // We can assert the map container is visible.
  await expect(page.locator('.ol-map')).toBeVisible();
});
