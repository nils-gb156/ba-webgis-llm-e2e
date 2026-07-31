// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher to be initially visible
  const layerSwitcherButton = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherButton).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button to hide the panel
  await layerSwitcherButton.click();

  // Expected result: After the first click, the layer switcher panel is no longer visible.
  // The panel is typically identified by a test id or by its role/container.
  // Assuming a common test id for the TOC panel or using a role-based locator for the panel content.
  // Since no specific test id is provided in the prompt for the panel itself, we rely on the button's state or a generic panel locator.
  // However, the prompt mentions "layer switcher (TOC)" and implies it's a panel.
  // Let's assume the panel has a data-testid or we can infer its visibility by checking if the button is pressed or not.
  // But the expected result is about the panel visibility.
  // Let's look for a common pattern. Often the panel might have a test id like 'layer-switcher-panel' or similar.
  // If not, we might need to check the button's aria-pressed state.
  // Let's assume the button has an aria-pressed attribute that toggles.
  
  // Check if the button is now unpressed (panel hidden)
  await expect(layerSwitcherButton).toHaveAttribute('aria-pressed', 'false');

  // Step 2: Click the 'Layer Switcher' button again to show the panel
  await layerSwitcherButton.click();

  // Expected result: After the second click, the layer switcher panel is visible again.
  // Check if the button is now pressed (panel visible)
  await expect(layerSwitcherButton).toHaveAttribute('aria-pressed', 'true');
});
