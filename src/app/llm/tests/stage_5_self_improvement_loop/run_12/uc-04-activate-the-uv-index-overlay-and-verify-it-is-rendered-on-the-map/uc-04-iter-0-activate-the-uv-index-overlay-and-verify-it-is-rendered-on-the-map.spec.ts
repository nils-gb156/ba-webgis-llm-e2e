// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready before interacting
  await expect(page.getByTestId('map-container')).toBeVisible();

  // 1. The user clicks the visibility toggle of the UV-Index overlay layer to show it.
  // The layer switcher is already visible. The UV-Index checkbox is unchecked.
  const uvIndexCheckbox = page.getByRole('checkbox', { name: 'UV-Index' });
  await expect(uvIndexCheckbox).not.toBeChecked();

  await uvIndexCheckbox.click({ force: true });

  // Verify the toggle is now checked
  await expect(uvIndexCheckbox).toBeChecked();

  // 2. The user waits for the map to load the layer tiles.
  // The helper returns true only when the layer is rendered.
  await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
