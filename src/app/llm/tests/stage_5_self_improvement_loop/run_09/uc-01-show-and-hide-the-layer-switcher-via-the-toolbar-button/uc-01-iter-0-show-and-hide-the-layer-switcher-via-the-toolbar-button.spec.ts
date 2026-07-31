// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('UC1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map model to be available
    await expect.poll(() => getActiveBaseLayerTitle(page)).toBeTruthy();

    // Verify the layer switcher is initially visible
    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    // Click the 'Layer Switcher' button to hide the panel
    const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
    await layerSwitcherToggle.click();

    // Verify the layer switcher panel is no longer visible
    await expect(layerSwitcher).not.toBeVisible();

    // Click the 'Layer Switcher' button again to show the panel
    await layerSwitcherToggle.click();

    // Verify the layer switcher panel is visible again
    await expect(layerSwitcher).toBeVisible();
});
