// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('UC1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Precondition: Layer switcher is initially visible
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Step 1: Click 'Layer Switcher' button to hide the panel
    // The button is in pressed state, so clicking it will close the panel.
    await page.getByRole('button', { name: 'Layer Switcher' }).click();

    // Expected result: After the first click, the layer switcher panel is no longer visible.
    await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

    // Step 2: Click 'Layer Switcher' button again to show the panel
    // The button is now in unpressed state, so clicking it will open the panel.
    await page.getByRole('button', { name: 'Layer Switcher' }).click();

    // Expected result: After the second click, the layer switcher panel is visible again.
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
