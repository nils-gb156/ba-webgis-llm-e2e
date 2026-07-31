// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: layer switcher is visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button to hide the panel.
  // The button is initially pressed (aria-pressed="true"), so we click to close.
  await page.getByTestId('layer-switcher-toggle').click();

  // Step 1 expected result: layer switcher panel is no longer visible.
  await expect(page.getByTestId('layer-switcher')).toBeHidden();

  // Step 2: Click the 'Layer Switcher' button again to show the panel.
  await page.getByTestId('layer-switcher-toggle').click();

  // Step 2 expected result: layer switcher panel is visible again.
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
