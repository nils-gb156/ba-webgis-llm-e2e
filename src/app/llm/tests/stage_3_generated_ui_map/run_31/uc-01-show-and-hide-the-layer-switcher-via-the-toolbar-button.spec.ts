// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // The layer switcher is initially visible by default according to the UI map.
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Click the 'Layer Switcher' button to hide the panel.
    // The layer switcher panel is initially visible, so the toggle button is likely in the "active/pressed" state
    // (meaning the panel is open). Clicking it should hide the panel.
    // We use force: true because Chakra UI switches/checkboxes might have pointer events issues,
    // although this is a button. However, to be safe against visual overlays or Chakra styling,
    // we click the role.
    await page.getByRole('button', { name: 'Layer Switcher' }).click({ force: true });

    // Expected result: After the first click, the layer switcher panel is no longer visible.
    await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

    // Step 2: Click the 'Layer Switcher' button again to show the panel.
    await page.getByRole('button', { name: 'Layer Switcher' }).click({ force: true });

    // Expected result: After the second click, the layer switcher panel is visible again.
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
