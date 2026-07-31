// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.locator('#map-container')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is visible by default. We need to find the checkbox for "UV-Index".
  // Based on the UI map, we don't have a specific test-id for the layer checkbox,
  // so we use getByRole with the layer name. We assume the layer switcher panel contains it.
  const layerSwitcher = page.getByRole('panel', { name: /Layer Switcher/i, exact: false });
  const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // Click the checkbox to enable the layer. Using force: true as per Chakra UI conventions.
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is checked
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  // We use the helper function isLayerRendered to check the map state.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
