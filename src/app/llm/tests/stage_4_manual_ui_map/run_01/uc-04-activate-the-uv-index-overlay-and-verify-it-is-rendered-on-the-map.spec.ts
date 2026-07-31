// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The UV-Index layer is not in the defaults, so it should be unchecked initially.
  // We use force: true because Chakra UI checkboxes render the input visually hidden.
  const uvIndexToggle = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexToggle).toBeChecked();

  // Step 2: The user waits for the map to load the layer tiles.
  // We poll the map model helper to verify the layer is rendered on the canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
