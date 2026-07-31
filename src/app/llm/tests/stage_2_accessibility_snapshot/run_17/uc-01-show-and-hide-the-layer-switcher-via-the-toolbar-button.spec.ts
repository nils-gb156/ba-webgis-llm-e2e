// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the initial state: layer switcher is visible
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggle).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button to hide the panel
  // The button is initially pressed (aria-pressed="true"), so clicking it will toggle it off.
  await layerSwitcherToggle.click();

  // Expected result: layer switcher panel is no longer visible
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).not.toBeVisible();
  // The toggle button should now be in the unpressed state (or at least the panel is gone)
  await expect(layerSwitcherToggle).not.toBeAttached(); // Or check aria-pressed if button remains

  // Step 2: Click the 'Layer Switcher' button again to show the panel
  // The button should be visible again (or we need to find it to click)
  // Since the button might be re-rendered or just hidden, let's find it again by role and name
  const layerSwitcherToggleAfterHide = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggleAfterHide).toBeVisible();
  await layerSwitcherToggleAfterHide.click();

  // Expected result: layer switcher panel is visible again
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();
});
