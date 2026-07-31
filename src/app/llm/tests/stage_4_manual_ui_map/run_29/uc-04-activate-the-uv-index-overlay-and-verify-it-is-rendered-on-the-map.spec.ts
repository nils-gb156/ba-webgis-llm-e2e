// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The UI map indicates the layer switcher is visible by default.
  // We locate the checkbox for "UV-Index" within the layer switcher.
  const uvIndexCheckbox = page.getByTestId('layer-switcher').getByRole('checkbox', {
    name: 'UV-Index',
  });

  // Use force: true because Chakra UI renders the real input visually hidden.
  await uvIndexCheckbox.click({ force: true });

  // Step 2: Wait for the map to load the layer tiles.
  // We assert that the UV-Index layer is rendered on the map canvas using the helper.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);

  // Expected result: The UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();
});
