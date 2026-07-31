// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the layer switcher is initially visible as per preconditions
  const layerSwitcher = page.getByRole('complementary', { name: 'Layer Switcher' });
  await expect(layerSwitcher).toBeVisible();

  // Step 1: Click the 'Layer Switcher' button in the toolbar to hide the panel.
  // We use force: true because Chakra UI toggle buttons may have visual overlays.
  // We assert the current state is "pressed" (open) before clicking to ensure we are closing it.
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggle).toBeChecked(); // Assuming toggle buttons use aria-checked or similar pattern for state
  // For Chakra toggle buttons, aria-pressed is often used. Let's check pressed state.
  const isPressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isPressed === 'true') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Expected result: After the first click, the layer switcher panel is no longer visible.
  await expect(layerSwitcher).not.toBeVisible();

  // Step 2: Click the 'Layer Switcher' button again to show the panel.
  await layerSwitcherToggle.click({ force: true });

  // Expected result: After the second click, the layer switcher panel is visible again.
  await expect(layerSwitcher).toBeVisible();
});
