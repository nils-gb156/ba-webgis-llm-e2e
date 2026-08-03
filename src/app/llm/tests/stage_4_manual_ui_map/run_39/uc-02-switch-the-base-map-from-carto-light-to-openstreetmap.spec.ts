// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    await expect(page.getByTestId('map-container')).toBeVisible();

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    let baseMapSelector = layerSwitcher.getByRole('combobox').first();
    if ((await layerSwitcher.getByRole('combobox').count()) === 0) {
        baseMapSelector = layerSwitcher.getByRole('button').first();
    }
    await expect(baseMapSelector).toBeVisible();

    const selectorTagName = await baseMapSelector.evaluate((element) => element.tagName.toLowerCase());

    if (selectorTagName === 'select') {
        await baseMapSelector.selectOption({ label: 'OpenStreetMap' });
    } else {
        await baseMapSelector.click();

        let optionSelected = false;

        try {
            await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click({ timeout: 2000 });
            optionSelected = true;
        } catch {
            // try next locator
        }

        if (!optionSelected) {
            try {
                await page
                    .getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true })
                    .click({ timeout: 2000 });
                optionSelected = true;
            } catch {
                // try next locator
            }
        }

        if (!optionSelected) {
            await page.getByRole('button', { name: 'OpenStreetMap', exact: true }).click();
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
