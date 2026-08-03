// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const layerSwitcher = page.getByTestId('layer-switcher');
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const baseMapCombobox = layerSwitcher.getByRole('combobox');
    if ((await baseMapCombobox.count()) > 0) {
        await expect(baseMapCombobox).toBeVisible();

        const tagName = await baseMapCombobox.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            await baseMapCombobox.selectOption({ label: 'OpenStreetMap' });
        } else {
            await baseMapCombobox.click();
            const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
            await expect(openStreetMapOption).toBeVisible();
            await openStreetMapOption.click();
        }
    } else {
        const baseMapButton = layerSwitcher.getByRole('button', { name: 'Carto Light', exact: true });
        await expect(baseMapButton).toBeVisible();
        await baseMapButton.click();

        const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        if ((await openStreetMapOption.count()) > 0) {
            await expect(openStreetMapOption).toBeVisible();
            await openStreetMapOption.click();
        } else {
            const openStreetMapMenuItemRadio = page.getByRole('menuitemradio', { name: 'OpenStreetMap', exact: true });
            if ((await openStreetMapMenuItemRadio.count()) > 0) {
                await expect(openStreetMapMenuItemRadio).toBeVisible();
                await openStreetMapMenuItemRadio.click();
            } else {
                const openStreetMapRadio = page.getByRole('radio', { name: 'OpenStreetMap', exact: true });
                await expect(openStreetMapRadio).toBeVisible();
                await openStreetMapRadio.click({ force: true });
            }
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
