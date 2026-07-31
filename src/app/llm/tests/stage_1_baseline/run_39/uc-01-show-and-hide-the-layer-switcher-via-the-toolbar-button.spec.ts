// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher to be initially visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button in the toolbar to hide the panel
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await layerSwitcherToggle.click();

  // Expected result: After the first click, the layer switcher panel is no longer visible
  await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

  // Step 2: Click the 'Layer Switcher' button again to show the panel
  await layerSwitcherToggle.click();

  // Expected result: After the second click, the layer switcher panel is visible again
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
