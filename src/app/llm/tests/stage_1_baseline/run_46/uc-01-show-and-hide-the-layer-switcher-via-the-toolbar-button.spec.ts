// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the app to load and the layer switcher to be initially visible
  const layerSwitcher = page.getByRole('complementary', { name: 'Layer Switcher' });
  await expect(layerSwitcher).toBeVisible();

  // Find the toolbar toggle button for the layer switcher
  // We need to find the button that controls the layer switcher visibility.
  // Assuming the button has an accessible name or test id.
  // If not, we might need to look for a button with a specific icon or text.
  // Let's assume there is a button with the text "Layer Switcher" or an aria-label.
  // Or it might be a toggle button with aria-pressed.
  
  // Let's try to find the button by its role and name if possible.
  // If the button is in a toolbar, we might scope it.
  const toolbar = page.getByRole('toolbar');
  const layerSwitcherToggle = toolbar.getByRole('button', { name: 'Layer Switcher' }).first();

  // Step 1: Click the button to hide the panel
  await layerSwitcherToggle.click();
  
  // Verify the layer switcher is no longer visible
  await expect(layerSwitcher).not.toBeVisible();

  // Step 2: Click the button again to show the panel
  await layerSwitcherToggle.click();
  
  // Verify the layer switcher is visible again
  await expect(layerSwitcher).toBeVisible();
});
