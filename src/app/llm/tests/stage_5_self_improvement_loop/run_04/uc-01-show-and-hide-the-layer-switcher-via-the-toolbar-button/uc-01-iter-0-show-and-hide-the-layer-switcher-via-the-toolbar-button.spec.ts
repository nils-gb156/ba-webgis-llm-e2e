// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 1: Show and hide the layer switcher via the toolbar button', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcherPanel = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcherPanel).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');

    const isLayerSwitcherPressed = async (): Promise<boolean> =>
        (await layerSwitcherToggle.getAttribute('aria-pressed')) === 'true';

    if (await isLayerSwitcherPressed()) {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcherPanel).toBeHidden();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'false');

    if (!(await isLayerSwitcherPressed())) {
        await layerSwitcherToggle.click();
    }

    await expect(layerSwitcherPanel).toBeVisible();
    await expect(layerSwitcherToggle).toHaveAttribute('aria-pressed', 'true');
});
