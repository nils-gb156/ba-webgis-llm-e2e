// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
    const basemapSelector = page.getByRole('combobox', { name: 'Basemaps', exact: true });

    await expect(layerSwitcherToggle).toBeVisible();

    if (!(await layerSwitcher.isVisible())) {
        if ((await layerSwitcherToggle.getAttribute('aria-pressed')) !== 'true') {
            await layerSwitcherToggle.click();
        }
    }

    await expect(layerSwitcher).toBeVisible();
    await expect(basemapSelector).toBeVisible();
    await expect(basemapSelector).toBeEnabled();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const basemapSelectorTagName = await basemapSelector.evaluate((element) =>
        element.tagName.toLowerCase()
    );

    if (basemapSelectorTagName === 'select') {
        await basemapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await basemapSelector.click();

        const openStreetMapOption = page.getByRole('option', {
            name: 'OpenStreetMap',
            exact: true
        });

        try {
            await expect(openStreetMapOption).toBeVisible({ timeout: 2000 });
            await openStreetMapOption.click();
        } catch {
            await basemapSelector.press('ArrowDown');
            await basemapSelector.press('Enter');
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
