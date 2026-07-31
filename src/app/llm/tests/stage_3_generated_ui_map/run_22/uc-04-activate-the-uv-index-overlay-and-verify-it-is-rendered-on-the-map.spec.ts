// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is visible by default. We need to find the UV-Index layer entry.
  // Based on the UI map, we don't have a direct test-id for the layer entry itself,
  // but we can use the layer switcher panel and look for the text "UV-Index".
  // Chakra UI checkboxes are visually hidden, so we use force: true.
  const uvIndexLayerToggle = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  
  // Ensure the toggle is not already checked before clicking
  if (!(await uvIndexLayerToggle.isChecked())) {
    await uvIndexLayerToggle.click({ force: true });
  }

  // Verify the toggle is now checked
  await expect(uvIndexLayerToggle).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
