// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    const mapContainer = page.getByTestId('map-container');
    const layerSwitcher = page.getByTestId('layer-switcher');

    await expect(mapContainer).toBeVisible();
    await expect(layerSwitcher).toBeVisible();

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

    const baseMapCombobox = layerSwitcher.getByRole('combobox');
    if ((await baseMapCombobox.count()) > 0) {
        const selector = baseMapCombobox.first();
        await expect(selector).toBeVisible();

        const tagName = await selector.evaluate((element) => element.tagName.toLowerCase());
        if (tagName === 'select') {
            await selector.click();
            await selector.selectOption({ label: 'OpenStreetMap' });
        } else {
            await selector.click();

            const option = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
            if ((await option.count()) > 0) {
                await option.click();
            } else {
                const menuItemRadio = page.getByRole('menuitemradio', {
                    name: 'OpenStreetMap',
                    exact: true
                });
                if ((await menuItemRadio.count()) > 0) {
                    await menuItemRadio.click();
                } else {
                    const radio = page.getByRole('radio', {
                        name: 'OpenStreetMap',
                        exact: true
                    });
                    if ((await radio.count()) > 0) {
                        await radio.click({ force: true });
                        await expect(radio).toBeChecked();
                    } else {
                        await page.getByRole('button', {
                            name: 'OpenStreetMap',
                            exact: true
                        }).click();
                    }
                }
            }
        }
    } else {
        const selectorButtonExact = layerSwitcher.getByRole('button', {
            name: 'Carto Light',
            exact: true
        });

        const selectorButton =
            (await selectorButtonExact.count()) > 0
                ? selectorButtonExact
                : layerSwitcher.getByRole('button').filter({ hasText: 'Carto Light' }).first();

        await expect(selectorButton).toBeVisible();
        await selectorButton.click();

        const option = page.getByRole('option', { name: 'OpenStreetMap', exact: true });
        if ((await option.count()) > 0) {
            await option.click();
        } else {
            const menuItemRadio = page.getByRole('menuitemradio', {
                name: 'OpenStreetMap',
                exact: true
            });
            if ((await menuItemRadio.count()) > 0) {
                await menuItemRadio.click();
            } else {
                const radio = page.getByRole('radio', {
                    name: 'OpenStreetMap',
                    exact: true
                });
                if ((await radio.count()) > 0) {
                    await radio.click({ force: true });
                    await expect(radio).toBeChecked();
                } else {
                    await page.getByRole('button', {
                        name: 'OpenStreetMap',
                        exact: true
                    }).click();
                }
            }
        }
    }

    await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
    await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
