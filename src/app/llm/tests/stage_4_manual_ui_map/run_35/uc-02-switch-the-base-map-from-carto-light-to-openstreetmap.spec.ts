// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const basemapCombobox = layerSwitcher.getByRole('combobox');
    if (await basemapCombobox.count() > 0) {
        const selector = basemapCombobox.first();
        await expect(selector).toBeVisible();

        const tagName = await selector.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            await selector.selectOption({ label: 'OpenStreetMap' });
        } else {
            await selector.click();

            const option = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
            if (await option.count() > 0) {
                await option.first().click();
            } else {
                const menuItem = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
                if (await menuItem.count() > 0) {
                    await menuItem.first().click();
                } else {
                    await page.getByText('OpenStreetMap', { exact: true }).click();
                }
            }
        }
    } else {
        const basemapToggle = layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true });
        await expect(basemapToggle).toBeVisible();
        await basemapToggle.click();

        const option = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        if (await option.count() > 0) {
            await option.first().click();
        } else {
            const menuItem = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
            if (await menuItem.count() > 0) {
                await menuItem.first().click();
            } else {
                await page.getByText('OpenStreetMap', { exact: true }).click();
            }
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
