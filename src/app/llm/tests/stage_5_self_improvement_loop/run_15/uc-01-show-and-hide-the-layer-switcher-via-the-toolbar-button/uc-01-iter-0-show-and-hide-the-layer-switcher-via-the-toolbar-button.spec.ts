// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: The user clicks the 'Layer Switcher' button in the toolbar to hide the panel.
    // The layer switcher is initially visible and the button is in the pressed state.
    // Clicking it should hide the panel.
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcherPanel = page.getByTestId('layer-switcher');

    await expect(layerSwitcherPanel).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    await layerSwitcherToggle.click({ force: true });

    // After the first click, the layer switcher panel is no longer visible.
    await expect(layerSwitcherPanel).not.toBeVisible();

    // Step 2: The user clicks the 'Layer Switcher' button again to show the panel.
    // The button should now be in the unpressed state.
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');

    await layerSwitcherToggle.click({ force: true });

    // After the second click, the layer switcher panel is visible again.
    await expect(layerSwitcherPanel).toBeVisible();
});
