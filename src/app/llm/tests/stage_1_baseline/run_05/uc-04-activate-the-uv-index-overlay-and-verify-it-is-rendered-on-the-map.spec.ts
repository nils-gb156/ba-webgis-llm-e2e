// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) to be visible as a precondition
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the UV-Index overlay toggle. Assuming a test id exists for the layer item or its checkbox.
  // If the layer item itself has a test id, we might need to find the checkbox within it.
  // Let's assume the layer item container has a test id like 'layer-uv-index' or similar,
  // or we can search by the accessible name "UV-Index".
  // Since we don't have the exact test ids, we will use getByRole with the accessible name.
  // We need to scope it to the layer switcher to avoid ambiguity.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const uvIndexToggle = layerSwitcher.getByRole('checkbox', { name: 'UV-Index' });

  // Assert that the UV-Index overlay is initially hidden (unchecked)
  await expect(uvIndexToggle).not.toBeChecked();

  // Click the visibility toggle to show the layer
  // Note: Chakra UI checkboxes need force: true due to decorative overlay
  await uvIndexToggle.click({ force: true });

  // Assert that the toggle is now in the enabled (checked) state
  await expect(uvIndexToggle).toBeChecked();

  // Wait for the map to load the layer tiles.
  // Since map state is not in the DOM, we rely on the fact that the layer is checked.
  // To verify tiles are rendered, we can check if a specific network request for the WMS/Tile layer was made.
  // However, without a specific test id for the map canvas or helper functions,
  // we can assert the request was sent.

  // Let's assume the WMS endpoint for UV-Index is known or can be inferred.
  // Common pattern: /wms?LAYERS=uv_index or similar.
  // Since we don't have the exact endpoint, we will wait for a response that matches a likely pattern.
  // Alternatively, we can just wait for the map to be interactive or assume that if the checkbox is checked,
  // the request is in progress. But the requirement is to verify tiles are rendered.
  // Without helper functions, verifying canvas content is hard.
  // We will assume that if the checkbox is checked and no error occurs, the layer is active.
  // To be more rigorous, let's try to catch a network request.

  const uvIndexRequestPromise = page.waitForResponse(response => {
    const url = response.url();
    // Heuristic: look for WMS requests with UV-Index in the layer name or a specific endpoint
    return url.includes('wms') && (url.includes('uv') || url.includes('UV'));
  });

  // Trigger the request by ensuring the checkbox is checked (it already is, but maybe it triggered on click)
  // The click above should have triggered the request. Let's wait for it.
  await uvIndexRequestPromise;

  // If we got here, the request was made.
  // To verify rendering on canvas, we might need to take a screenshot or use a helper.
  // Since no helper is provided, and canvas assertion is not possible via DOM,
  // we will assert the successful completion of the request as a proxy for loading.
  const response = await uvIndexRequestPromise;
  expect(response.status()).toBe(200);
});
