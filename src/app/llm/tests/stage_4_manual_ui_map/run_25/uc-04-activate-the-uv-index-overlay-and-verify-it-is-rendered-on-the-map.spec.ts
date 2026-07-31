// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the UV-Index overlay layer.
  // The layer switcher is visible by default. We locate the checkbox for "UV-Index".
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index', exact: true });
  await uvIndexCheckbox.click({ force: true });

  // Step 2: Wait for the map to load the layer tiles and verify the layer is rendered.
  // The layer toggle should be checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Verify the UV-Index layer is rendered on the map canvas using the helper.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
