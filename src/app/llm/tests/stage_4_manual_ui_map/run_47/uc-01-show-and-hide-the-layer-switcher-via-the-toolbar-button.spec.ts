// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the Layer Switcher button to hide the panel.
    // The layer switcher is initially visible, so we click the toggle to hide it.
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await layerSwitcherToggle.click();
    await expect(layerSwitcher).not.toBeVisible();

    // Step 2: Click the Layer Switcher button again to show the panel.
    await layerSwitcherToggle.click();
    await expect(layerSwitcher).toBeVisible();
});
