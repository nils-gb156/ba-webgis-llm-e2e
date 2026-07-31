// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is visible by default. We look for the checkbox associated with "UV-Index".
  // Chakra UI checkboxes render the input visually hidden, so we use force: true.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles and verify it is rendered.
  // We use the map model helper to check if the "UV-Index" operational layer is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
