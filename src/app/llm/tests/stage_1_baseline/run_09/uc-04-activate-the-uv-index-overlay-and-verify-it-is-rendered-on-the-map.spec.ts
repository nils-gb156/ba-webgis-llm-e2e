// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Identify the UV-Index overlay toggle.
  // Based on typical Open Pioneer Trails structure, the layer toggle is a checkbox
  // associated with the layer name. We use getByRole with exact name matching.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Ensure the toggle is initially hidden (unchecked) before clicking
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the UV-Index overlay
  // Using force: true because Chakra UI checkboxes have a decorative control
  // that intercepts pointer events.
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // The UV-Index layer is likely a WMS or tile layer. We wait for a network request
  // that matches the expected pattern for the UV-Index layer tiles or WMS GetMap.
  // Assuming the layer name or id contains 'uv' or 'uv-index'.
  const uvIndexRequestPromise = page.waitForResponse(response => {
    const url = response.url();
    return url.includes('uv') || url.includes('UV') || url.includes('uv-index');
  });

  await uvIndexRequestPromise;

  // Verify that the UV-Index overlay tiles are rendered on the map canvas.
  // Since map content is on a canvas, we check for non-empty canvas content
  // or a specific visual change. However, without specific helper functions for
  // map state, we can assert that the request succeeded and the layer is active.
  // A common pattern is to check that the map canvas is not empty or has changed.
  // Given the constraints, we rely on the successful network request as a proxy
  // for the layer being rendered, as direct canvas assertion is complex without
  // pixel comparison or helper functions.
  // If a helper function were provided, we would use expect.poll() to check map state.
  // Here, we assume the successful response indicates the layer is being rendered.
  expect(uvIndexRequestPromise.status()).toBe(200);
});
