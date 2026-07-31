// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('UC1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the Layer Switcher button to hide the panel.
  // The layer switcher is initially visible, so clicking the toggle should hide it.
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  await layerSwitcherToggle.click();

  // Verify the layer switcher panel is no longer visible.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).not.toBeVisible();

  // Step 2: Click the Layer Switcher button again to show the panel.
  await layerSwitcherToggle.click();

  // Verify the layer switcher panel is visible again.
  await expect(layerSwitcher).toBeVisible();
});
