// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index layer is in the operational layer checkbox list.
  // We need to find the checkbox for "UV-Index".
  // Based on the UI map, operational layers are in a checkbox-list.
  // We look for a checkbox with the text "UV-Index".
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });

  // The layer is initially hidden (not checked).
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to enable the layer.
  // Note: Chakra UI checkboxes are role="checkbox", so we click the role locator.
  await uvIndexCheckbox.click();

  // Step 2: The user waits for the map to load the layer tiles.
  // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();

  // Expected result: The UV-Index overlay tiles are rendered on the map canvas.
  // We use the helper function to check if the layer is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
