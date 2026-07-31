// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the initial state: layer switcher is visible
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');

  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toBeChecked();

  // Step 1: Click the 'Layer Switcher' button to hide the panel
  await layerSwitcherToggle.click({ force: true });

  // Expected result: After the first click, the layer switcher panel is no longer visible
  await expect(layerSwitcher).not.toBeVisible();
  await expect(layerSwitcherToggle).not.toBeChecked();

  // Step 2: Click the 'Layer Switcher' button again to show the panel
  await layerSwitcherToggle.click({ force: true });

  // Expected result: After the second click, the layer switcher panel is visible again
  await expect(layerSwitcher).toBeVisible();
  await expect(layerSwitcherToggle).toBeChecked();
});
