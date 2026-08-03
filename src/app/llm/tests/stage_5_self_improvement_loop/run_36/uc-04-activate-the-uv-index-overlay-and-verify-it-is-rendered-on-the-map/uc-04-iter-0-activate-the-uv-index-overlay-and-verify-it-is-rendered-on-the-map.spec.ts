// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle, isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');
    await page.waitForLoadState('domcontentloaded');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');

    if (!(await layerSwitcher.isVisible())) {
        await expect(layerSwitcherToggle).toBeVisible();
        const pressed = await layerSwitcherToggle.getAttribute('aria-pressed');
        if (pressed !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(layerSwitcher.getByRole('heading', { name: 'Layer Switcher', exact: true })).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const uvIndexCheckbox = layerSwitcher.getByRole('checkbox', { name: 'UV-Index', exact: true });

    await expect(uvIndexCheckbox).not.toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(false);

    await uvIndexCheckbox.click({ force: true });

    await expect(uvIndexCheckbox).toBeChecked();
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
