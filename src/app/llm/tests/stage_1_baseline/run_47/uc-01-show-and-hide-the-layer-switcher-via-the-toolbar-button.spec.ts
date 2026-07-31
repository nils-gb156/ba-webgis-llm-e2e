// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to be ready and the layer switcher to be initially visible
  const layerSwitcher = page.getByRole('complementary', { name: /Layer Switcher/i });
  await expect(layerSwitcher).toBeVisible();

  // Find the Layer Switcher toolbar button.
  // Since it's a toggle, we check its current state (pressed) to determine the action.
  const layerSwitcherButton = page.getByRole('button', { name: 'Layer Switcher', exact: true });

  // Step 1: Click the button to hide the panel.
  // The panel is initially visible, so the button is likely in "pressed" (active) state.
  // Clicking it should hide the panel.
  await layerSwitcherButton.click();
  await expect(layerSwitcher).not.toBeVisible();

  // Step 2: Click the button again to show the panel.
  await layerSwitcherButton.click();
  await expect(layerSwitcher).toBeVisible();
});
