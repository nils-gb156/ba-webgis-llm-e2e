// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is initially visible and the toggle button is pressed.
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button to hide the panel.
  // The button has aria-pressed="true" initially, so clicking it will toggle it off.
  await page.getByRole('button', { name: 'Layer Switcher' }).click();

  // After the first click, the layer switcher panel is no longer visible.
  await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

  // Step 2: Click the 'Layer Switcher' button again to show the panel.
  // The button now has aria-pressed="false", so clicking it will toggle it back on.
  await page.getByRole('button', { name: 'Layer Switcher' }).click();

  // After the second click, the layer switcher panel is visible again.
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
