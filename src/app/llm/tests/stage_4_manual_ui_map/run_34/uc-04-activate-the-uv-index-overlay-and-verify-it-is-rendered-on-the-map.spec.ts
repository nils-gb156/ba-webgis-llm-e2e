// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is visible by default. We locate the checkbox for "UV-Index".
  // Since it's a Chakra UI checkbox, we use force: true to click the underlying input.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Step 2: The user waits for the map to load the layer tiles.
  // We verify the UV-Index overlay layer toggle is in the enabled (checked) state.
  await expect(uvIndexCheckbox).toBeChecked();

  // We verify the UV-Index overlay tiles are rendered on the map canvas.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
