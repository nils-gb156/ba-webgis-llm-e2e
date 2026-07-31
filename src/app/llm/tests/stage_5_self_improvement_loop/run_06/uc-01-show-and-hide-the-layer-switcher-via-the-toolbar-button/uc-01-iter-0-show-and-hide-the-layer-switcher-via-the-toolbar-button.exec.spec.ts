// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';

test('Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // The layer switcher is initially visible (pressed state)
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    await expect(layerSwitcherToggle).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('layer-switcher')).toBeVisible();

    // Click the toggle to hide the panel
    await layerSwitcherToggle.click();

    // After first click, the layer switcher panel is no longer visible
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('layer-switcher')).not.toBeVisible();

    // Click the toggle again to show the panel
    await layerSwitcherToggle.click();

    // After second click, the layer switcher panel is visible again
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('layer-switcher')).toBeVisible();
});
