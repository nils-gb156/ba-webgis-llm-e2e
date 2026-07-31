// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: Click the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is visible by default, so we can interact with it directly.
  // We use force: true because Chakra UI checkbox controls intercept pointer events.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is in the enabled (checked) state
  await expect(uvIndexCheckbox).toBeChecked();

  // Step 2: Wait for the map to load the layer tiles.
  // We assert that the UV-Index layer is rendered on the map canvas using the helper.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
