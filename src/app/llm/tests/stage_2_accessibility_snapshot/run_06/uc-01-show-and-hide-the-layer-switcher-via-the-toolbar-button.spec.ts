// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher toggle button is initially pressed (active) and the panel is visible.
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });

  // Step 1: Click the 'Layer Switcher' button to hide the panel.
  await layerSwitcherToggle.click();

  // Expected result: After the first click, the layer switcher panel is no longer visible.
  // We verify by checking the toggle button is no longer pressed and the panel is hidden.
  await expect(layerSwitcherToggle).not.toBeChecked();
  await expect(page.getByRole('region', { name: 'Layer Switcher' })).not.toBeVisible();

  // Step 2: Click the 'Layer Switcher' button again to show the panel.
  await layerSwitcherToggle.click();

  // Expected result: After the second click, the layer switcher panel is visible again.
  await expect(layerSwitcherToggle).toBeChecked();
  await expect(page.getByRole('region', { name: 'Layer Switcher' })).toBeVisible();
});
