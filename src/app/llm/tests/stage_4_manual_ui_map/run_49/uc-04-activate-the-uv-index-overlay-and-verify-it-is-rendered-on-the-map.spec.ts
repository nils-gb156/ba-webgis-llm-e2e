// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer
  // The UI map indicates "UV-Index" is an operational layer in the checkbox-list.
  // We need to find the checkbox for "UV-Index". Since it's not in the default list,
  // it should be unchecked. We use force: true because Chakra UI checkboxes
  // have a hidden input under a decorative control.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).toBeChecked({ checked: false });
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexCheckbox).toBeChecked({ checked: true });

  // Step 2: Wait for the map to load the layer tiles
  // We use the helper to check if the "UV-Index" layer is rendered.
  // Note: The helper uses the layer title "UV-Index".
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
